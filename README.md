# ระบบจัดการผลผลิตสวนทุเรียน

ระบบจัดการสวนทุเรียนแบบครบวงจรสำหรับคนสวนและเจ้าของสวน โดยใช้ LINE Official Account เป็นช่องทางหลักในการบันทึกข้อมูล และมี Dashboard สำหรับผู้บริหารผ่าน AppSheet

## 🏗 สถาปัตยกรรม (Architecture)
ระบบนี้ถูกออกแบบให้ทำงานประสานกัน 4 ส่วนหลัก:
1. **LINE OA (Messaging API & LIFF)**: หน้าบ้าน (Frontend) สำหรับคนสวนใช้แจ้งบันทึกผลผลิตและตัดจำหน่ายผ่านเมนู Rich Menu และสแกน QR Code
2. **Google Apps Script (GAS)**: เป็น Webhook API และ Backend Logic คอยรับส่งข้อความและประมวลผลคำสั่ง
3. **Google Sheets + Google Drive**: ฐานข้อมูล (Database) เก็บข้อมูลรายการทั้งหมด และ Drive สำหรับเก็บรูปภาพ
4. **AppSheet**: แอปพลิเคชัน (Backoffice/Dashboard) สำหรับเจ้าของสวนในการ อนุมัติ/ปฏิเสธ รายการและดูภาพรวม

## 📂 โครงสร้างไฟล์ในโปรเจค
```text
สวนทุเรียน/
├── gas/
│   └── LIFF/
│       └── index.html            # หน้าเว็บแอป LIFF สำหรับสแกน QR Code
├── setup/
│   ├── APPSHEET_SETUP.md         # คู่มือตั้งค่า AppSheet สำหรับ Dashboard
│   ├── LINE_OA_SETUP.md          # คู่มือตั้งค่า LINE OA, LIFF และ Rich Menu
│   └── SHEETS_STRUCTURE.md       # คู่มือสร้าง Database บน Google Sheets
└── README.md                     # ภาพรวมโปรเจค (ไฟล์นี้)
```

## 🚀 วิธีการติดตั้ง (Deploy) คร่าวๆ
ทำตามขั้นตอนในโฟลเดอร์ `setup/` ตามลำดับดังนี้:
1. สร้าง Google Sheet ใหม่ → สร้าง 7 Sheets ตามโครงสร้าง
2. เปิด Apps Script Editor → copy ไฟล์ .gs และ .html ทั้งหมดไปวาง
3. Deploy as Web App
4. สมัคร LINE OA + Messaging API
5. ตั้ง Webhook URL
6. สร้าง LIFF app และนำ LIFF ID ไปใส่ใน Config Sheet
7. สร้าง Rich Menu สำหรับคนสวน (ลิงก์เข้าหน้า LIFF Scanner) และเจ้าของ (ลิงก์เข้าหน้า Dashboard)

## 💰 ค่าใช้จ่าย (Costs)
- **ฟรี (Free Tier)** ทั้งระบบ หากอยู่ในเงื่อนไขการใช้งานเบื้องต้น
- ไม่มีค่า Server เนื่องจากรันบน Google Cloud Infrastructure

## ⚠️ ข้อจำกัดระบบ (Limitations)
- **LINE Push Message**: ส่งฟรี 200 ข้อความต่อเดือน (Reply Message ไม่จำกัด) หากต้องการส่งแจ้งเตือน (Push) เกินจำนวนนี้ ต้องอัปเกรดแพ็กเกจ LINE OA
- **Google Drive**: ฟรี 15 GB รวมข้อมูลทุกอย่าง (อีเมล, ไฟล์, รูปภาพ)
- **AppSheet (Free plan)**: ใช้ได้ไม่เกิน 10 Users (เหมาะสมสำหรับแอดมินหรือเจ้าของสวนไม่กี่คน)
- **GAS Execution limits**: 6 นาทีต่อครั้งของการทำงานรันโค้ด และจำกัดโควต้าการอ่าน/เขียน Sheets ต่อวันของ Google (เพียงพอต่อการใช้งานสวนทุเรียนปกติ)
