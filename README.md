# 🌟 GrowStar

> "Grow Smarter. Invest Stronger."

GrowStar is a premium, secure client portal and administrative dashboard application built for wealth management, financial records tracking, client messaging, and automated investment tracking.

---

## 🎨 Key Features

*   **Premium Brand Design:** Consistent layout utilizing Outfit and Inter fonts, gold star and blue trendline SVG logo accents.
*   **Dual-Verification Secure Signups:**
    *   **Email Verification:** Real Nodemailer SMTP OTP dispatch with casing matching.
    *   **Mobile Validation:** Instant client-side validation for 10-digit Indian mobile numbers.
*   **Client Workspace Portal:**
    *   Dynamic portfolio tracking cards (Total Invested, Current Profit, Portfolio Value).
    *   Interactive support ticket creation and transaction logs.
*   **Admin Management Center:**
    *   Client onboarding list with Pending/Approved/Rejected statuses.
    *   Portfolio and investment management logs.
    *   Interactive support ticket reply and resolution console.
*   **Enterprise Security:**
    *   Secure environment-based seeding.
    *   Dynamic CORS domain white-listing and Helmet security headers.
    *   React Error Boundaries for graceful runtime recovery.

---

## 🛠️ Tech Stack

*   **Frontend:** React (Vite), React Router, Axios, Bootstrap, Bootstrap Icons
*   **Backend:** Node.js, Express, Mongoose (MongoDB Atlas), Nodemailer, Helmet, Cors, Rate-Limiter
*   **Database:** MongoDB Atlas

---

## 📁 Repository Structure

```
├── client/                 # Frontend React SPA
│   ├── src/
│   │   ├── components/     # Reusable design components (cards, loader, headers)
│   │   ├── pages/          # Auth, Client, and Admin pages
│   │   ├── services/       # API call handlers (Auth, Admin, Messages)
│   │   └── App.jsx
│   └── vercel.json         # Vercel SPA routing redirects
├── server/                 # Backend Node/Express API
│   ├── config/             # DB connection settings
│   ├── controllers/        # Auth, Admin, User, and Message controllers
│   ├── models/             # Mongoose schemas (User, Message, ActivityLog)
│   ├── routes/             # API routes definition
│   └── server.js
└── DEPLOYMENT.md           # Production Deployment Guide
```

---

## 🚀 Getting Started

To run the application locally in development:

### 1. Configure Environment Variables
Create a `.env` file under the `server` directory and configure the variables (refer to `DEPLOYMENT.md` for options).

### 2. Install & Start Backend
```bash
cd server
npm install
npm run dev
```

### 3. Install & Start Frontend
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:3000` to interact with the application.

---

## 📄 License
This project is proprietary. All rights reserved.
