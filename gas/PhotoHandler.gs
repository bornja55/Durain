function getOrCreateFolder(parentId, folderName) {
  let parentFolder;
  if (parentId) {
    parentFolder = DriveApp.getFolderById(parentId);
  } else {
    parentFolder = DriveApp.getRootFolder();
  }
  
  const folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parentFolder.createFolder(folderName);
}

function generatePhotoFilename(targetFolder) {
  const d = new Date();
  const yy = String(d.getFullYear() % 100).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const prefix = `${yy}${mm}${dd}_${hh}${m}_`;
  
  let count = 0;
  if (targetFolder) {
    const files = targetFolder.searchFiles(`title contains '${prefix}'`);
    while (files.hasNext()) {
      files.next();
      count++;
    }
  }
  const xx = String(count).padStart(2, '0');
  return `${prefix}${xx}.jpg`;
}

function savePhotoToDrive(messageId, seasonId, treeId) {
  const baseFolderId = getConfig('DRIVE_FOLDER_ID');
  if (!baseFolderId) return null;
  
  const seasonFolder = getOrCreateFolder(baseFolderId, seasonId);
  const treeFolder = getOrCreateFolder(seasonFolder.getId(), treeId);
  
  const blob = getContent(messageId);
  if (!blob) return null;
  
  const file = treeFolder.createFile(blob);
  file.setName(generatePhotoFilename(treeFolder));
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {
    console.warn("Could not set sharing permissions: " + e.message);
  }
  
  return file.getUrl();
}

function uploadBase64PhotoToDrive(base64Data, filename) {
  const baseFolderId = getConfig('DRIVE_FOLDER_ID');
  if (!baseFolderId) return null;
  
  const seasonId = getActiveSeason();
  const seasonFolder = getOrCreateFolder(baseFolderId, seasonId);
  const webUploadFolder = getOrCreateFolder(seasonFolder.getId(), "WebUploads");
  
  const parts = base64Data.split(',');
  if (parts.length !== 2) return base64Data; // Not a valid base64 string, return original
  
  const dataType = parts[0].split(';')[0].split(':')[1];
  const b64 = parts[1];
  
  const blob = Utilities.newBlob(Utilities.base64Decode(b64), dataType, filename || generatePhotoFilename(webUploadFolder));
  
  const file = webUploadFolder.createFile(blob);
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {
    console.warn("Could not set sharing permissions: " + e.message);
  }
  
  return file.getUrl();
}
