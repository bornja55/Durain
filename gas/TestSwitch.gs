// ==========================================
// เครื่องมือสลับ Role สำหรับทดสอบ (รันจาก Apps Script editor)
// สลับได้ครบ 4 role: เจ้าของ / admin / คนสวน / Customer
// อัปเดตทั้ง role ในชีต "ผู้ใช้" และ Rich Menu จริง
//
// วิธีใช้:
//   1. ตั้ง Script Property OWNER_LINE_ID เป็น LINE userId ของคุณ (มีอยู่แล้ว)
//   2. เลือกฟังก์ชัน testAs... ที่ต้องการ แล้วกด Run
//   3. ปิดแชท LINE แล้วเปิดใหม่ เมนูจะเปลี่ยนตาม role
//   4. ทดสอบเสร็จ รัน testAsOwner() เพื่อกลับเป็นเจ้าของเสมอ!
// ==========================================

function testAsOwner()    { switchMyRole('เจ้าของ'); }
function testAsAdmin()    { switchMyRole('admin'); }
function testAsWorker()   { switchMyRole('คนสวน'); }
function testAsCustomer() { switchMyRole('Customer'); }

/**
 * เปลี่ยน role ของ "เจ้าของตัวจริง" (OWNER_LINE_ID) ในชีต + sync Rich Menu
 * ใช้ OWNER_LINE_ID จาก Script Properties เสมอ ไม่สนว่า role ปัจจุบันคืออะไร
 * จึงสลับกลับได้เสมอแม้ตอนนั้นจะเป็น Customer อยู่
 */
function switchMyRole(newRole) {
  const validRoles = ['เจ้าของ', 'admin', 'คนสวน', 'Customer'];
  if (validRoles.indexOf(newRole) === -1) {
    Logger.log('❌ role ไม่ถูกต้อง: ' + newRole + ' (ต้องเป็น ' + validRoles.join(' / ') + ')');
    return;
  }

  const myUserId = getConfig('OWNER_LINE_ID');
  if (!myUserId) {
    Logger.log('❌ ยังไม่ได้ตั้ง Script Property: OWNER_LINE_ID');
    return;
  }

  // อัปเดต role ในชีต "ผู้ใช้"
  const sheet = SheetRepository.getSheet('ผู้ใช้');
  const data = sheet.getDataRange().getValues();
  let found = false;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === myUserId) {
      sheet.getRange(i + 1, 3).setValue(newRole);
      found = true;
      break;
    }
  }
  if (!found) {
    Logger.log('❌ ไม่พบ userId ' + myUserId + ' ในชีต "ผู้ใช้" — ตรวจว่า OWNER_LINE_ID ตรงกับคอลัมน์ A');
    return;
  }

  // Sync Rich Menu ตาม role ใหม่
  syncUserRichMenu(myUserId, newRole);
  Logger.log('✅ สลับเป็น role "' + newRole + '" เรียบร้อย (ชีต + Rich Menu) — ปิดแชทแล้วเปิดใหม่เพื่อเห็นเมนูใหม่');
  Logger.log('ℹ️ ทดสอบเสร็จอย่าลืมรัน testAsOwner() เพื่อกลับเป็นเจ้าของ');
}

/**
 * Diagnostic: แสดง Rich Menu ทั้งหมดที่มีอยู่จริงบน LINE + Default menu
 * ใช้ยืนยันว่า ID ใน RICH_MENU_IDS (SheetOperations.gs) ยังมีอยู่จริง
 */
function listRichMenus() {
  const token = getConfig('CHANNEL_ACCESS_TOKEN');
  const options = { headers: { 'Authorization': 'Bearer ' + token }, muteHttpExceptions: true };

  const res = UrlFetchApp.fetch('https://api.line.me/v2/bot/richmenu/list', options);
  const menus = (JSON.parse(res.getContentText()).richmenus) || [];
  Logger.log('=== Rich Menus บน LINE (' + menus.length + ' รายการ) ===');
  menus.forEach(function (m) {
    // เมนูที่ "มีอยู่" แต่ยังไม่อัปโหลดรูป จะ link ให้ผู้ใช้ไม่ได้ (LINE ปฏิเสธ)
    // แล้วผู้ใช้จะตกไปใช้ Default menu แทน = ต้นเหตุที่เมนูเพี้ยนแบบเงียบๆ
    const imgRes = UrlFetchApp.fetch('https://api-data.line.me/v2/bot/richmenu/' + m.richMenuId + '/content', options);
    const hasImage = imgRes.getResponseCode() === 200;
    Logger.log(m.richMenuId + '  |  ' + m.name + '  |  ' + m.chatBarText +
      '  |  รูป: ' + (hasImage ? '✅ มี (ใช้ได้)' : '❌ ไม่มี (link ไม่ได้!)'));
  });

  const defRes = UrlFetchApp.fetch('https://api.line.me/v2/bot/user/all/richmenu', options);
  Logger.log('=== Default Menu ===');
  Logger.log(defRes.getResponseCode() === 200 ? defRes.getContentText() : '(ไม่ได้ตั้ง Default)');

  Logger.log('=== ที่โค้ดใช้อยู่ (RICH_MENU_IDS) ===');
  Logger.log(JSON.stringify(RICH_MENU_IDS, null, 2));
  Logger.log('ถ้า ID ใน RICH_MENU_IDS ไม่อยู่ในรายการข้างบน ให้แก้ค่าใน SheetOperations.gs ให้ตรง');
}

/**
 * ซ่อมเมนูให้ผู้ใช้ทุกคนในชีต "ผู้ใช้" ตาม role ปัจจุบัน
 * ใช้ครั้งเดียวหลังแก้ RICH_MENU_IDS — คนที่เคยผูกกับเมนูรุ่นเก่าที่ถูกลบ
 * (แล้วตกไปเมนู Default/Customer) จะถูก link กลับให้ถูกต้องทั้งหมด
 */
function resyncAllRichMenus() {
  const sheet = SheetRepository.getSheet('ผู้ใช้');
  const data = sheet.getDataRange().getValues();
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    const userId = String(data[i][0] || '').trim();
    const role = String(data[i][2] || '').trim();
    if (!userId) continue;
    syncUserRichMenu(userId, role);
    count++;
  }
  Logger.log('✅ resync เมนูให้ผู้ใช้ ' + count + ' คนเรียบร้อย (ดู error รายคนใน Executions log ถ้ามี)');
}

/**
 * Diagnostic ชี้ขาด: ลอง link เมนูทั้ง 3 ตัวใน RICH_MENU_IDS ให้เจ้าของจริงๆ
 * แล้วรายงานว่า LINE ตอบอะไรกลับมา (ไม่กลืน error เหมือน syncUserRichMenu)
 * จบด้วยการ link เมนู admin คืนให้เสมอ
 */
function diagnoseRichMenuLink() {
  const myUserId = getConfig('OWNER_LINE_ID');
  const token = getConfig('CHANNEL_ACCESS_TOKEN');
  if (!myUserId) { Logger.log('❌ ไม่มี OWNER_LINE_ID'); return; }

  Logger.log('=== ทดสอบ link เมนูให้ ' + myUserId + ' ===');
  Object.keys(RICH_MENU_IDS).forEach(function (key) {
    const id = RICH_MENU_IDS[key];
    const res = UrlFetchApp.fetch('https://api.line.me/v2/bot/user/' + myUserId + '/richmenu/' + id, {
      method: 'post',
      headers: { 'Authorization': 'Bearer ' + token },
      muteHttpExceptions: true
    });
    const code = res.getResponseCode();
    Logger.log(key + ' (' + id + ') -> HTTP ' + code + (code === 200 ? ' ✅ สำเร็จ' : ' ❌ ' + res.getContentText()));
  });

  syncUserRichMenu(myUserId, 'เจ้าของ');
  Logger.log('--- คืนเมนู admin ให้เจ้าของแล้ว ---');
}

/**
 * Diagnostic: เทียบ OWNER_LINE_ID กับแถวในชีต "ผู้ใช้"
 * ถ้า userId ในชีตไม่ตรงกับ userId จริงของเจ้าของ ระบบจะมองว่าเป็นคนใหม่
 * แล้ว register เป็น Customer + ผูกเมนูลูกค้าให้ทันที (โดยไม่มี error เลย)
 * นี่คือเส้นทางที่ทำให้ "เจ้าของกลายเป็นลูกค้า" ทั้งที่ role ในชีตยังถูก
 */
function diagnoseUserRows() {
  const ownerId = getConfig('OWNER_LINE_ID');
  Logger.log('OWNER_LINE_ID (Script Property) = ' + ownerId);
  Logger.log('');

  const sheet = SheetRepository.getSheet('ผู้ใช้');
  const data = sheet.getDataRange().getValues();
  Logger.log('=== ชีต "ผู้ใช้" มี ' + (data.length - 1) + ' แถว ===');

  const seen = {};
  let ownerRowFound = false;
  for (let i = 1; i < data.length; i++) {
    const uid = String(data[i][0] || '');
    const uidTrim = uid.trim();
    const role = String(data[i][2] || '');
    const marks = [];

    if (uidTrim === String(ownerId || '').trim()) { marks.push('⬅️ ตรงกับ OWNER_LINE_ID'); ownerRowFound = true; }
    if (uid !== uidTrim) marks.push('⚠️ userId มีช่องว่างหน้า/หลัง');
    if (role !== role.trim()) marks.push('⚠️ role มีช่องว่างหน้า/หลัง');
    if (seen[uidTrim]) marks.push('⚠️ userId ซ้ำกับแถว ' + seen[uidTrim]);
    seen[uidTrim] = i + 1;

    Logger.log('แถว ' + (i + 1) + ' | ' + uid + ' | ' + data[i][1] + ' | role=' + role + '  ' + marks.join(' '));
  }

  Logger.log('');
  if (!ownerRowFound) {
    Logger.log('❌ ไม่พบแถวที่ userId ตรงกับ OWNER_LINE_ID');
    Logger.log('   => นี่คือต้นเหตุ: ระบบมองเจ้าของเป็นผู้ใช้ใหม่ แล้วตั้งเป็น Customer ทุกครั้งที่ทัก');
    Logger.log('   => วิธีแก้: แก้ userId ในชีตแถวของเจ้าของให้เป็น ' + ownerId + ' แล้วลบแถว Customer ที่ซ้ำออก');
  } else {
    Logger.log('✅ พบแถวของเจ้าของตรงกับ OWNER_LINE_ID แล้ว');
  }
}

/**
 * Diagnostic: เช็คว่าตอนนี้ user ผูกกับเมนูไหนอยู่
 */
function checkMyRichMenu() {
  const myUserId = getConfig('OWNER_LINE_ID');
  const token = getConfig('CHANNEL_ACCESS_TOKEN');
  const res = UrlFetchApp.fetch('https://api.line.me/v2/bot/user/' + myUserId + '/richmenu',
    { headers: { 'Authorization': 'Bearer ' + token }, muteHttpExceptions: true });
  if (res.getResponseCode() === 200) {
    Logger.log('ผูกอยู่กับ: ' + res.getContentText());
  } else {
    Logger.log('ไม่ได้ผูกเมนูส่วนตัว (ใช้ Default = Customer Menu): ' + res.getContentText());
  }
}
