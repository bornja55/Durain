# คู่มือการตั้งค่า LINE Official Account และ LIFF

ทำตามขั้นตอนด้านล่างเพื่อเชื่อมต่อ LINE OA กับระบบจัดการสวนทุเรียน

## 1. การสร้างและตั้งค่า LINE Official Account
1. สมัคร LINE Official Account ที่ [manager.line.biz](https://manager.line.biz) ล็อกอินด้วยบัญชี LINE ของคุณ
2. กรอกข้อมูลร้านค้า/สวนให้ครบถ้วนแล้วกดยืนยัน
3. เมื่อเข้าสู่ LINE Official Account Manager ให้ไปที่เมนู **การตั้งค่า (Settings)** > **Messaging API**
4. กด **เปิดใช้งาน Messaging API (Enable Messaging API)**
   * *[Screenshot: ปุ่มสีเขียวสำหรับเปิดใช้งาน Messaging API ในหน้าตั้งค่า]*
5. เลือกสร้าง Provider ใหม่ (หรือเลือกที่มีอยู่แล้ว) เช่น "DurianFarmProvider"

## 2. การตั้งค่าใน LINE Developers Console
1. ไปที่ [LINE Developers Console](https://developers.line.biz) ล็อกอินด้วยบัญชี LINE เดียวกัน
2. เลือก Provider ที่เพิ่งสร้าง แล้วเลือก Channel ของ LINE OA ของเรา
3. ไปที่แท็บ **Messaging API**
   - เลื่อนลงมาล่างสุดที่ **Channel access token (long-lived)** 
   - กด Issue แล้ว Copy โทเคนนี้เก็บไว้ (นำไปใส่ใน Config sheet)
4. ไปที่แท็บ **Basic settings**
   - เลื่อนลงมาหา **Channel secret**
   - Copy ค่านี้เก็บไว้ (นำไปใส่ใน Config sheet)
5. กลับไปที่แท็บ **Messaging API** ตรงหัวข้อ **Webhook settings**
   - กด Edit ใส่ **Webhook URL** เป็น URL ของ GAS Web App ที่ Deploy ไว้ (เช่น `https://script.google.com/macros/s/.../exec`)
   - กด Update แล้วกด **Verify** (ต้องขึ้น Success)
   - เปิดสวิตช์ **Use webhook** ให้เป็นสีเขียว
   * *[Screenshot: ช่องใส่ Webhook URL และสวิตช์ Use webhook ที่เปิดใช้งานแล้ว]*
6. ไปที่แท็บ **LINE Official Account features** 
   - กด Edit ที่ Auto-reply messages เพื่อปิด
   - กด Edit ที่ Greeting messages เพื่อปิด (ระบบเราจะจัดการตอบกลับเอง)

## 3. การสร้าง LIFF App สำหรับสแกน QR Code
1. ใน LINE Developers Console กดกลับไปที่หน้า Provider ของคุณ
2. กด **Create a new channel** แล้วเลือก **LINE Login**
3. กรอกข้อมูล Channel ให้ครบถ้วน (เช่น ชื่อ "Durian QR Scanner") และกดยืนยัน
4. เมื่อสร้างเสร็จให้คลิกเข้าไปที่ Channel นี้ แล้วเลือกแท็บ **LIFF**
5. กดปุ่ม **Add**
   * **Size**: เลือก `Full`
   * **Endpoint URL**: ใส่ URL ของ GAS Web App (ตัวเดียวกับ Webhook) หรือ URL ที่ Host ไฟล์ `index.html` ของคุณ
   * **Scopes**: ติ๊ก `profile` และ `openid`
   * **Bot link feature**: เลือก `On (Normal)`
   * **Scan QR**: เปิดใช้งาน (สำคัญมาก เพื่อให้ LIFF เรียกกล้องได้)
   * *[Screenshot: หน้าฟอร์ม Add LIFF App พร้อมติ๊กเปิด Scan QR]*
6. กด Add เพื่อบันทึก เมื่อเสร็จแล้วจะได้ **LIFF ID** ให้ Copy ไปใส่ในไฟล์ `gas/LIFF/index.html` และหน้า Config sheet

## 4. การสร้าง Rich Menu
เราจะสร้าง Rich Menu 2 ชุด สำหรับคนสวน (Default) และสำหรับเจ้าของสวน (Admin) สามารถสร้างผ่าน LINE OA Manager หรือผ่าน Messaging API ก็ได้ (แนะนำให้ใช้ LINE OA Manager เพื่อความง่าย)

### ชุดที่ 1: สำหรับคนสวน (Worker Menu)
1. ไปที่ [LINE Official Account Manager](https://manager.line.biz)
2. เมนูซ้ายมือ เลือก **เครื่องมือแชท** > **ริชเมนู (Rich menus)** > กด **สร้างใหม่ (Create new)**
- คนสวน (2×2 grid, 4 buttons): ตัดจำหน่ายผลผลิต, บันทึกผลผลิต, ลงทะเบียนต้นไม้, ภาพรวม
  - Action ของปุ่ม เป็นแบบ URI หรือ Postback ตามที่กำหนด
- เจ้าของ (3×2 grid, 6 buttons): รออนุมัติ, ภาพรวม, จัดการต้นไม้, รายงาน, ตั้งค่าผู้ใช้
  - Action ของปุ่ม: ให้ใช้แบบ **URI** ชี้ไปที่ LIFF App ของระบบ (เช่น `https://liff.line.me/YOUR_LIFF_ID?page=dashboard`) เพื่อเปิด Web App Dashboard ฝั่งแอดมิน
- ใช้ LINE OA Manager หรือ Messaging API ในการสร้าง
13. ผูก Rich Menu คนสวน ให้เป็นเมนูเริ่มต้น (Default)
14. ผูก Rich Menu เจ้าของกับ LINE ID ของเจ้าของสวน (ผ่าน API `linkRichMenuToUser` หรือตั้งค่าใน Manager)nu)
1. สร้างริชเมนูใหม่ ตั้งชื่อ: `Admin Menu`
2. **คอนเทนต์ (Content)**: เลือกเทมเพลตแบบ **3x2 grid (6 ปุ่ม)**
3. อัปโหลดภาพพื้นหลังแบ่ง 6 ช่อง
4. กำหนด Action แบบ **ข้อความ (Text)** สำหรับเมนูส่วนใหญ่ และ **ลิงก์ (URI)** สำหรับ AppSheet:
   - A (บนซ้าย): `รออนุมัติ`
   - B (บนกลาง): `ภาพรวม`
   - C (บนขวา): `จัดการต้นไม้`
   - D (ล่างซ้าย): `รายงาน`
   - E (ล่างกลาง): ลิงก์ (URI) ใส่ลิงก์ของหน้า AppSheet
   - F (ล่างขวา): `ตั้งค่า`
5. บันทึก (ไม่ต้องตั้งเป็นค่าเริ่มต้น)

### 5. การผูก Rich Menu สำหรับแอดมิน
ในการให้เจ้าของสวนเห็น Rich Menu ชุดที่ 2 ต้องทำผ่าน **Messaging API (Link Rich Menu to User)**:
1. หา User ID ของตัวเอง (จาก logs หรือจากหน้า Config)
2. หา Rich Menu ID ของ Admin Menu
3. ใช้ Postman หรือเขียน GAS script สั้นๆ ยิง API `POST https://api.line.me/v2/bot/user/{userId}/richmenu/{richMenuId}` เพื่อผูกเมนูเข้ากับ User ของแอดมิน
