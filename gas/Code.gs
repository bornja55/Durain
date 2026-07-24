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
    try {
      const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
      const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName('Config');
      sheet.appendRow(['ERROR_LOG', new Date().toLocaleString(), err.toString(), err.stack]);
    } catch (e2) {}
    return HtmlService.createHtmlOutput("Error");
  }
}

function doGet(e) {
  try {
    let page = 'scanner';
    let oauthCode = null;
    let oauthState = null;
    let oauthDenied = false;

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
      } else if (e.parameter.page) {
        page = e.parameter.page;
      } else if (e.parameter['liff.state']) {
        const stateStr = decodeURIComponent(e.parameter['liff.state']);
        if (stateStr.indexOf('page=dashboard') !== -1) {
          page = 'dashboard';
        }
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
      if (!consumeOAuthState(oauthState)) {
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

    // Fresh login link for the button - always generated so a failed
    // attempt above can be retried without a full page reload.
    template.loginUrl = buildLineLoginUrl(redirectUri);

    // JSON.stringify these before they hit the <?!= ?> (raw, unescaped)
    // scriptlets in Dashboard.html, so they come out as safe JS string
    // literals no matter what characters they contain.
    template.sessionTokenJson = JSON.stringify(template.sessionToken || '');
    template.loginErrorJson = JSON.stringify(template.loginError || '');
    template.loginUrlJson = JSON.stringify(template.loginUrl || '');

    return template.evaluate()
      .setTitle('ระบบจัดการสวนทุเรียน')
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
    try {
      const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
      const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName('Config');
      sheet.appendRow(['ERROR_LOG', new Date().toLocaleString(), err.toString(), err.stack]);
    } catch (e2) {}
    return HtmlService.createHtmlOutput("Error: " + err.toString());
  }
}

function handleFollow(event) {
  const userId = event.source.userId;
  const profile = getProfile(userId);
  
  let role = getUserRole(userId);
  if (!role) {
    role = 'Customer';
    registerUser(userId, profile.displayName || 'Unknown', role, profile.pictureUrl || '');
  }
  
  // ผูก Rich Menu ตาม Role (ป้องกันการเขียนทับเมนูของผู้ใช้เดิม)
  syncUserRichMenu(userId, role);
  
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
      role = 'Customer';
      registerUser(userId, profile.displayName || 'Unknown', role, profile.pictureUrl || '');
      syncUserRichMenu(userId, role);
    } catch(e) {}
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
    state.step = 'WAIT_QUANTITY';
    setState(userId, state);
    replyMessage(event.replyToken, buildTextPromptFlex('กรุณาพิมพ์จำนวนที่เก็บเกี่ยว'));
  }
  else if (action === 'GRADE') {
    state.data.grade = params['grade'];
    state.step = 'WAIT_WEIGHT';
    setState(userId, state);
    replyMessage(event.replyToken, buildTextPromptFlex('กรุณาพิมพ์น้ำหนักรวม (กิโลกรัม)'));
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
    
    if (type === 'harvest') queueType = 'ตัดจำหน่าย';
    else if (type === 'production') queueType = 'บันทึกผลผลิต';
    else if (type === 'register') {
      queueType = 'ลงทะเบียนต้นไม้';
      // Generate ID right away so worker knows it!
      const newTreeId = generateNextTreeId();
      state.data.treeId = newTreeId;
    }
    
    const photoUrlString = state.data.photoUrls ? state.data.photoUrls.join(',') : (state.data.photoUrl || '');
    addToPendingQueue(queueType, state.data.treeId, state.data, userId, profile.displayName, photoUrlString);
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
  else if (action === 'DASHBOARD') {
    replyMessage(event.replyToken, buildDashboardMenuFlex());
  }
  else if (action === 'DASHBOARD_VIEW') {
    const viewType = params['type'];
    let dashData;
    let title;
    const seasonId = getActiveSeason();
    if (viewType === 'variety') { dashData = getDashboardByVariety(seasonId); title = 'สรุปตามสายพันธุ์'; }
    else if (viewType === 'grade') { dashData = getDashboardByGrade(seasonId); title = 'สรุปตามเกรด'; }
    else { dashData = getDashboardTotal(seasonId); title = 'สรุปภาพรวม'; }
    
    replyMessage(event.replyToken, buildDashboardResultFlex(title, dashData));
  }
  else if (action === 'REGISTER_TREE') {
    state.action = 'REGISTER_TREE';
    state.step = 'WAIT_VARIETY';
    state.data = { treeId: 'AUTO_GENERATED' };
    setState(userId, state);
    replyMessage(event.replyToken, buildVarietySelectionFlex());
  }
}

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
      role = 'Customer';
      registerUser(userId, profile.displayName || 'Unknown', role, profile.pictureUrl || '');
      syncUserRichMenu(userId, role);
    }
    // Default reply
    replyMessage(event.replyToken, {
      type: 'text',
      text: 'กรุณาเลือกทำรายการจากเมนูด้านล่างครับ 👇'
    });
    return;
  }
  
  if (state.action === 'HARVEST') {
    if (state.step === 'WAIT_QUANTITY') {
      state.data.quantity = parseInt(text, 10);
      if (isNaN(state.data.quantity)) {
        replyMessage(event.replyToken, buildErrorFlex('กรุณาพิมพ์เป็นตัวเลขเท่านั้น'));
        return;
      }
      if (state.data.reason === 'ตัดขาย') {
        state.step = 'WAIT_GRADE';
        setState(userId, state);
        replyMessage(event.replyToken, buildGradeSelectionFlex());
      } else {
        state.step = 'WAIT_PHOTO';
        setState(userId, state);
        replyMessage(event.replyToken, buildPhotoRequestFlex('กรุณาถ่ายรูปผลไม้ที่เสียหาย 📸'));
      }
    }
    else if (state.step === 'WAIT_WEIGHT') {
      state.data.weight = parseFloat(text);
      state.step = 'WAIT_PRICE';
      setState(userId, state);
      replyMessage(event.replyToken, buildTextPromptFlex('กรุณาพิมพ์ราคาต่อกิโลกรัม'));
    }
    else if (state.step === 'WAIT_PRICE') {
      state.data.price = parseFloat(text);
      state.step = 'WAIT_PHOTO';
      setState(userId, state);
      replyMessage(event.replyToken, buildPhotoRequestFlex('กรุณาถ่ายรูปที่เห็นตาชั่งน้ำหนัก 📸'));
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
    else if (state.step === 'WAIT_PHOTO') {
      if (text === 'ข้าม') {
        if (state.action === 'HARVEST') {
          replyMessage(event.replyToken, buildTextPromptFlex('⚠️ ห้ามข้าม กรุณาถ่ายรูปน้ำหนักตาชั่ง หรือรูปผลไม้ที่เสียหายทุกกรณีครับ'));
          return;
        }
        replyMessage(event.replyToken, buildTreeRegistrationSummaryFlex(state.data));
      } 
      else if (text === 'ส่งรูปครบแล้ว') {
        const photoCount = state.data.photoUrls ? state.data.photoUrls.length : 0;
        
        if (photoCount === 0 && state.action === 'HARVEST') {
          replyMessage(event.replyToken, buildTextPromptFlex('⚠️ ยังไม่ได้ส่งรูปเลยครับ กรุณาแนบรูปภาพก่อนกดส่งรูปครบแล้ว'));
          return;
        }
        
        if (state.action === 'HARVEST') {
          replyMessage(event.replyToken, buildHarvestSummaryFlex(state.data));
        } else if (state.action === 'REGISTER_TREE') {
          replyMessage(event.replyToken, buildTreeRegistrationSummaryFlex(state.data));
        }
      }
    }
  }
  else if (state.action === 'REJECT' && state.step === 'WAIT_REASON') {
    rejectItem(state.data.itemId, text);
    clearState(userId);
    replyMessage(event.replyToken, buildSuccessFlex('ปฏิเสธรายการเรียบร้อย'));
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
