# Durian Farm Management System (บ้านสวนโพรงกระต่าย)

*🇹🇭 สำหรับภาษาไทย กรุณาเลื่อนลงด้านล่าง | 🇹🇭 Thai version is available below.*

## 🇬🇧 Executive Summary

**TL;DR:** A zero-cost, end-to-end farm management system built on Google Workspace and LINE OA. It digitizes the entire durian harvest tracking process—from tree registration to yield approval—replacing manual paperwork with a centralized, real-time dashboard.

### Business Impact
- **Operational Efficiency:** Farm workers can scan QR codes on trees to record yields, grades, and harvest data instantly via a LINE chatbot directly from the field.
- **Executive Visibility:** Farm owners gain access to a real-time web dashboard to track total yields, graded sales revenue, tree statuses, and pending approvals.
- **Zero Cost Architecture:** Built entirely on Google Apps Script (GAS), Google Sheets, and the LINE Messaging API. This eliminates the need for per-user subscription fees from third-party tools like AppSheet, scaling freely for small-to-medium farms.

### How it works (High-level Architecture)
- **Worker Interface (LINE OA & LIFF):** Workers interact with a LINE bot. A built-in QR scanner (LIFF app) allows them to scan a tree and submit structured harvest data seamlessly.
- **Owner Dashboard (GAS Web App):** A secure, mobile-friendly web dashboard authenticated seamlessly via LINE Login (LIFF Auth). Owners can view yield charts, approve/reject harvest records, and manage user roles without managing separate passwords.
- **Database (Google Sheets & Drive):** All structured data is stored in Google Sheets for easy export and downstream analysis. Photos are automatically saved and organized in Google Drive.

---

## 🇹🇭 สรุปสำหรับผู้บริหาร (Executive Summary)

**TL;DR:** ระบบบริหารจัดการฟาร์มแบบครบวงจรที่ไม่มีค่าใช้จ่ายรายเดือน (Zero-cost) สร้างบน Google Workspace และ LINE OA ช่วยเปลี่ยนกระบวนการบันทึกผลผลิตจากกระดาษมาเป็นระบบดิจิทัล พร้อม Dashboard ส่วนกลางสำหรับเจ้าของสวนแบบเรียลไทม์

### ผลกระทบต่อธุรกิจ (Business Impact)
- **เพิ่มประสิทธิภาพคนหน้างาน:** คนสวนสามารถสแกน QR Code ที่ต้นทุเรียนผ่าน LINE เพื่อบันทึกผลผลิต, เกรด, ราคา และรูปถ่าย ได้ทันทีจากหน้างานโดยไม่ต้องใช้กระดาษ
- **เห็นภาพรวมเพื่อการตัดสินใจ:** เจ้าของสวนสามารถดู Dashboard สรุปยอดผลผลิต, รายได้แบ่งตามเกรด, แผนที่สวน และสามารถกดอนุมัติรายการผลผลิตได้ทันทีผ่านมือถือหรือคอมพิวเตอร์
- **ไม่มีค่าใช้จ่ายรายเดือน:** ระบบทั้งหมดรันบน Google Apps Script (GAS), Google Sheets, และ LINE API จึงไม่มีค่าใช้จ่ายต่อผู้ใช้งาน (ทดแทนการใช้แพลตฟอร์มสำเร็จรูปอย่าง AppSheet) เหมาะสำหรับธุรกิจ SME 

### ภาพรวมการทำงาน (Architecture)
- **ส่วนปฏิบัติการ (LINE OA & LIFF):** คนสวนใช้งานผ่าน LINE Bot พร้อมระบบสแกน QR Code แบบฝังตัว (LIFF) ทำให้บันทึกข้อมูลตามขั้นตอน (Conversation Flow) ได้ง่ายและรวดเร็ว
- **ส่วนบริหาร (GAS Web App Dashboard):** หน้าเว็บ Dashboard ออกแบบในสไตล์มินิมอล ปลอดภัยสูงสุดด้วยการยืนยันตัวตนผ่าน LINE (LIFF Auth) ใช้สำหรับดูรายงานสถิติและอนุมัติผลผลิตโดยไม่ต้องจำรหัสผ่าน
- **ฐานข้อมูล (Google Sheets & Drive):** ข้อมูลทั้งหมดถูกจัดเก็บอย่างเป็นระเบียบใน Google Sheets (พร้อมให้ Export ไปวิเคราะห์ต่อ) และระบบจะเก็บรูปภาพหลักฐานเข้า Google Drive ให้อัตโนมัติ

---
*Developed for บ้านสวนโพรงกระต่าย (Rabbit-Habitat Homestay & Farm).*
