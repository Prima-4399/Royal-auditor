# 🛡️ RoyalGuard AI
**Real-Time Autonomous Audit & Compliance Engine**

🌐 **[Live Demo](https://royalguard-ai.vercel.app)** • [GitHub](https://github.com/Cognify-Analytics/royalty-auditor) • [Report Issue](https://github.com/Cognify-Analytics/royalty-auditor/issues)

RoyalGuard AI is a high-performance auditing platform designed to detect financial leakage, contractual violations, and compliance risks in real-time. Built for enterprise-scale data monitoring with deep-reasoning AI agents.

![Dashboard Preview](https://via.placeholder.com/1200x600?text=RoyalGuard+AI+Dashboard)

## 🚀 Key Features
- **⚡ Live Monitor**: Real-time auditing stream powered by Server-Sent Events (SSE).
- **🤖 Autonomous Agents**: Multi-agent orchestration for deep legal and financial reasoning.
- **📊 Leakage Analysis**: Automated detection of underpayments and contractual discrepancies.
- **🔗 Enterprise Connectors**: Unified status monitoring for Stripe, ERP, and Banking integrations.
- **📜 Unified Governance**: Integrated blockchain verification for audit finality.

## 🏗️ Technical Stack
- **Frontend**: React, Vite, Tailwind CSS, Framer Motion.
- **Backend**: FastAPI (Python), PostgreSQL (Managed Database).
- **AI**: Deep-reasoning agentic models.
- **Real-time**: Server-Sent Events (SSE) for live data streaming.
- **Authentication**: JWT with role-based access control (RBAC).

---

## 🌐 Deployment Instructions

This project is a monorepo containing both the `/frontend` and `/backend`.

### 1. Backend Deployment (Render.com)
1. Create a **PostgreSQL Database** on Render (use Render's managed PostgreSQL).
2. Create a **Web Service** on Render and connect this repository.
3. Set **Root Directory** to `backend`.
4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. **Environment Variables**:
   - `DATABASE_URL`: Your Render PostgreSQL connection string
   - `STRIPE_SECRET_KEY`: Your Stripe API key
   - `JWT_SECRET`: A strong random secret for authentication

### 2. Frontend Deployment (Vercel)
1. Import this repository into Vercel and set **Root Directory** to `frontend`.
2. **Framework Preset**: Vite.
3. **Environment Variables**:
   - Add `VITE_API_URL`: Set this to your Render backend URL (e.g., `https://royalguard-api.onrender.com`).
4. Click **Deploy**.

---

## 🛠️ Local Development

### Prerequisites
- Python 3.10+
- Node.js 18+

### Setup
1. **Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   python main.py
   ```
2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## ⚖️ License
Enterprise Proprietary - RoyalGuard AI Platform.
