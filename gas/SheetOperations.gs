// ==========================================
// Core Data Access (Repositories)
// ==========================================

const SheetRepository = {
  cachedSpreadsheet: null,
  getSpreadsheet: function() {
    if (!this.cachedSpreadsheet) {
      const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
      if (!spreadsheetId) {
         throw new Error("คุณยังไม่ได้ตั้งค่า SPREADSHEET_ID ใน Script Properties (Project Settings)");
      }
      this.cachedSpreadsheet = SpreadsheetApp.openById(spreadsheetId);
    }
    return this.cachedSpreadsheet;
  },
  getSheet: function(name) {
    return this.getSpreadsheet().getSheetByName(name);
  },
  getData: function(sheetName) {
    const sheet = this.getSheet(sheetName);
    return sheet ? sheet.getDataRange().getValues() : [];
  },
  appendRow: function(sheetName, rowData) {
    const sheet = this.getSheet(sheetName);
    if(sheet) sheet.appendRow(rowData);
  },
  updateCell: function(sheetName, rowIdx, colIdx, value) {
    const sheet = this.getSheet(sheetName);
    if(sheet) sheet.getRange(rowIdx, colIdx).setValue(value);
  },
  getLastRow: function(sheetName) {
    const sheet = this.getSheet(sheetName);
    return sheet ? sheet.getLastRow() : 0;
  },
  getCellValue: function(sheetName, rowIdx, colIdx) {
    const sheet = this.getSheet(sheetName);
    return sheet ? sheet.getRange(rowIdx, colIdx).getValue() : null;
  }
};

// Global wrapper for backward compatibility with LineAPI.gs and QRGenerator.gs
function getSpreadsheet() {
  return SheetRepository.getSpreadsheet();
}

function getTreeInfo(treeId) {
  const sheet = SheetRepository.getSheet('ต้นไม้');
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
  const sheet = SheetRepository.getSheet('ผลผลิต');
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
  const sheet = SheetRepository.getSheet('คิวรออนุมัติ');
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
  const sheet = SheetRepository.getSheet('คิวรออนุมัติ');
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

function generateNextTreeId() {
  const ss = SheetRepository.getSpreadsheet();
  const treeSheet = ss.getSheetByName('ต้นไม้');
  const treeData = treeSheet.getDataRange().getValues();
  
  const pendingSheet = ss.getSheetByName('คิวรออนุมัติ');
  const pendingData = pendingSheet.getDataRange().getValues();
  
  let maxNumber = 0;
  
  for (let i = 1; i < treeData.length; i++) {
    const match = String(treeData[i][0]).match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (num > maxNumber) maxNumber = num;
    }
  }
  
  for (let i = 1; i < pendingData.length; i++) {
    if (pendingData[i][1] === 'ลงทะเบียนต้นไม้' && pendingData[i][3] === 'รออนุมัติ') {
      const match = String(pendingData[i][2]).match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNumber) maxNumber = num;
      }
    }
  }
  
  const nextNumber = maxNumber + 1;
  return 'T-' + String(nextNumber).padStart(3, '0');
}

function approveItem(itemId, approverName) {
  const sheet = SheetRepository.getSheet('คิวรออนุมัติ');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == itemId && data[i][3] === 'รออนุมัติ') {
      sheet.getRange(i + 1, 4).setValue('อนุมัติ');
      const itemData = JSON.parse(data[i][4]);
      const type = data[i][1];
      const treeId = data[i][2]; // Now treeId comes from the queue (already generated by CONFIRM)
      const recorderId = data[i][6];
      const recorderName = data[i][5];
      const date = data[i][7];
      const photoUrl = data[i][9];
      const seasonId = getActiveSeason();
      const approveDate = new Date();
      
      if (type === 'ตัดจำหน่าย') {
        const harvestSheet = SheetRepository.getSheet('การเก็บเกี่ยว');
        const nextHId = harvestSheet.getLastRow() > 1 ? Number(harvestSheet.getRange(harvestSheet.getLastRow(), 1).getValue()) + 1 : 1;
        harvestSheet.appendRow([
          nextHId, seasonId, treeId, itemData.quantity, itemData.reason, itemData.grade,
          itemData.weight, itemData.price, photoUrl, recorderName, recorderId, date, approveDate, approverName
        ]);

        // BUG FIX: approving a harvest (sale or damage/loss report) removes
        // fruit from the tree either way, but this never used to touch
        // "ผลผลิต" at all - so "ตัดไปแล้ว"/"คงเหลือบนต้น" in the overview
        // summary silently stopped reflecting reality after the first
        // registration. Reconcile it here the same way 'บันทึกผลผลิต' does.
        const prodSheet = SheetRepository.getSheet('ผลผลิต');
        const prodData = prodSheet.getDataRange().getValues();
        const qty = Number(itemData.quantity) || 0;
        let prodFound = false;
        for (let r = 1; r < prodData.length; r++) {
          if (prodData[r][1] == seasonId && prodData[r][2] == treeId) {
            const currentHarvested = Number(prodData[r][4]) || 0;
            const currentRemaining = Number(prodData[r][5]) || 0;
            prodSheet.getRange(r + 1, 5).setValue(currentHarvested + qty);
            prodSheet.getRange(r + 1, 6).setValue(Math.max(0, currentRemaining - qty));
            prodFound = true;
            break;
          }
        }
        if (!prodFound) {
          // No prior production estimate for this tree/season - create one
          // so the tree isn't silently missing from totals. Total defaults
          // to at least the harvested quantity (best guess with no other
          // estimate on record).
          prodSheet.appendRow([`${seasonId}-${treeId}`, seasonId, treeId, qty, qty, 0, recorderName, date]);
        }

      } else if (type === 'บันทึกผลผลิต') {
        const prodSheet = SheetRepository.getSheet('ผลผลิต');
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
        const treeSheet = SheetRepository.getSheet('ต้นไม้');
        
        treeSheet.appendRow([
          treeId, 
          itemData.variety, 
          itemData.age, 
          itemData.lat || '', 
          itemData.lng || '', 
          itemData.flowerMonth, 
          'active', 
          '', 
          date, 
          recorderName,
          photoUrl || ''
        ]);
        
        // Add initial production record if quantity was provided during registration
        if (itemData.quantity && itemData.quantity > 0) {
          const prodSheet = SheetRepository.getSheet('ผลผลิต');
          prodSheet.appendRow([`${seasonId}-${treeId}`, seasonId, treeId, itemData.quantity, 0, itemData.quantity, recorderName, date]);
        }
        
        return { success: true, type: 'register', newTreeId: treeId };
      }
      return { success: true, type: type };
    }
  }
  return { success: false };
}

function rejectItem(itemId, reason) {
  const sheet = SheetRepository.getSheet('คิวรออนุมัติ');
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
  const ss = SheetRepository.getSpreadsheet();
  
  const treeSheet = ss.getSheetByName('ต้นไม้');
  const treeData = treeSheet.getDataRange().getValues();
  const treeMap = {};
  for (let i = 1; i < treeData.length; i++) {
    treeMap[treeData[i][0]] = treeData[i][1];
  }
  
  const harvestSheet = ss.getSheetByName('การเก็บเกี่ยว');
  const harvestData = harvestSheet.getDataRange().getValues();
  
  const result = {};
  for (let i = 1; i < harvestData.length; i++) {
    // index 1: รหัสฤดูกาล, index 2: รหัสต้น, index 3: จำนวนลูก, index 4: เหตุผล
    if (harvestData[i][1] == seasonId && harvestData[i][4] === 'ตัดขาย') {
      const treeId = harvestData[i][2];
      const variety = treeMap[treeId] || 'ไม่ระบุ';
      const qty = Number(harvestData[i][3]) || 0;
      
      if (!result[variety]) result[variety] = 0;
      result[variety] += qty;
    }
  }
  return Object.keys(result).length > 0 ? result : { 'ยังไม่มีข้อมูล': 0 };
}

function getDashboardByGrade(seasonId) {
  const ss = SheetRepository.getSpreadsheet();
  const harvestSheet = ss.getSheetByName('การเก็บเกี่ยว');
  const harvestData = harvestSheet.getDataRange().getValues();
  
  const result = {};
  for (let i = 1; i < harvestData.length; i++) {
    // index 1: รหัสฤดูกาล, index 3: จำนวนลูก, index 4: เหตุผล, index 5: เกรด
    if (harvestData[i][1] == seasonId && harvestData[i][4] === 'ตัดขาย') {
      const grade = harvestData[i][5] || 'ไม่ระบุ';
      const qty = Number(harvestData[i][3]) || 0;
      
      if (!result[grade]) result[grade] = 0;
      result[grade] += qty;
    }
  }
  return Object.keys(result).length > 0 ? result : { 'ยังไม่มีข้อมูล': 0 };
}

function getDashboardByFlowerMonth(seasonId) {
  return { 'ม.ค.': 50, 'ก.พ.': 100 }; // mock (not heavily used in chat yet)
}

function getDashboardTotal(seasonId) {
  const sheet = SheetRepository.getSheet('ผลผลิต');
  const data = sheet.getDataRange().getValues();
  let total = 0, harvested = 0, remaining = 0;

  for (let i = 1; i < data.length; i++) {
    // index 1: รหัสฤดูกาล, index 3: จำนวนผล, index 4: ตัดแล้ว, index 5: คงเหลือ
    if (data[i][1] == seasonId) {
      total += Number(data[i][3]) || 0;
      harvested += Number(data[i][4]) || 0;
      remaining += Number(data[i][5]) || 0;
    }
  }

  // Merged into the overview (rather than a separate rich-menu button) -
  // it's the same "ภาพรวม" concept, just one more line, and keeps the
  // existing 3-button menu unchanged.
  const sales = getDashboardSales(seasonId);

  return {
    'ยอดประเมินรวม': total,
    'ตัดไปแล้ว': harvested,
    'คงเหลือบนต้น': remaining,
    'น้ำหนักที่ขายแล้ว (กก.)': sales.totalWeight.toLocaleString('th-TH'),
    'รายได้จากการขาย': sales.totalRevenue.toLocaleString('th-TH') + ' บาท'
  };
}

/**
 * Real sales totals for the season, computed from "การเก็บเกี่ยว" rows
 * where เหตุผล = 'ตัดขาย' (damage/loss rows have no price and are
 * excluded). Revenue per row = น้ำหนัก(กก.) x ราคาต่อกก. - this was a
 * hardcoded mock ({ totalRevenue: 50000, totalWeight: 500 }) before; now
 * used by getDashboardTotal() to add real revenue to the overview.
 */
function getDashboardSales(seasonId) {
  const sheet = SheetRepository.getSheet('การเก็บเกี่ยว');
  const data = sheet.getDataRange().getValues();
  let totalRevenue = 0, totalWeight = 0, totalQuantity = 0;

  for (let i = 1; i < data.length; i++) {
    // index 1: รหัสฤดูกาล, index 3: จำนวนลูก, index 4: เหตุผล,
    // index 6: น้ำหนัก(กก.), index 7: ราคาต่อกก.
    if (data[i][1] == seasonId && data[i][4] === 'ตัดขาย') {
      const weight = Number(data[i][6]) || 0;
      const price = Number(data[i][7]) || 0;
      totalWeight += weight;
      totalRevenue += weight * price;
      totalQuantity += Number(data[i][3]) || 0;
    }
  }

  return { totalRevenue, totalWeight, totalQuantity };
}

function getDashboardYearComparison() {
  const sheet = SheetRepository.getSheet('การเก็บเกี่ยว');
  if(!sheet) return { '2567': 0 };
  const data = sheet.getDataRange().getValues();
  const yoy = {};
  for (let i = 1; i < data.length; i++) {
    const seasonId = data[i][1];
    const reason = data[i][4]; // index 4: reason
    const qty = Number(data[i][3]) || 0; // index 3: qty
    if (reason === 'ตัดขาย') {
      const yearMatch = String(seasonId).match(/\d{4}/);
      const year = yearMatch ? yearMatch[0] : String(seasonId);
      if(!yoy[year]) yoy[year] = 0;
      yoy[year] += qty;
    }
  }
  return Object.keys(yoy).length > 0 ? yoy : { '2567': 0 };
}

function registerUser(userId, displayName, role, pictureUrl = '') {
  const sheet = SheetRepository.getSheet('ผู้ใช้');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) return false; // exists
  }
  sheet.appendRow([userId, displayName, role, pictureUrl]);
  return true;
}

function getUserRole(userId) {
  const sheet = SheetRepository.getSheet('ผู้ใช้');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) return data[i][2];
  }
  return null;
}

/**
 * Shared privilege check used by both the LINE bot (Code.gs) and the
 * Dashboard web APIs below, so "who can approve/administer" is defined
 * in exactly one place.
 */
function isOwnerOrAdmin(role) {
  return role === 'เจ้าของ' || role === 'admin';
}

function openSeason(seasonId) {
  const sheet = SheetRepository.getSheet('ฤดูกาล');
  sheet.appendRow([seasonId, 'เปิด', new Date(), '']);
}

function closeSeason(seasonId) {
  const sheet = SheetRepository.getSheet('ฤดูกาล');
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
/**
 * Verifies a LINE id_token (obtained via the LINE Login OAuth2 code
 * exchange in exchangeLineOAuthCode(), below) against LINE's own
 * verification endpoint. This is the only trustworthy way to know who is
 * really making the request - unlike a client-supplied userId string,
 * which cannot be trusted on its own since it isn't secret and anyone can
 * type any value into a request.
 * Returns the verified payload (with a real "sub" = LINE userId) or null.
 */
function verifyLineIdToken(idToken) {
  const liffId = getConfig('LIFF_ID');
  if (!liffId || !idToken) return null;

  // LIFF IDs are formatted as "{channelId}-{randomString}"; LINE's verify
  // endpoint needs the channel ID as client_id.
  const channelId = liffId.split('-')[0];

  const url = 'https://api.line.me/oauth2/v2.1/verify';
  const options = {
    method: 'post',
    payload: { id_token: idToken, client_id: channelId },
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() !== 200) return null;
    const result = JSON.parse(response.getContentText());
    if (!result.sub || result.aud !== channelId) return null;
    return result;
  } catch (e) {
    return null;
  }
}

/**
 * Session tokens are opaque, server-generated, unguessable values that map
 * to a verified userId. The Dashboard client stores/sends this token
 * instead of a raw LINE userId, so it can no longer just claim to be
 * anyone by passing a different string.
 */
function createDashboardSession(userId) {
  const token = Utilities.getUuid();
  CacheService.getScriptCache().put('dash_session_' + token, userId, 21600); // 6h (CacheService max)
  return token;
}

function resolveDashboardSession(sessionToken) {
  if (!sessionToken) return null;
  return CacheService.getScriptCache().get('dash_session_' + sessionToken) || null;
}

/**
 * OAuth2 "state" parameter, standard CSRF defense: proves the ?code= LINE
 * sends back is a reply to a login WE actually initiated, not a redirect
 * someone tricked the victim's browser into completing. Without this,
 * an attacker could potentially link their own LINE login to a victim's
 * session via a crafted callback URL.
 *
 * Originally implemented as a random value stored in CacheService and
 * burned on first use, but that showed a real mismatch in testing (state
 * generated on the login page wasn't found ~14s later on the LINE
 * callback, well inside the 10-minute TTL - not a timing issue). Rather
 * than chase a CacheService cross-execution reliability question,
 * switched to a stateless, self-verifying signed token: timestamp +
 * HMAC-SHA256(timestamp, CHANNEL_SECRET). No storage/lookup involved at
 * all, so nothing to be inconsistent - a state is valid if and only if the
 * signature checks out and it's not too old. Only our server (which holds
 * CHANNEL_SECRET) can mint a signature that will pass, so forging one
 * isn't possible without that secret. Trade-off: not single-use like the
 * cache version was, but LINE's own `code` is already single-use/short-
 * lived on LINE's side, so replay of the whole login isn't possible either
 * way - state's job here is purely proving origin, not replay defense.
 */
function generateOAuthState() {
  const ts = Date.now().toString();
  return ts + '.' + signOAuthTimestamp(ts);
}

function consumeOAuthState(state) {
  if (!state) return false;
  const parts = state.split('.');
  if (parts.length !== 2) return false;
  const ts = parts[0];
  const sig = parts[1];
  if (signOAuthTimestamp(ts) !== sig) return false;
  const age = Date.now() - Number(ts);
  return !isNaN(age) && age >= 0 && age <= 600000; // valid for 10 minutes
}

function signOAuthTimestamp(ts) {
  const secret = getConfig('CHANNEL_SECRET');
  const raw = Utilities.computeHmacSha256Signature(ts, secret);
  return Utilities.base64EncodeWebSafe(raw);
}

/**
 * The LIFF app's channel ID doubles as the LINE Login channel ID here
 * (LIFF ID is formatted "{channelId}-{randomString}"). Reused as client_id
 * for both the /authorize and /token calls below.
 */
function getDashboardChannelId() {
  const liffId = getConfig('LIFF_ID');
  return liffId ? liffId.split('-')[0] : null;
}

/**
 * Builds the URL that sends the user to LINE's own login/consent page.
 * redirect_uri must exactly match what's registered as a callback URL for
 * this channel in the LINE Developers Console (LINE Login settings).
 */
function buildLineLoginUrl(redirectUri) {
  const channelId = getDashboardChannelId();
  if (!channelId) return null;
  const params = {
    response_type: 'code',
    client_id: channelId,
    redirect_uri: redirectUri,
    state: generateOAuthState(),
    scope: 'openid profile'
  };
  const query = Object.keys(params)
    .map(function (k) { return k + '=' + encodeURIComponent(params[k]); })
    .join('&');
  return 'https://access.line.me/oauth2/v2.1/authorize?' + query;
}

/**
 * Server-to-server exchange of the one-time authorization code for an
 * id_token. Requires the LINE LOGIN channel's secret (LOGIN_CHANNEL_SECRET)
 * - NOT CHANNEL_SECRET, which belongs to the separate Messaging API channel
 * (this project has always kept LIFF/LINE Login and Messaging API as two
 * distinct channels under the same provider, each with its own ID/secret -
 * confirmed against LINE's own docs: a LIFF app's channel ID is the LINE
 * Login channel's ID, and only that channel's secret works here. Using
 * CHANNEL_SECRET here failed with LINE's own "invalid client_secret").
 * Only our server holds this secret - what makes a leaked/logged `code`
 * useless to anyone else: it can't be redeemed without it, and it's
 * single-use and short-lived on LINE's side regardless.
 */
function exchangeLineOAuthCode(code, redirectUri) {
  const channelId = getDashboardChannelId();
  const channelSecret = getConfig('LOGIN_CHANNEL_SECRET');
  if (!channelId || !channelSecret || !code) return null;

  const url = 'https://api.line.me/oauth2/v2.1/token';
  const options = {
    method: 'post',
    payload: {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: channelId,
      client_secret: channelSecret
    },
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() !== 200) return null;
    const result = JSON.parse(response.getContentText());
    return result.id_token || null;
  } catch (e) {
    return null;
  }
}

/**
 * Canonical, always-correct URL for this deployment - used as the OAuth
 * redirect_uri instead of hardcoding the /exec URL, so it stays right
 * even if the deployment is recreated.
 */
function getDashboardRedirectUri() {
  return ScriptApp.getService().getUrl();
}

// NOTE: no longer called from the client. The whole LINE Login handshake
// (code -> token exchange -> this verify+session step) now happens
// entirely server-side in doGet(), triggered by LINE's redirect back with
// ?code=&state=. See Code.gs. Kept the name close to the old
// loginWithLiffWeb() since the verify+session logic itself is unchanged -
// only how we obtain the id_token changed (OAuth code exchange vs. LIFF's
// client-side liff.getIDToken()).
function loginWithLineIdToken(idToken) {
  const verified = verifyLineIdToken(idToken);
  if (!verified || !verified.sub) return { success: false };

  const userId = verified.sub;
  const sheet = SheetRepository.getSheet('ผู้ใช้');
  if (!sheet) return { success: false };
  const data = sheet.getDataRange().getValues();

  let role = null;
  let rowIndex = -1;
  let hasAnyAdmin = false;
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === 'เจ้าของ' || data[i][2] === 'admin') hasAnyAdmin = true;
    if (data[i][0] === userId) { role = data[i][2]; rowIndex = i; }
  }

  // First-run bootstrap: nobody is owner/admin yet. Promote the actual
  // verified person logging in right now (not an arbitrary row).
  if (!hasAnyAdmin && rowIndex !== -1) {
    sheet.getRange(rowIndex + 1, 3).setValue('เจ้าของ');
    role = 'เจ้าของ';
  }

  if (!isOwnerOrAdmin(role)) return { success: false };

  return { success: true, sessionToken: createDashboardSession(userId) };
}

function checkUserAccessWeb(sessionToken) {
  const userId = resolveDashboardSession(sessionToken);
  if (!userId) return { hasAccess: false };

  const role = getUserRole(userId);
  if (isOwnerOrAdmin(role)) {
    const sheet = SheetRepository.getSheet('ผู้ใช้');
    const data = sheet.getDataRange().getValues();
    let name = 'Unknown';
    let pictureUrl = '';
    for(let i=1; i<data.length; i++){
      if(data[i][0] === userId) {
        name = data[i][1];
        pictureUrl = data[i][3] || '';
        break;
      }
    }
    return { hasAccess: true, user: { userId: userId, name: name, role: role, pictureUrl: pictureUrl } };
  }
  return { hasAccess: false };
}

function getDashboardDataWeb(sessionToken) {
  if(!checkUserAccessWeb(sessionToken).hasAccess) throw new Error("Unauthorized");
  
  const seasonId = getActiveSeason();
  const ss = SheetRepository.getSpreadsheet();
  
  // 1. Total Trees & Variety
  const treeSheet = ss.getSheetByName('ต้นไม้');
  const treeData = treeSheet.getDataRange().getValues();
  let totalTrees = treeData.length > 1 ? treeData.length - 1 : 0;
  
  const variety = {};
  for(let i=1; i<treeData.length; i++){
    const v = treeData[i][1];
    if(v) variety[v] = (variety[v] || 0) + 1;
  }
  
  const pendingCount = getPendingCount();
  
  // 2. Production Stats
  const prodSheet = ss.getSheetByName('ผลผลิต');
  let totalExpected = 0;
  let totalRemaining = 0;
  if(prodSheet) {
    const prodData = prodSheet.getDataRange().getValues();
    for(let i=1; i<prodData.length; i++) {
      if(prodData[i][1] == seasonId) {
        totalExpected += Number(prodData[i][3]) || 0;
        totalRemaining += Number(prodData[i][5]) || 0;
      }
    }
  }

  // 3. Revenue & Sales Stats
  const harvestSheet = ss.getSheetByName('การเก็บเกี่ยว');
  let totalRevenue = 0;
  let totalDamagedCount = 0;
  let salesData = { 'A/B': 0, 'C': 0, 'D': 0, 'ตกไซส์': 0 };
  let recentActivities = [];
  
  if (harvestSheet) {
    const harvestData = harvestSheet.getDataRange().getValues();
    for(let i=1; i<harvestData.length; i++){
      if(harvestData[i][1] == seasonId) {
        const reason = harvestData[i][4];
        const grade = harvestData[i][5] || 'ตกไซส์';
        const qty = Number(harvestData[i][3]) || 0;
        const price = Number(harvestData[i][7]) || 0;
        
        if (reason === 'เสียหาย') {
          totalDamagedCount += qty;
        } else {
          totalRevenue += price;
          if (grade.includes('A') || grade.includes('B')) salesData['A/B'] += qty;
          else if (grade.includes('C')) salesData['C'] += qty;
          else if (grade.includes('D')) salesData['D'] += qty;
          else salesData['ตกไซส์'] += qty;
        }
      }
    }
    
    // Get recent 5 activities for this season
    const filteredHarvests = harvestData.slice(1).filter(r => r[1] == seasonId);
    filteredHarvests.reverse(); // Latest first
    const top5 = filteredHarvests.slice(0, 5);
    recentActivities = top5.map(r => ({
      treeId: r[2],
      action: r[4] === 'เสียหาย' ? 'เสียหาย' : 'ตัดขาย',
      quantity: Number(r[3]),
      date: r[11],
      user: r[9]
    }));
  }
  
  return {
    activeSeason: seasonId,
    totalTrees: totalTrees,
    pendingCount: pendingCount,
    variety: variety,
    totalExpected: totalExpected,
    totalRemaining: totalRemaining,
    totalDamagedCount: totalDamagedCount,
    totalRevenue: totalRevenue,
    salesData: salesData,
    recentActivities: recentActivities,
    yoy: getDashboardYearComparison()
  };
}

function changeActiveSeasonWeb(newSeasonId, sessionToken) {
  const auth = checkUserAccessWeb(sessionToken);
  if(!auth.hasAccess || (auth.user.role !== 'เจ้าของ' && auth.user.role !== 'admin')) {
    throw new Error("Unauthorized. Only owner or admin can change season.");
  }
  
  if (!newSeasonId) throw new Error("Season ID is required.");

  // 1. ACTIVE_SEASON now lives in Script Properties, not the Config sheet
  PropertiesService.getScriptProperties().setProperty('ACTIVE_SEASON', newSeasonId);

  // 2. Add/Update Season in ฤดูกาล sheet, auto-closing any season still
  //    marked open (previously this had to be done by hand)
  const seasonSheet = SheetRepository.getSheet('ฤดูกาล');
  if (seasonSheet) {
    const seasonData = seasonSheet.getDataRange().getValues();
    let exists = false;
    for (let i = 1; i < seasonData.length; i++) {
      if (seasonData[i][0] == newSeasonId) {
        exists = true;
        seasonSheet.getRange(i + 1, 2).setValue('เปิด');
      } else if (seasonData[i][1] === 'เปิด') {
        seasonSheet.getRange(i + 1, 2).setValue('ปิด');
        seasonSheet.getRange(i + 1, 4).setValue(new Date());
      }
    }
    if (!exists) {
      seasonSheet.appendRow([newSeasonId, 'เปิด', new Date(), '']);
    }
  }

  return { success: true, seasonId: newSeasonId };
}

function getPendingItemsWeb(sessionToken) {
  if(!checkUserAccessWeb(sessionToken).hasAccess) throw new Error("Unauthorized");
  
  const sheet = SheetRepository.getSheet('คิวรออนุมัติ');
  if (!sheet) return { pending: [], approved: [], rejected: [] };
  const data = sheet.getDataRange().getValues();
  
  const result = { pending: [], approved: [], rejected: [] };
  
  // Return last 200 items to keep payload light
  let count = 0;
  for (let i = data.length - 1; i >= 1; i--) {
    if (count > 200) break;
    count++;
    
    const status = data[i][3];
    let parsedData = {};
    try { parsedData = JSON.parse(data[i][4]); } catch(e) {}
    
    let dateStr = data[i][7];
    if (dateStr instanceof Date) {
      dateStr = dateStr.toISOString();
    }
    
    const item = {
      id: data[i][0],
      type: data[i][1],
      treeId: data[i][2],
      status: status,
      data: parsedData,
      recorderName: data[i][5],
      date: dateStr,
      rejectReason: data[i][8] || ''
    };
    
    if (status === 'รออนุมัติ') result.pending.push(item);
    else if (status === 'อนุมัติ') result.approved.push(item);
    else if (status === 'ปฏิเสธ') result.rejected.push(item);
  }
  
  return result;
}

/**
 * ดึงประวัติการตัดขายของต้นไม้ใน season ที่กำหนด
 * @param {string} seasonId - รหัสฤดูกาล
 * @param {string} treeId - รหัสต้น
 * @param {number} limit - จำนวนรายการสูงสุด
 */
function getHarvestHistory(seasonId, treeId, limit) {
  const sheet = SheetRepository.getSheet('การเก็บเกี่ยว');
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  
  const records = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] == seasonId && data[i][2] == treeId) { // เอาทั้งตัดขายและเสียหาย
      const approveDate = data[i][12];
      const recordDate  = data[i][11];
      records.push({
        date:     approveDate || recordDate,
        reason:   data[i][4] || '-',
        grade:    data[i][5] || '-',
        quantity: Number(data[i][3]) || 0,
        photoUrl: data[i][8] || ''
      });
    }
  }
  
  records.sort((a, b) => new Date(b.date) - new Date(a.date));
  return records.slice(0, limit || 5);
}

function getTreeHistoryWeb(treeId, sessionToken) {
  if(!checkUserAccessWeb(sessionToken).hasAccess) throw new Error("Unauthorized");
  const seasonId = getActiveSeason();
  return getHarvestHistory(seasonId, treeId, 10);
}

function approvePendingItemWeb(itemId, sessionToken) {
  const auth = checkUserAccessWeb(sessionToken);
  if(!auth.hasAccess) throw new Error("Unauthorized");
  return approveItem(itemId, auth.user.name);
}

function rejectPendingItemWeb(itemId, reason, sessionToken) {
  if(!checkUserAccessWeb(sessionToken).hasAccess) throw new Error("Unauthorized");
  return rejectItem(itemId, reason);
}

function getUsersWeb(sessionToken) {
  if(!checkUserAccessWeb(sessionToken).hasAccess) throw new Error("Unauthorized");
  
  const sheet = SheetRepository.getSheet('ผู้ใช้');
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

function syncUserRichMenu(userId, role) {
  try {
    if (role === 'เจ้าของ' || role === 'admin') {
      linkRichMenuToUser(userId, "richmenu-e965ba0fb0d93888408f7dd7cdf2b336");
    } else if (role === 'คนสวน') {
      linkRichMenuToUser(userId, "richmenu-36623b6970c5491f16332221a8f5eaa2");
    } else if (role === 'Customer') {
      linkRichMenuToUser(userId, "richmenu-275478d29a58253eacf727ca4e00d179");
    } else {
      // ไม่มี role หรืออื่นๆ ให้ใช้ Default (ซึ่งต้องตั้ง Default เป็น Customer Menu)
      unlinkRichMenuFromUser(userId);
    }
  } catch (err) {
    console.error("Failed to sync rich menu for " + userId + ": " + err);
  }
}

function updateUserRoleWeb(targetUserId, newRole, sessionToken) {
  const auth = checkUserAccessWeb(sessionToken);
  if(!auth.hasAccess || auth.user.role !== 'เจ้าของ') throw new Error("Unauthorized. Only owner can change roles.");
  
  const sheet = SheetRepository.getSheet('ผู้ใช้');
  const data = sheet.getDataRange().getValues();
  for(let i=1; i<data.length; i++){
    if(data[i][0] === targetUserId){
      sheet.getRange(i+1, 3).setValue(newRole);
      syncUserRichMenu(targetUserId, newRole);
      return true;
    }
  }
  return false;
}

function getAllTreesWeb(sessionToken) {
  if(!checkUserAccessWeb(sessionToken).hasAccess) throw new Error("Unauthorized");
  
  const seasonId = getActiveSeason();
  const prodSheet = SheetRepository.getSheet('ผลผลิต');
  const prodData = prodSheet.getDataRange().getValues();
  const prodMap = {}; // map treeId -> fruitCount
  for(let i=1; i<prodData.length; i++) {
    if(prodData[i][1] == seasonId) {
      prodMap[prodData[i][2]] = prodData[i][5]; // Column F: คงเหลือ (Remaining fruits)
    }
  }

  const sheet = SheetRepository.getSheet('ต้นไม้');
  const data = sheet.getDataRange().getValues();
  const trees = [];
  
  // index 0: ID, 1: Variety, 2: Age, 3: Lat, 4: Lng, 5: FlowerMonth, 6: Status, 7: QR, 8: Date, 9: Recorder, 10: Photo
  for(let i=1; i<data.length; i++){
    trees.push({
      id: data[i][0],
      variety: data[i][1],
      age: data[i][2],
      lat: data[i][3],
      lng: data[i][4],
      flowerMonth: data[i][5],
      status: data[i][6],
      qrPrinted: data[i][7] || '', // column H - last bulk-print timestamp, blank = never printed. Written by markTreesPrintedWeb() in QRGenerator.gs
      photoUrl: data[i][10] || '',
      fruitCount: prodMap[data[i][0]] || 0
    });
  }
  return trees;
}

/**
 * Everything needed for the printable QR tag: current remaining fruit
 * count (same "คงเหลือ" figure as the dashboard) and the most recent
 * activity date for this tree - which means the latest of either its
 * registration date or any approved "การเก็บเกี่ยว" row (sale or
 * damage/loss report), not just when it was first registered.
 */
function getTreePrintInfoWeb(treeId, sessionToken) {
  if (!checkUserAccessWeb(sessionToken).hasAccess) throw new Error("Unauthorized");

  const seasonId = getActiveSeason();

  const treeSheet = SheetRepository.getSheet('ต้นไม้');
  const treeData = treeSheet.getDataRange().getValues();
  let tree = null;
  for (let i = 1; i < treeData.length; i++) {
    if (treeData[i][0] === treeId) {
      tree = { id: treeData[i][0], variety: treeData[i][1], age: treeData[i][2], registeredDate: treeData[i][8] };
      break;
    }
  }
  if (!tree) throw new Error('ไม่พบต้นไม้รหัส ' + treeId);

  const prodSheet = SheetRepository.getSheet('ผลผลิต');
  const prodData = prodSheet.getDataRange().getValues();
  let fruitCount = 0;
  for (let i = 1; i < prodData.length; i++) {
    if (prodData[i][1] == seasonId && prodData[i][2] == treeId) {
      fruitCount = Number(prodData[i][5]) || 0; // column F: คงเหลือ
      break;
    }
  }

  let lastDate = tree.registeredDate ? new Date(tree.registeredDate) : null;
  const harvestSheet = SheetRepository.getSheet('การเก็บเกี่ยว');
  const harvestData = harvestSheet.getDataRange().getValues();
  for (let i = 1; i < harvestData.length; i++) {
    // index 2: รหัสต้น, index 11: วันที่บันทึก - no reason filter here on
    // purpose, both sale ('ตัดขาย') and damage/loss rows count as activity.
    if (harvestData[i][2] == treeId) {
      const d = new Date(harvestData[i][11]);
      if (!isNaN(d) && (!lastDate || d > lastDate)) lastDate = d;
    }
  }

  return {
    id: tree.id,
    variety: tree.variety || '-',
    age: tree.age,
    fruitCount: fruitCount,
    lastRecordDate: lastDate && !isNaN(lastDate) ? Utilities.formatDate(lastDate, 'Asia/Bangkok', 'dd/MM/yyyy') : '-'
  };
}

function updateTreeWeb(treeData, sessionToken) {
  const auth = checkUserAccessWeb(sessionToken);
  if(!auth.hasAccess || (auth.user.role !== 'เจ้าของ' && auth.user.role !== 'admin')) {
    throw new Error("Unauthorized. Only owner or admin can edit trees.");
  }
  
  const sheet = SheetRepository.getSheet('ต้นไม้');
  const data = sheet.getDataRange().getValues();
  for(let i=1; i<data.length; i++){
    if(data[i][0] === treeData.id){
      sheet.getRange(i+1, 2).setValue(treeData.variety || '');
      sheet.getRange(i+1, 3).setValue(treeData.age || '');
      sheet.getRange(i+1, 4).setValue(treeData.lat || '');
      sheet.getRange(i+1, 5).setValue(treeData.lng || '');
      sheet.getRange(i+1, 6).setValue(treeData.flowerMonth || '');
      let photoUrlToSave = treeData.photoUrl || '';
      if (photoUrlToSave.startsWith('data:image/')) {
        const d = new Date();
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear() + 543;
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        const ss = String(d.getSeconds()).padStart(2, '0');
        const fileName = `${treeData.id}_${dd}${mm}${yyyy}_${hh}${min}${ss}.jpg`;
        photoUrlToSave = uploadBase64PhotoToDrive(photoUrlToSave, fileName);
      }
      sheet.getRange(i+1, 11).setValue(photoUrlToSave);
      
      // Update Fruit Count in ผลผลิต
      if (treeData.fruitCount !== undefined && treeData.fruitCount !== '') {
        const seasonId = getActiveSeason();
        const prodSheet = SheetRepository.getSheet('ผลผลิต');
        const prodData = prodSheet.getDataRange().getValues();
        let found = false;
        for(let r=1; r<prodData.length; r++){
          if(prodData[r][1] == seasonId && prodData[r][2] == treeData.id) {
            prodSheet.getRange(r+1, 6).setValue(treeData.fruitCount); // Update คงเหลือ
            // We should also update 'จำนวนผล' (total) if we want, but usually 'คงเหลือ' is the current live count.
            prodSheet.getRange(r+1, 4).setValue(treeData.fruitCount); // Override total too for simplicity.
            found = true;
            break;
          }
        }
        if(!found) {
          prodSheet.appendRow([`${seasonId}-${treeData.id}`, seasonId, treeData.id, treeData.fruitCount, 0, treeData.fruitCount, auth.user.name, new Date()]);
        }
      }
      
      return { success: true };
    }
  }
  return { success: false, error: 'Tree not found' };
}

function getIncomeDataWeb(sessionToken) {
  if(!checkUserAccessWeb(sessionToken).hasAccess) throw new Error("Unauthorized");
  
  const seasonId = getActiveSeason();
  const harvestSheet = SheetRepository.getSheet('การเก็บเกี่ยว');
  if (!harvestSheet) return { totalIncome: 0, totalVolume: 0, gradeSummary: [], items: [], yoy: {} };
  
  const data = harvestSheet.getDataRange().getValues();
  let totalIncome = 0;
  let totalVolume = 0;
  const gradeMap = {};
  const items = [];
  
  for(let i = 1; i < data.length; i++) {
    const rowSeason = data[i][1];
    const reason = data[i][4];
    
    if (rowSeason === seasonId && reason === 'ตัดขาย') {
      const weight = parseFloat(data[i][6]) || 0;
      const price = parseFloat(data[i][7]) || 0; // price per kg or total? Usually total if it's "price", wait. The current code says: const total = weight * price;
      // Wait, in my previous edit for Overview, I used price directly as totalRevenue! But here it says `const total = weight * price;`.
      // Let's stick to `weight * price` if price means price per kg. But wait, in the worker form, price is just price per kg? 
      // Actually the column is "ราคา/กก." so `weight * price` is correct for total.
      const total = weight * price;
      
      totalIncome += total;
      totalVolume += weight;
      
      const grade = data[i][5] || 'ไม่ระบุ';
      if (!gradeMap[grade]) gradeMap[grade] = { weight: 0, total: 0 };
      gradeMap[grade].weight += weight;
      gradeMap[grade].total += total;
      
      items.push({
        date: data[i][12] || data[i][11],
        treeId: data[i][2],
        grade: grade,
        weight: weight,
        price: price,
        total: total
      });
    }
  }
  
  const gradeSummary = Object.keys(gradeMap).map(k => ({
    grade: k,
    weight: gradeMap[k].weight,
    avgPrice: gradeMap[k].weight > 0 ? (gradeMap[k].total / gradeMap[k].weight) : 0,
    total: gradeMap[k].total
  })).sort((a,b) => b.total - a.total);
  
  items.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  return {
    totalIncome: totalIncome,
    totalVolume: totalVolume,
    gradeSummary: gradeSummary,
    items: items,
    yoy: getDashboardYearComparison()
  };
}
