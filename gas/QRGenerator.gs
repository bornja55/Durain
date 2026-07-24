// ============================================================================
// Bulk QR generation/printing
// ============================================================================
// Rebuilt 2026-07-24. This file originally held generateQRCode()/
// generateAllQRCodes() - both dead code (no callers anywhere in the project)
// and both broken on top of that (chart.googleapis.com is a shut-down
// endpoint; generateAllQRCodes() called functions/variables that don't
// exist anywhere in this project). That version was removed after the
// project owner confirmed it was never used.
//
// The owner then clarified the real original intent: let an admin print QR
// tags for a whole batch of trees at once instead of clicking "QR Code" one
// tree at a time in the Trees tab, and track which trees have already had
// their tag printed (using the previously-unused "QR" column - column H /
// index 7 - in the ต้นไม้ sheet).
//
// This file now holds the two server-side functions the Dashboard's bulk-
// print UI (TreesVM in Dashboard.js.html) calls:
//   - getTreesPrintInfoBulkWeb(treeIds, sessionToken): batch version of
//     getTreePrintInfoWeb() (SheetOperations.gs) - same per-tree fields,
//     but reads each sheet once for the whole batch instead of once per
//     tree, so selecting e.g. 50 trees doesn't mean 50 round trips.
//   - markTreesPrintedWeb(treeIds, sessionToken): stamps column H with the
//     print date/time for every tree just printed, so the Trees tab can
//     show "ปริ้นแล้ว" / "ยังไม่ปริ้น" and the owner can select-all-unprinted
//     next time instead of re-checking by hand.
// The actual QR image + print-tag HTML is unchanged from the single-tree
// flow (TreesVM.printQR / renderQrPrintPage in Dashboard.js.html) - quickchart.io,
// 1200x1200, same label layout - the bulk version just repeats that same tag
// markup once per selected tree in one print window, separated by page
// breaks so they come out as separate pages/tags when printed.

/**
 * Batch version of getTreePrintInfoWeb() (SheetOperations.gs). Returns one
 * info object per requested treeId that actually exists in ต้นไม้, in the
 * same shape TreesVM.printQR()'s single-tree flow already uses:
 *   { id, variety, age, fruitCount, lastRecordDate }
 * Unknown treeIds are silently skipped (client only ever sends IDs it just
 * displayed, so this should never happen in normal use - skipping instead
 * of throwing means one stale row in the client's cache doesn't kill the
 * whole batch print for everyone else selected).
 */
function getTreesPrintInfoBulkWeb(treeIds, sessionToken) {
  if (!checkUserAccessWeb(sessionToken).hasAccess) throw new Error("Unauthorized");
  if (!treeIds || treeIds.length === 0) throw new Error("ไม่ได้เลือกต้นไม้");

  const wanted = {};
  treeIds.forEach(function (id) { wanted[id] = true; });

  const seasonId = getActiveSeason();

  // ต้นไม้: id -> { age, registeredDate }
  const treeSheet = SheetRepository.getSheet('ต้นไม้');
  const treeData = treeSheet.getDataRange().getValues();
  const treeMap = {};
  for (let i = 1; i < treeData.length; i++) {
    const id = treeData[i][0];
    if (wanted[id]) {
      treeMap[id] = { variety: treeData[i][1], age: treeData[i][2], registeredDate: treeData[i][8] };
    }
  }

  // ผลผลิต: id -> คงเหลือ (this season only, same figure the dashboard/single-tree print uses)
  const prodSheet = SheetRepository.getSheet('ผลผลิต');
  const prodData = prodSheet.getDataRange().getValues();
  const fruitMap = {};
  for (let i = 1; i < prodData.length; i++) {
    const id = prodData[i][2];
    if (wanted[id] && prodData[i][1] == seasonId) {
      fruitMap[id] = Number(prodData[i][5]) || 0; // column F: คงเหลือ
    }
  }

  // การเก็บเกี่ยว: id -> most recent activity date (sale or damage/loss, no
  // reason filter - same as the single-tree flow: any recorded activity
  // counts, not just registration).
  const harvestSheet = SheetRepository.getSheet('การเก็บเกี่ยว');
  const harvestData = harvestSheet.getDataRange().getValues();
  const lastDateMap = {};
  for (let i = 1; i < harvestData.length; i++) {
    const id = harvestData[i][2];
    if (!wanted[id]) continue;
    const d = new Date(harvestData[i][11]);
    if (isNaN(d)) continue;
    if (!lastDateMap[id] || d > lastDateMap[id]) lastDateMap[id] = d;
  }

  const results = [];
  treeIds.forEach(function (id) {
    const tree = treeMap[id];
    if (!tree) return; // unknown/stale id, skip

    let lastDate = tree.registeredDate ? new Date(tree.registeredDate) : null;
    const harvestLast = lastDateMap[id];
    if (harvestLast && (!lastDate || harvestLast > lastDate)) lastDate = harvestLast;

    results.push({
      id: id,
      variety: tree.variety || '-',
      age: tree.age,
      fruitCount: fruitMap[id] || 0,
      lastRecordDate: lastDate && !isNaN(lastDate) ? Utilities.formatDate(lastDate, 'Asia/Bangkok', 'dd/MM/yyyy') : '-'
    });
  });

  return results;
}

/**
 * Stamps column H ("QR") in ต้นไม้ with the current date/time for every
 * treeId given, marking them as printed. Called right after the bulk print
 * window is opened (see TreesVM.printSelectedQR in Dashboard.js.html) - this
 * means "printed" really means "print was requested", same trade-off any
 * "mark as printed" button has if the user cancels the print dialog after
 * the fact. Good enough for its actual purpose here: letting the owner
 * quickly re-select "only trees I haven't printed a tag for yet" without
 * hand-tracking a paper list.
 */
function markTreesPrintedWeb(treeIds, sessionToken) {
  const auth = checkUserAccessWeb(sessionToken);
  if (!auth.hasAccess) throw new Error("Unauthorized");
  if (!treeIds || treeIds.length === 0) return { updated: 0 };

  const wanted = {};
  treeIds.forEach(function (id) { wanted[id] = true; });

  const now = new Date();
  const stamp = Utilities.formatDate(now, 'Asia/Bangkok', 'dd/MM/yyyy HH:mm');

  const sheet = SheetRepository.getSheet('ต้นไม้');
  const data = sheet.getDataRange().getValues();
  let updated = 0;
  for (let i = 1; i < data.length; i++) {
    if (wanted[data[i][0]]) {
      sheet.getRange(i + 1, 8).setValue(stamp); // column H = index 7 = "QR"
      updated++;
    }
  }
  return { updated: updated, stamp: stamp };
}
