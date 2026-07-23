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

*   **Cross-App Login Unblocked:** Resolved a major authentication bottleneck. Users can now seamlessly log into the dashboard via the LINE app on both iOS and Android without being blocked by cross-site tracking security policies.
*   **Map & UI Upgrades:** The Dashboard now accurately renders the interactive Tree Location Map. We also overhauled the data table's underlying click mechanisms, resolving unresponsiveness in action buttons (Edit / QR Code).
*   **Database & Bot Connectivity:** Fortified the submission pipeline to prevent duplicate data entries (double-submissions from slow connections). Additionally, the LINE Rich Menu logic has been fixed to accurately serve the correct interface based on the user's role (Owner vs Worker).

---

## 🚀 Getting Started

For developers or farm owners who want to set this up themselves, just follow our step-by-step guides:
1. 🗄️ **[Database Setup (Google Sheets)](setup/SHEETS_STRUCTURE.md)**
2. 💬 **[LINE OA & LIFF Scanner Configuration](setup/LINE_OA_SETUP.md)**
