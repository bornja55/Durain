function initializeDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Config
  setupSheet(ss, 'Config', ['Key', 'Value', 'คำอธิบาย']);
  const configSheet = ss.getSheetByName('Config');
  if (configSheet.getLastRow() <= 1) {
    configSheet.getRange(2, 1, 6, 3).setValues([
      ['ACTIVE_SEASON', '2569', 'รหัสฤดูกาลปัจจุบัน'],
      ['OWNER_LINE_ID', '', 'LINE UserID ของเจ้าของ (ไว้รับแจ้งเตือน)'],
      ['DRIVE_FOLDER_ID', '', 'ID ของโฟลเดอร์ Google Drive สำหรับเก็บรูป'],
      ['LIFF_ID', '', 'LIFF ID สำหรับ Dashboard และ Scanner'],
      ['CHANNEL_ACCESS_TOKEN', '', 'LINE Channel Access Token'],
      ['CHANNEL_SECRET', '', 'LINE Channel Secret']
    ]);
  }

  // 2. ต้นไม้
  setupSheet(ss, 'ต้นไม้', [
    'รหัสต้น', 'พันธุ์', 'อายุ(ปี)', 'Latitude', 'Longitude', 
    'เดือนออกดอก', 'สถานะ', 'QR Code URL', 'วันที่ลงทะเบียน', 'ลงทะเบียนโดย', 'รูปภาพ URL'
  ]);
  setValidation(ss.getSheetByName('ต้นไม้'), 'G2:G', ['active', 'ปลดระวาง']);
  setValidation(ss.getSheetByName('ต้นไม้'), 'B2:B', ['หมอนทอง', 'ชะนี', 'ก้านยาว', 'กระดุม', 'พวงมณี', 'นกหยิบ', 'อื่นๆ']);

  // 3. ฤดูกาล
  setupSheet(ss, 'ฤดูกาล', ['รหัสฤดูกาล', 'สถานะ', 'วันเปิด', 'วันปิด']);
  setValidation(ss.getSheetByName('ฤดูกาล'), 'B2:B', ['เปิด', 'ปิด']);

  // 4. ผลผลิต
  setupSheet(ss, 'ผลผลิต', [
    'ID', 'รหัสฤดูกาล', 'รหัสต้น', 'จำนวนผล', 'ตัดแล้ว', 
    'คงเหลือ', 'บันทึกโดย', 'วันที่บันทึก'
  ]);

  // 5. การเก็บเกี่ยว
  // คอลัมน์ 'เกรด'/'ราคา/กก.' คงไว้เพื่อไม่ให้ข้อมูลรุ่นเก่าพัง แต่แถวใหม่
  // จะเว้นว่างเสมอ — เกรดกับราคาย้ายไปอยู่ชีต 'รอบขาย' แล้ว เพราะตอนคนสวน
  // ชั่งทีละต้นยังไม่รู้เกรด ต้องเทรวมกองแล้วคัดขายอีกที (1 รอบ = 1 วัน)
  setupSheet(ss, 'การเก็บเกี่ยว', [
    'ID', 'รหัสฤดูกาล', 'รหัสต้น', 'จำนวนลูก', 'เหตุผล',
    'เกรด (เลิกใช้)', 'น้ำหนัก(กก.)', 'ราคา/กก. (เลิกใช้)', 'รูปถ่าย URL',
    'บันทึกโดย', 'LINE UserID', 'วันที่บันทึก', 'วันที่อนุมัติ', 'อนุมัติโดย', 'รอบที่'
  ]);
  setValidation(ss.getSheetByName('การเก็บเกี่ยว'), 'E2:E', ['ตัดขาย', 'เสียหาย']);

  // 5.1 รอบขาย — ผลการคัดเกรดและราคาขายจริงของแต่ละวัน (1 แถวต่อ 1 เกรด)
  setupSheet(ss, 'รอบขาย', [
    'รอบที่', 'วันที่ขาย', 'เกรด', 'น้ำหนัก(กก.)', 'ราคา/กก.',
    'รวมเงิน', 'ผู้ซื้อ', 'บันทึกโดย', 'วันที่บันทึก'
  ]);
  setValidation(ss.getSheetByName('รอบขาย'), 'C2:C', ['A', 'B', 'C', 'ตกไซซ์']);

  // 6. คิวรออนุมัติ
  setupSheet(ss, 'คิวรออนุมัติ', [
    'ID', 'ประเภท', 'รหัสต้น', 'สถานะ', 'ข้อมูล JSON', 
    'บันทึกโดย', 'LINE UserID', 'วันที่บันทึก', 'หมายเหตุ', 'รูปถ่าย URL'
  ]);
  // 'ส่งกลับแก้ไข'/'ยกเลิก' และ 'บันทึกขาย' เพิ่มมาพร้อม flow คนสวนส่งขายเข้าคิว
  // (ดู SheetOperations.gs หัวข้อ "คิวรออนุมัติสำหรับ 'บันทึกขาย'")
  setValidation(ss.getSheetByName('คิวรออนุมัติ'), 'D2:D', ['รออนุมัติ', 'อนุมัติ', 'ปฏิเสธ', 'ส่งกลับแก้ไข', 'ยกเลิก']);
  setValidation(ss.getSheetByName('คิวรออนุมัติ'), 'B2:B', ['ตัดจำหน่าย', 'บันทึกผลผลิต', 'ลงทะเบียนต้นไม้', 'บันทึกขาย']);

  // 7. ผู้ใช้
  setupSheet(ss, 'ผู้ใช้', ['LINE UserID', 'ชื่อ', 'บทบาท', 'Rich Menu ID']);
  setValidation(ss.getSheetByName('ผู้ใช้'), 'C2:C', ['คนสวน', 'เจ้าของ', 'admin']);

  SpreadsheetApp.getUi().alert('✅ สร้างฐานข้อมูลและตั้งค่าชีตสำเร็จเรียบร้อยแล้ว!');
}

/**
 * ==========================================================================
 * MIGRATION: แยกการเก็บเกี่ยวออกจากการขาย (รันครั้งเดียว)
 * ==========================================================================
 * รันฟังก์ชันนี้จาก Apps Script editor ก่อน deploy โค้ดชุดใหม่
 *
 *   เลือก migrateToSaleRounds จาก dropdown -> กด Run -> ดูผลใน Execution log
 *
 * สิ่งที่ทำ:
 *   1. สร้างชีต "รอบขาย" พร้อมหัวคอลัมน์ (ถ้ายังไม่มี)
 *   2. เพิ่มหัวคอลัมน์ "รอบที่" ที่คอลัมน์ O ของชีต "การเก็บเกี่ยว" (ถ้ายังไม่มี)
 *
 * ปลอดภัย:
 *   - ไม่แตะข้อมูลเดิมสักแถว แก้แค่หัวตารางกับสร้างชีตใหม่
 *   - รันซ้ำได้ (idempotent) ถ้ามีอยู่แล้วจะข้ามและรายงานว่าข้าม
 *   - ใช้ SheetRepository (อ่าน SPREADSHEET_ID จาก Script Properties)
 *     จึงรันได้ทั้งแบบ bound และ standalone
 *
 * ⚠️ ตั้งใจ "ไม่" เติมรหัสรอบย้อนหลังให้แถวเก่า:
 *   แถวเก่าเก็บราคาไว้ในตัวเอง (คอลัมน์ H) ระบบจึงคำนวณรายได้จากตรงนั้นได้
 *   ถ้าไปเติมรหัสรอบให้ ระบบจะเข้าใจว่าเป็นข้อมูลรูปแบบใหม่แล้วไปหาราคา
 *   ในชีต "รอบขาย" ซึ่งไม่มี -> รายได้ย้อนหลังทั้งหมดจะกลายเป็น 0 ทันที
 */
function migrateToSaleRounds() {
  const ss = SheetRepository.getSpreadsheet();
  const log = [];

  // ---- 1. ชีต "รอบขาย" ----
  const SALE_HEADERS = [
    'รอบที่', 'วันที่ขาย', 'เกรด', 'น้ำหนัก(กก.)', 'ราคา/กก.',
    'รวมเงิน', 'ผู้ซื้อ', 'บันทึกโดย', 'วันที่บันทึก'
  ];
  let saleSheet = ss.getSheetByName('รอบขาย');
  if (!saleSheet) {
    saleSheet = ss.insertSheet('รอบขาย');
    setupSheet(ss, 'รอบขาย', SALE_HEADERS);
    setValidation(saleSheet, 'C2:C', ['A', 'B', 'C', 'ตกไซซ์']);
    log.push('✅ สร้างชีต "รอบขาย" พร้อมหัวคอลัมน์ 9 ช่อง');
  } else {
    log.push('⏭️ ชีต "รอบขาย" มีอยู่แล้ว — ข้าม');
  }

  // ---- 2. คอลัมน์ "รอบที่" ในชีตการเก็บเกี่ยว ----
  const harvestSheet = ss.getSheetByName('การเก็บเกี่ยว');
  if (!harvestSheet) {
    log.push('❌ ไม่พบชีต "การเก็บเกี่ยว" — ตรวจชื่อชีตให้ตรงก่อน');
  } else {
    const ROUND_COL = 15; // คอลัมน์ O (index 14 ในโค้ด = คอลัมน์ที่ 15 ในชีต)
    const lastCol = harvestSheet.getLastColumn();
    const headers = harvestSheet.getRange(1, 1, 1, Math.max(lastCol, ROUND_COL)).getValues()[0];
    const current = String(headers[ROUND_COL - 1] || '').trim();

    if (current === 'รอบที่') {
      log.push('⏭️ คอลัมน์ "รอบที่" (O) มีอยู่แล้ว — ข้าม');
    } else if (current !== '') {
      // มีอย่างอื่นอยู่ตรงนั้น — หยุดทันที ดีกว่าเขียนทับข้อมูลใคร
      log.push('❌ คอลัมน์ O มีหัวข้ออื่นอยู่แล้ว: "' + current + '"');
      log.push('   หยุดเพื่อความปลอดภัย — ย้ายคอลัมน์นั้นออกก่อน แล้วรันใหม่');
    } else {
      harvestSheet.getRange(1, ROUND_COL).setValue('รอบที่')
        .setFontWeight('bold').setBackground('#d9ead3');
      log.push('✅ เพิ่มหัวคอลัมน์ "รอบที่" ที่คอลัมน์ O');
    }

    const dataRows = Math.max(harvestSheet.getLastRow() - 1, 0);
    log.push('ℹ️ ชีตการเก็บเกี่ยวมีข้อมูลเดิม ' + dataRows + ' แถว — ไม่ถูกแก้ไขใดๆ');
    if (dataRows > 0) {
      log.push('   (จงใจไม่เติมรหัสรอบย้อนหลัง เพื่อให้รายได้เก่ายังคำนวณจากคอลัมน์ราคาเดิมได้)');
    }
  }

  // ---- 3. ขยาย dropdown ของชีต "คิวรออนุมัติ" ให้รองรับ flow คนสวนส่งขาย ----
  // (ประเภท: บันทึกขาย / สถานะ: ส่งกลับแก้ไข, ยกเลิก) — แค่ตั้งรายการใหม่ทับ
  // รายการ validation เดิม ไม่แตะข้อมูลแถวไหนเลย รันซ้ำได้ปลอดภัย
  const queueSheet = ss.getSheetByName('คิวรออนุมัติ');
  if (!queueSheet) {
    log.push('❌ ไม่พบชีต "คิวรออนุมัติ" — ตรวจชื่อชีตให้ตรงก่อน');
  } else {
    setValidation(queueSheet, 'B2:B', ['ตัดจำหน่าย', 'บันทึกผลผลิต', 'ลงทะเบียนต้นไม้', 'บันทึกขาย']);
    setValidation(queueSheet, 'D2:D', ['รออนุมัติ', 'อนุมัติ', 'ปฏิเสธ', 'ส่งกลับแก้ไข', 'ยกเลิก']);
    log.push('✅ ขยาย dropdown ชีต "คิวรออนุมัติ" ให้รองรับ "บันทึกขาย" แล้ว');
  }

  log.push('');
  log.push('=== เสร็จแล้ว ขั้นต่อไป ===');
  log.push('1. วางไฟล์ .gs ชุดใหม่ให้ครบ แล้ว Deploy -> New version');
  log.push('2. ทดสอบตาม docs/QA_CHECKLIST.md หัวข้อ 6-NEW');

  log.forEach(function (l) { Logger.log(l); });
  return log.join('\n');
}

/**
 * ตรวจว่าโครงสร้างชีตพร้อมสำหรับโค้ดชุดใหม่หรือยัง (อ่านอย่างเดียว ไม่แก้อะไร)
 * รันได้ตลอดเวลาเพื่อยืนยันว่า migration สำเร็จจริง
 */
function verifySaleRoundSetup() {
  const ss = SheetRepository.getSpreadsheet();
  const problems = [];

  const saleSheet = ss.getSheetByName('รอบขาย');
  if (!saleSheet) {
    problems.push('❌ ไม่มีชีต "รอบขาย" — รัน migrateToSaleRounds()');
  } else if (String(saleSheet.getRange(1, 1).getValue()).trim() !== 'รอบที่') {
    problems.push('❌ ชีต "รอบขาย" คอลัมน์ A ต้องมีหัวว่า "รอบที่"');
  }

  const harvestSheet = ss.getSheetByName('การเก็บเกี่ยว');
  if (!harvestSheet) {
    problems.push('❌ ไม่มีชีต "การเก็บเกี่ยว"');
  } else if (String(harvestSheet.getRange(1, 15).getValue()).trim() !== 'รอบที่') {
    problems.push('❌ ชีต "การเก็บเกี่ยว" คอลัมน์ O ต้องมีหัวว่า "รอบที่" — รัน migrateToSaleRounds()');
  }

  const result = problems.length === 0
    ? '✅ โครงสร้างชีตพร้อมใช้งานแล้ว'
    : problems.join('\n');
  Logger.log(result);
  return result;
}

function setupSheet(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  // Set headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format headers
  sheet.getRange(1, 1, 1, headers.length)
       .setFontWeight('bold')
       .setBackground('#d9ead3')
       .setBorder(true, true, true, true, true, true);
       
  // Freeze first row
  sheet.setFrozenRows(1);
}

function setValidation(sheet, rangeA1, values) {
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(values, true).build();
  sheet.getRange(rangeA1).setDataValidation(rule);
}
