function checkAndPushPending() {
  const pendingCount = getPendingCount();
  if (pendingCount > 0) {
    const ownerId = getConfig('OWNER_LINE_ID');
    if (ownerId) {
      pushMessage(ownerId, {
        type: 'text',
        text: `มีรายการรออนุมัติจำนวน ${pendingCount} รายการ กรุณาตรวจสอบ`
      });
    }
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
