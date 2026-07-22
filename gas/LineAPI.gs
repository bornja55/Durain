/**
 * Gets a configuration value from the Config sheet
 * @param {string} key - The config key
 * @returns {string} The config value
 */
function getConfig(key) {
  const sheet = getSpreadsheet().getSheetByName('Config');
  const data = sheet.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    const rowKey = data[i][0] ? data[i][0].toString().trim() : '';
    if (rowKey === key) {
      return data[i][1] ? data[i][1].toString().trim() : null;
    }
  }
  return null;
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
    try {
      const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
      const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName('Config');
      sheet.appendRow(['ERROR_LOG', new Date().toLocaleString(), 'Reply Error', response.getContentText()]);
    } catch(e) {}
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
    }
  };

  UrlFetchApp.fetch(url, options);
}

/**
 * ยกเลิกการผูก Rich Menu ของผู้ใช้ (จะกลับไปใช้ Default)
 * @param {string} userId - The user ID
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

  UrlFetchApp.fetch(url, options);
}
