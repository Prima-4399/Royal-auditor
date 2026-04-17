# 🛡️ RoyalGuard AI
**Real-Time Autonomous Audit & Compliance Engine**

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
- **Backend**: FastAPI (Python), SQLite (Persistent).
- **AI**: Deep-reasoning agentic models.

---

## 🌐 Deployment Instructions

This project is a monorepo containing both the `/frontend` and `/backend`.

### 1. Backend Deployment (Render.com)
The backend requires a persistent filesystem to store the SQLite database.
1. Create a **Web Service** on Render.
2. Connect this repository and set **Root Directory** to `backend`.
3. **Build Command**: `pip install -r requirements.txt`
4. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. **Disk**: Under the "Volumes" tab, mount a Persistent Disk at `/app/data`.

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
