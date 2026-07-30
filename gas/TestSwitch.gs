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
 *
 * ⚠️ ฟังก์ชันนี้ "แก้ไขข้อมูลจริง" ไม่ใช่แค่ตรวจสอบเฉยๆ — ทุกครั้งที่รัน จะ
 * เปลี่ยนเมนูที่ผูกกับ OWNER_LINE_ID จริงบน LINE ไปเรื่อยๆ (admin -> worker ->
 * customer ตามลำดับใน RICH_MENU_IDS) เดิมจบด้วยการบังคับ sync กลับเป็น 'เจ้าของ'
 * เสมอ ซึ่งจะไปทับ role ที่กำลังทดสอบอยู่แบบเงียบๆ (เช่นกำลังทดสอบ 'คนสวน' อยู่
 * แล้วเผลอรันฟังก์ชันนี้ เมนูจะถูกดีดกลับเป็น Owner Menu ทันทีโดยไม่มีคำเตือน)
 * ตัดบรรทัดนั้นออกแล้ว — ใช้ testAsOwner() เองถ้าต้องการคืนเป็นเจ้าของ
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

  Logger.log('--- ทดสอบ link ครบทุกเมนูแล้ว (ไม่ได้คืนเป็น admin ให้อัตโนมัติ) ---');
  Logger.log('ℹ️ ตอนนี้เมนูจริงของ ' + myUserId + ' ค้างอยู่ที่ตัวสุดท้ายที่ลิงก์ (customer) — รัน checkMyRichMenu() เพื่อดู แล้วรัน testAsOwner() ถ้าต้องการคืนเป็นเจ้าของ');
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

/**
 * debug-mantra 2026-07-30 (Mantra 1: Reproduce First): เช็คว่ามีรายการค้างอยู่
 * ในคิวรออนุมัติจริงไหม ก่อนจะเดาสาเหตุที่ "ประวัติ/รายได้ไม่ขึ้น" — ทั้งการ
 * บันทึก "ตัดขาย" (harvest) และ "บันทึกการขาย" (sale) ต้องผ่านการอนุมัติก่อน
 * ถึงจะไปโผล่ในชีต "การเก็บเกี่ยว"/"รอบขาย" ที่หน้าประวัติ/รายได้อ่านอยู่ —
 * ถ้ายังค้างสถานะ "รออนุมัติ"/"ส่งกลับแก้ไข" คือยังไม่ถูกอนุมัติ ไม่ใช่บั๊ก
 */
function listPendingQueueItems() {
  const sheet = SheetRepository.getSheet('คิวรออนุมัติ');
  const data = sheet.getDataRange().getValues();
  let count = 0;
  Logger.log('=== รายการในคิวรออนุมัติที่ยังไม่จบ (รออนุมัติ / ส่งกลับแก้ไข) ===');
  for (let i = 1; i < data.length; i++) {
    const status = data[i][3];
    if (status !== 'รออนุมัติ' && status !== 'ส่งกลับแก้ไข') continue;
    count++;
    Logger.log('ID=' + data[i][0] + ' | ประเภท=' + data[i][1] + ' | รหัสต้น/รอบ=' + data[i][2] +
      ' | สถานะ=' + status + ' | บันทึกโดย=' + data[i][5] + ' | วันที่=' + data[i][7] +
      ' | ข้อมูล=' + data[i][4]);
  }
  if (count === 0) {
    Logger.log('(ไม่มีรายการค้าง — ถ้ายังไม่ขึ้นประวัติ/รายได้ สาเหตุไม่ใช่รอการอนุมัติ ต้องหาสาเหตุอื่น)');
  } else {
    Logger.log('');
    Logger.log('พบ ' + count + ' รายการค้างอยู่ — ถ้ารายการที่ "เพิ่งตัดขายไป" อยู่ในนี้ นั่นคือสาเหตุ:');
    Logger.log('ยังไม่ได้กด "อนุมัติ" (เมนู "รออนุมัติ" ใน LINE หรือ Dashboard) จึงยังไม่เขียนลงชีตจริง');
  }
}

/**
 * debug-mantra 2026-07-30 (Mantra 3: Falsify): Dashboard ขึ้น "ฤดูกาลปัจจุบัน: -"
 * (ว่างเปล่า) สงสัยว่า getActiveSeason() คืนค่า null (ACTIVE_SEASON ไม่เคยถูกตั้ง
 * ใน Script Properties หลังย้ายจาก Config sheet) แล้วค่าที่ไม่ตรงกันระหว่างตอน
 * "อนุมัติ" (เขียน seasonId ลงแถว) กับตอน "ดูรายได้" (กรองด้วย seasonId) ทำให้
 * ข้อมูลหายไป — เช็คค่าจริงตรงๆ ทั้ง 2 ฝั่งแทนเดา
 */
function debugSeasonAndHarvestData() {
  Logger.log('=== getActiveSeason() ตอนนี้คืนค่า: "' + getActiveSeason() + '" ===');
  Logger.log('');

  const harvestSheet = SheetRepository.getSheet('การเก็บเกี่ยว');
  const hData = harvestSheet.getDataRange().getValues();
  Logger.log('=== แถวล่าสุดในชีต "การเก็บเกี่ยว" (คอลัมน์ B = seasonId ที่บันทึกไว้จริง) ===');
  const lastN = hData.slice(Math.max(1, hData.length - 5));
  lastN.forEach(function (row) {
    Logger.log('treeId=' + row[2] + ' | seasonId(B)="' + row[1] + '" | เหตุผล=' + row[4] +
      ' | น้ำหนัก=' + row[6] + ' | roundId=' + row[14]);
  });

  Logger.log('');
  const saleSheet = SheetRepository.getSheet(SALE_ROUND_SHEET);
  if (saleSheet) {
    const sData = saleSheet.getDataRange().getValues();
    Logger.log('=== แถวล่าสุดในชีต "รอบขาย" ===');
    sData.slice(Math.max(1, sData.length - 5)).forEach(function (row) {
      Logger.log('roundId=' + row[0] + ' | เกรด=' + row[2] + ' | น้ำหนัก=' + row[3] + ' | รวมเงิน=' + row[5]);
    });
  } else {
    Logger.log('❌ ไม่พบชีต "รอบขาย" เลย');
  }

  Logger.log('');
  Logger.log('=== ทดสอบเรียก getRevenueByTree() ตรงๆ ด้วย seasonId ปัจจุบัน ===');
  try {
    const result = getRevenueByTree(getActiveSeason());
    Logger.log('ผลลัพธ์: ' + JSON.stringify(result));
    if (result.length === 0) {
      Logger.log('⚠️ ได้ array ว่าง — ถ้า seasonId(B) ในชีตข้างบน "ไม่ตรง" กับ getActiveSeason() นี่คือสาเหตุ');
    }
  } catch (e) {
    Logger.log('❌ getRevenueByTree() throw error: ' + e.toString());
  }

  // debug-mantra 2026-07-30 (Mantra 2: Trace the Fail Path): ภาพรวม/รายได้ ใน
  // Dashboard ไม่ได้เรียก getRevenueByTree เลย — ทั้งคู่ใช้ getDashboardDataWeb()
  // ตัวเดียว (Dashboard.js.html เรียก .getDashboardDataWeb() แล้วเอา
  // data.totalRevenue/data.activeSeason ไปแสดง) ไล่ทีละท่อนแยก try/catch กัน
  // exception จุดเดียวบังทุกอย่างที่เหลือ เหมือนที่ alert() อาจไม่เด้งใน LIFF webview
  Logger.log('');
  Logger.log('=== ไล่ทีละส่วนของ getDashboardDataWeb() (จำลอง logic เดียวกัน) ===');
  try {
    const seasonId = getActiveSeason();
    Logger.log('1) seasonId = "' + seasonId + '"');

    const ss = SheetRepository.getSpreadsheet();
    const treeSheet = ss.getSheetByName('ต้นไม้');
    const treeData = treeSheet.getDataRange().getValues();
    Logger.log('2) totalTrees = ' + (treeData.length > 1 ? treeData.length - 1 : 0) + ' (แถวทั้งหมดในชีตต้นไม้ = ' + treeData.length + ')');

    try {
      const pendingCount = getPendingCount();
      Logger.log('3) getPendingCount() = ' + pendingCount);
    } catch (e3) {
      Logger.log('3) ❌ getPendingCount() throw: ' + e3.toString());
    }

    try {
      const harvestSheet = ss.getSheetByName('การเก็บเกี่ยว');
      const harvestData = harvestSheet.getDataRange().getValues();
      let totalRevenue = 0, matchedRows = 0;
      for (let i = 1; i < harvestData.length; i++) {
        if (harvestData[i][1] == seasonId) {
          matchedRows++;
          if (harvestData[i][4] !== 'เสียหาย') totalRevenue += Number(harvestData[i][7]) || 0;
        }
      }
      Logger.log('4) harvest loop: matchedRows(season)=' + matchedRows + ' totalRevenue(จากคอลัมน์ราคาเก่า)=' + totalRevenue +
        '  ⚠️ คอลัมน์นี้ (index 7) เป็นค่าว่างเสมอในแถวใหม่ตั้งแต่ย้ายราคาไปชีต "รอบขาย" แล้ว — totalRevenue นี้จะเป็น 0 เสมอสำหรับข้อมูลใหม่ ถึงจะมียอดขายจริงก็ตาม');
    } catch (e4) {
      Logger.log('4) ❌ harvest loop throw: ' + e4.toString());
    }

    try {
      const yoy = getDashboardYearComparison();
      Logger.log('5) getDashboardYearComparison() = ' + JSON.stringify(yoy));
    } catch (e5) {
      Logger.log('5) ❌ getDashboardYearComparison() throw: ' + e5.toString());
    }
  } catch (eOuter) {
    Logger.log('❌ พังตั้งแต่ขั้นแรกๆ: ' + eOuter.toString());
  }

  Logger.log('');
  Logger.log('=== ทดสอบ getHarvestHistory() ตรงๆ สำหรับ T-001 (หน้าประวัติต้นไม้) ===');
  try {
    const history = getHarvestHistory(getActiveSeason(), 'T-001', 10);
    Logger.log('ผลลัพธ์: ' + JSON.stringify(history));
    if (history.length === 0) Logger.log('⚠️ ว่างเปล่า ทั้งที่มีแถวอนุมัติแล้วของ T-001 อยู่ — ต้องดูสาเหตุแยกต่างหาก');
  } catch (eH) {
    Logger.log('❌ getHarvestHistory() throw: ' + eH.toString());
  }
}
