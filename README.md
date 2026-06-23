# Enterprise Link

> MSME Financial Platform — React + Node.js + PostgreSQL

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Clone & Install

```bash
git clone https://github.com/abosede-a11y/enterprise-link.git
cd enterprise-link
npm run install:all
```

### 2. Configure Environment

```bash
cd server
cp .env.example .env
# Edit .env with your PostgreSQL credentials and SMTP details
```

### 3. Set Up Database

Create a PostgreSQL database:
```sql
CREATE DATABASE enterprise_link;
```

The app auto-creates all tables on first run.

### 4. Run the App

```bash
# From root — runs both client and server
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

---

## 📁 Project Structure

```
enterprise-link/
├── client/          # React frontend
│   └── src/
│       ├── pages/   # LoginPage, DashboardPage, TransactionsPage, etc.
│       ├── components/layout/  # Sidebar, Topbar (AppShell)
│       ├── context/ # AuthContext (JWT auth)
│       └── services/api.js     # Axios instance
│
└── server/          # Node.js + Express backend
    ├── controllers/ # Auth, Profile, FAQ, Transactions, Onboarding, Support
    ├── routes/      # Express routes
    ├── middleware/  # JWT auth, file upload, error handling
    ├── services/    # Email (Nodemailer)
    └── config/db.js # PostgreSQL + schema init
```

## 📋 Features (from User Stories)

| Module | Features |
|--------|---------|
| Auth | Register, Login, Logout, Reset Password |
| Business Profile | View + Edit business info |
| FAQ | Browse by category, Search, Bookmark |
| Transactions | History, Filter, Status tracking, Download PDF/CSV, Print |
| Onboarding | Upload documents, Track progress, Email notification |
| Support | Submit ticket, Monitor status, File attachments |

## 🛠️ Tech Stack

**Frontend:** React 18, React Router v6, React Hook Form, Axios, React Hot Toast

**Backend:** Node.js, Express, PostgreSQL (pg), JWT, bcryptjs, Multer, Nodemailer, PDFKit

## 📦 Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Enterprise Link full implementation"
git remote add origin https://github.com/abosede-a11y/enterprise-link.git
git push -u origin main
```
