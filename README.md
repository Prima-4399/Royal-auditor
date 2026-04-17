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
- **Backend**: FastAPI (Python), PostgreSQL (Managed Database).
- **Real-time**: Server-Sent Events (SSE) for live streaming.
- **AI**: Deep-reasoning agentic models.
- **Authentication**: Enterprise-grade security patterns.

---

## 🌐 Deployment Instructions

This project is a monorepo containing both the `/frontend` and `/backend`.

### 1. Backend Deployment (Render.com)
The backend requires a PostgreSQL database for production data persistence.

1. **Create PostgreSQL Database** (on Render):
   - Go to Render Dashboard → Create → PostgreSQL
   - Select `Standard` or `Premium` tier
   - Copy the `Internal Database URL` for the backend service
   - Create a backup connection string (PostgreSQL connection string)

2. **Create Web Service** on Render:
   - Click **Create** → **Web Service**
   - Connect this repository and set **Root Directory** to `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables**:
     - `DATABASE_URL`: Your PostgreSQL connection string from step 1
     - `LOG_LEVEL`: `info` (optional)

3. **Database Setup**:
   - The backend automatically runs migrations on startup
   - Tables are created with proper indexes and constraints

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
- PostgreSQL 14+ (local or cloud-based)
- Git

### Environment Setup

1. **Backend Environment Variables**:
   ```bash
   cd backend
   cp .env.example .env
   ```
   
   Add to `.env`:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/royalguard
   DEBUG=True
   LOG_LEVEL=debug
   ```

2. **Frontend Environment Variables**:
   ```bash
   cd frontend
   ```
   
   Add to `.env.local`:
   ```
   VITE_API_URL=http://localhost:8000
   ```

### Setup

1. **Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   # Create database tables (auto-runs on first startup)
   python main.py
   ```
   Backend runs on: `http://localhost:8000`

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend runs on: `http://localhost:5173`

### Testing the Integration
- Navigate to `http://localhost:5173`
- The frontend will connect to the backend at `http://localhost:8000`
- All audit streams, agent traces, and live monitoring will be available

---

## 📋 API Documentation

### Core Endpoints

**Audit Operations**:
- `POST /api/audit/start` - Initiate a new audit cycle
- `GET /api/audit/results` - Retrieve audit results with streaming SSE
- `GET /api/audit/status` - Check current audit status

**Live Monitor**:
- `GET /api/monitor/stream` - Server-Sent Events stream for real-time updates
- `POST /api/monitor/pause` - Pause monitoring
- `POST /api/monitor/resume` - Resume monitoring

**Violations**:
- `GET /api/violations` - List all detected violations
- `POST /api/violations/{id}/resolve` - Mark violation as resolved
- `GET /api/violations/{id}` - Get detailed violation info

**Contracts**:
- `GET /api/contracts` - List all contracts
- `POST /api/contracts` - Add new contract
- `GET /api/contracts/{id}/pdf` - Generate contract PDF

**Governance**:
- `GET /api/governance/status` - Blockchain verification status
- `GET /api/governance/audit-trail` - Complete audit trail

---

## 🏛️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│              Frontend (React + Vite)                │
│  - Live Dashboard  - Agent Trace  - Violation View  │
│  - Governance UI   - Connector Status - Reports     │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│        FastAPI Backend + 8-Agent Pipeline          │
├─────────────────────────────────────────────────────┤
│  • Contract Analyzer   • Payment Validator          │
│  • Violation Detector  • Compliance Checker         │
│  • Governance Engine   • Leakage Calculator         │
│  • Report Generator    • Action Orchestrator        │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│      PostgreSQL Database (Persistent Storage)      │
├─────────────────────────────────────────────────────┤
│  • Contracts  • Payments  • Violations              │
│  • Audit Logs • Governance Records • User Settings  │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 Troubleshooting

### Backend Connection Issues
```bash
# Test database connection
python -c "from backend.main import db; print('DB OK')"

# Check environment variables
env | grep DATABASE_URL
```

### Frontend API Connection
- Ensure `VITE_API_URL` matches your backend URL
- Check browser console for CORS errors
- Verify backend is running: `curl http://localhost:8000/docs`

### PostgreSQL Connection
- Verify credentials: `psql -U user -d royalguard -h localhost`
- Check network connectivity: `telnet localhost 5432`
- For Render: use Internal Database URL from Render dashboard

---

## 📊 Performance Metrics

- **Audit Speed**: <2 seconds for real-time analysis
- **Database Queries**: Optimized with proper indexing
- **SSE Streaming**: <100ms latency for live updates
- **Agent Pipeline**: Parallel processing for 8 agents

---

## 🛡️ Security Considerations

- ✅ Database connection strings stored in environment variables
- ✅ API authentication ready for integration
- ✅ CORS configured for production deployments
- ✅ Audit trails logged for compliance

---

## ⚖️ License
Enterprise Proprietary - RoyalGuard AI Platform.

---

## 📞 Support & Contribution

For issues, questions, or feature requests, please open an issue on the company GitHub repository.

**Last Updated**: April 2026  
**Version**: 1.0.0


