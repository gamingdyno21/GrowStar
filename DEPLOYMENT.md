# 🚀 GrowStar - Production Deployment Guide

This guide details the step-by-step process of deploying the **GrowStar** web application to production. GrowStar utilizes a decoupled architecture:
*   **Frontend:** React (Vite) deployed to **Vercel**.
*   **Backend:** Node.js (Express) deployed to **Render**.
*   **Database:** MongoDB Atlas cluster.

---

## 📋 Table of Contents
1. [MongoDB Atlas Setup](#1-mongodb-atlas-setup)
2. [Render Backend Deployment](#2-render-backend-deployment)
3. [Vercel Frontend Deployment](#3-vercel-frontend-deployment)
4. [Environment Variables Reference](#4-environment-variables-reference)
5. [Verification Checklist](#5-verification-checklist)

---

## 1. MongoDB Atlas Setup

GrowStar requires a MongoDB database cluster.

1.  **Create Cluster:** Log into [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free tier (M0) or production cluster.
2.  **Configure Access:**
    *   Go to **Database Access** and create a new database user. Keep the credentials secure.
    *   Go to **Network Access** and add a new IP access rule. For Render, whitelist `0.0.0.0/0` (allow access from anywhere) since Render server IPs are dynamic, or use Render's static outbound IP addresses if you are on a paid plan.
3.  **Get Connection String:**
    *   Click **Connect** on your cluster dashboard.
    *   Select **Drivers** (Node.js).
    *   Copy the connection string (format: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbName>?...`).

---

## 2. Render Backend Deployment

Render is used to host the Express API server.

1.  **Create Web Service:**
    *   Log into [Render](https://render.com/).
    *   Click **New +** and select **Web Service**.
    *   Connect your GitHub repository containing the codebase.
2.  **Configure Service Settings:**
    *   **Name:** `growstar-backend` (or custom name).
    *   **Language:** `Node`.
    *   **Root Directory:** `server` (crucial to separate from client files).
    *   **Build Command:** `npm install`
    *   **Start Command:** `npm start`
    *   **Instance Type:** Free (or select appropriate paid tier).
3.  **Configure Environment Variables:**
    *   Open the **Environment** tab on Render and add the environment variables listed in the [Environment Variables Reference](#4-environment-variables-reference) section.
4.  **Deploy:** Click **Create Web Service**. Wait for the logs to show `Server running on port 5000` and `MongoDB Connected`. Note down your Render service URL (e.g., `https://growstar-backend.onrender.com`).

---

## 3. Vercel Frontend Deployment

Vercel is used to compile, optimize, and host the React SPA static assets.

1.  **Create Project:**
    *   Log into [Vercel](https://vercel.com/).
    *   Click **Add New...** and select **Project**.
    *   Import the same GitHub repository.
2.  **Configure Build & Development Settings:**
    *   **Framework Preset:** `Vite`.
    *   **Root Directory:** `client` (very important!).
    *   **Build Command:** `npm run build`
    *   **Output Directory:** `dist`
3.  **Configure Environment Variables:**
    *   Add `VITE_API_URL` under Environment Variables and set it to your Render backend URL (e.g., `https://growstar-backend.onrender.com`). Do not append a trailing slash.
4.  **Deploy:** Click **Deploy**. Vercel will build the optimized assets and output a deployed URL (e.g., `https://growstar.vercel.app`).

> [!NOTE]
> Client-side routing is handled gracefully via the preset `client/vercel.json` rewrites, ensuring browser refreshes do not trigger 404s.

---

## 4. Environment Variables Reference

### 🟢 Backend (Render Settings)
Configure these inside Render's **Environment** panel.

| Variable Name | Description | Example/Recommendation |
| :--- | :--- | :--- |
| `NODE_ENV` | Mode of operation | `production` |
| `PORT` | Web service listen port | `5000` |
| `MONGO_URI` | MongoDB Connection URL | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for signing web tokens | *Choose a strong cryptographically secure string* |
| `FRONTEND_URL` | CORS whitelisted frontend domain | `https://growstar.vercel.app` (comma-separated for multiples) |
| `EMAIL_USER` | NodeMailer login email | `salunkesourav1224@gmail.com` |
| `EMAIL_PASS` | Google Gmail App Password | `rvihhfdjprdqznpy` |
| `ADMIN_EMAIL` | Default administrator account email | `admin@growstar.com` |
| `ADMIN_PASSWORD` | Default administrator password | *Choose a strong password* |

### 🔵 Frontend (Vercel Settings)
Configure these inside Vercel's **Environment Variables** panel.

| Variable Name | Description | Example/Recommendation |
| :--- | :--- | :--- |
| `VITE_API_URL` | Production Backend base URL | `https://growstar-backend.onrender.com` |
| `REACT_APP_FIREBASE_API_KEY` | Firebase API key | *Optional Firebase configurations if retained* |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | Firebase Domain | *Optional* |
| `REACT_APP_FIREBASE_PROJECT_ID` | Firebase Project ID | *Optional* |

---

## 5. Verification Checklist

After deployments finish:
*   [ ] Access the frontend URL and verify the browser console displays no initial connection errors.
*   [ ] Test Signup: Complete registration using an email OTP. Confirm that the phone number input shows valid badges and successfully maps to `phoneNumber` in Atlas.
*   [ ] Verify the backend server logs display `Received phone: <number>` and `Submitting phone: <number>` on submit.
*   [ ] Test Login: Sign in with the user email and password. Confirm routing to the client dashboard occurs smoothly.
*   [ ] Test Admin Panel: Access `/admin/login` and authenticate with `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Check the inbox and verify ticket resolution functions error-free.
