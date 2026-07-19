let cachedSpreadsheet = null;

function getSpreadsheet() {
  if (!cachedSpreadsheet) {
    const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (!spreadsheetId) {
       throw new Error("คุณยังไม่ได้ตั้งค่า SPREADSHEET_ID ใน Script Properties (Project Settings)");
    }
    cachedSpreadsheet = SpreadsheetApp.openById(spreadsheetId);
  }
  return cachedSpreadsheet;
}

function getTreeInfo(treeId) {
  const sheet = getSpreadsheet().getSheetByName('ต้นไม้');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == treeId) {
      const tree = {};
      for (let j = 0; j < headers.length; j++) {
        tree[headers[j]] = data[i][j];
      }
      return tree;
    }
  }
  return null;
}

function getActiveSeason() {
  return getConfig('ACTIVE_SEASON');
}

function getProductionForTree(seasonId, treeId) {
  const sheet = getSpreadsheet().getSheetByName('ผลผลิต');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] == seasonId && data[i][2] == treeId) {
      return {
        total: data[i][3],
        harvested: data[i][4],
        remaining: data[i][5]
      };
    }
  }
  return { total: 0, harvested: 0, remaining: 0 };
}

function getRemainingFruits(seasonId, treeId) {
  return getProductionForTree(seasonId, treeId).remaining;
}

function addToPendingQueue(type, treeId, data, userId, displayName, photoUrl) {
  const sheet = getSpreadsheet().getSheetByName('คิวรออนุมัติ');
  const date = new Date();
  
  const lastRow = sheet.getLastRow();
  let nextId = 1;
  if (lastRow > 1) {
    const lastId = sheet.getRange(lastRow, 1).getValue();
    if (!isNaN(lastId)) nextId = Number(lastId) + 1;
  }
  
  sheet.appendRow([
    nextId,
    type,
    treeId,
    'รออนุมัติ',
    JSON.stringify(data),
    displayName,
    userId,
    date,
    '',
    photoUrl || ''
  ]);
}

function getPendingItems() {
  const sheet = getSpreadsheet().getSheetByName('คิวรออนุมัติ');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const items = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][3] === 'รออนุมัติ') {
      const item = {};
      for (let j = 0; j < headers.length; j++) {
        item[headers[j]] = data[i][j];
      }
      items.push(item);
    }
  }
  return items;
}

function getPendingCount() {
  return getPendingItems().length;
}

function getNewPendingCount(sinceDate) {
  const items = getPendingItems();
  return items.filter(item => new Date(item['วันที่บันทึก']) > sinceDate).length;
}

function approveItem(itemId, approverName) {
  const sheet = getSpreadsheet().getSheetByName('คิวรออนุมัติ');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == itemId && data[i][3] === 'รออนุมัติ') {
      // Update status
      sheet.getRange(i + 1, 4).setValue('อนุมัติ');
      const itemData = JSON.parse(data[i][4]);
      const type = data[i][1];
      const treeId = data[i][2];
      const recorderId = data[i][6];
      const recorderName = data[i][5];
      const date = data[i][7];
      const photoUrl = data[i][9];
      const seasonId = getActiveSeason();
      const approveDate = new Date();
      
      if (type === 'ตัดจำหน่าย') {
        const harvestSheet = getSpreadsheet().getSheetByName('การเก็บเกี่ยว');
        const nextHId = harvestSheet.getLastRow() > 1 ? Number(harvestSheet.getRange(harvestSheet.getLastRow(), 1).getValue()) + 1 : 1;
        harvestSheet.appendRow([
          nextHId, seasonId, treeId, itemData.quantity, itemData.reason, itemData.grade, 
          itemData.weight, itemData.price, photoUrl, recorderName, recorderId, date, approveDate, approverName
        ]);
        
      } else if (type === 'บันทึกผลผลิต') {
        const prodSheet = getSpreadsheet().getSheetByName('ผลผลิต');
        const prodData = prodSheet.getDataRange().getValues();
        let found = false;
        for(let r=1; r<prodData.length; r++){
          if(prodData[r][1] == seasonId && prodData[r][2] == treeId) {
            prodSheet.getRange(r+1, 4).setValue(itemData.quantity);
            found = true;
            break;
          }
        }
        if(!found) {
          prodSheet.appendRow([`${seasonId}-${treeId}`, seasonId, treeId, itemData.quantity, 0, itemData.quantity, recorderName, date]);
        }
        
      } else if (type === 'ลงทะเบียนต้นไม้') {
        const treeSheet = getSpreadsheet().getSheetByName('ต้นไม้');
        const treeData = treeSheet.getDataRange().getValues();
        let found = false;
        for(let r=1; r<treeData.length; r++){
          if(treeData[r][0] == treeId) {
            treeSheet.getRange(r+1, 2).setValue(itemData.variety);
            treeSheet.getRange(r+1, 3).setValue(itemData.age);
            treeSheet.getRange(r+1, 4).setValue(itemData.lat);
            treeSheet.getRange(r+1, 5).setValue(itemData.lng);
            treeSheet.getRange(r+1, 6).setValue(itemData.flowerMonth);
            found = true;
            break;
          }
        }
        if(!found) {
           treeSheet.appendRow([treeId, itemData.variety, itemData.age, itemData.lat, itemData.lng, itemData.flowerMonth, 'active', '', date, recorderName]);
        }
      }
      return true;
    }
  }
  return false;
}

function rejectItem(itemId, reason) {
  const sheet = getSpreadsheet().getSheetByName('คิวรออนุมัติ');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == itemId) {
      sheet.getRange(i + 1, 4).setValue('ปฏิเสธ');
      sheet.getRange(i + 1, 9).setValue(reason);
      return true;
    }
  }
  return false;
}

function getDashboardByVariety(seasonId) {
  // Aggregate implementation
  return { 'หมอนทอง': 100, 'ชะนี': 50 }; // mock
}

function getDashboardByGrade(seasonId) {
  return { 'A': 80, 'B': 60, 'ตกไซซ์': 10 }; // mock
}

function getDashboardByFlowerMonth(seasonId) {
  return { 'ม.ค.': 50, 'ก.พ.': 100 }; // mock
}

function getDashboardTotal(seasonId) {
  return { total: 150, harvested: 50, remaining: 100 }; // mock
}

function getDashboardSales(seasonId) {
  return { totalRevenue: 50000, totalWeight: 500 }; // mock
}

function getDashboardYearComparison() {
  return { '2566': 200, '2567': 150 }; // mock
}

function registerUser(userId, displayName, role) {
  const sheet = getSpreadsheet().getSheetByName('ผู้ใช้');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) return false; // exists
  }
  sheet.appendRow([userId, displayName, role, '']);
  return true;
}

function getUserRole(userId) {
  const sheet = getSpreadsheet().getSheetByName('ผู้ใช้');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) return data[i][2];
  }
  return null;
}

function openSeason(seasonId) {
  const sheet = getSpreadsheet().getSheetByName('ฤดูกาล');
  sheet.appendRow([seasonId, 'เปิด', new Date(), '']);
}

function closeSeason(seasonId) {
  const sheet = getSpreadsheet().getSheetByName('ฤดูกาล');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == seasonId) {
      sheet.getRange(i + 1, 2).setValue('ปิด');
      sheet.getRange(i + 1, 4).setValue(new Date());
    }
  }
}

// ==========================================
// Web App APIs (Dashboard)
// ==========================================

function checkUserAccessWeb(userId) {
  const role = getUserRole(userId);
  if (role === 'เจ้าของ' || role === 'admin') {
    const sheet = getSpreadsheet().getSheetByName('ผู้ใช้');
    const data = sheet.getDataRange().getValues();
    let name = 'Unknown';
    for(let i=1; i<data.length; i++){
      if(data[i][0] === userId) { name = data[i][1]; break; }
    }
    return { hasAccess: true, user: { userId: userId, name: name, role: role } };
  }
  return { hasAccess: false };
}

function getDashboardDataWeb(userId) {
  if(!checkUserAccessWeb(userId).hasAccess) throw new Error("Unauthorized");
  
  const seasonId = getActiveSeason();
  const treeSheet = getSpreadsheet().getSheetByName('ต้นไม้');
  const treeData = treeSheet.getDataRange().getValues();
  let totalTrees = treeData.length > 1 ? treeData.length - 1 : 0;
  
  const pendingCount = getPendingCount();
  
  // Aggregate variety
  const variety = {};
  for(let i=1; i<treeData.length; i++){
    const v = treeData[i][1];
    if(v) variety[v] = (variety[v] || 0) + 1;
  }
  
  return {
    totalTrees: totalTrees,
    pendingCount: pendingCount,
    variety: variety
  };
}

function getPendingItemsWeb(userId) {
  if(!checkUserAccessWeb(userId).hasAccess) throw new Error("Unauthorized");
  
  const items = getPendingItems();
  return items.map(item => ({
    id: item['ID'],
    type: item['ประเภท'],
    treeId: item['รหัสต้น'],
    data: JSON.parse(item['ข้อมูล JSON']),
    recorderName: item['บันทึกโดย'],
    date: item['วันที่บันทึก']
  }));
}

function approvePendingItemWeb(itemId, userId) {
  const auth = checkUserAccessWeb(userId);
  if(!auth.hasAccess) throw new Error("Unauthorized");
  return approveItem(itemId, auth.user.name);
}

function rejectPendingItemWeb(itemId, reason, userId) {
  if(!checkUserAccessWeb(userId).hasAccess) throw new Error("Unauthorized");
  return rejectItem(itemId, reason);
}

function getUsersWeb(userId) {
  if(!checkUserAccessWeb(userId).hasAccess) throw new Error("Unauthorized");
  
  const sheet = getSpreadsheet().getSheetByName('ผู้ใช้');
  const data = sheet.getDataRange().getValues();
  const users = [];
  for(let i=1; i<data.length; i++){
    users.push({
      userId: data[i][0],
      name: data[i][1],
      role: data[i][2]
    });
  }
  return users;
}

function updateUserRoleWeb(targetUserId, newRole, userId) {
  const auth = checkUserAccessWeb(userId);
  if(!auth.hasAccess || auth.user.role !== 'เจ้าของ') throw new Error("Unauthorized. Only owner can change roles.");
  
  const sheet = getSpreadsheet().getSheetByName('ผู้ใช้');
  const data = sheet.getDataRange().getValues();
  for(let i=1; i<data.length; i++){
    if(data[i][0] === targetUserId){
      sheet.getRange(i+1, 3).setValue(newRole);
      return true;
    }
  }
  return false;
}
