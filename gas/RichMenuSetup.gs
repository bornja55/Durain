/**
 * สคริปต์สำหรับสร้าง Rich Menu ผ่าน LINE Messaging API
 * อ้างอิงจากการออกแบบในเอกสาร LINE_OA_SETUP.md
 */

function setupRichMenus() {
  const token = getConfig('CHANNEL_ACCESS_TOKEN');
  const liffId = getConfig('LIFF_ID');
  
  if (!token) {
    Logger.log('ERROR: ไม่พบ CHANNEL_ACCESS_TOKEN ใน Config sheet');
    return;
  }
  
  const liffBaseUrl = liffId ? `https://liff.line.me/${liffId}` : 'https://liff.line.me/YOUR_LIFF_ID';
  
  // 1. Worker Menu (คนสวน) 2x2 grid, 4 buttons
  const workerMenu = {
    size: { width: 2500, height: 1686 },
    selected: true,
    name: "Worker Menu",
    chatBarText: "เมนูคนสวน",
    areas: [
      {
        bounds: { x: 0, y: 0, width: 1250, height: 843 },
        action: { type: "uri", uri: "https://line.me/R/nv/QRCodeReader" } // A: ตัดจำหน่ายผลผลิต (เปิดกล้อง LINE)
      },
      {
        bounds: { x: 1250, y: 0, width: 1250, height: 843 },
        action: { type: "uri", uri: "https://line.me/R/nv/QRCodeReader" } // B: บันทึกผลผลิต (เปิดกล้อง LINE)
      },
      {
        bounds: { x: 0, y: 843, width: 1250, height: 843 },
        action: { type: "postback", data: "action=REGISTER_TREE", displayText: "ลงทะเบียนต้นไม้" } // C: ลงทะเบียนต้นไม้
      },
      {
        bounds: { x: 1250, y: 843, width: 1250, height: 843 },
        action: { type: "postback", data: "action=DASHBOARD", displayText: "ภาพรวม" } // D: ภาพรวม
      }
    ]
  };

  // 2. Admin Menu (เจ้าของสวน) 3x2 grid, 6 buttons
  const dashboardUrl = `${liffBaseUrl}?page=dashboard`;
  const adminMenu = {
    size: { width: 2500, height: 1686 },
    selected: true,
    name: "Admin Menu",
    chatBarText: "เมนูผู้บริหาร",
    areas: [
      {
        bounds: { x: 0, y: 0, width: 833, height: 843 },
        action: { type: "postback", data: "action=APPROVAL_LIST", displayText: "รออนุมัติ" } // A: รออนุมัติ
      },
      {
        bounds: { x: 833, y: 0, width: 834, height: 843 },
        action: { type: "postback", data: "action=DASHBOARD", displayText: "ภาพรวม" } // B: ภาพรวม
      },
      {
        bounds: { x: 1667, y: 0, width: 833, height: 843 },
        action: { type: "uri", uri: dashboardUrl } // C: จัดการต้นไม้ (เปิด LIFF Dashboard)
      },
      {
        bounds: { x: 0, y: 843, width: 833, height: 843 },
        action: { type: "uri", uri: dashboardUrl } // D: รายงาน
      },
      {
        bounds: { x: 833, y: 843, width: 834, height: 843 },
        action: { type: "uri", uri: dashboardUrl } // E: AppSheet / Dashboard
      },
      {
        bounds: { x: 1667, y: 843, width: 833, height: 843 },
        action: { type: "uri", uri: dashboardUrl } // F: ตั้งค่า
      }
    ]
  };

  try {
    const workerMenuId = createRichMenuAPI(workerMenu, token);
    Logger.log('สร้าง Worker Menu สำเร็จ! ID: ' + workerMenuId);
    
    const adminMenuId = createRichMenuAPI(adminMenu, token);
    Logger.log('สร้าง Admin Menu สำเร็จ! ID: ' + adminMenuId);
    
    Logger.log('---');
    Logger.log('ขั้นตอนต่อไป:');
    Logger.log('1. อัปโหลดรูปภาพให้กับ Rich Menu ผ่าน Postman หรือ cURL');
    Logger.log('2. ตั้ง Worker Menu เป็นค่าเริ่มต้นโดยเรียกใช้: setDefaultRichMenu("' + workerMenuId + '")');
    Logger.log('3. ผูก Admin Menu ให้ผู้บริหารโดยเรียกใช้: linkRichMenuToUser(userId, "' + adminMenuId + '")');
    
  } catch (err) {
    Logger.log('เกิดข้อผิดพลาด: ' + err.toString());
  }
}

function createRichMenuAPI(menuObj, token) {
  const url = "https://api.line.me/v2/bot/richmenu";
  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    payload: JSON.stringify(menuObj),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(response.getContentText());
  
  if (response.getResponseCode() !== 200) {
    throw new Error(json.message || 'API Error');
  }
  
  return json.richMenuId;
}

function setDefaultRichMenu(richMenuId) {
  const token = getConfig('CHANNEL_ACCESS_TOKEN');
  const url = `https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`;
  const options = {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + token
    },
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() === 200) {
    Logger.log('ตั้งค่าเมนูเริ่มต้นสำเร็จ!');
  } else {
    Logger.log('เกิดข้อผิดพลาด: ' + response.getContentText());
  }
}

/**
 * ฟังก์ชันสำหรับอัปโหลดรูปภาพ Rich Menu จาก Google Drive
 * @param {string} richMenuId - ID ของ Rich Menu ที่สร้างไว้
 * @param {string} driveFileId - ID ของไฟล์รูปภาพใน Google Drive (ขนาด 2500x1686 px, ไม่เกิน 1MB)
 */
function uploadRichMenuImageFromDrive(richMenuId, driveFileId) {
  const token = getConfig('CHANNEL_ACCESS_TOKEN');
  const url = `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`;
  
  try {
    const file = DriveApp.getFileById(driveFileId);
    const blob = file.getBlob();
    const contentType = file.getMimeType();
    
    if (contentType !== 'image/jpeg' && contentType !== 'image/png') {
      Logger.log('ERROR: ไฟล์รูปภาพต้องเป็น JPEG หรือ PNG เท่านั้น');
      return;
    }
    
    const options = {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': contentType
      },
      payload: blob,
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() === 200) {
      Logger.log('อัปโหลดรูปภาพสำเร็จสำหรับ Rich Menu ID: ' + richMenuId);
    } else {
      Logger.log('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ' + response.getContentText());
    }
  } catch (err) {
    Logger.log('เกิดข้อผิดพลาดในการดึงไฟล์จาก Drive: ' + err.toString());
  }
}

/**
 * ---------------------------------------------------------
 * ฟังก์ชันสำหรับรันขั้นตอนสุดท้าย (ให้ผู้ใช้ระบุ ID ในบรรทัดล่างสุด)
 * ---------------------------------------------------------
 */

// 1. นำภาพเมนูคนสวนไปอัปโหลด และตั้งเป็นค่าเริ่มต้น
function finalizeWorkerMenu() {
  const workerMenuId = "richmenu-36623b6970c5491f16332221a8f5eaa2"; // ID จากระบบ
  const workerImageDriveId = "1dyDGvNzgaWVPidkUeXH1c9mXIiNqNMRD"; // <- นำ File ID จาก Google Drive มาใส่
  
  if (workerImageDriveId !== "ใส่_DRIVE_FILE_ID_ของภาพเมนูคนสวนที่นี่") {
    uploadRichMenuImageFromDrive(workerMenuId, workerImageDriveId);
    setDefaultRichMenu(workerMenuId);
  } else {
    Logger.log("กรุณาใส่ File ID ของรูปภาพก่อนรันฟังก์ชันนี้");
  }
}

// 2. นำภาพเมนูเจ้าของสวนไปอัปโหลด และผูกกับแอดมิน
function finalizeAdminMenu() {
  const adminMenuId = "richmenu-6aeef5cf6cfd36b6150d498c4cd7509e"; // ID จากระบบ
  const adminImageDriveId = "1MCS81oPNiihNswrK5wyOjs-uKpXsupE6"; // ← นำ File ID จาก Google Drive มาใส่
  const adminUserId = "U4f70abfadabd87fbeade08844640e0e4"; // ← นำ User ID ของคุณมาใส่
  
  if (adminImageDriveId !== "ใส่_DRIVE_FILE_ID_ของภาพเมนูแอดมินที่นี่" && adminUserId !== "ใส่_LINE_USER_ID_ของคุณที่นี่") {
    uploadRichMenuImageFromDrive(adminMenuId, adminImageDriveId);
    linkRichMenuToUser(adminUserId, adminMenuId); // ฟังก์ชันนี้มีอยู่แล้วใน LineAPI.gs
    Logger.log("ผูกเมนูแอดมินให้ User: " + adminUserId + " สำเร็จ");
  } else {
    Logger.log("กรุณาใส่ User ID ก่อนรันฟังก์ชันนี้ (File ID รูปภาพใส่เรียบร้อยแล้ว)");
  }
}

// 3. สร้าง Customer Rich Menu (1 ปุ่ม สแกนต้นไม้)
function setupCustomerRichMenu() {
  const token = getConfig('CHANNEL_ACCESS_TOKEN');
  if (!token) { Logger.log('ERROR: ไม่พบ CHANNEL_ACCESS_TOKEN'); return; }

  const customerMenu = {
    size: { width: 2500, height: 1686 },
    selected: true,
    name: "Customer Menu",
    chatBarText: "สแกนต้นไม้",
    areas: [
      {
        bounds: { x: 0, y: 0, width: 2500, height: 1686 }, // เต็มพื้นที่ = 1 ปุ่ม
        action: { type: "uri", uri: "https://line.me/R/nv/QRCodeReader" }
      }
    ]
  };

  const menuId = createRichMenuAPI(customerMenu, token);
  Logger.log('สร้าง Customer Menu สำเร็จ! ID: ' + menuId);
  Logger.log('ขั้นตอนต่อไป:');
  Logger.log('1. อัปโหลดรูปภาพ: finalizeCustomerMenu()');
  Logger.log('2. บันทึก CUSTOMER_RICH_MENU_ID=' + menuId + ' ใน Config sheet');
  return menuId;
}

function finalizeCustomerMenu() {
  const customerMenuId = "richmenu-275478d29a58253eacf727ca4e00d179";
  const customerImageDriveId = "1dyDGvNzgaWVPidkUeXH1c9mXIiNqNMRD";

  if (!customerMenuId || !customerImageDriveId) {
    Logger.log("กรุณาใส่ customerMenuId และ customerImageDriveId ก่อนรัน");
    return;
  }

  uploadRichMenuImageFromDrive(customerMenuId, customerImageDriveId);
  Logger.log("เสร็จสิ้น! บันทึก CUSTOMER_RICH_MENU_ID=" + customerMenuId + " ลง Config sheet");
}
