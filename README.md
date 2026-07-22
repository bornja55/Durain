# 🌳 Durian Farm Management System (ระบบจัดการบ้านสวนโพรงกระต่าย)

![Backend](https://img.shields.io/badge/Backend-Google_Apps_Script-0F9D58?style=for-the-badge&logo=google)
![Database](https://img.shields.io/badge/Database-Google_Sheets-34A853?style=for-the-badge&logo=googlesheets)
![Frontend](https://img.shields.io/badge/Frontend-LINE_LIFF-00C300?style=for-the-badge&logo=line)

ระบบบริหารจัดการฟาร์มทุเรียนแบบครบวงจร (End-to-End) ที่ **ไม่มีค่าใช้จ่ายรายเดือน (Zero-cost)** ออกแบบมาเพื่อเปลี่ยนการจดบันทึกลงกระดาษแบบเดิมๆ ให้กลายเป็นระบบดิจิทัลสุดล้ำ! ใช้งานง่ายผ่าน LINE ทั้งสำหรับคนสวนหน้างานและเจ้าของสวน 

---

## 🔥 ไฮไลท์ฟีเจอร์เด่น (Key Features)

### 📱 1. สแกนปุ๊บ บันทึกปั๊บผ่าน LINE (Smart Worker Interface)
บอกลาสมุดจด! คนสวนสามารถใช้แอป LINE สแกน QR Code ประจำต้นทุเรียน เพื่อบันทึกข้อมูลผลผลิต เกรด น้ำหนัก และถ่ายรูปภาพยืนยันจากหน้างานได้ทันที สะดวกรวดเร็วและลดข้อผิดพลาด

### 📊 2. แดชบอร์ดผู้บริหารแบบเรียลไทม์ (Executive Dashboard)
เจ้าของสวนสามารถติดตามสถิติผลผลิต, รายได้แบ่งตามเกรด, สถานะต้นไม้ และรายการรออนุมัติ ผ่านเว็บแดชบอร์ดดีไซน์มินิมอล ใช้งานลื่นไหลบนมือถือ พร้อมระบบยืนยันตัวตนผ่าน LINE Login (LIFF Auth) ปลอดภัย 100% โดยไม่ต้องจำรหัสผ่าน

### 💸 3. โครงสร้างระบบฟรี 100% (Zero-cost Architecture)
บอกลาค่า Subscription รายเดือนแพงๆ! ระบบทั้งหมดขับเคลื่อนด้วยขุมพลังของ Google Workspace (Apps Script, Sheets, Drive) และ LINE API ทำให้สามารถใช้งานระบบสำหรับฟาร์มขนาดเล็กถึงกลางได้อย่างสบายๆ ไร้กังวลเรื่องค่าใช้จ่ายราย User (ทดแทนการใช้ AppSheet)

### 📂 4. ฐานข้อมูลจัดการง่าย (Smart Database)
ข้อมูลทั้งหมดจะถูกจัดเก็บอย่างเป็นระเบียบลงใน Google Sheets เพื่อให้นำไปทำ Report หรือวิเคราะห์ต่อได้อย่างง่ายดาย ส่วนรูปภาพหลักฐานต่างๆ จะถูกอัปโหลดและจัดระเบียบลงโฟลเดอร์ Google Drive ให้อัตโนมัติ

---

## 🚀 เริ่มต้นการใช้งาน (Getting Started)

สำหรับผู้ที่ต้องการนำระบบไปติดตั้งใช้งานด้วยตัวเอง สามารถทำตามคู่มือทีละขั้นตอนได้เลยครับ:
1. 🗄️ **[ตั้งค่าฐานข้อมูล (Google Sheets)](setup/SHEETS_STRUCTURE.md)**
2. 💬 **[ตั้งค่าระบบ LINE OA และ LIFF Scanner](setup/LINE_OA_SETUP.md)**
