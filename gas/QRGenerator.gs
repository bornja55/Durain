function generateQRCodeUrl(treeId, liffId) {
  const data = encodeURIComponent(`https://liff.line.me/${liffId}?tree=${treeId}`);
  return `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${data}`;
}

function generateAllQRCodes() {
  const liffId = getConfig('LIFF_ID');
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
