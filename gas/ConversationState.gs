/**
 * Gets the conversation state for a user
 * @param {string} userId - The LINE User ID
 * @returns {Object|null} The state object {step, action, data} or null
 */
function getState(userId) {
  const cache = CacheService.getScriptCache();
  const stateStr = cache.get(userId);
  if (stateStr) {
    return JSON.parse(stateStr);
  }
  return null;
}

/**
 * Sets the conversation state for a user (expires in 30 mins)
 * @param {string} userId - The LINE User ID
 * @param {Object} state - The state object {step, action, data}
 */
function setState(userId, state) {
  const cache = CacheService.getScriptCache();
  // Store for 30 minutes (1800 seconds)
  cache.put(userId, JSON.stringify(state), 1800);
}

/**
 * Clears the conversation state for a user
 * @param {string} userId - The LINE User ID
 */
function clearState(userId) {
  const cache = CacheService.getScriptCache();
  cache.remove(userId);
}
