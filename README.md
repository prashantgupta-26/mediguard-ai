# MediGuard AI

> **Smart Medication Safety System**  
> *Powered by MediKiosk*

[![Vercel Deployment](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://vercel.com)
[![Render Deployment](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)](https://render.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 1. Project Overview

**MediGuard AI** is a smart clinical safety platform designed to streamline patient intake, automate prescription OCR analysis, cross-check drug–drug and drug–food interactions, and assemble rapid, audit-ready clinical summaries for doctors.

### Key Capabilities:
- **Smart Patient Intake & OPD Kiosk Mode**: Conversational and form-based intake capturing patient vitals, chief complaints, and past medical history.
- **Multimodal Prescription OCR & Extraction**: Analyzes uploaded prescriptions, laboratory documents, and discharge summaries via Google Gemini AI.
- **Drug–Drug & Drug–Food Interaction Checker**: AI-powered pharmacological safety analysis identifying severe contraindications, interactions, and precautions.
- **Doctor Clinical Summary**: High-density clinical overview condensing patient records, chronic prescriptions, abnormal lab values, and clinical safety alerts for fast doctor review.
- **Chronological Health Timeline**: Interactive timeline tracking patient medical records, diagnostic tests, and clinical encounters.
- **ABDM / FHIR Compliance**: Architecture ready for Ayushman Bharat Digital Mission (ABDM) and FHIR standards.

---

## 2. Tech Stack

- **Frontend**:
  - React 18 (Vite SPA)
  - Tailwind CSS & Google Material Symbols
  - React Router DOM v6
  - Lucide React Icons
- **Backend**:
  - Node.js & Express.js
  - Mongoose / MongoDB
  - Google Gemini API (`@google/generative-ai`)
  - Multer (Multipart file parsing)
  - JSON Web Tokens (JWT) & Bcryptjs
  - Nodemailer (Gmail SMTP for 2FA / OTP verification)
- **Deployment**:
  - Frontend: Vercel (Edge CDN + SPA Rewrites)
  - Backend: Render (Node.js Web Service)
  - Database: MongoDB Atlas (or local MongoDB)

---

## 3. Folder Structure

```text
mediguard-ai/
│
├── frontend/                     # React + Vite Frontend
│   ├── public/                   # Static icons and assets
│   ├── src/
│   │   ├── components/           # Reusable UI cards, headers, modals
│   │   ├── pages/                # Dashboard, DoctorSummary, KioskMode, etc.
│   │   ├── services/             # Centralized API service (api.js)
│   │   ├── App.jsx               # Main router & state management
│   │   └── main.jsx              # React DOM entry point
│   ├── vercel.json               # Vercel SPA routing rewrites
│   ├── .env.example              # Frontend environment variable template
│   ├── .gitignore                # Frontend git exclusions
│   ├── package.json              # Frontend dependencies and scripts
│   └── vite.config.js            # Vite build and dev proxy config
│
├── backend/                      # Node.js + Express Backend
│   ├── src/
│   │   ├── config/               # Database connection (db.js)
│   │   ├── controllers/          # Business logic handlers
│   │   ├── middleware/           # JWT authentication & error handling
│   │   ├── models/               # Mongoose data schemas (User, Document, etc.)
│   │   ├── routes/               # API route definitions
│   │   ├── services/             # Gemini AI & email services
│   │   ├── app.js                # Express app & CORS configuration
│   │   └── server.js             # Server listener & entry point
│   ├── data/                     # Local persistence store (store.json)
│   ├── uploads/                  # Temporary file upload directory (git-ignored)
│   ├── .env.example              # Backend environment variable template
│   ├── .gitignore                # Backend git exclusions
│   └── package.json              # Backend dependencies and scripts
│
├── .env.example                  # Root environment variable template
├── .gitignore                    # Root repository git exclusions
├── package.json                  # Root runner scripts
├── render.yaml                   # Render Blueprint deployment definition
└── README.md                     # Documentation
```

---

## 4. Local Development Setup

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- MongoDB (Local service or free MongoDB Atlas URI)
- Google Gemini API Key ([Google AI Studio](https://aistudio.google.com/))

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/prashantgupta-26/mediguard-ai.git
   cd mediguard-ai
   ```

2. **Install dependencies:**
   ```bash
   # Install backend dependencies
   npm --prefix backend install

   # Install frontend dependencies
   npm --prefix frontend install
   ```

3. **Configure environment variables:**
   ```bash
   # Create backend environment file
   cp backend/.env.example backend/.env

   # Create frontend environment file (optional for local dev)
   cp frontend/.env.example frontend/.env
   ```
   *Edit `backend/.env` with your `MONGODB_URI` and `GEMINI_API_KEY`.*

---

## 5. Environment Variables

### Backend (`backend/.env` or Render Web Service)

| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | Port the backend server binds to | `5000` |
| `NODE_ENV` | Environment mode | `production` or `development` |
| `MONGODB_URI` | MongoDB connection connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key used to sign JWT auth tokens | `<your-secure-random-secret>` |
| `JWT_EXPIRES_IN`| Token lifespan | `7d` |
| `GEMINI_API_KEY`| Google Gemini AI API key | `<your-gemini-key>` |
| `FRONTEND_URL`  | URL of deployed frontend (for CORS security) | `https://your-frontend.vercel.app` |
| `SMTP_HOST`    | Email server host | `smtp.gmail.com` |
| `SMTP_PORT`    | Email server port | `587` |
| `SMTP_USER`    | Email address for OTP emails | `your_email@gmail.com` |
| `SMTP_PASS`    | App password for SMTP account | `<your-app-password>` |
| `EMAIL_FROM`   | From header for sent emails | `"MediGuard AI <your_email@gmail.com>"` |

### Frontend (`frontend/.env` or Vercel Environment Variables)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Base URL of deployed Render backend | `https://mediguard-ai-backend.onrender.com` |

---

## 6. How to Run Frontend

```bash
cd frontend
npm run dev
```
The frontend Vite server will be available at: `http://localhost:5173`

---

## 7. How to Run Backend

```bash
cd backend
npm run dev
```
The backend API server will be available at: `http://localhost:5000`  
Health check endpoint: `http://localhost:5000/health`

---

## 8. How to Deploy Frontend to Vercel

1. Log in to [Vercel](https://vercel.com/) and click **"Add New..." > "Project"**.
2. Import the `prashantgupta-26/mediguard-ai` repository.
3. Configure the Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend` *(Click Edit and select the `frontend` folder)*
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Add Environment Variable:
   - Name: `VITE_API_URL`
   - Value: `https://YOUR-RENDER-BACKEND.onrender.com`
5. Click **Deploy**. Vercel will build the frontend and serve it with automatic SPA routing via `frontend/vercel.json`.

---

## 9. How to Deploy Backend to Render

1. Log in to [Render](https://render.com/) and click **"New +" > "Web Service"**.
2. Connect your GitHub repository `prashantgupta-26/mediguard-ai`.
3. Configure the Service Settings:
   - **Name**: `mediguard-ai-backend`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Health Check Path**: `/health`
4. In **Environment Variables**, add the required variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGODB_URI`: `<your-mongodb-atlas-uri>`
   - `JWT_SECRET`: `<generate-a-strong-random-key>`
   - `GEMINI_API_KEY`: `<your-gemini-api-key>`
   - `FRONTEND_URL`: `https://YOUR-VERCEL-DOMAIN.vercel.app`
   - `SMTP_USER` & `SMTP_PASS`: *(optional for live email OTPs)*
5. Click **Create Web Service**.

*Alternatively, use Render Blueprints by linking the included `render.yaml` file.*

---

## 10. How Frontend Connects to Backend

All HTTP and multipart requests are routed through a centralized client service located in `frontend/src/services/api.js`:

```javascript
// Automatically detects environment
const rawBase = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
export const API_BASE_URL = rawBase ? `${rawBase}/api` : '/api';
```

- **In Local Development**: When `VITE_API_URL` is omitted, the frontend automatically uses the Vite development proxy forwarding `/api/*` to `http://localhost:5000`.
- **In Production (Vercel)**: When `VITE_API_URL` is set, requests target the Render backend at `https://YOUR-BACKEND.onrender.com/api/*`.
- **CORS Protection**: The Render backend verifies incoming `Origin` headers against `FRONTEND_URL`, preventing unauthorized cross-origin requests while preserving local testing access.

---

## 11. Security Notes

- **Zero Secrets in Code**: No API keys, passwords, or JWT secrets are hardcoded in the codebase.
- **Git Exclusions**: All `.env` files, uploads, and node modules are explicitly ignored by `.gitignore`.
- **Frontend Key Protection**: Google Gemini API calls are strictly handled server-side by the backend. The `GEMINI_API_KEY` is never shipped to or exposed in the client bundle.
- **Input Sanitization**: File uploads are processed through MIME-type validation and isolated storage.

---

## License

This project is licensed under the MIT License.
