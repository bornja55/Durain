*Read in other languages: [🇹🇭 ภาษาไทย](README.md), [🇬🇧 English](README_EN.md)*

# 🌳 Durian Farm Management System (Rabbit-Habitat Farm)

![Backend](https://img.shields.io/badge/Backend-Google_Apps_Script-0F9D58?style=for-the-badge&logo=google)
![Database](https://img.shields.io/badge/Database-Google_Sheets-34A853?style=for-the-badge&logo=googlesheets)
![Frontend](https://img.shields.io/badge/Frontend-LINE_LIFF-00C300?style=for-the-badge&logo=line)

An end-to-end, **zero-cost** durian farm management system designed to digitize manual paper-based tracking! Extremely easy to use via the LINE app for both field workers and farm owners.

---

## 🔥 Key Features

### 📱 1. Scan & Log Instantly via LINE (Smart Worker Interface)
Say goodbye to notebooks! Farm workers can use the LINE app to scan the QR Code on each durian tree to instantly record harvest data, grades, weights, and attach photo evidence right from the field. It's fast, convenient, and reduces human error.

### 📊 2. Real-Time Executive Dashboard
Farm owners can track total yields, revenue separated by grades, tree health statuses, and pending harvest approvals through a minimalist web dashboard. It works seamlessly on mobile devices with secure LINE Login (LIFF Auth) authentication—no passwords to remember!

### 💸 3. 100% Free Architecture (Zero-cost Architecture)
Say goodbye to expensive monthly subscriptions! The entire system is powered by Google Workspace (Apps Script, Sheets, Drive) and LINE API, allowing small to medium-sized farms to easily scale without worrying about per-user costs (A perfect alternative to AppSheet).

### 📂 4. Smart Database Management
All data is neatly organized and stored in Google Sheets, making it incredibly easy to export for further reporting or analysis. Photographic evidence is automatically uploaded and organized into Google Drive folders.

---

## 📢 Recent Updates

**Current Status: Stable & Deployed**

*   **Fixed Inaccurate Remaining-Yield Counts:** Approving a sale or damage report used to leave the "remaining on tree" figure unchanged, so it drifted further from reality over time. It now updates correctly every time a report is approved.
*   **Real Sales Revenue on the Overview Report:** The LINE "Overview" menu now shows actual sales revenue and total weight sold, replacing the placeholder figures used before.
*   **Full-Screen Photo Viewer:** Tapping a photo in a tree's detail view now opens it full-screen, with swipe/arrow navigation to browse the rest of that tree's photos — no more squinting at tiny thumbnails on mobile.
*   **Upgraded Printable QR Tags:** QR codes are now bigger and sharper, with the tree's name, variety, age, remaining fruit count, and last-recorded date printed right on the tag. Owners can also select multiple trees and print all their tags in one batch, with the system tracking which trees have already been printed so nothing gets missed or duplicated.

---

## 🚀 Getting Started

For developers or farm owners who want to set this up themselves, just follow our step-by-step guides:
1. 🗄️ **[Database Setup (Google Sheets)](setup/SHEETS_STRUCTURE.md)**
2. 💬 **[LINE OA & LIFF Scanner Configuration](setup/LINE_OA_SETUP.md)**
