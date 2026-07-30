function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return HtmlService.createHtmlOutput("OK");
    }

    // GAS cannot read the X-Line-Signature header itself (platform
    // limitation), so the Cloudflare Worker verifies it and forwards here
    // with a shared secret. Reject anything that skips the Worker.
    const expectedSecret = getConfig('PROXY_SECRET');
    const providedSecret = e.parameter && e.parameter.proxy_secret;
    if (!expectedSecret || providedSecret !== expectedSecret) {
      return HtmlService.createHtmlOutput("OK"); // fail closed, no details leaked
    }

    const payload = JSON.parse(e.postData.contents);
    const events = payload.events || [];
    
    events.forEach(event => {
      const userId = event.source.userId;
      
      if (event.type === 'follow') {
        handleFollow(event);
      } else if (event.type === 'postback') {
        handlePostback(event);
      } else if (event.type === 'message') {
        if (event.message.type === 'text') {
          const text = event.message.text.trim();
          // Check if it is LIFF QR scan result format: SCAN:flow:treeId
          if (text.startsWith('SCAN:')) {
            const parts = text.split(':');
            if (parts.length >= 3) {
               const flow = parts[1];
               const treeId = parts[2];
               event.postback = { data: `action=SCAN_RESULT&tree=${treeId}&flow=${flow}` };
               handlePostback(event);
               return;
            }
          }
          handleTextMessage(event);
        } else if (event.message.type === 'image') {
          handleImageMessage(event);
        } else if (event.message.type === 'location') {
          handleLocationMessage(event);
        }
      }
    });

    return HtmlService.createHtmlOutput("OK");
  } catch (err) {
    logErrorToSheet('doPost', err.toString(), err.stack);
    return HtmlService.createHtmlOutput("Error");
  }
}

/**
 * แท็บที่มีจริงในหน้า Dashboard (ตรงกับ id="tab-xxx" ใน Dashboard.html)
 * ใช้เป็น whitelist ของ deep-link `?page=dashboard&tab=xxx`
 * ถ้าเพิ่มแท็บใหม่ในหน้าเว็บ ต้องเพิ่มชื่อที่นี่ด้วย ไม่งั้น deep-link จะไม่ทำงาน
 */
const VALID_DASHBOARD_TABS = ['overview', 'map', 'pending', 'trees', 'income', 'users'];

function doGet(e) {
  try {
    let page = 'scanner';
    let oauthCode = null;
    let oauthState = null;
    let oauthDenied = false;
    let treeId = null;
    let requestedTab = '';

    if (e && e.parameter) {
      if (e.parameter.code) {
        // LINE Login redirects back here with ?code=&state= after the user
        // logs in. The registered redirect_uri is the bare /exec URL (no
        // ?page=), so this is the only way to detect the callback - the
        // dashboard is the only feature using this flow, so that's enough.
        page = 'dashboard';
        oauthCode = e.parameter.code;
        oauthState = e.parameter.state;
      } else if (e.parameter.error) {
        page = 'dashboard';
        oauthDenied = true;
      } else if (e.parameter.tree) {
        // QR บนแท็กต้นไม้ชี้มาที่ ?tree=X (ผ่าน liff.line.me หรือ /exec ตรงๆ)
        // เสิร์ฟหน้าข้อมูลต้นไม้แบบ server-rendered ไม่ใช้ LIFF SDK เลย
        // (LIFF init ใน GAS iframe ค้างตลอด - ข้อจำกัดเดียวกับที่เลิกใช้ LIFF login)
        page = 'tree';
        treeId = e.parameter.tree;
      } else if (e.parameter.page) {
        page = e.parameter.page;
        requestedTab = e.parameter.tab || '';
      } else if (e.parameter['liff.state']) {
        const stateStr = decodeURIComponent(e.parameter['liff.state']);
        if (stateStr.indexOf('page=dashboard') !== -1) {
          page = 'dashboard';
          // liff.state อาจพก tab มาด้วย เช่น "?page=dashboard&tab=income"
          const tabMatch = stateStr.match(/[?&]tab=([^&]+)/);
          if (tabMatch) requestedTab = decodeURIComponent(tabMatch[1]);
        } else {
          // liff.line.me/{LIFF_ID}?tree=X มาถึงที่นี่เป็น liff.state="?tree=X"
          const treeMatch = stateStr.match(/[?&]tree=([^&]+)/);
          if (treeMatch) {
            page = 'tree';
            treeId = decodeURIComponent(treeMatch[1]);
          }
        }
      }
    }

    // OAuth callback: อ่าน state "ครั้งเดียว" แล้วใช้ผลร่วมกันทุกสาขา
    // (ถ้าเรียก consumeOAuthState ซ้ำไม่เป็นไรเพราะเป็น HMAC ไร้ storage
    //  แต่ถ้าเผลอ exchangeLineOAuthCode ซ้ำจะพัง — code ใช้ได้ครั้งเดียว)
    let stateResult = { valid: false, returnTo: '' };
    if (oauthCode) stateResult = consumeOAuthState(oauthState);

    // กลับไปหน้าที่ผู้ใช้กดมาก่อน login ไม่ใช่เด้งเข้าหน้าแรกเสมอ
    let treeSessionToken = '';
    let treeLoginError = '';
    if (oauthCode && stateResult.valid) {
      if (stateResult.returnTo.indexOf('tree:') === 0) {
        // หน้าต้นไม้: จัดการ login เองตรงนี้ (คนสวนไม่มีสิทธิ์ Dashboard)
        page = 'tree';
        treeId = stateResult.returnTo.substring(5);
        const idToken = exchangeLineOAuthCode(oauthCode, getDashboardRedirectUri());
        const verified = idToken ? verifyLineIdToken(idToken) : null;
        if (verified && verified.sub) {
          treeSessionToken = createDashboardSession(verified.sub);
        } else {
          treeLoginError = 'ยืนยันตัวตนไม่สำเร็จ กรุณาลองใหม่';
        }
        oauthCode = null; // จัดการเสร็จแล้ว อย่าให้ตกไปเข้า flow ของ Dashboard
      } else if (stateResult.returnTo.indexOf('dashboard:') === 0) {
        // Dashboard: แค่จำแท็บไว้ แล้วปล่อยให้ flow login ปกติข้างล่างทำงานต่อ
        // ถ้าไม่ทำ ผู้ใช้ที่กด "รายได้" ตอน session หมดจะตกที่แท็บแรกแทน
        page = 'dashboard';
        requestedTab = stateResult.returnTo.substring(10);
      }
    }

    if (page === 'dashboard') {
    // Return Dashboard Web App
    const template = HtmlService.createTemplateFromFile('Dashboard');
    template.liffId = getConfig('LIFF_ID'); // still used for the tree QR deep link, unrelated to login
    template.sessionToken = '';
    template.loginError = '';

    const redirectUri = getDashboardRedirectUri();

    if (oauthCode) {
      if (!stateResult.valid) {
        template.loginError = 'เซสชันเข้าสู่ระบบหมดอายุหรือไม่ถูกต้อง กรุณาลองเข้าสู่ระบบใหม่อีกครั้ง';
      } else {
        const idToken = exchangeLineOAuthCode(oauthCode, redirectUri);
        const loginResult = idToken ? loginWithLineIdToken(idToken) : { success: false };
        if (loginResult.success) {
          template.sessionToken = loginResult.sessionToken;
        } else {
          template.loginError = 'ไม่สามารถเข้าสู่ระบบด้วยบัญชี LINE นี้ได้ (ไม่มีสิทธิ์เข้าถึง หรือยืนยันตัวตนไม่สำเร็จ)';
        }
      }
    } else if (oauthDenied) {
      template.loginError = 'การเข้าสู่ระบบถูกยกเลิก';
    }

    // whitelist ชื่อแท็บ: ค่าที่ไม่รู้จักให้ตกไป overview เสมอ
    // ใช้ whitelist ไม่ใช่ blacklist เพราะค่านี้ถูกส่งเข้าไปในหน้าเว็บ
    const initialTab = VALID_DASHBOARD_TABS.indexOf(requestedTab) !== -1 ? requestedTab : 'overview';

    // Fresh login link for the button - always generated so a failed
    // attempt above can be retried without a full page reload.
    // พา returnTo ไปด้วยเพื่อให้ login เสร็จแล้วกลับมาแท็บเดิม ไม่ใช่แท็บแรก
    template.loginUrl = buildLineLoginUrl(redirectUri, 'dashboard:' + initialTab);

    // JSON.stringify these before they hit the <?!= ?> (raw, unescaped)
    // scriptlets in Dashboard.html, so they come out as safe JS string
    // literals no matter what characters they contain.
    template.sessionTokenJson = JSON.stringify(template.sessionToken || '');
    template.loginErrorJson = JSON.stringify(template.loginError || '');
    template.loginUrlJson = JSON.stringify(template.loginUrl || '');
    template.initialTabJson = JSON.stringify(initialTab);

    return template.evaluate()
      .setTitle('ระบบจัดการสวนทุเรียน')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } else if (page === 'tree') {
    // หน้าข้อมูลต้นไม้ (server-rendered, ไม่มี LIFF) - ปลายทางของ QR บนแท็ก
    // ปุ่มบันทึกจะโชว์ก็ต่อเมื่อ server ยืนยัน role แล้วว่าเป็นคนสวน/เจ้าของ/admin
    // ผู้ที่ยังไม่ login (รวมลูกค้าทุกคน) เห็นแค่ข้อมูลต้นไม้
    const template = HtmlService.createTemplateFromFile('TreeInfo');
    const info = getTreePublicInfo(treeId);
    const myRole = treeSessionToken ? getMyRoleWeb(treeSessionToken) : null;
    const canRecord = canRecordFromScan(myRole);

    const safeJson = function (v) { return JSON.stringify(v).replace(/</g, '\\u003c'); };
    // .replace กัน "</script>" หลุดจากข้อมูลในชีตมาปิด tag ในหน้า (XSS hardening)
    template.infoJson = safeJson(info); // null ถ้าไม่พบ -> หน้าแสดง "ไม่พบต้นไม้"
    template.historyJson = safeJson(info ? getTreeHistoryPublic(treeId) : []);
    template.treeIdJson = safeJson(String(treeId || ''));
    template.botBasicIdJson = safeJson(canRecord ? (getConfig('BOT_BASIC_ID') || '') : '');
    template.sessionTokenJson = safeJson(treeSessionToken || '');
    template.myRoleJson = safeJson(myRole || '');
    template.canRecordJson = safeJson(!!canRecord);
    template.loginErrorJson = safeJson(treeLoginError || '');
    template.loginUrlJson = safeJson(buildLineLoginUrl(getDashboardRedirectUri(), 'tree:' + treeId) || '');
    return template.evaluate()
      .setTitle('ข้อมูลต้นทุเรียน ' + (info ? info.id : ''))
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } else {
    // Default to LIFF Scanner
    const template = HtmlService.createTemplateFromFile('LIFF/index');
    template.liffId = getConfig('LIFF_ID');
    return template.evaluate()
      .setTitle('สแกน QR ต้นทุเรียน')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  } catch (err) {
    logErrorToSheet('doGet', err.toString(), err.stack);
    return HtmlService.createHtmlOutput("Error: " + err.toString());
  }
}

function handleFollow(event) {
  const userId = event.source.userId;
  const profile = getProfile(userId);
  
  let role = getUserRole(userId);
  if (!role) {
    role = registerUserWithDefaultRole(userId, profile.displayName, profile.pictureUrl);
  } else {
    // ผูก Rich Menu ตาม Role (ป้องกันการเขียนทับเมนูของผู้ใช้เดิม)
    syncUserRichMenu(userId, role);
  }
  
  replyMessage(event.replyToken, {
    type: 'text',
    text: `ยินดีต้อนรับ ${profile.displayName} สู่ระบบจัดการสวนทุเรียน`
  });
}

function handlePostback(event) {
  const userId = event.source.userId;
  const data = event.postback.data;
  
  // Ensure user is registered even if their first interaction is a button click
  let role = getUserRole(userId);
  if (!role) {
    try {
      const profile = getProfile(userId);
      role = registerUserWithDefaultRole(userId, profile.displayName, profile.pictureUrl);
    } catch(e) {}
  } else {
    // เมนูตามทัน role ที่ถูกแก้ด้วยมือในชีต (ยิง API เฉพาะตอนไม่ตรงจริงๆ)
    ensureRichMenuMatchesRole(userId, role);
  }
  
  // Custom parser since URLSearchParams is not fully supported in all GAS environments
  const params = {};
  data.split('&').forEach(pair => {
    const [key, value] = pair.split('=');
    if (key) params[key] = decodeURIComponent(value || '');
  });
  
  const action = params['action'];
  
  if (action === 'CANCEL') {
    clearState(userId);
    replyMessage(event.replyToken, buildSuccessFlex('ยกเลิกรายการแล้ว'));
    return;
  }
  
  if (action === 'SCAN_RESULT') {
    const treeId = params['tree'];
    const flow = params['flow'];
    
    const treeInfo = getTreeInfo(treeId);
    if (!treeInfo) {
      replyMessage(event.replyToken, buildErrorFlex('ไม่พบข้อมูลต้นไม้ในระบบ'));
      return;
    }
    
    const seasonId = getActiveSeason();
    const remaining = getRemainingFruits(seasonId, treeId);
    const harvestHistory = getHarvestHistory(seasonId, treeId, 5);
    const msgs = [buildTreeInfoFlex(treeInfo, remaining, harvestHistory)];
    
    const role = getUserRole(userId);
    if (role !== 'Customer') {
      if (flow === 'harvest') {
        msgs.push(buildHarvestReasonFlex(treeId));
        setState(userId, { action: 'HARVEST', data: { treeId: treeId } });
      } else if (flow === 'production') {
        msgs.push(buildTextPromptFlex('กรุณาพิมพ์จำนวนผลผลิตทั้งหมดที่นับได้'));
        setState(userId, { step: 'WAIT_QUANTITY', action: 'PRODUCTION', data: { treeId: treeId } });
      }
    }
    replyMessage(event.replyToken, msgs);
    return;
  }
  
  const state = getState(userId) || { data: {} };
  
  if (action === 'HARVEST_REASON') {
    state.data.reason = params['reason'];

    if (state.data.reason === 'ตัดขาย') {
      // FLOW ใหม่: ตัดทั้งต้น ลงตะกร้า ชั่งครั้งเดียว -> ถามน้ำหนัก+จำนวนลูก
      // ในคำถามเดียว ไม่ถามเกรด/ราคาแล้ว เพราะตอนชั่งยังไม่รู้ (ต้องเทรวมกอง
      // แล้วคัดเกรดขายอีกที) ดู docs/DESIGN_harvest_lot.md
      state.step = 'WAIT_WEIGHT_COUNT';
      setState(userId, state);
      const roundTotal = getTreeRoundTotal(getHarvestRoundId(new Date()), state.data.treeId);
      const already = roundTotal.entries > 0
        ? `\n\n📊 ต้นนี้วันนี้บันทึกไปแล้ว ${roundTotal.entries} ตะกร้า รวม ${roundTotal.weight} กก. (ระบบจะบวกให้อัตโนมัติ)`
        : '';
      replyMessage(event.replyToken, buildTextPromptFlex(
        'พิมพ์ น้ำหนัก และ จำนวนลูก คั่นด้วยช่องว่าง\n\nตัวอย่าง: 45 18\n(45 กก. 18 ลูก)' + already));
    } else {
      state.step = 'WAIT_QUANTITY';
      setState(userId, state);
      replyMessage(event.replyToken, buildTextPromptFlex('กรุณาพิมพ์จำนวนลูกที่เสียหาย'));
    }
  }
  else if (action === 'GRADE') {
    // ขั้นตอนเลือกเกรดถูกยกเลิกแล้ว (ย้ายไปอยู่ตอนบันทึกการขายรายวัน)
    // ปุ่มนี้อาจยังค้างอยู่ในแชทเก่า -> บอกให้เริ่มใหม่แทนที่จะเงียบ
    clearState(userId);
    replyMessage(event.replyToken, buildTextPromptFlex(
      '⚠️ ระบบเปลี่ยนวิธีบันทึกใหม่แล้ว ไม่ต้องเลือกเกรดตอนตัดอีก\n\nกรุณาสแกน QR แล้วเริ่มรายการใหม่ครับ'));
  }
  else if (action === 'VARIETY') {
    const variety = params['variety'];
    if (variety === 'อื่นๆ') {
      state.step = 'WAIT_OTHER_VARIETY';
      setState(userId, state);
      replyMessage(event.replyToken, buildTextPromptFlex('กรุณาพิมพ์ชื่อสายพันธุ์ครับ'));
    } else {
      state.data.variety = variety;
      state.step = 'WAIT_AGE';
      setState(userId, state);
      replyMessage(event.replyToken, buildTextPromptFlex('กรุณาพิมพ์อายุต้น (ปี)'));
    }
  }
  else if (action === 'MONTH') {
    state.data.flowerMonth = params['month'];
    state.step = 'WAIT_QUANTITY';
    setState(userId, state);
    replyMessage(event.replyToken, buildTextPromptFlex('กรุณาพิมพ์จำนวนลูก(หรือดอก) ปัจจุบัน (หากไม่มีให้ใส่ 0)'));
  }
  else if (action === 'CONFIRM') {
    if (!getState(userId)) return; // Prevent double submission
    
    const type = params['type'];
    const profile = getProfile(userId);
    let queueType = '';
    
    if (type === 'harvest') {
      queueType = 'ตัดจำหน่าย';
      // ผูกรายการเข้ารอบของ "วันที่บันทึก" — 1 รอบ = 1 วัน ไม่ต้องเปิด/ปิดรอบเอง
      state.data.roundId = getHarvestRoundId(new Date());
    }
    else if (type === 'production') queueType = 'บันทึกผลผลิต';
    else if (type === 'register') {
      queueType = 'ลงทะเบียนต้นไม้';
    }

    const photoUrlString = state.data.photoUrls ? state.data.photoUrls.join(',') : (state.data.photoUrl || '');

    // Script Lock ครอบตั้งแต่ gen รหัสต้นไม้ -> append ลงคิว ให้เป็นงานเดียว
    // แยก lock ทีละฟังก์ชันไม่พอ: ช่องว่างระหว่าง generateNextTreeId() กับ
    // addToPendingQueue() คือจุดที่สองคนกด CONFIRM พร้อมกันแล้วได้รหัสซ้ำ
    withScriptLock(function () {
      if (type === 'register') {
        // Generate ID right away so worker knows it!
        state.data.treeId = generateNextTreeId();
      }
      addToPendingQueue(queueType, state.data.treeId, state.data, userId, profile.displayName, photoUrlString);
    });
    clearState(userId);
    
    if (type === 'register') {
      replyMessage(event.replyToken, buildSuccessFlex(`บันทึกข้อมูลและส่งขออนุมัติเรียบร้อยแล้ว\n\n⚠️ รหัสต้นไม้ของคุณคือ: ${state.data.treeId}\n\nกรุณาจดรหัสนี้และนำไปผูกติดกับต้นไม้ครับ!`));
    } else {
      replyMessage(event.replyToken, buildSuccessFlex('บันทึกข้อมูลและส่งขออนุมัติเรียบร้อยแล้ว'));
    }
  }
  else if (action === 'APPROVE') {
    if (!isOwnerOrAdmin(role)) {
      replyMessage(event.replyToken, buildErrorFlex('คุณไม่มีสิทธิ์ทำรายการนี้'));
      return;
    }
    const itemId = params['id'];
    const profile = getProfile(userId);
    const result = approveItem(itemId, profile.displayName);
    if (result && result.success) {
      if (result.type === 'register') {
        replyMessage(event.replyToken, buildSuccessFlex(`อนุมัติเรียบร้อย!\nต้นไม้ใหม่ได้รหัส: ${result.newTreeId}`));
      } else {
        replyMessage(event.replyToken, buildSuccessFlex('อนุมัติรายการเรียบร้อย'));
      }
    } else {
      replyMessage(event.replyToken, buildErrorFlex('ไม่พบรายการหรือถูกอนุมัติไปแล้ว'));
    }
  }
  else if (action === 'REJECT_START') {
    if (!isOwnerOrAdmin(role)) {
      replyMessage(event.replyToken, buildErrorFlex('คุณไม่มีสิทธิ์ทำรายการนี้'));
      return;
    }
    const itemId = params['id'];
    state.action = 'REJECT';
    state.step = 'WAIT_REASON';
    state.data.itemId = itemId;
    setState(userId, state);
    replyMessage(event.replyToken, buildTextPromptFlex('กรุณาพิมพ์เหตุผลที่ปฏิเสธ'));
  }
  else if (action === 'APPROVAL_LIST') {
    if (!isOwnerOrAdmin(role)) {
      replyMessage(event.replyToken, buildErrorFlex('คุณไม่มีสิทธิ์ทำรายการนี้'));
      return;
    }
    const items = getPendingItems();
    if (items.length === 0) {
      replyMessage(event.replyToken, buildSuccessFlex('ไม่มีรายการรออนุมัติ'));
      return;
    }
    replyMessage(event.replyToken, buildApprovalCarouselFlex(items));
  }
  else if (action === 'SALE_ROUND') {
    // เจ้าของ/admin/คนสวน กรอกเกรด/น้ำหนัก/ราคาได้ทุกคนที่จุดเดียวนี้
    // เจ้าของ/admin: บันทึกมีผลทันที (เหมือนเดิม)
    // คนสวน (หรือ role อื่นที่ไม่ใช่ Customer): ส่งเข้าคิวรอเจ้าของอนุมัติก่อน
    // ดู WAIT_BUYER ด้านล่างที่เป็นจุดแยก path จริง
    if (role === 'Customer') {
      replyMessage(event.replyToken, buildErrorFlex('คุณไม่มีสิทธิ์ทำรายการนี้'));
      return;
    }
    const isDirectSave = isOwnerOrAdmin(role);

    // รองรับย้อนหลัง: days=1 คือเมื่อวาน (เผื่อขายดึกแล้วมาบันทึกเช้าวันรุ่งขึ้น)
    const daysBack = parseInt(params['days'], 10) || 0;
    const target = new Date();
    target.setDate(target.getDate() - daysBack);
    const roundId = getHarvestRoundId(target);
    const summary = getHarvestRoundSummary(roundId);

    if (summary.treeCount === 0) {
      replyMessage(event.replyToken, buildErrorFlex(
        'วันที่ ' + formatRoundIdAsDate(roundId) + ' ยังไม่มีรายการตัดขายที่อนุมัติแล้ว\n\nถ้าเพิ่งบันทึก ให้อนุมัติรายการก่อนครับ'));
      return;
    }

    // ไม่ใช่เจ้าของ/admin และยังไม่ได้กด "แก้ไขรายการ" (params.edit) มา:
    // เช็คก่อนว่ารอบนี้มีของที่ตัวเองส่งค้างไว้ไหม กันส่งซ้ำจนคิวบวม
    // (1 รอบมีรายการค้างได้แค่ 1 รายการ แต่แก้ไขรายการเดิมได้เรื่อยๆ)
    if (!isDirectSave && params['edit'] !== '1') {
      const pending = findPendingSaleItem(roundId);
      if (pending) {
        replyMessage(event.replyToken, buildSalePendingExistsFlex(roundId, pending, daysBack));
        return;
      }
    }

    state.action = 'SALE_ROUND';
    state.step = 'WAIT_GRADES';
    state.data = { roundId: roundId, isDirectSave: isDirectSave };
    setState(userId, state);
    replyMessage(event.replyToken, buildSaleRoundPromptFlex(summary, getSaleRoundTotals(roundId)));
  }
  else if (action === 'SALE_CANCEL_PENDING') {
    // คนสวนยกเลิกรายการขายที่ตัวเองส่งไปเอง ก่อนเจ้าของตัดสินใจ
    if (role === 'Customer') {
      replyMessage(event.replyToken, buildErrorFlex('คุณไม่มีสิทธิ์ทำรายการนี้'));
      return;
    }
    const result = cancelPendingItem(params['id'], userId);
    if (result.success) {
      clearState(userId);
      replyMessage(event.replyToken, buildSuccessFlex('ยกเลิกรายการที่ส่งไปแล้วเรียบร้อย พิมพ์ "บันทึกการขาย" เพื่อเริ่มใหม่ได้เลยครับ'));
    } else {
      replyMessage(event.replyToken, buildErrorFlex(result.reason || 'ยกเลิกไม่สำเร็จ'));
    }
  }
  else if (action === 'RETURN_START') {
    // เจ้าของ/admin ขอให้คนสวนแก้ไขตัวเลขแล้วส่งใหม่ (ต่างจากปฏิเสธตรงที่แก้ไข-ส่งซ้ำได้)
    if (!isOwnerOrAdmin(role)) {
      replyMessage(event.replyToken, buildErrorFlex('คุณไม่มีสิทธิ์ทำรายการนี้'));
      return;
    }
    state.action = 'RETURN';
    state.step = 'WAIT_RETURN_REASON';
    state.data.itemId = params['id'];
    setState(userId, state);
    replyMessage(event.replyToken, buildTextPromptFlex('พิมพ์เหตุผลที่ให้แก้ไข (เช่น ราคาผิด/น้ำหนักไม่ตรง)\n\nระบบจะแจ้งคนที่ส่งมาให้แก้ไขและส่งใหม่ทันที'));
  }
  else if (action === 'DASHBOARD') {
    replyMessage(event.replyToken, buildDashboardMenuFlex());
  }
  else if (action === 'MANAGE') {
    // ประตูเข้าเว็บ Dashboard แยกตามแท็บ — เฉพาะคนที่เข้า Dashboard ได้
    if (!isOwnerOrAdmin(role)) {
      replyMessage(event.replyToken, buildErrorFlex('คุณไม่มีสิทธิ์ทำรายการนี้'));
      return;
    }
    replyMessage(event.replyToken, buildManageMenuFlex(getDashboardRedirectUri()));
  }
  else if (action === 'DASHBOARD_VIEW') {
    const viewType = params['type'];
    let dashData;
    let title;
    const seasonId = getActiveSeason();
    let unit = '';
    if (viewType === 'variety') {
      dashData = getDashboardByVariety(seasonId); title = 'สรุปตามสายพันธุ์'; unit = 'ลูก';
    } else if (viewType === 'grade') {
      // หน่วยเป็นกิโลกรัม เพราะเกรดมาจากผลคัดจริงตอนขาย (ชั่ง ไม่ได้นับลูก)
      dashData = getDashboardByGrade(seasonId); title = 'สรุปตามเกรด (จากการคัดขาย)'; unit = 'กก.';
    } else {
      dashData = getDashboardTotal(seasonId); title = 'สรุปภาพรวม'; // มีหน่วยติดมากับค่าแล้ว
    }

    replyMessage(event.replyToken, buildDashboardResultFlex(title, dashData, unit));
  }
  else if (action === 'SALE_CONFIRM') {
    if (role === 'Customer') {
      replyMessage(event.replyToken, buildErrorFlex('คุณไม่มีสิทธิ์ทำรายการนี้'));
      return;
    }
    const st = getState(userId);
    if (!st || st.action !== 'SALE_ROUND' || !st.data.grades) {
      replyMessage(event.replyToken, buildErrorFlex('รายการหมดอายุแล้ว กรุณาเริ่มบันทึกการขายใหม่'));
      return;
    }
    st.step = 'WAIT_BUYER';
    setState(userId, st);
    replyMessage(event.replyToken, buildTextPromptFlex('พิมพ์ชื่อผู้ซื้อ (ล้ง/พ่อค้า)\n\nถ้าไม่ระบุ พิมพ์ - หรือ ข้าม'));
  }
  else if (action === 'REGISTER_TREE') {
    state.action = 'REGISTER_TREE';
    state.step = 'WAIT_VARIETY';
    state.data = { treeId: 'AUTO_GENERATED' };
    setState(userId, state);
    replyMessage(event.replyToken, buildVarietySelectionFlex());
  }
}

/**
 * ข้อความที่พิมพ์แล้วทำงานเหมือนกดปุ่ม — ทางเข้าสำรองของ action ที่ไม่มีปุ่ม
 * ใน Rich Menu (การเพิ่มปุ่ม Rich Menu ต้องทำรูปใหม่ทั้งใบ)
 * ทุก action ที่ handle ควรมีทางเข้าอย่างน้อย 1 ทาง ไม่งั้นโค้ดตายอยู่เฉยๆ
 */
const TEXT_SHORTCUTS = {
  'บันทึกการขาย': 'action=SALE_ROUND',
  'บันทึกขาย': 'action=SALE_ROUND',
  'ขาย': 'action=SALE_ROUND',
  'บันทึกการขายเมื่อวาน': 'action=SALE_ROUND&days=1',
  'รออนุมัติ': 'action=APPROVAL_LIST',
  'ภาพรวม': 'action=DASHBOARD',
  'รายงาน': 'action=DASHBOARD',
  'ระบบจัดการ': 'action=MANAGE',
  'จัดการ': 'action=MANAGE',
  'ลงทะเบียนต้นไม้': 'action=REGISTER_TREE'
};

function handleTextMessage(event) {
  const userId = event.source.userId;
  const text = event.message.text.trim();
  
  // Allow user to cancel at any time by typing "ยกเลิก"
  if (text === 'ยกเลิก' || text === 'cancel') {
    clearState(userId);
    replyMessage(event.replyToken, buildSuccessFlex('ยกเลิกรายการเรียบร้อยแล้ว คุณสามารถเริ่มทำรายการใหม่ได้เลยครับ'));
    return;
  }
  
  const state = getState(userId);

  if (!state) {
    // If user is not in a flow, ensure they are registered
    let role = getUserRole(userId);
    if (!role) {
      const profile = getProfile(userId);
      role = registerUserWithDefaultRole(userId, profile.displayName, profile.pictureUrl);
    } else {
      ensureRichMenuMatchesRole(userId, role);
    }

    // ทางลัดด้วยการพิมพ์ — สำรองจากปุ่มในเมนู "ภาพรวม" เผื่อหาปุ่มไม่เจอ
    // (แปลง text เป็น postback แล้วส่งเข้า handler เดิม ไม่ต้องเขียน logic ซ้ำ)
    if (TEXT_SHORTCUTS[text]) {
      event.postback = { data: TEXT_SHORTCUTS[text] };
      handlePostback(event);
      return;
    }

    // Default reply
    replyMessage(event.replyToken, {
      type: 'text',
      text: 'กรุณาเลือกทำรายการจากเมนูด้านล่างครับ 👇\n\n' +
            'พิมพ์ "บันทึกการขาย" เพื่อบันทึกยอดขายของวันนี้'
    });
    return;
  }
  
  // BUG FIX: บล็อกจัดการ "ข้าม"/"ส่งรูปครบแล้ว" เดิมถูกเขียนซ้อนอยู่ใน
  // สาขา REGISTER_TREE ทั้งที่โค้ดข้างในเช็ค state.action === 'HARVEST'
  // (เข้าไม่ถึงตลอดกาล) ผลคือ flow ตัดจำหน่าย/ผลเสียหาย พอกด "ส่งรูปครบแล้ว"
  // แล้วบอทเงียบ ทำรายการไม่จบสักครั้ง ย้ายออกมาเป็นสาขาระดับบนที่ใช้ร่วมกัน
  // ทั้งสอง flow
  if (state.step === 'WAIT_PHOTO') {
    const photoCount = state.data.photoUrls ? state.data.photoUrls.length : 0;

    if (text === 'ข้าม') {
      if (state.action === 'HARVEST') {
        replyMessage(event.replyToken, buildTextPromptFlex('⚠️ ห้ามข้าม กรุณาถ่ายรูปน้ำหนักตาชั่ง หรือรูปผลไม้ที่เสียหายทุกกรณีครับ'));
        return;
      }
      replyMessage(event.replyToken, buildTreeRegistrationSummaryFlex(state.data));
      return;
    }

    if (text === 'ส่งรูปครบแล้ว') {
      if (photoCount === 0 && state.action === 'HARVEST') {
        replyMessage(event.replyToken, buildTextPromptFlex('⚠️ ยังไม่ได้ส่งรูปเลยครับ กรุณาแนบรูปภาพก่อนกดส่งรูปครบแล้ว'));
        return;
      }
      if (state.action === 'HARVEST') {
        replyMessage(event.replyToken, buildHarvestSummaryFlex(state.data));
      } else if (state.action === 'REGISTER_TREE') {
        replyMessage(event.replyToken, buildTreeRegistrationSummaryFlex(state.data));
      }
      return;
    }

    // พิมพ์อย่างอื่นระหว่างรอรูป: บอกให้ชัดว่าระบบรออะไรอยู่ ดีกว่าเงียบ
    replyMessage(event.replyToken, buildTextPromptFlex('กรุณาส่งรูปภาพ 📸 แล้วกด "ส่งรูปครบแล้ว" เมื่อส่งครบ (หรือพิมพ์ "ยกเลิก" เพื่อเริ่มใหม่)'));
    return;
  }

  if (state.action === 'HARVEST') {
    if (state.step === 'WAIT_WEIGHT_COUNT') {
      // รับ "45 18" = 45 กก. 18 ลูก — คั่นด้วยช่องว่างหรือ comma ก็ได้
      const parts = text.replace(/,/g, ' ').split(/\s+/).filter(function (s) { return s !== ''; });
      const weight = parseFloat(parts[0]);
      const count = parseInt(parts[1], 10);

      if (parts.length < 2 || isNaN(weight) || isNaN(count)) {
        replyMessage(event.replyToken, buildErrorFlex(
          'กรุณาพิมพ์ 2 ตัวเลข คั่นด้วยช่องว่าง\n\nตัวอย่าง: 45 18\n(น้ำหนัก 45 กก. จำนวน 18 ลูก)'));
        return;
      }
      if (weight <= 0 || count <= 0) {
        replyMessage(event.replyToken, buildErrorFlex('น้ำหนักและจำนวนลูกต้องมากกว่า 0'));
        return;
      }

      state.data.weight = weight;
      state.data.quantity = count;
      state.step = 'WAIT_PHOTO';
      setState(userId, state);
      replyMessage(event.replyToken, buildPhotoRequestFlex('กรุณาถ่ายรูปที่เห็นตาชั่งน้ำหนัก 📸'));
    }
    else if (state.step === 'WAIT_QUANTITY') {
      // สายผลเสียหาย: ถามจำนวนลูกอย่างเดียว ไม่ต้องชั่ง
      state.data.quantity = parseInt(text, 10);
      if (isNaN(state.data.quantity) || state.data.quantity <= 0) {
        replyMessage(event.replyToken, buildErrorFlex('กรุณาพิมพ์จำนวนลูกเป็นตัวเลขที่มากกว่า 0'));
        return;
      }
      state.data.weight = 0;
      state.step = 'WAIT_PHOTO';
      setState(userId, state);
      replyMessage(event.replyToken, buildPhotoRequestFlex('กรุณาถ่ายรูปผลไม้ที่เสียหาย 📸'));
    }
  }
  else if (state.action === 'SALE_ROUND') {
    if (state.step === 'WAIT_GRADES') {
      // รับหลายบรรทัด บรรทัดละ "เกรด น้ำหนัก ราคา" เช่น
      //   A 60 130
      //   B 40 90
      // กรอกทีเดียวจบ เร็วกว่าเดินทีละขั้นทีละเกรด
      const parsed = parseSaleGradeLines(text);
      if (parsed.error) {
        replyMessage(event.replyToken, buildErrorFlex(parsed.error));
        return;
      }
      state.data.grades = parsed.grades;
      state.step = 'WAIT_CONFIRM';
      setState(userId, state);
      replyMessage(event.replyToken, buildSaleRoundConfirmFlex(state.data.roundId, parsed.grades));
      return;
    }
    if (state.step === 'WAIT_BUYER') {
      state.data.buyer = (text === '-' || text === 'ข้าม') ? '' : text;
      const profile = getProfile(userId);
      const roundId = state.data.roundId;
      const grades = state.data.grades;
      const buyer = state.data.buyer;
      const isDirectSave = state.data.isDirectSave;
      clearState(userId);

      if (isDirectSave) {
        // เจ้าของ/admin — บันทึกมีผลทันทีเหมือนเดิม
        const result = saveSaleRound(roundId, grades, buyer, profile.displayName);
        replyMessage(event.replyToken, buildSaleRoundSavedFlex(roundId, result,
          getHarvestRoundSummary(roundId)));
      } else {
        // คนสวน (หรือ role อื่น) — เข้าคิวรอเจ้าของอนุมัติก่อน ยังไม่บันทึกลง 'รอบขาย' จริง
        upsertSalePendingItem(roundId, grades, buyer, userId, profile.displayName);
        replyMessage(event.replyToken, buildSaleQueuedFlex(roundId, grades, buyer));
      }
      return;
    }
  }
  else if (state.action === 'PRODUCTION') {
    if (state.step === 'WAIT_QUANTITY') {
      state.data.quantity = parseInt(text, 10);
      replyMessage(event.replyToken, buildProductionSummaryFlex(state.data));
    }
  }
  else if (state.action === 'REGISTER_TREE') {
    if (state.step === 'WAIT_OTHER_VARIETY') {
      state.data.variety = text;
      state.step = 'WAIT_AGE';
      setState(userId, state);
      replyMessage(event.replyToken, buildTextPromptFlex('กรุณาพิมพ์อายุต้น (ปี)'));
    }
    else if (state.step === 'WAIT_AGE') {
      state.data.age = parseInt(text, 10);
      state.step = 'WAIT_MONTH';
      setState(userId, state);
      replyMessage(event.replyToken, buildMonthSelectionFlex());
    }
    else if (state.step === 'WAIT_QUANTITY') {
      state.data.quantity = parseInt(text, 10) || 0;
      state.step = 'WAIT_LOCATION';
      setState(userId, state);
      replyMessage(event.replyToken, buildLocationRequestFlex());
    }
  }
  else if (state.action === 'REJECT' && state.step === 'WAIT_REASON') {
    rejectItem(state.data.itemId, text);
    clearState(userId);
    replyMessage(event.replyToken, buildSuccessFlex('ปฏิเสธรายการเรียบร้อย'));
  }
  else if (state.action === 'RETURN' && state.step === 'WAIT_RETURN_REASON') {
    const result = returnItemForEdit(state.data.itemId, text);
    clearState(userId);
    if (!result.success) {
      replyMessage(event.replyToken, buildErrorFlex('ไม่พบรายการหรือถูกดำเนินการไปแล้ว'));
      return;
    }
    // แจ้งคนที่ส่งมาให้รู้ว่าต้องแก้ไข — ถ้า push ไม่สำเร็จ (เช่น block บอท)
    // ไม่ให้กระทบ flow หลัก แค่ log ไว้เฉยๆ
    if (result.recorderId) {
      try {
        pushMessage(result.recorderId, {
          type: 'text',
          text: `⚠️ รายการที่คุณส่งไปวันที่ ${formatRoundIdAsDate(result.roundId)} เจ้าของขอให้แก้ไข:\n\n${text}\n\nพิมพ์ "บันทึกการขาย" เพื่อกรอกใหม่ได้เลยครับ (ระบบจะทับของเดิมให้อัตโนมัติ)`
        });
      } catch (e) {
        logErrorToSheet('RETURN_START', 'push แจ้งผู้ส่งรายการไม่สำเร็จ', e.toString());
      }
    }
    replyMessage(event.replyToken, buildSuccessFlex('ส่งกลับให้แก้ไขเรียบร้อย แจ้งผู้ส่งแล้วครับ'));
  }
}

function handleImageMessage(event) {
  const userId = event.source.userId;
  const state = getState(userId);
  if (state && state.step === 'WAIT_PHOTO') {
    const photoUrl = savePhotoToDrive(event.message.id, getActiveSeason(), state.data.treeId || 'NEW_TREE');
    
    // Initialize array if not exists
    if (!state.data.photoUrls) state.data.photoUrls = [];
    state.data.photoUrls.push(photoUrl);
    
    setState(userId, state);
    
    // Reply that we received the photo and wait for them to finish
    replyMessage(event.replyToken, {
      type: 'text',
      text: `📸 รับรูปที่ ${state.data.photoUrls.length} แล้ว หากมีรูปเพิ่มเติมสามารถส่งมาได้เลยครับ\n\nหากส่งครบแล้ว กรุณากดปุ่มด้านล่าง 👇`,
      quickReply: {
        items: [
          { type: 'action', action: { type: 'message', label: 'ส่งรูปครบแล้ว', text: 'ส่งรูปครบแล้ว' } }
        ]
      }
    });
  }
}

function handleLocationMessage(event) {
  const userId = event.source.userId;
  const state = getState(userId);
  if (state && state.action === 'REGISTER_TREE' && state.step === 'WAIT_LOCATION') {
    state.data.lat = event.message.latitude;
    state.data.lng = event.message.longitude;
    state.step = 'WAIT_PHOTO';
    setState(userId, state);
    replyMessage(event.replyToken, buildPhotoRequestFlex('กรุณาถ่ายรูปต้นไม้แล้วส่งมาได้เลยครับ 📸', true));
  }
}
