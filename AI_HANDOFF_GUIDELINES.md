# Handoff: Durian Farm Management System — Bug Fixes + Harvest/Sale Split

## Status
งาน 2 ชุดเสร็จในไฟล์ local แล้ว (แก้บั๊ก 8 ตัว + แยกการเก็บเกี่ยวออกจากการขาย) **automated test 181 เคสผ่านทั้งหมด** แต่ **ผู้ใช้ยังไม่ได้ deploy และยังไม่ได้ทดสอบบนเครื่องจริงเลยสักข้อ** ชุดแก้บั๊กถูก push ขึ้น GitHub แล้ว (`9821582`) ส่วนชุดแยก harvest/sale ยังไม่ได้ commit

## Goal
ผู้ใช้ (Siraphob / "ตะวัน") ดูแลระบบจัดการสวนทุเรียนที่ใช้งานจริง — Google Apps Script + LINE OA + Google Sheets + Drive ขอให้แก้บั๊กด้วย `debug-mantra` discipline, ทำ QA ทั้งระบบ, แล้วปรับ flow ตัดขายให้ตรงกับขั้นตอนจริงหน้าสวน

## What's done

### ชุดที่ 1 — แก้บั๊ก 8 ตัว (push แล้ว commit `9821582`)

1. **เจ้าของสวนเห็นเมนูลูกค้า** — `syncUserRichMenu` ถูกเรียกแค่ตอน add friend / สร้างผู้ใช้ใหม่ / แก้ role ผ่าน Dashboard **ไม่มีจุดไหนอัปเดตเมนูเมื่อแก้ role ด้วยมือในชีต** → เมนูค้างถาวร แก้ด้วย `ensureRichMenuMatchesRole()` เรียกทุก event (เทียบ CacheService ก่อนยิง LINE API — ทัก 5 ครั้งยิงครั้งเดียว)
2. **ลูกค้าสแกน QR แล้วค้าง** — `doGet` ไม่เคยอ่าน `tree` param → เสิร์ฟหน้า LIFF scanner ผิดหน้า แก้ด้วย route `?tree=` (รวม `liff.state`) ไปหน้าใหม่ `TreeInfo.html` ที่ไม่ใช้ LIFF SDK
3. **หน้าเว็บแก้ role ไม่บันทึก** — `UsersVM.changeRole(userId)` อ้างตัวแปร `targetId`/`newRole` ที่ไม่มีจริง → ReferenceError เงียบ
4. **flow ตัดจำหน่ายทำรายการไม่จบ** — บล็อก `WAIT_PHOTO` ถูกเขียนซ้อนในสาขา `REGISTER_TREE` ทั้งที่เช็ค `action === 'HARVEST'` = dead code ตลอดกาล
5. **รูปไม่ขึ้นในหน้าต้นไม้** — `file.getUrl()` เป็นหน้า viewer ไม่ใช่ไฟล์รูป เพิ่ม `toDriveImageUrl()`
6. **ปุ่มเปิดแชทค้างใน iframe** — เพิ่ม `target="_top"` + ปุ่มคัดลอกคำสั่งเป็นทางสำรอง
7. **admin แก้สิทธิ์ไม่ได้** — `updateUserRoleWeb` จำกัดเฉพาะ `'เจ้าของ'` เปลี่ยนเป็น `isOwnerOrAdmin()` + กันแก้สิทธิ์ตัวเอง
8. **ลูกค้าเห็นปุ่มบันทึก** — server ไม่ส่ง `BOT_BASIC_ID` ให้ผู้ไม่มีสิทธิ์เลย + OAuth state พก `returnTo` กลับหน้าต้นไม้เดิม + จำ session 6 ชม. ใน localStorage

**Robustness ที่เพิ่ม:** `withScriptLock()` ครอบ `registerUser` และ gen-รหัสต้นไม้+เข้าคิวเป็นก้อนเดียว · `linkRichMenuToUser` เลิกกลืน error (เพิ่ม `muteHttpExceptions` + log) · `logErrorToSheet()` เขียนลงชีต `Error Log` แทนชีต `Config` ที่ถูก migrate ไปแล้ว · `getUserRole` trim ค่า

### ชุดที่ 2 — แยกการเก็บเกี่ยวออกจากการขาย (ยังไม่ commit)

**ปัญหา:** ชีต `การเก็บเกี่ยว` เก็บ `treeId + เกรด + ราคา` ไว้แถวเดียวกัน ซึ่งผิดตั้งแต่แนวคิด — หน้างานจริงคือ ตัดทั้งต้นทีละต้น → ชั่ง 1 ครั้งต่อตะกร้า → เทรวมกอง → คัดเกรดขาย **พอเทรวมแล้วไม่มีทางรู้ว่าเกรด A มาจากต้นไหน** และตอนคนสวนชั่งก็ยังไม่รู้เกรด/ราคา

**แก้เป็น 2 ตาราง + 1 รอบ = 1 วัน** (ผู้ใช้ยืนยัน "ขายทุกวันที่ตัด") รหัสรอบ `H-25680727` สร้างจากวันที่อัตโนมัติ ไม่ต้องเปิด/ปิดรอบเอง

| ฟังก์ชันใหม่ | ที่อยู่ | หน้าที่ |
|---|---|---|
| `getHarvestRoundId()` / `formatRoundIdAsDate()` | SheetOperations.gs | รหัสรอบจากวันที่ (ใช้ timezone ไทย) |
| `getHarvestRoundSummary()` / `getTreeRoundTotal()` | SheetOperations.gs | สรุปยอดตัดของวัน รวมหลายตะกร้าของต้นเดียวกัน |
| `saveSaleRound()` / `getSaleRoundTotals()` / `parseSaleGradeLines()` | SheetOperations.gs | บันทึก/อ่านการขาย (เขียนทับทั้งรอบเพื่อแก้ไขซ้ำได้) |
| `getRevenueByTree()` / `getRevenueByTreeWeb()` | SheetOperations.gs | รายได้ต่อต้น เฉลี่ยตามสัดส่วนน้ำหนัก |
| `getRoundsMissingSale()` | SheetOperations.gs | วันที่ตัดแล้วลืมบันทึกขาย |
| `migrateToSaleRounds()` / `verifySaleRoundSetup()` | DatabaseSetup.gs | สร้างชีต+คอลัมน์ให้อัตโนมัติ |
| `buildSaleRoundPromptFlex/ConfirmFlex/SavedFlex` | FlexMessages.gs | การ์ดใน LINE |

**Flow ใหม่:** คนสวนเหลือ 3 ขั้น (สแกน → พิมพ์ `45 18` → ถ่ายรูป) · เจ้าของกด `SALE_ROUND` วันละครั้ง → พิมพ์ `A 60 130` หลายบรรทัด → ยืนยัน → ระบบเฉลี่ยรายได้กลับไปทุกต้น

### รอบแก้หลัง scrutinize (สำคัญ — เกือบ deploy ทั้งที่ใช้ไม่ได้)

การ scrutinize หลังเขียนเสร็จจับได้ 4 จุดที่เทสต์ 181 เคสมองไม่เห็น:

1. **🔴 `SALE_ROUND` ไม่มีปุ่มไหนยิงเลย** — ฟีเจอร์ทั้งชุดเข้าไม่ถึง เพราะเทสต์ทุกเคสยิง postback ตรงๆ ข้ามชั้น UI แก้โดยเพิ่มปุ่มใน `buildDashboardMenuFlex()` + ตาราง `TEXT_SHORTCUTS` ใน `Code.gs` (พิมพ์ `บันทึกการขาย` ได้)
2. **🔴 `getIncomeDataWeb()` (แท็บ "รายได้" ในเว็บ) ยังอ่านราคาจากแถวรายต้น** → แถวใหม่ราคาว่าง = รายได้ 0 ทั้งหน้า เขียนใหม่ให้อ่านจากรอบขาย (1 รายการ = 1 รอบ ไม่ใช่ 1 ต้น) + fallback แถวเก่า
3. **🟡 อ่านชีตรอบขายซ้ำต่อรอบ** → 60 รอบ = อ่านชีตเป็นร้อยครั้งต่อการเปิด Dashboard 1 ครั้ง เพิ่ม `buildSaleRoundIndex()` อ่านครั้งเดียวแล้วส่ง map ต่อ (มีเทสต์นับจำนวนครั้งที่อ่านจริง)
4. **🟡 `Dashboard.js.html` ใช้ `h.grade !== '-'` แยกขาย/เสียหาย** → แถวใหม่ grade เป็น `-` เสมอ รายการตัดขายจะถูกมองเป็นความเสียหายหมด เปลี่ยนไปเช็ค `h.reason === 'ตัดขาย'`

**เทสต์ป้องกันซ้ำที่เพิ่ม:** สแกนหา `action === 'X'` ทุกตัวใน `Code.gs` แล้วบังคับว่าต้องมี `action=X` ปรากฏใน Flex/RichMenu/TEXT_SHORTCUTS จริง — พิสูจน์แล้วว่าจับบั๊กเดิมได้ (ย้อนโค้ดกลับแล้วเทสต์แดง)

## What's next

1. **ผู้ใช้ deploy + ทดสอบ** — ยังไม่ได้ทำเลย ดู `docs/QA_CHECKLIST.md` (หัวข้อ 6-NEW คือของชุดที่ 2)
2. **รัน `migrateToSaleRounds()` ก่อน deploy** จาก Apps Script editor แล้วยืนยันด้วย `verifySaleRoundSetup()`
3. **รัน `resyncAllRichMenus()` หนึ่งครั้ง** ซ่อมเมนูให้ทุกคนตาม role ปัจจุบัน (ยังไม่ยืนยันว่ารันแล้ว)
4. **commit + push ชุดที่ 2** — ยังไม่ได้ commit เลย
5. เปลี่ยน `PROXY_SECRET` เป็นค่าสุ่มยาว (ปัจจุบันเป็นคำที่เดาง่าย) แก้ทั้ง Script Property และ Cloudflare Worker ให้ตรงกัน
6. **ยังไม่ได้ทำ (ผู้ใช้ยังไม่สั่ง):** ตารางรายได้ต่อต้นในหน้า Dashboard เว็บ — ฝั่ง API `getRevenueByTreeWeb()` พร้อมแล้วพร้อม `note` กำกับว่าเป็นค่าประมาณ แต่ยังไม่ได้ต่อ UI

## Key decisions made

- **1 รอบ = 1 วัน** ตัดสินหลังผู้ใช้เปลี่ยนกฎเป็น "ขายทุกวันที่ตัด" — ทำให้ไม่ต้องมีปุ่มเปิด/ปิดรอบ ไม่ต้องเก็บ state ไม่มี race condition (เดิมออกแบบไว้รองรับรอบ 1-3 วัน ทิ้งไปแล้ว)
- **เพิ่มคอลัมน์ ไม่ลบของเดิม** — คอลัมน์ `เกรด`/`ราคา/กก.` ยังอยู่ในชีต (ติดป้าย "เลิกใช้") แถวใหม่เว้นว่าง รายงาน fallback ไปอ่านของเก่าเมื่อไม่มีรหัสรอบ → รายได้ย้อนหลังไม่หาย
- **จงใจไม่เติมรหัสรอบย้อนหลัง** — ถ้าเติม ระบบจะมองว่าเป็นข้อมูลรูปแบบใหม่แล้วไปหาราคาในชีต `รอบขาย` ซึ่งไม่มี → **รายได้ย้อนหลังกลายเป็น 0 ทันที** มีเทสต์ล็อกไว้
- **สแกนต้นเดิมซ้ำ = append แถวใหม่** ไม่ใช่ update แถวเดิม — ได้ audit trail ครบ (แต่ละตะกร้ามีรูปของตัวเอง) ไม่มี race condition การ "บวกให้" เกิดตอนอ่าน
- **รายได้ต่อต้นเป็นค่าประมาณ** เฉลี่ยตามน้ำหนัก ไม่ใช่เกรดจริง (ตามกลับไม่ได้) — ผู้ใช้ยอมรับแล้ว แต่หน้ารายงานต้องกำกับเสมอ
- **หน้า TreeInfo ไม่ใช้ LIFF เลย** — server-rendered ล้วน เพราะ LIFF ใน GAS iframe พังตั้งแต่ session ก่อน
- **ประวัติในหน้า TreeInfo ไม่มีข้อมูลราคา** — `getTreeHistoryPublic()` ไม่อ่านคอลัมน์ราคาเลย ไม่ใช่แค่ไม่แสดง มีเทสต์บังคับ
- **admin แก้สิทธิ์ได้เท่าเจ้าของ** รวมถึงตั้งคนอื่นเป็น "เจ้าของ" (ผู้ใช้เลือกเอง) + guard ห้ามแก้สิทธิ์ตัวเอง

## Files changed or created

**ชุดที่ 1 (push แล้ว):**
- `gas/Code.gs` — doGet route `?tree=`, WAIT_PHOTO ย้ายเป็นสาขาบน, lock ครอบ CONFIRM, `logErrorToSheet`, `registerUserWithDefaultRole`, `ensureRichMenuMatchesRole`
- `gas/SheetOperations.gs` — `RICH_MENU_IDS`, `withScriptLock`, `logErrorToSheet`, `getTreePublicInfo`, `toDriveImageUrl`, `getTreeHistoryPublic`, `getMyRoleWeb`, `canRecordFromScan`, OAuth state พก `returnTo`
- `gas/LineAPI.gs` — `linkRichMenuToUser` ไม่กลืน error
- `gas/TestSwitch.gs` — เขียนใหม่: สลับ role 4 แบบ + `listRichMenus`, `diagnoseUserRows`, `diagnoseRichMenuLink`, `resyncAllRichMenus`, `checkMyRichMenu`
- `gas/Dashboard.js.html` — แก้ `UsersVM.changeRole` + confirm
- `gas/TreeInfo.html` — **ใหม่** หน้าข้อมูลต้นไม้ + แกลเลอรี + lightbox + ประวัติ + ปุ่มตามสิทธิ์
- `docs/QA_CHECKLIST.md` — **ใหม่**
- `README.md` / `README_EN.md` — อัปเดต Recent Updates (สไตล์ `management-talk`)

**ชุดที่ 2 (ยังไม่ commit):**
- `gas/SheetOperations.gs` — ฟังก์ชันรอบ/ขาย/รายได้ต่อต้น ตามตารางข้างบน + `getDashboardSales`/`getDashboardByGrade` อ่านจากชีต `รอบขาย`
- `gas/Code.gs` — flow `WAIT_WEIGHT_COUNT`, action `SALE_ROUND`/`SALE_CONFIRM`, CONFIRM แนบ `roundId`, `approveItem` เขียนคอลัมน์รอบ
- `gas/FlexMessages.gs` — 3 การ์ดใหม่ + `buildHarvestSummaryFlex` ตัดเกรด/ราคาออก
- `gas/PushScheduler.gs` — เตือนวันที่ยังไม่บันทึกขาย
- `gas/DatabaseSetup.gs` — `migrateToSaleRounds()`, `verifySaleRoundSetup()`, หัวชีตใหม่
- `docs/DESIGN_harvest_lot.md` — **ใหม่** design เต็ม + สูตร + ข้อจำกัด

**Test suite (อยู่ใน agent scratchpad ไม่ได้อยู่ใน repo):** `gasmock.js` (mock GAS runtime) + `qa.js` (54) + `qa2.js` (63) + `qa3.js` (64) — รวม 181 เคส

## Context the next agent needs

1. **ห้ามถามค่า secret จริงจากผู้ใช้** (`CHANNEL_SECRET`, `LOGIN_CHANNEL_SECRET`, `PROXY_SECRET`)
2. **GAS `doPost`/`doGet` อ่าน HTTP header ไม่ได้เลย** — เหตุผลที่มี Cloudflare Worker proxy (`https://durian-line-verifier.siraphob-an.workers.dev/`) ส่ง `?proxy_secret=` มาให้
3. **หน้าเว็บ GAS ถูก serve ใน iframe เสมอ** บน origin `*-script.googleusercontent.com` — ทำให้ LIFF ใช้ไม่ได้ และเคยลอง "หลุด iframe" ด้วย `window.location.href` แล้วไม่สำเร็จ **รอบนี้ลองใหม่ด้วย `target="_top"` (browser-level nav ไม่ต้องอ่าน URL) ยังไม่ยืนยันผล มีปุ่มคัดลอกเป็นทางสำรอง**
4. **Executions log** (ไอคอนนาฬิกา แถบซ้าย) คือเครื่องมือวินิจฉัยหลัก เช็คก่อนตั้งสมมติฐานเสมอ
5. **ทุกการแก้โค้ดต้อง Deploy → Manage deployments → ✏️ → New version → Deploy** แค่บันทึกไฟล์ไม่พอ
6. **ผู้ใช้ copy ไฟล์เข้า Apps Script editor เอง** (ไม่ได้ใช้ clasp) — ต้องบอกชัดว่าไฟล์ไหนบ้าง
7. โฟลเดอร์ผู้ใช้ sync OneDrive — git จาก sandbox ใช้ได้ แต่ `.git/index.lock` ลบไม่ได้ถ้าค้าง (ต้องขอ permission ผ่าน `allow_cowork_file_delete`) และ **`git push` ทำไม่ได้จาก sandbox** (ไม่มี credential) ต้องให้ผู้ใช้รันเอง
8. `LIFF_ID` เป็นของ **LINE Login channel** ส่วน `BOT_BASIC_ID` เป็นของ **Messaging API channel** คนละตัวกัน
9. **Script Properties ที่ต้องมี:** `SPREADSHEET_ID`, `ACTIVE_SEASON`, `CHANNEL_SECRET`, `CHANNEL_ACCESS_TOKEN`, `LIFF_ID`, `LOGIN_CHANNEL_SECRET`, `PROXY_SECRET`, `OWNER_LINE_ID`, `DRIVE_FOLDER_ID`, `BOT_BASIC_ID`
10. **ชีตที่ต้องมี:** `ต้นไม้`, `ผลผลิต`, `การเก็บเกี่ยว`, `คิวรออนุมัติ`, `ผู้ใช้`, `ฤดูกาล`, `Error Log`, `รอบขาย`
11. **บทเรียนสำคัญ 2 ข้อจาก session นี้:**
    - บั๊ก "เจ้าของกลายเป็นลูกค้า" เสียเวลา 3 สมมติฐานผิด เพราะทุกครั้งตั้งอยู่บนสมมติฐานว่า "มีอะไรพัง" ทั้งที่ความจริงคือ **ไม่มีอะไรพัง — แค่ไม่มีใครเรียกฟังก์ชัน** ถ้าเจอบั๊กแนว "ค่าถูกใน DB แต่พฤติกรรมผิด" ให้ `grep` หาว่า **ใครเรียกฟังก์ชันนั้นบ้าง** ก่อนเดาว่ามันทำงานล้มเหลว
    - **ยิง API ภายนอกทุกจุดต้องใส่ `muteHttpExceptions: true` แล้ว log ผลลัพธ์** — โค้ดที่ throw แล้วถูก catch กลืนคือที่มาของบั๊กที่หายากที่สุดในโปรเจกต์นี้
12. **Preferences ผู้ใช้:** ตอบกระชับตรงประเด็น · ภาษาไทยเป็นหลักผสมศัพท์เทคนิคอังกฤษ · step-by-step สำหรับงานที่ต้องทำมือ · แก้ไฟล์ตรงๆ ไม่ต้องโชว์ diff ก่อน · ชอบให้ทำเป็นสคริปต์มากกว่าให้แก้มือ
13. **GitHub:** `https://github.com/bornja55/Durain.git` branch `main` — commit ล่าสุด `9821582`

## How to resume

ถามผู้ใช้ว่า **deploy ถึงขั้นไหนแล้ว** โดยเฉพาะ 3 อย่างนี้ตามลำดับ:

1. รัน `migrateToSaleRounds()` แล้วหรือยัง (ต้องทำก่อน deploy โค้ดชุดที่ 2 ไม่งั้นรหัสรอบจะลงคอลัมน์ผิด)
2. วางไฟล์ครบแล้วหรือยัง — ชุดที่ 2 คือ `Code.gs`, `SheetOperations.gs`, `FlexMessages.gs`, `PushScheduler.gs`, `DatabaseSetup.gs`
3. ทดสอบตาม `docs/QA_CHECKLIST.md` ถึงข้อไหน — ที่ยังไม่รู้ผลเลยคือ **ทุกข้อ** โดยเฉพาะปุ่มเปิดแชท (`target="_top"` จะรอด iframe ไหม) และ flow เก็บเกี่ยว/ขายใหม่ทั้งหมด

ถ้าผู้ใช้ยังไม่ได้เริ่ม ให้เริ่มจากข้อ 1 แล้วไล่ไปทีละขั้น ถ้าเจอบั๊กให้ใช้ `debug-mantra` และ **ไล่ว่าใครเรียกฟังก์ชันนั้นบ้างก่อนเดาว่ามันพัง**
