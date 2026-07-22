// ==========================================
// เครื่องมือสลับเมนูสำหรับทดสอบ (Quick Switch)
// ==========================================

function testAsWorker() {
  const myUserId = "U4f70abfadabd87fbeade08844640e0e4"; // User ID ของคุณ
  unlinkRichMenuFromUser(myUserId);
  Logger.log("✅ สลับเป็นเมนู 'คนสวน' เรียบร้อยแล้ว (ลองปิดแชทแล้วเปิดใหม่)");
}

function testAsAdmin() {
  const myUserId = "U4f70abfadabd87fbeade08844640e0e4"; // User ID ของคุณ
  const adminMenuId = "richmenu-e965ba0fb0d93888408f7dd7cdf2b336"; // ID ของเมนูแอดมิน (อ้างอิงจากระบบเดิม)
  linkRichMenuToUser(myUserId, adminMenuId);
  Logger.log("✅ สลับกลับเป็นเมนู 'ผู้บริหาร' เรียบร้อยแล้ว (ลองปิดแชทแล้วเปิดใหม่)");
}
