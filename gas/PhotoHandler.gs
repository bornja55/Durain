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

function savePhotoToDrive(messageId, seasonId, treeId) {
  const baseFolderId = getConfig('DRIVE_FOLDER_ID');
  if (!baseFolderId) return null;
  
  const seasonFolder = getOrCreateFolder(baseFolderId, seasonId);
  const treeFolder = getOrCreateFolder(seasonFolder.getId(), treeId);
  
  const blob = getContent(messageId);
  if (!blob) return null;
  
  const file = treeFolder.createFile(blob);
  file.setName(`photo_${new Date().getTime()}.jpg`);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  return file.getUrl();
}
