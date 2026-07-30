/**
 * Gets a configuration value from the Config sheet
 * @param {string} key - The config key
 * @returns {string} The config value
 */
function getConfig(key) {
  // Secrets and settings now live in Project Settings > Script Properties
  // instead of the Config sheet (plaintext tokens in a shared sheet was a
  // real exposure risk). See setup/SHEETS_STRUCTURE.md for the migration note.
  const value = PropertiesService.getScriptProperties().getProperty(key);
  return value ? value.toString().trim() : null;
}

/**
 * Replies to a LINE message
 * @param {string} replyToken - The reply token
 * @param {Array|Object} messages - Message(s) to send
 */
function replyMessage(replyToken, messages) {
  const url = 'https://api.line.me/v2/bot/message/reply';
  const token = getConfig('CHANNEL_ACCESS_TOKEN');
  
  if (!Array.isArray(messages)) {
    messages = [messages];
  }

  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    payload: JSON.stringify({
      replyToken: replyToken,
      messages: messages
    }),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() !== 200) {
    logErrorToSheet('replyMessage', 'Reply Error', response.getContentText());
  }
}

/**
 * Pushes a LINE message to a user
 * @param {string} userId - The user ID
 * @param {Array|Object} messages - Message(s) to send
 */
function pushMessage(userId, messages) {
  const url = 'https://api.line.me/v2/bot/message/push';
  const token = getConfig('CHANNEL_ACCESS_TOKEN');
  
  if (!Array.isArray(messages)) {
    messages = [messages];
  }

  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    payload: JSON.stringify({
      to: userId,
      messages: messages
    })
  };

  UrlFetchApp.fetch(url, options);
}

/**
 * Gets the profile of a LINE user
 * @param {string} userId - The user ID
 * @returns {Object} The user profile
 */
function getProfile(userId) {
  const url = `https://api.line.me/v2/bot/profile/${userId}`;
  const token = getConfig('CHANNEL_ACCESS_TOKEN');
  
  const options = {
    method: 'get',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    return JSON.parse(response.getContentText());
  } catch (err) {
    throw new Error(`getProfile Error (Token start: "${token ? token.substring(0, 10) : 'null'}...", Length: ${token ? token.length : 0}): ` + err.message);
  }
}

/**
 * Downloads message content (image/video/audio)
 * @param {string} messageId - The message ID
 * @returns {Blob} The content blob
 */
function getContent(messageId) {
  const url = `https://api-data.line.me/v2/bot/message/${messageId}/content`;
  const token = getConfig('CHANNEL_ACCESS_TOKEN');
  
  const options = {
    method: 'get',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  };

  const response = UrlFetchApp.fetch(url, options);
  return response.getBlob();
}

/**
 * Links a rich menu to a user
 * @param {string} userId - The user ID
 * @param {string} richMenuId - The rich menu ID
 */
function linkRichMenuToUser(userId, richMenuId) {
  const url = `https://api.line.me/v2/bot/user/${userId}/richmenu/${richMenuId}`;
  const token = getConfig('CHANNEL_ACCESS_TOKEN');

  const options = {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + token
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() !== 200) {
    // เดิมไม่มี muteHttpExceptions -> throw แล้วถูก catch กลืนใน syncUserRichMenu
    // เห็นแค่ใน console ที่ไม่มีใครเปิดดู ผู้ใช้เลยตกไปใช้ Default menu
    // (= เมนูลูกค้า) แบบไม่มีใครรู้ ตอนนี้บันทึกลงชีต Error Log ให้เห็นชัด
    logErrorToSheet('linkRichMenuToUser',
      'ผูก Rich Menu ไม่สำเร็จ (HTTP ' + response.getResponseCode() + ')',
      'userId=' + userId + ' richMenuId=' + richMenuId + ' | ' + response.getContentText());
    return false;
  }
  return true;
}

/**
 * ยกเลิกการผูก Rich Menu ของผู้ใช้ (จะกลับไปใช้ Default)
 * @param {string} userId - The user ID
 * @returns {boolean} true ถ้า LINE ตอบสำเร็จ (เดิมไม่เช็ค response เลย — ผู้เรียก
 *   อย่าง ensureRichMenuMatchesRole ก็เลย cache "สำเร็จ" ไปทั้งที่ไม่รู้ผลจริง)
 */
function unlinkRichMenuFromUser(userId) {
  const url = `https://api.line.me/v2/bot/user/${userId}/richmenu`;
  const token = getConfig('CHANNEL_ACCESS_TOKEN');

  const options = {
    method: 'delete',
    headers: {
      'Authorization': 'Bearer ' + token
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() !== 200) {
    logErrorToSheet('unlinkRichMenuFromUser',
      'ยกเลิกการผูก Rich Menu ไม่สำเร็จ (HTTP ' + response.getResponseCode() + ')',
      'userId=' + userId + ' | ' + response.getContentText());
    return false;
  }
  return true;
}
