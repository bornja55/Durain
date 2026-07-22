function generateQRCode(treeId) {
  // สร้าง QR Code ที่เมื่อสแกนด้วยกล้อง LINE จะพิมพ์ข้อความ SCAN:harvest:{treeId} ให้ในแชทอัตโนมัติ
  // วิธีนี้เสถียรกว่าการเปิดเว็บ LIFF และไม่ค้าง 100%
  const textCommand = `SCAN:harvest:${treeId}`;
  const qrData = `https://line.me/R/msg/text/?${encodeURIComponent(textCommand)}`;
  
  const url = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(qrData)}`;
  const response = UrlFetchApp.fetch(url);
  return response.getBlob();
}

function generateAllQRCodes() {
  const sheet = getSpreadsheet().getSheetByName('ต้นไม้');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][6] === 'active') { // สถานะ
      const treeId = data[i][0];
      const qrUrl = generateQRCodeUrl(treeId, liffId);
      sheet.getRange(i + 1, 8).setValue(qrUrl);
    }
  }
}
