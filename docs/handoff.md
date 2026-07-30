# Handoff: Durian Farm Management System

> เอกสารสรุปสั้นสำหรับเริ่ม session ใหม่ — รายละเอียดเต็มอยู่ที่ [`AI_HANDOFF_GUIDELINES.md`](../AI_HANDOFF_GUIDELINES.md)

> 📌 **อัปเดตล่าสุด:** มีงานชุดที่ 2 เพิ่ม (แยกการเก็บเกี่ยวออกจากการขาย) — เสร็จในไฟล์แล้ว 181 เทสต์ผ่าน แต่ยังไม่ deploy และยังไม่ commit
> ก่อน deploy **ต้องรัน `migrateToSaleRounds()`** ใน Apps Script editor — รายละเอียดทั้งหมดอยู่ใน [`AI_HANDOFF_GUIDELINES.md`](../AI_HANDOFF_GUIDELINES.md)

## Current State & Recent Actions

- **แก้บั๊กชุดใหญ่ 8 ตัว (2026-07-27):** role/เมนูเพี้ยน, สแกน QR ค้าง, แก้สิทธิ์ในเว็บไม่บันทึก, flow ตัดจำหน่ายทำรายการไม่จบ, รูปไม่ขึ้น, ปุ่มเปิดแชทค้าง, admin แก้สิทธิ์ไม่ได้, ลูกค้าเห็นปุ่มบันทึก — รายละเอียดและ root cause แต่ละตัวอยู่ใน `AI_HANDOFF_GUIDELINES.md`
- **หน้า `TreeInfo.html` (ใหม่):** ปลายทางของ QR บนแท็กต้นไม้ — server-rendered ล้วน ไม่ใช้ LIFF SDK มีแกลเลอรีรูป + lightbox + ไทม์ไลน์ประวัติต้นไม้ (ไม่มีข้อมูลราคา) ปุ่มบันทึกแสดงเฉพาะผู้ที่ login แล้วมีสิทธิ์
- **Automated test suite (ใหม่):** mock GAS runtime แล้วรันไฟล์ `.gs` จริง — 117 เคสผ่านทั้งหมด อยู่ใน scratchpad ของ agent (`gasmock.js` / `qa.js` / `qa2.js`) ยังไม่ได้ย้ายเข้า repo
- **`docs/QA_CHECKLIST.md` (ใหม่):** รายการทดสอบด้วยมือที่ automate ไม่ได้ พร้อมเหตุผลว่าทำไม
- **Architecture Review REJECTED (คงเดิม):** แผน Repository/Router/Builder pattern ถูกปฏิเสธเพราะ over-engineering สำหรับ GAS ที่ต้องการ overhead ต่ำและ bulk operation (`getValues()`) กัน execution timeout
- **Codebase Philosophy (คงเดิม):** โครงสร้างเรียบง่ายแบบ procedural — `SheetOperations.gs` ใช้ 2D array, `doPost` เป็น switch statement, `FlexMessages.gs` ใช้ JSON template ตรงๆ

## Focus for Next Session

1. **ยืนยันผลทดสอบบนเครื่องจริง** ตาม `docs/QA_CHECKLIST.md` — ที่ยังไม่รู้ผล: รูปในหน้าต้นไม้, ปุ่มเปิดแชท (`target="_top"` จะรอด iframe ของ GAS หรือไม่), flow ตัดจำหน่ายจนจบ, race condition 2 คนพร้อมกัน
2. เปลี่ยน `PROXY_SECRET` เป็นค่าสุ่มยาว (ปัจจุบันเดาง่าย) แก้ทั้ง Script Property และ Cloudflare Worker ให้ตรงกัน

## Suggested Skills

- `/debug-mantra` — วินิจฉัย GAS execution error หรือ LINE webhook timeout
- `/scrutinize` — ตรวจแผนหรือ design decision ก่อนลงมือ (ใช้ได้ผลดีกับเรื่อง flow ตัดขาย)
- `/management-talk` — อัปเดต README ให้คงสไตล์เดิม

## References

- Handoff เต็ม: [`AI_HANDOFF_GUIDELINES.md`](../AI_HANDOFF_GUIDELINES.md)
- Checklist ทดสอบด้วยมือ: [`docs/QA_CHECKLIST.md`](QA_CHECKLIST.md)
- คู่มือผู้ใช้: [`docs/USER_MANUAL.md`](USER_MANUAL.md) / `docs/USER_MANUAL.docx`
- Architecture Review (ถูกปฏิเสธ): `architecture-review-20260724.html` (อยู่ใน OS Temp directory)
