function doPost(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return ContentService.createTextOutput("OK");
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

  return ContentService.createTextOutput("OK");
}

function doGet(e) {
  const page = e.parameter.page || 'scanner';
  
  if (page === 'dashboard') {
    // Return Dashboard Web App
    const template = HtmlService.createTemplateFromFile('Dashboard');
    template.liffId = getConfig('LIFF_ID');
    return template.evaluate()
      .setTitle('ระบบจัดการสวนทุเรียน')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } else {
    // Default to LIFF Scanner
    const template = HtmlService.createTemplateFromFile('LIFF/index');
    template.liffId = getConfig('LIFF_ID');
    return template.evaluate()
      .setTitle('สแกน QR ต้นทุเรียน')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
}

function handleFollow(event) {
  const userId = event.source.userId;
  const profile = getProfile(userId);
  registerUser(userId, profile.displayName || 'Unknown', 'คนสวน');
  
  replyMessage(event.replyToken, {
    type: 'text',
    text: `ยินดีต้อนรับ ${profile.displayName} สู่ระบบจัดการสวนทุเรียน`
  });
}

function handlePostback(event) {
  const userId = event.source.userId;
  const data = event.postback.data;
  const params = new URLSearchParams(data);
  const action = params.get('action');
  
  if (action === 'CANCEL') {
    clearState(userId);
    replyMessage(event.replyToken, buildSuccessFlex('ยกเลิกรายการแล้ว'));
    return;
  }
  
  if (action === 'SCAN_RESULT') {
    const treeId = params.get('tree');
    const flow = params.get('flow');
    
    const treeInfo = getTreeInfo(treeId);
    if (!treeInfo) {
      replyMessage(event.replyToken, buildErrorFlex('ไม่พบข้อมูลต้นไม้ในระบบ'));
      return;
    }
    
    const remaining = getRemainingFruits(getActiveSeason(), treeId);
    const msgs = [buildTreeInfoFlex(treeInfo, remaining)];
    
    if (flow === 'harvest') {
      msgs.push(buildHarvestReasonFlex(treeId));
      setState(userId, { action: 'HARVEST', data: { treeId: treeId } });
    } else if (flow === 'production') {
      msgs.push(buildTextPromptFlex('กรุณาพิมพ์จำนวนผลผลิตทั้งหมดที่นับได้'));
      setState(userId, { step: 'WAIT_QUANTITY', action: 'PRODUCTION', data: { treeId: treeId } });
    }
    replyMessage(event.replyToken, msgs);
    return;
  }
  
  const state = getState(userId) || { data: {} };
  
  if (action === 'HARVEST_REASON') {
    state.data.reason = params.get('reason');
    state.step = 'WAIT_QUANTITY';
    setState(userId, state);
    replyMessage(event.replyToken, buildTextPromptFlex('กรุณาพิมพ์จำนวนที่เก็บเกี่ยว'));
  }
  else if (action === 'GRADE') {
    state.data.grade = params.get('grade');
    state.step = 'WAIT_WEIGHT';
    setState(userId, state);
    replyMessage(event.replyToken, buildTextPromptFlex('กรุณาพิมพ์น้ำหนักรวม (กิโลกรัม)'));
  }
  else if (action === 'VARIETY') {
    state.data.variety = params.get('variety');
    state.step = 'WAIT_AGE';
    setState(userId, state);
    replyMessage(event.replyToken, buildTextPromptFlex('กรุณาพิมพ์อายุต้น (ปี)'));
  }
  else if (action === 'MONTH') {
    state.data.flowerMonth = params.get('month');
    state.step = 'WAIT_LOCATION';
    setState(userId, state);
    replyMessage(event.replyToken, buildLocationRequestFlex());
  }
  else if (action === 'CONFIRM') {
    const type = params.get('type');
    const profile = getProfile(userId);
    let queueType = '';
    
    if (type === 'harvest') queueType = 'ตัดจำหน่าย';
    else if (type === 'production') queueType = 'บันทึกผลผลิต';
    else if (type === 'register') queueType = 'ลงทะเบียนต้นไม้';
    
    addToPendingQueue(queueType, state.data.treeId, state.data, userId, profile.displayName, state.data.photoUrl);
    clearState(userId);
    
    replyMessage(event.replyToken, buildSuccessFlex('บันทึกข้อมูลและส่งขออนุมัติเรียบร้อยแล้ว'));
  }
  else if (action === 'APPROVE') {
    const itemId = params.get('id');
    const profile = getProfile(userId);
    const success = approveItem(itemId, profile.displayName);
    if (success) {
      replyMessage(event.replyToken, buildSuccessFlex('อนุมัติรายการเรียบร้อย'));
    } else {
      replyMessage(event.replyToken, buildErrorFlex('ไม่พบรายการหรือถูกอนุมัติไปแล้ว'));
    }
  }
  else if (action === 'REJECT_START') {
    const itemId = params.get('id');
    state.action = 'REJECT';
    state.step = 'WAIT_REASON';
    state.data.itemId = itemId;
    setState(userId, state);
    replyMessage(event.replyToken, buildTextPromptFlex('กรุณาพิมพ์เหตุผลที่ปฏิเสธ'));
  }
  else if (action === 'APPROVAL_LIST') {
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
    const viewType = params.get('type');
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
    state.step = 'WAIT_TREE_ID';
    setState(userId, state);
    replyMessage(event.replyToken, buildTextPromptFlex('กรุณาพิมพ์รหัสต้น (เช่น 001)'));
  }
}

function handleTextMessage(event) {
  const userId = event.source.userId;
  const text = event.message.text.trim();
  const state = getState(userId);
  
  if (!state) return; // Ignore if not in flow
  
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
        replyMessage(event.replyToken, buildPhotoRequestFlex());
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
      replyMessage(event.replyToken, buildPhotoRequestFlex());
    }
    else if (state.step === 'WAIT_PHOTO' && text === 'ข้าม') {
      replyMessage(event.replyToken, buildHarvestSummaryFlex(state.data));
    }
  }
  else if (state.action === 'PRODUCTION') {
    if (state.step === 'WAIT_QUANTITY') {
      state.data.quantity = parseInt(text, 10);
      replyMessage(event.replyToken, buildProductionSummaryFlex(state.data));
    }
  }
  else if (state.action === 'REGISTER_TREE') {
    if (state.step === 'WAIT_TREE_ID') {
      state.data.treeId = text;
      state.step = 'WAIT_VARIETY';
      setState(userId, state);
      replyMessage(event.replyToken, buildVarietySelectionFlex());
    }
    else if (state.step === 'WAIT_AGE') {
      state.data.age = parseInt(text, 10);
      state.step = 'WAIT_MONTH';
      setState(userId, state);
      replyMessage(event.replyToken, buildMonthSelectionFlex());
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
    const photoUrl = savePhotoToDrive(event.message.id, getActiveSeason(), state.data.treeId);
    state.data.photoUrl = photoUrl;
    setState(userId, state);
    
    if (state.action === 'HARVEST') {
      replyMessage(event.replyToken, buildHarvestSummaryFlex(state.data));
    }
  }
}

function handleLocationMessage(event) {
  const userId = event.source.userId;
  const state = getState(userId);
  if (state && state.action === 'REGISTER_TREE' && state.step === 'WAIT_LOCATION') {
    state.data.lat = event.message.latitude;
    state.data.lng = event.message.longitude;
    setState(userId, state);
    replyMessage(event.replyToken, buildTreeRegistrationSummaryFlex(state.data));
  }
}
