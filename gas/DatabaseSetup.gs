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
    'เดือนออกดอก', 'สถานะ', 'QR Code URL', 'วันที่ลงทะเบียน', 'ลงทะเบียนโดย'
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
  setupSheet(ss, 'การเก็บเกี่ยว', [
    'ID', 'รหัสฤดูกาล', 'รหัสต้น', 'จำนวนลูก', 'เหตุผล', 
    'เกรด', 'น้ำหนัก(กก.)', 'ราคา/กก.', 'รูปถ่าย URL', 
    'บันทึกโดย', 'LINE UserID', 'วันที่บันทึก', 'วันที่อนุมัติ', 'อนุมัติโดย'
  ]);
  setValidation(ss.getSheetByName('การเก็บเกี่ยว'), 'E2:E', ['ตัดขาย', 'เสียหาย']);
  setValidation(ss.getSheetByName('การเก็บเกี่ยว'), 'F2:F', ['A', 'B', 'C', 'ตกไซซ์']);

  // 6. คิวรออนุมัติ
  setupSheet(ss, 'คิวรออนุมัติ', [
    'ID', 'ประเภท', 'รหัสต้น', 'สถานะ', 'ข้อมูล JSON', 
    'บันทึกโดย', 'LINE UserID', 'วันที่บันทึก', 'หมายเหตุ', 'รูปถ่าย URL'
  ]);
  setValidation(ss.getSheetByName('คิวรออนุมัติ'), 'D2:D', ['รออนุมัติ', 'อนุมัติ', 'ปฏิเสธ']);
  setValidation(ss.getSheetByName('คิวรออนุมัติ'), 'B2:B', ['ตัดจำหน่าย', 'บันทึกผลผลิต', 'ลงทะเบียนต้นไม้']);

  // 7. ผู้ใช้
  setupSheet(ss, 'ผู้ใช้', ['LINE UserID', 'ชื่อ', 'บทบาท', 'Rich Menu ID']);
  setValidation(ss.getSheetByName('ผู้ใช้'), 'C2:C', ['คนสวน', 'เจ้าของ', 'admin']);

  SpreadsheetApp.getUi().alert('✅ สร้างฐานข้อมูลและตั้งค่าชีตสำเร็จเรียบร้อยแล้ว!');
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
