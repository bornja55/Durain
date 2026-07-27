# Handoff: Durian Farm Management System — Role/Menu & Scan-Flow Bug Fixes

## Status
บั๊ก 8 ตัวแก้เสร็จแล้วในไฟล์ local + **automated test 117 เคสผ่านทั้งหมด** + push ขึ้น GitHub แล้ว

**สิ่งที่ยังไม่เสร็จ:** ผู้ใช้ยังไม่ได้ deploy รอบล่าสุดและยืนยันบนเครื่องจริงครบทุกข้อ — ที่ยังไม่รู้ผลคือ รูปในหน้าต้นไม้ / ปุ่มเปิดแชท (`target="_top"`) / flow ตัดจำหน่ายจนจบ / race condition สองคนพร้อมกัน (ดู `docs/QA_CHECKLIST.md`)

## Goal
ผู้ใช้ขอให้แก้บั๊กด้วย `debug-mantra` discipline แล้วทำ QA ทั้งระบบ โดยแจ้งว่าอะไรต้องให้ผู้ใช้ทดสอบเองเพราะข้อจำกัดของ agent

## What's done (session นี้)

### บั๊ก 1: เจ้าของสวนกลายเป็นลูกค้า — root cause หายาก เดาผิด 3 รอบ
สมมติฐานที่ **ผิด** (บันทึกไว้กันเสียเวลาซ้ำ):
1. ~~menu ID ที่โค้ดใช้ถูกลบไปแล้ว~~ → `listRichMenus()` พิสูจน์ว่ามีอยู่ครบ 5 เมนู
2. ~~เมนูมีอยู่แต่ยังไม่อัปโหลดรูป จึง link ไม่ได้~~ → ทุกเมนูมีรูปครบ
3. ~~userId ในชีตไม่ตรงกับ `OWNER_LINE_ID`~~ → `diagnoseUserRows()` พิสูจน์ว่าตรง

**Root cause จริง**: `syncUserRichMenu()` ถูกเรียกแค่ 3 จุด — ตอน `handleFollow`, ตอนสร้างผู้ใช้ใหม่, และตอนแก้ role ผ่าน Dashboard — **ไม่มีจุดไหนอัปเดตเมนูเมื่อ role ถูกแก้ด้วยมือในชีต** บัญชี "ตะวัน" add friend ตอนยังไม่มีสิทธิ์ → ถูกตั้งเป็น Customer + ผูกเมนูลูกค้า → แก้ชีตเป็น "เจ้าของ" ทีหลัง → เมนูบน LINE ไม่มีอะไรไปสั่งให้เปลี่ยน ค้างถาวร

**แก้**: เพิ่ม `ensureRichMenuMatchesRole()` (SheetOperations.gs) เรียกทุก event ใน `handlePostback`/`handleTextMessage` — จำ role ที่ผูกไปล่าสุดใน CacheService ยิง LINE API เฉพาะตอนไม่ตรง (ทดสอบแล้ว: ทัก 5 ครั้ง ยิงครั้งเดียว)

### บั๊ก 2: ลูกค้าสแกน QR แล้วค้างที่ liff.init
`doGet()` ไม่เคยอ่าน `tree` param → เสิร์ฟหน้า LIFF scanner ผิดหน้า → ค้างเพราะ LIFF ใช้ใน GAS iframe ไม่ได้ (ข้อจำกัดเดิมที่รู้อยู่แล้ว)
**แก้**: route `?tree=X` (รวมที่มาทาง `liff.state`) ไปหน้าใหม่ `TreeInfo.html` — server-rendered ล้วน ไม่มี LIFF SDK เลย สแกนด้วยกล้องอะไรก็เปิดได้

### บั๊ก 3: หน้าเว็บแก้โรลไม่มีปุ่มเซฟ
`UsersVM.changeRole(userId)` อ้างตัวแปร `targetId`/`newRole` ที่ไม่มีอยู่จริง → ReferenceError เงียบๆ ทุกครั้ง
**แก้**: รับพารามิเตอร์ให้ถูก + confirm ก่อนเซฟ + revert dropdown ถ้ายกเลิก + reload หลังสำเร็จ

### บั๊ก 4 (เจอเองระหว่าง QA): flow ตัดจำหน่ายทำรายการไม่จบเลย
บล็อกจัดการ `"ส่งรูปครบแล้ว"`/`"ข้าม"` ถูกเขียนซ้อนอยู่ในสาขา `REGISTER_TREE` ทั้งที่โค้ดข้างในเช็ค `state.action === 'HARVEST'` → dead code เข้าไม่ถึงตลอดกาล คนสวนถ่ายรูปตาชั่งเสร็จ กดปุ่มแล้วบอทเงียบ ทำรายการไม่จบสักครั้งตั้งแต่ต้น
**แก้**: ย้าย WAIT_PHOTO ออกมาเป็นสาขาระดับบนใช้ร่วมกันทั้งสอง flow + เพิ่ม fallback ถ้าพิมพ์อย่างอื่นระหว่างรอรูป

### บั๊ก 5-6 (ผู้ใช้เจอบนมือถือจริง รอบล่าสุด — แก้แล้วแต่ยังไม่ทดสอบ)
- **รูปไม่ขึ้นในหน้าต้นไม้**: `savePhotoToDrive()` เก็บ `file.getUrl()` ซึ่งเป็นหน้า viewer ไม่ใช่ไฟล์รูป → เพิ่ม `toDriveImageUrl()` ฝั่ง server แปลงเป็น `drive.google.com/thumbnail?id=...` (ตรรกะเดียวกับ `UtilsVM.getDriveImageUrl()` ที่ Dashboard ใช้อยู่แล้ว)
- **กดปุ่มบันทึกแล้วค้างที่ "โปรดเปิด LINE"**: ลิงก์ navigate ภายใน GAS iframe → LINE บล็อกการเปิดแอป → ใส่ `target="_top"` + เพิ่มปุ่ม "คัดลอกคำสั่ง" เป็นทางสำรอง

### บั๊ก 7: admin แก้สิทธิ์ผู้ใช้ไม่ได้ ("Only owner can change roles")
`updateUserRoleWeb` เช็ค `role !== 'เจ้าของ'` ซึ่งไม่สอดคล้องกับที่อื่นที่ admin ทำได้ทุกอย่างผ่าน `isOwnerOrAdmin`
**แก้** (ผู้ใช้เลือก policy เอง): admin แก้ได้เท่าเจ้าของ รวมถึงตั้งคนอื่นเป็น "เจ้าของ" ได้ + เพิ่ม guard ห้ามแก้สิทธิ์ตัวเอง (กันล็อกตัวเองออก — UI disable อยู่แล้วแต่ server ต้องกันด้วย)

### บั๊ก 8: ลูกค้าเห็นปุ่มตัดจำหน่าย/บันทึกผลผลิตในหน้าต้นไม้
หน้า TreeInfo เปิดจากการสแกน QR แบบไม่มี login — `doGet` ไม่มีทางรู้ว่าใครเปิด (LINE ไม่แนบ userId มากับ HTTP request ธรรมดา, LIFF SDK ใช้ไม่ได้ใน GAS iframe)
**แก้**: ใช้ LINE Login OAuth ที่มีอยู่แล้ว
- ขยาย `generateOAuthState(returnTo)` ให้เซ็น `returnTo` รวมใน HMAC → พา login กลับมาที่ **หน้าต้นไม้เดิม** ไม่ใช่ Dashboard (คนสวนไม่มีสิทธิ์ Dashboard อยู่แล้ว)
- `consumeOAuthState` เปลี่ยนจากคืน boolean เป็น `{valid, returnTo}` — **ผู้เรียกทุกที่ต้องอ่าน `.valid`** (object เป็น truthy เสมอ ถ้าลืมจะกลายเป็นช่องโหว่เงียบๆ) แก้ที่ `doGet` แล้ว
- `getMyRoleWeb(sessionToken)` + `canRecordFromScan(role)` (คนสวน/เจ้าของ/admin เท่านั้น)
- **server ไม่ส่ง `BOT_BASIC_ID` ไปหน้าเว็บเลยถ้าไม่มีสิทธิ์** — ซ่อนที่ต้นทาง ไม่ใช่ซ่อนด้วย CSS
- TreeInfo จำ session ใน localStorage 6 ชม. (try/catch — GAS iframe บางเครื่องบล็อก storage) คนสวนสแกนต้นถัดไปไม่ต้อง login ซ้ำ
- ลูกค้าเห็นแค่ลิงก์เล็ก "🔑 เจ้าหน้าที่สวน" ถ้า login แล้วไม่มีสิทธิ์ก็ไม่แสดงอะไรเพิ่ม

### งานอื่นที่ปิดในรอบนี้
- **LockService** (ค้างจาก handoff เดิม ข้อ 5): ครอบ `registerUser` และครอบ `generateNextTreeId()`+`addToPendingQueue()` เป็นก้อนเดียวใน `CONFIRM` (ช่องว่างระหว่างสองฟังก์ชันคือจุดที่รหัสต้นไม้ซ้ำได้) — helper `withScriptLock()` รอ lock 10 วิ
- **Error log ย้ายออกจากชีต Config**: helper `logErrorToSheet()` เขียนลงชีต **"Error Log"** แทน ใช้ที่ `doPost`/`doGet`/`replyMessage`/`linkRichMenuToUser`
- **`linkRichMenuToUser` เคยกลืน error เงียบๆ** (ไม่มี `muteHttpExceptions` → throw → ถูก catch ใน `syncUserRichMenu` ลง console ที่ไม่มีใครดู) — **นี่คือเหตุผลที่บั๊ก 1 หายากขนาดนี้** ตอนนี้ลง Error Log พร้อม userId + menuId + คำตอบจาก LINE
- **`getUserRole` trim ค่า** — space ตัวเดียวจากการแก้ชีตด้วยมือเคยทำให้สิทธิ์หายเงียบๆ
- **`registerUserWithDefaultRole()`** — ถ้า userId ตรงกับ `OWNER_LINE_ID` ลงทะเบียนเป็น "เจ้าของ" ไม่ใช่ "Customer"
- **Feature สลับ role**: `TestSwitch.gs` เขียนใหม่ — `testAsOwner/Admin/Worker/Customer()` อัปเดตทั้งชีตและเมนูจริง ใช้ `OWNER_LINE_ID` จาก Script Properties (ไม่ hardcode userId เหมือนเดิม)

### Automated test suite (ใหม่)
`outputs/gasmock.js` + `qa.js` + `qa2.js` — mock GAS runtime (SpreadsheetApp/CacheService/UrlFetchApp/LockService/HtmlService) แล้วโหลดไฟล์ `.gs` จริงเข้าไปรัน **89 เคสผ่านหมด** ครอบ role/สิทธิ์, rich menu, doGet routing, หน้าต้นไม้, lock, error log, webhook security, ทุก flow ของบอท, session/OAuth
> อยู่ใน scratchpad ของ agent ไม่ได้อยู่ในโปรเจกต์ — ถ้าอยากเก็บถาวรต้องย้ายเข้า repo เอง

## จุดที่ค้างไว้ตามคำขอผู้ใช้ (ยังไม่ต้องทำ)
**flow ตัดขายต้องเปลี่ยนเป็น 1 ลูก/1 รายการ** — ปัจจุบันกรอกเป็นยอดรวม (จำนวน+น้ำหนัก+ราคารวม) แต่ความจริงหน้างานต้องบันทึกทีละลูก หรือขายเป็นล็อตในอนาคต ผู้ใช้บอกว่า **"ขอดูหน้างานจริงก่อน ค้างไว้ก่อน"** — อย่าเพิ่งลงมือ รอผู้ใช้กลับมาบอกรูปแบบที่ต้องการ

## What's next
0. **ผู้ใช้ยังไม่ได้ deploy รอบล่าสุด** — เริ่มจากยืนยันว่าวางไฟล์ครบทั้ง 6 ไฟล์แล้วหรือยัง (`Code.gs`, `SheetOperations.gs`, `LineAPI.gs`, `TestSwitch.gs`, `Dashboard.js.html`, `TreeInfo.html`) แล้ว Deploy → New version
1. **ผู้ใช้ deploy + ทดสอบตาม `docs/QA_CHECKLIST.md`** (สร้างใหม่ในรอบนี้) — ที่ยังไม่ยืนยัน: รูปในหน้าต้นไม้, ปุ่มเปิดแชท (`target="_top"` จะรอดหรือไม่), flow ตัดจำหน่ายจนจบ, race condition 2 คนพร้อมกัน
2. **รัน `resyncAllRichMenus()` หนึ่งครั้ง** เพื่อซ่อมเมนูให้ทุกคนตาม role ปัจจุบัน (ยังไม่ยืนยันว่ารันแล้ว)
3. ~~commit + push GitHub~~ — **เสร็จแล้ว** push ครบทุกอย่างในรอบนี้ รวม `docs/QA_CHECKLIST.md`, `gas/TreeInfo.html` และ README ที่อัปเดตแล้ว
4. เปลี่ยน `PROXY_SECRET` — ค่าปัจจุบันเป็นคำที่เดาง่าย เป็นสิ่งเดียวที่กัน request ปลอมข้าม Cloudflare Worker (ต้องแก้ทั้ง Script Property และ Worker ให้ตรงกัน)
5. ยังไม่ทำ (เสนอแล้ว ไม่ได้ขอ): dashboard session ย้ายจาก CacheService ไปเป็น signed token แบบเดียวกับ OAuth state, ลบ rich menu ซ้ำ 2 คู่ที่เกิดจากรัน `setupRichMenus()` สองรอบ

## Key decisions made (session นี้)
- **หน้าข้อมูลต้นไม้ไม่ใช้ LIFF เลย** — server-rendered ล้วน เพราะ LIFF ใน GAS iframe พังตั้งแต่ session ก่อน สแกนด้วยกล้องอะไรก็เปิดได้ ทุก role ใช้ได้
- **แยกสิทธิ์ที่ server ไม่ใช่ที่หน้าเว็บ** — ปุ่มบันทึกในหน้าต้นไม้แสดงให้ทุกคน แต่ `doPost` เช็ค role อยู่แล้ว ลูกค้ากดก็ได้แค่ข้อมูลต้นไม้
- **แปลง Drive URL ที่ฝั่ง server** (`toDriveImageUrl` ใน SheetOperations.gs) ไม่ใช่ฝั่ง client — เพื่อให้เขียน automated test ครอบได้
- **lock ครอบ gen-รหัส + เข้าคิว เป็นก้อนเดียว** ไม่ใช่ lock แยกทีละฟังก์ชัน เพราะช่องว่างระหว่างสองฟังก์ชันคือจุดที่ race เกิด

## Files changed (session นี้)
- `gas/Code.gs` — doGet route `?tree=`; WAIT_PHOTO ย้ายเป็นสาขาระดับบน; `withScriptLock` ครอบ CONFIRM; `logErrorToSheet`; `registerUserWithDefaultRole`; `ensureRichMenuMatchesRole`
- `gas/SheetOperations.gs` — `RICH_MENU_IDS`, `withScriptLock`, `logErrorToSheet`, `getTreePublicInfo`, `toDriveImageUrl`, `registerUserWithDefaultRole`, `ensureRichMenuMatchesRole`; `getUserRole` trim; `registerUser` lock; `updateUserRoleWeb` validate role
- `gas/LineAPI.gs` — `linkRichMenuToUser` ไม่กลืน error แล้ว; `replyMessage` log ลง Error Log
- `gas/TestSwitch.gs` — เขียนใหม่ทั้งไฟล์: สลับ role 4 แบบ + `listRichMenus`, `diagnoseRichMenuLink`, `diagnoseUserRows`, `checkMyRichMenu`, `resyncAllRichMenus`
- `gas/Dashboard.js.html` — `UsersVM.changeRole` แก้บั๊ก + confirm
- `gas/TreeInfo.html` — **ไฟล์ใหม่** หน้าข้อมูลต้นไม้ (ต้องสร้างเป็นไฟล์ HTML ชื่อ `TreeInfo` ใน editor)
- `docs/QA_CHECKLIST.md` — **ไฟล์ใหม่** checklist ทดสอบด้วยมือ
- Script Property ใหม่: `BOT_BASIC_ID` (Basic ID ของ OA จาก **Messaging API channel** ไม่ใช่ LINE Login channel)
- ชีตใหม่: **"Error Log"** (เวลา / แหล่งที่มา / ข้อความ / รายละเอียด) — ชื่อต้องตรงเป๊ะ

## Context the next agent needs
> ข้อ 1-8 สืบทอดจาก session ก่อน ยังใช้ได้ทั้งหมด

1. **ห้ามถามค่า secret จริงจากผู้ใช้** (`CHANNEL_SECRET`, `LOGIN_CHANNEL_SECRET`, `PROXY_SECRET`)
2. **GAS `doPost`/`doGet` อ่าน HTTP header ไม่ได้เลย** — เหตุผลที่มี Cloudflare Worker proxy
3. **หน้าเว็บ GAS ถูก serve ใน iframe เสมอ** บน origin `*-script.googleusercontent.com` ที่ต่างจาก URL ในแถบที่อยู่ — ทำให้ LIFF ใช้ไม่ได้ และเคยลอง "หลุด iframe" ด้วย `window.location.href` แล้วไม่สำเร็จ **(รอบนี้ลองใหม่ด้วย `target="_top"` ซึ่งเป็น browser-level navigation ไม่ต้องอ่าน URL — ยังไม่ยืนยันผล มีปุ่มคัดลอกเป็นทางสำรองแล้ว)**
4. **Executions log** (ไอคอนนาฬิกา แถบซ้าย) คือเครื่องมือวินิจฉัยหลัก — เช็คก่อนตั้งสมมติฐานเสมอ
5. **ทุกการแก้โค้ดต้อง Deploy → Manage deployments → ✏️ → New version → Deploy** แค่บันทึกไฟล์ไม่พอ
6. **ผู้ใช้ copy ไฟล์เข้า Apps Script editor เอง** (ไม่ได้ใช้ clasp) — ต้องบอกชัดว่าไฟล์ไหนบ้าง
7. โฟลเดอร์ผู้ใช้ sync กับ OneDrive — git จาก sandbox อาจล้มด้วย `EPERM`
8. `LIFF_ID` = `"{channelId}-{randomString}"` โดย channelId เป็นของ **LINE Login channel** ส่วน `BOT_BASIC_ID` เป็นของ **Messaging API channel** คนละตัวกัน
9. **บทเรียนสำคัญจากรอบนี้**: บั๊ก "เจ้าของกลายเป็นลูกค้า" เสียเวลาไป 3 สมมติฐานเพราะทุกครั้งตั้งอยู่บนสมมติฐานว่า "มีอะไรพัง" ทั้งที่ความจริงคือ **ไม่มีอะไรพังเลย — แค่ไม่มีใครเรียกฟังก์ชัน** ถ้าเจอบั๊กแนว "ค่าถูกในฐานข้อมูลแต่พฤติกรรมผิด" ให้ `grep` หาว่า **ใครเรียกฟังก์ชันที่ทำให้เกิดผลนั้นบ้าง** ก่อนจะเดาว่ามันทำงานล้มเหลว
10. **ยิง API ภายนอกทุกจุดต้องใส่ `muteHttpExceptions: true` แล้ว log ผลลัพธ์** — โค้ดที่ throw แล้วถูก catch กลืนคือที่มาของบั๊กที่หายากที่สุดในโปรเจกต์นี้
11. Preferences ผู้ใช้: ตอบกระชับตรงประเด็น ภาษาไทยเป็นหลักผสมศัพท์เทคนิคอังกฤษ, step-by-step สำหรับงานที่ต้องทำมือ, แก้ไฟล์ตรงๆ ไม่ต้องโชว์ diff ก่อน

## How to resume
ถามผู้ใช้ว่า deploy 6 ไฟล์ (`Code.gs`, `SheetOperations.gs`, `LineAPI.gs`, `TestSwitch.gs`, `Dashboard.js.html`, `TreeInfo.html`) แล้วทดสอบตาม `docs/QA_CHECKLIST.md` ถึงข้อไหน โดยเฉพาะ 2 บั๊กล่าสุด (รูปในหน้าต้นไม้ขึ้นหรือยัง / ปุ่มเปิดแชทค้างอีกไหม — ถ้ายังค้าง ให้ถามว่าปุ่ม "คัดลอกคำสั่ง" ใช้ได้ไหม เพื่อแยกว่าเป็นข้อจำกัด WebView หรือแก้ได้อีก) เมื่อผ่านหมดแล้วช่วยผู้ใช้ commit + push ขึ้น `https://github.com/bornja55/Durain.git`
