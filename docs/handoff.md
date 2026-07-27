# Handoff: Durian Farm Management System

> เอกสารสรุปสั้นสำหรับเริ่ม session ใหม่ — รายละเอียดเต็มอยู่ที่ [`AI_HANDOFF_GUIDELINES.md`](../AI_HANDOFF_GUIDELINES.md)

## Current State & Recent Actions

- **แก้บั๊กชุดใหญ่ 8 ตัว (2026-07-27):** role/เมนูเพี้ยน, สแกน QR ค้าง, แก้สิทธิ์ในเว็บไม่บันทึก, flow ตัดจำหน่ายทำรายการไม่จบ, รูปไม่ขึ้น, ปุ่มเปิดแชทค้าง, admin แก้สิทธิ์ไม่ได้, ลูกค้าเห็นปุ่มบันทึก — รายละเอียดและ root cause แต่ละตัวอยู่ใน `AI_HANDOFF_GUIDELINES.md`
- **หน้า `TreeInfo.html` (ใหม่):** ปลายทางของ QR บนแท็กต้นไม้ — server-rendered ล้วน ไม่ใช้ LIFF SDK มีแกลเลอรีรูป + lightbox + ไทม์ไลน์ประวัติต้นไม้ (ไม่มีข้อมูลราคา) ปุ่มบันทึกแสดงเฉพาะผู้ที่ login แล้วมีสิทธิ์
- **Automated test suite (ใหม่):** mock GAS runtime แล้วรันไฟล์ `.gs` จริง — 117 เคสผ่านทั้งหมด อยู่ใน scratchpad ของ agent (`gasmock.js` / `qa.js` / `qa2.js`) ยังไม่ได้ย้ายเข้า repo
- **`docs/QA_CHECKLIST.md` (ใหม่):** รายการทดสอบด้วยมือที่ automate ไม่ได้ พร้อมเหตุผลว่าทำไม
- **Architecture Review REJECTED (คงเดิม):** แผน Repository/Router/Builder pattern ถูกปฏิเสธเพราะ over-engineering สำหรับ GAS ที่ต้องการ overhead ต่ำและ bulk operation (`getValues()`) กัน execution timeout
- **Codebase Philosophy (คงเดิม):** โครงสร้างเรียบง่ายแบบ procedural — `SheetOperations.gs` ใช้ 2D array, `doPost` เป็น switch statement, `FlexMessages.gs` ใช้ JSON template ตรงๆ

## Focus for Next Session

1. **ยืนยันผลทดสอบบนเครื่องจริง** ตาม `docs/QA_CHECKLIST.md` — ที่ยังไม่รู้ผล: รูปในหน้าต้นไม้, ปุ่มเปิดแชท (`target="_top"` จะรอด iframe ของ GAS หรือไม่), flow ตัดจำหน่ายจนจบ, race condition 2 คนพร้อมกัน
2. **รอผู้ใช้ดูหน้างานจริงเรื่อง flow ตัดขาย** — ค้างไว้ตามคำขอ (ดูหัวข้อถัดไป)
3. เปลี่ยน `PROXY_SECRET` เป็นค่าสุ่มยาว (ปัจจุบันเดาง่าย) แก้ทั้ง Script Property และ Cloudflare Worker ให้ตรงกัน

## ค้างไว้รอคำตอบ: flow ตัดขาย (batch vs ต่อต้น)

ผู้ใช้บอกให้ **ยังไม่ต้องลงมือ** รอดูหน้างานจริงก่อน — ข้อสรุปจากการวิเคราะห์:

- ปัญหาไม่ใช่ "เลือก batch หรือต่อต้น" แต่คือระบบรวม **2 เหตุการณ์คนละหน่วยนับ** ไว้ในแถวเดียว: *เก็บเกี่ยว* (หน่วย = ลูก, ผูกกับต้นที่มี QR) กับ *ขาย* (หน่วย = กก./เกรด/ราคา, ผูกกับการซื้อขาย)
- QR อยู่ที่ **ต้น** ไม่ได้อยู่ที่ **ลูก** — traceability รายลูกทำไม่ได้ด้วยฮาร์ดแวร์ปัจจุบัน
- flow ปัจจุบัน 7 ขั้น ถ้าทำต่อลูก 50 ลูก = 350 interaction ในแชท → ต้อง redesign input พร้อมกัน
- "ล็อตล้วน" เป็นทางตัน เพราะยอดคงเหลือผูกกับต้น สุดท้ายต้องระบุรายต้นอยู่ดี
- โครงที่น่าจะรอด: แยก 2 ตาราง `การเก็บเกี่ยว` (treeId, จำนวนลูก, lotId) + `ล็อตขาย` (lotId, น้ำหนัก, เกรด, ราคา, ผู้ซื้อ)

**4 คำถามที่ต้องตอบจากหน้างานก่อนเขียนโค้ด:** ล้งรับซื้อแบบชั่งรวมหรือคัดทีละลูก / ทุเรียนหลายต้นปนกันในกองเดียวไหม / "ต่อลูก" ต้องการเพื่อ traceability หรือความแม่นของน้ำหนัก / ตอนตัดรู้เกรดกับราคาแล้วหรือรู้ทีหลัง

## Suggested Skills

- `/debug-mantra` — วินิจฉัย GAS execution error หรือ LINE webhook timeout
- `/scrutinize` — ตรวจแผนหรือ design decision ก่อนลงมือ (ใช้ได้ผลดีกับเรื่อง flow ตัดขาย)
- `/management-talk` — อัปเดต README ให้คงสไตล์เดิม

## References

- Handoff เต็ม: [`AI_HANDOFF_GUIDELINES.md`](../AI_HANDOFF_GUIDELINES.md)
- Checklist ทดสอบด้วยมือ: [`docs/QA_CHECKLIST.md`](QA_CHECKLIST.md)
- คู่มือผู้ใช้: [`docs/USER_MANUAL.md`](USER_MANUAL.md) / `docs/USER_MANUAL.docx`
- Architecture Review (ถูกปฏิเสธ): `architecture-review-20260724.html` (อยู่ใน OS Temp directory)
