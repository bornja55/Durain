function checkAndPushPending() {
  const ownerId = getConfig('OWNER_LINE_ID');
  if (!ownerId) return;

  const pendingCount = getPendingCount();
  if (pendingCount > 0) {
    pushMessage(ownerId, {
      type: 'text',
      text: `มีรายการรออนุมัติจำนวน ${pendingCount} รายการ กรุณาตรวจสอบ`
    });
  }

  // เตือนวันที่ตัดขายแล้วแต่ยังไม่บันทึกการขาย — ถ้าลืม รายได้ต่อต้นของวันนั้น
  // จะเป็น 0 ตลอดไปโดยไม่มีใครรู้ (ข้อมูลผิดแบบเงียบๆ อันตรายกว่าระบบพัง)
  try {
    const missing = getRoundsMissingSale(getActiveSeason());
    if (missing.length > 0) {
      const list = missing.slice(-5).map(formatRoundIdAsDate).join('\n• ');
      pushMessage(ownerId, {
        type: 'text',
        text: `📦 ยังไม่ได้บันทึกการขายของวันที่:\n• ${list}\n\n` +
              (missing.length > 5 ? `(และอีก ${missing.length - 5} วัน)\n\n` : '') +
              'กดเมนู "บันทึกการขาย" เพื่อกรอกเกรดและราคาครับ'
      });
    }
  } catch (e) {
    logErrorToSheet('checkAndPushPending', 'เช็ควันที่ยังไม่บันทึกการขายไม่สำเร็จ', e.toString());
  }
}

function setupTriggers() {
  deleteTriggers(); // clean up first
  const hours = [8, 10, 12, 14, 16, 18];
  
  hours.forEach(hour => {
    ScriptApp.newTrigger('checkAndPushPending')
      .timeBased()
      .atHour(hour)
      .nearMinute(0)
      .everyDays(1)
      .create();
  });
}

function deleteTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'checkAndPushPending') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}
