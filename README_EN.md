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

*   **Workers Can Now Log Their Own Sales — Pending Owner Approval:** Previously only the owner/admin could record a sale. Workers can now enter grade, weight, price, and buyer themselves from the menu, and the entry queues up for the owner to approve before it counts as a real sale. While it's pending, the owner can still cancel it, send it back for the worker to fix, or reject it outright.
*   **Worker Menu Gets a "Record Sale" Button:** The worker menu grew from 3 buttons to 4, so the feature above is one tap away from the home screen instead of needing to type a command.
*   **Fixed Overview/Revenue/Tree-History Pages Showing Blank or Zero Despite Real Data:** On some devices these pages were silently failing to load — no error, nothing. They now load the real numbers correctly, and if something does go wrong in the future, a clear message will show up immediately instead of failing silently like before.
*   **Tree Detail Page Now Shows Full Harvest Progress, Fruit Count and Weight:** Added a summary card showing "harvested X out of Y fruit" with a progress bar for the current season, plus the real total weight (in kg) harvested from that specific tree.

---

## 🕒 Previous Updates

*   **QR Scanning Now Works With Any Camera:** Customers used to hit a frozen screen after scanning a tree tag. Scanning now opens a plain web page that loads instantly — whether it's scanned with the LINE camera or any regular phone camera.
*   **Redesigned Tree Page With Full History:** See every photo of a tree, swipe through them, tap to view full-screen — plus a timeline of that tree's history from the day it was registered through its latest harvest. Customers can now trace where each durian came from on their own.
*   **LINE Menus Always Match Permissions:** Fixes the case where a farm owner opened the chat and got the customer menu, unable to do anything. Changing someone's role now updates their menu automatically the next time they message the bot — no more setting it by hand, one person at a time.
*   **Sale Records Can Finally Be Completed:** Workers used to photograph the scale, tap "photos complete," and get nothing back — the record could never be finished. It now shows the summary card so the request can be submitted for approval as normal.
*   **No More Collisions When Several People Record at Once:** If two workers registered a tree in the same second, they could previously receive the same tree ID, permanently mixing up two trees' yield data. The system now queues these requests and guarantees unique IDs.
*   **Automatic Error Log:** Every system failure is now written to a dedicated sheet with full detail, making root causes far faster to find instead of disappearing silently as they used to.
*   **Fixed Inaccurate Remaining-Yield Counts:** Approving a sale or damage report used to leave the "remaining on tree" figure unchanged, so it drifted further from reality over time. It now updates correctly every time a report is approved.
*   **Real Sales Revenue on the Overview Report:** The LINE "Overview" menu now shows actual sales revenue and total weight sold, replacing the placeholder figures used before.
*   **Full-Screen Photo Viewer:** Tapping a photo in a tree's detail view now opens it full-screen, with swipe/arrow navigation to browse the rest of that tree's photos — no more squinting at tiny thumbnails on mobile.
*   **Upgraded Printable QR Tags:** QR codes are now bigger and sharper, with the tree's name, variety, age, remaining fruit count, and last-recorded date printed right on the tag. Owners can also select multiple trees and print all their tags in one batch, with the system tracking which trees have already been printed so nothing gets missed or duplicated.

---

## 🚀 Getting Started

For developers or farm owners who want to set this up themselves, just follow our step-by-step guides:
1. 🗄️ **[Database Setup (Google Sheets)](setup/SHEETS_STRUCTURE.md)**
2. 💬 **[LINE OA & LIFF Scanner Configuration](setup/LINE_OA_SETUP.md)**
