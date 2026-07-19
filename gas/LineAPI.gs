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
    })
  };

  UrlFetchApp.fetch(url, options);
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

  const response = UrlFetchApp.fetch(url, options);
  return JSON.parse(response.getContentText());
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
