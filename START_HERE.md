# 🚀 AutoFix AI - Complete Startup Guide

## ✅ Pre-flight Checklist

Before starting, ensure you have:

- ✅ Docker Desktop running
- ✅ Ollama running with llama3 model (`ollama pull llama3`)
- ✅ Python dependencies installed (already done ✓)
- ✅ Node.js dependencies installed (already done ✓)

---

## 🎯 Quick Start (3 Steps)

### Step 1: Build Docker Sandbox Image

```powershell
# From the root directory (d:\offline_debugger)
docker build -t my-safe-sandbox .
```

### Step 2: Start FastAPI Backend

```powershell
# Option A: Direct Python
py main.py

# Option B: With Uvicorn (recommended for development)
py -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be running at: **http://localhost:8000**

### Step 3: Start Next.js Frontend

```powershell
# Open a NEW terminal window
cd frontend
npm run dev
```

Frontend will be running at: **http://localhost:3000**

---

## 🔍 Verification

### Check Backend Health

Open browser to: http://localhost:8000/health

Should return:

```json
{
  "status": "healthy",
  "docker": true,
  "ollama": true
}
```

### Check Frontend

Open browser to: http://localhost:3000

You should see the cyberpunk-styled dashboard!

---

## 🧪 Test It Out

1. **Go to:** http://localhost:3000
2. **Paste this buggy code:**

```python
x = 10 / 0
print(x)
```

3. **Click:** "Start Autonomous Repair"
4. **Watch:** The AI fix the code in real-time!

---

## 📡 API Reference

### POST /api/debug

Execute and auto-fix Python code.

**Request:**

```json
{
  "code": "print(1/0)",
  "max_retries": 3
}
```

**Response:**

```json
{
  "final_code": "print(1/1)",
  "status": "solved",
  "history": [...]
}
```

---

## 🐛 Troubleshooting

### "Docker image 'my-safe-sandbox' not found"

```powershell
docker build -t my-safe-sandbox .
```

### "Cannot connect to Ollama"

```powershell
# Make sure Ollama is running
ollama serve

# Verify llama3 is available
ollama list
```

### "Cannot connect to backend"

- Ensure FastAPI is running on port 8000
- Check: http://localhost:8000/health

### Frontend won't start

```powershell
cd frontend
npm install
npm run dev
```

---

## 🏗️ Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   Next.js       │────────▶│   FastAPI       │
│   Frontend      │   HTTP  │   Backend       │
│   :3000         │◀────────│   :8000         │
└─────────────────┘         └────────┬────────┘
                                     │
                            ┌────────┴────────┐
                            │                 │
                    ┌───────▼──────┐  ┌──────▼─────┐
                    │   Docker     │  │   Ollama   │
                    │   Sandbox    │  │   LLM      │
                    │   (128MB)    │  │   :11434   │
                    └──────────────┘  └────────────┘
```

---

## 🎨 Features

### Backend (FastAPI)

- ✅ Secure Docker sandbox (128MB RAM, no network)
- ✅ 5-second execution timeout
- ✅ Ollama LLM integration (llama3)
- ✅ Auto-retry with max attempts
- ✅ Unified diff generation
- ✅ CORS enabled for frontend

### Frontend (Next.js)

- ✅ Cyberpunk/VS Code dark theme
- ✅ Real-time execution timeline
- ✅ Syntax-highlighted diffs
- ✅ Loading animations
- ✅ Success/failure indicators
- ✅ JetBrains Mono font

---

## 🏆 Hackathon Ready!

Both frontend and backend are **production-ready** with:

- Clean, documented code
- Error handling
- Security features
- Modern UI/UX
- Complete API integration

Good luck! 🚀
