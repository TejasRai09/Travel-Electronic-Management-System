<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# NFO Travel Approval Portal

> Internal Employee Travel Management System for Zuari Industries

A full-stack travel request and approval management system with hierarchical workflow, AI-powered assistance, and multi-role access.

## 🏗️ Project Structure

```
nfo-approval-portal/
├── frontend/              # React + TypeScript frontend
│   ├── src/
│   │   ├── components/    # All React components
│   │   ├── services/      # API service layer
│   │   ├── assets/        # Images, fonts, etc.
│   │   ├── App.tsx        # Main app with auth routing
│   │   ├── DashboardApp.tsx  # Dashboard container
│   │   ├── types.ts       # TypeScript type definitions
│   │   └── index.tsx      # React entry point
│   ├── public/            # Static assets
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/               # Node.js + Express + MongoDB backend
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── models.ts      # Mongoose schemas
│   │   ├── index.ts       # Express server entry
│   │   └── ...            # Other backend modules
│   ├── 1.pdf              # Travel policy PDF for AI
│   ├── Book20.xlsx        # Employee master data
│   ├── package.json
│   └── tsconfig.json
│
├── package.json           # Root commands (npm start)
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (local or cloud instance)

### One-Command Setup & Run

```bash
# Install all dependencies (frontend + backend)
npm run setup

# Start both frontend and backend servers
npm start
```

**That's it!** The application will be available at:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8787

## 📦 Available Scripts

### Main Commands (run from root)

| Command | Description |
|---------|-------------|
| `npm start` | **Start both frontend and backend** |
| `npm run setup` | Install dependencies for all packages |
| `npm run build:all` | Build both frontend and backend |
| `npm run seed` | Import employees from Excel file |
| `npm run create:poc` | Create POC user (poc@adventz.com / poc123456) |
| `npm run create:vendor` | Create vendor user (vendor@zuari.com / Vendor@123) |

### Frontend/Backend Specific (npm run dev:frontend / npm run dev:backend)

## 🔧 Configuration

### Environment Variables

Create `.env` file in the **backend/** directory:

```env
MONGODB_URI=mongodb://localhost:27017/TravelDesk
JWT_SECRET=your-secret-key-here
GEMINI_API_KEY=your-gemini-api-key

# Email (Optional - defaults to console logging)
EMAIL_MODE=console
SMTP_HOST=smtp.office365.com
SMTP_USER=your-email@company.com
SMTP_PASS=your-password

CORS_ORIGIN=http://localhost:3000
```

### Initial Setup

1. **Install:** `npm run setup`
2. **Import Employees:** `npm run seed` (uses backend/Book20.xlsx)
3. **Create Users:** `npm run create:poc` and `npm run create:vendor`
4. **Start:** `npm start`

## 👥 User Roles

| Role | Description | Access |
|------|-------------|--------|
| **Employee** | Create & track travel requests | Dashboard, Requests, Profile |
| **Manager** | Approve subordinate requests | Approval Queue, Multi-level Chain |
| **POC** | Final approval & editing | All Requests, Edit Mode |
| **Vendor** | Process approved requests | Ticket Upload, Chat |

## ✨ Key Features

- ⛓️ **Hierarchical Approval Chain** - Multi-level manager approvals based on impact
- 🤖 **AI Assistant** - Gemini-powered form filling & policy expert
- 💬 **Real-time Chat** - Employee ↔ Manager ↔ POC ↔ Vendor
- 📎 **File Attachments** - Upload tickets, documents
- 📊 **PDF Export** - Professional travel request documents
- 🔔 **Notifications** - Email & in-app alerts
- 🌐 **Multi-city Support** - Complex itinerary planning

## 🛠️ Technology Stack

**Frontend:** React 19 • TypeScript • Vite • TailwindCSS • Lucide Icons  
**Backend:** Node.js • Express • MongoDB • Mongoose • JWT Auth  
**AI:** Google Gemini AI • PDF Parsing  
**DevOps:** Concurrently • TSX • Nodemailer

## 🔐 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| POC | poc@adventz.com | poc123456 |
| Vendor | vendor@zuari.com | Vendor@123 |

## 📄 License

Internal use only - Zuari Industries Limited

---

© 2026 Zuari Industries Limited. All rights reserved.
