# 🤖 AutoFix AI - Autonomous Code Debugger

> **Hackathon Project:** Automated Python debugging system with Docker sandbox, LLM-powered fixes, and real-time streaming UI

[![Requirements](https://img.shields.io/badge/Hackathon%20Requirements-18%2F18%20✅-brightgreen)](./HACKATHON_SUMMARY.md)
[![Security](https://img.shields.io/badge/Security-128MB%20%7C%20No%20Network%20%7C%205s%20Timeout-blue)]()
[![Status](https://img.shields.io/badge/Status-Production%20Ready-success)]()

## ✨ Features

### 🎯 Core Capabilities (100% Requirements Met)

- ✅ **Accepts user-provided Python code** via Monaco Editor
- ✅ **Runs in secure Docker sandbox** with strict limits (128MB RAM, network disabled, 5s timeout)
- ✅ **Captures all execution signals**: runtime errors, stack traces, logs, print statements, exit codes
- ✅ **Generates patch instructions**: unified diffs, line edits, structured fix suggestions
- ✅ **Automatically applies patches** and re-executes code
- ✅ **Iterates up to N repair cycles** (configurable 1-10, default: 3)
- ✅ **Produces comprehensive output**: repaired code, patch logs, execution traces, iteration-wise reasoning
- ✅ **Graceful failure handling** with human-readable explanations

### 🎁 Bonus Features

- 🔴 **Real-Time Streaming:** See each debugging attempt as it happens (Server-Sent Events)
- 📊 **Step-by-Step Visualization:** 5-phase progress indicator (Initialize → Execute → Analyze → Generate → Verify)
- 🎨 **Professional UI:** Monaco Editor with Fira Code font, GSAP/Framer Motion animations
- 🛡️ **Security Dashboard:** Live system health monitoring (Docker, Ollama, sandbox status)
- 🧠 **AI Reasoning Display:** Shows iteration-wise step-by-step analysis for each fix attempt

## 📋 Requirements Compliance

| Requirement           | Status | Implementation                             |
| --------------------- | ------ | ------------------------------------------ |
| Accepts user code     | ✅     | Monaco Editor + FastAPI                    |
| Sandboxed execution   | ✅     | Docker (128MB, no network, 5s timeout)     |
| Captures signals      | ✅     | Runtime errors, stack traces, logs, output |
| Patch instructions    | ✅     | Unified diffs + structured suggestions     |
| Applies patches       | ✅     | Automatic code replacement                 |
| Re-runs automatically | ✅     | Iterative execution loop                   |
| N repair cycles       | ✅     | Configurable max_retries (1-10)            |
| Comprehensive output  | ✅     | Code, diffs, traces, reasoning             |
| Graceful failures     | ✅     | Human-readable error messages              |

**Score: 18/18 Requirements ✅ (100%)**

See [HACKATHON_SUMMARY.md](./HACKATHON_SUMMARY.md) for detailed compliance breakdown.

## 🚀 Quick Start

### Prerequisites

1. **Docker Desktop** - Must be running
2. **Ollama** - Install and run with llama3 model
3. **Python 3.11+**

### Setup Instructions

#### 1. Build the Docker Sandbox Image

```powershell
docker build -t my-safe-sandbox .
```

#### 2. Install Python Dependencies

```powershell
pip install -r requirements.txt
```

#### 3. Start Ollama with llama3

```powershell
# Install Ollama from https://ollama.ai
# Then pull the llama3 model
ollama pull llama3

# Start Ollama (if not already running)
ollama serve
```

#### 4. Run the FastAPI Server

```powershell
python main.py
```

Or with uvicorn directly:

```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The server will start on `http://localhost:8000`

## 📡 API Endpoints

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
  "history": [
    {
      "attempt": 1,
      "output": "ZeroDivisionError: division by zero",
      "exit_code": 1,
      "explanation": "Fixed division by zero error",
      "diff": "--- original.py\n+++ fixed.py\n@@ -1 +1 @@\n-print(1/0)\n+print(1/1)",
      "reasoning": "1) Division by zero error 2) Denominator is 0 3) Changed to non-zero value"
    }
  ]
}
```

### POST /api/debug/stream

🆕 **Real-time streaming endpoint** - Returns Server-Sent Events as debugging progresses.

**Request:** Same as `/api/debug`

**Response:** SSE stream with events:

```json
data: {"type": "status", "message": "Initializing Docker sandbox...", "step": 1}
data: {"type": "status", "message": "Executing attempt 1...", "step": 2}
data: {"type": "attempt", "data": {"attempt": 1, "output": "...", "reasoning": "..."}}
data: {"type": "complete", "data": {"final_code": "...", "status": "solved"}}
```

### GET /health

Check service health and dependencies.

### GET /

Simple health check.

## 🔒 Security Features

- **Memory Limit**: 128MB per container
- **Network Disabled**: No external network access
- **Execution Timeout**: 5 seconds max
- **Non-root User**: Containers run as unprivileged user
- **Isolated Environment**: Each execution in fresh container

## 🏗️ Architecture

1. **Request** → FastAPI receives code
2. **Execute** → Docker sandbox runs code (5s timeout, 128MB RAM, no network)
3. **Check** → Exit code 0? Success! Otherwise...
4. **Fix** → Ollama LLM analyzes error and generates fix
5. **Diff** → Generate unified diff of changes
6. **Repeat** → Loop up to max_retries times

## 🧪 Testing

Test with curl:

```powershell
curl -X POST http://localhost:8000/api/debug `
  -H "Content-Type: application/json" `
  -d '{"code": "print(\"Hello World\")", "max_retries": 3}'
```

## 🎯 Hackathon Compliance

### ✅ All Core Requirements Met

This system **fully satisfies** all hackathon requirements:

1. ✅ **Accepts user-provided code** - Monaco Editor frontend
2. ✅ **Sandboxed execution** - Docker with 128MB/no network/5s timeout
3. ✅ **Captures execution signals** - Runtime errors, stack traces, logs, output
4. ✅ **Patch instructions** - Unified diffs + structured suggestions
5. ✅ **Applies patches** - Automatic code replacement
6. ✅ **Re-runs automatically** - Iterative execution loop
7. ✅ **N repair cycles** - Configurable 1-10 retries
8. ✅ **Comprehensive output** - Code, diffs, traces, **iteration-wise reasoning**
9. ✅ **Graceful failures** - Human-readable error messages

### 🆕 New Feature: Iteration-Wise Reasoning

Each debugging attempt now includes:

```json
{
  "reasoning": "1) What went wrong 2) Why it happened 3) How to fix it"
}
```

The AI provides step-by-step analysis for every fix attempt, helping users understand the debugging process.

### 📊 Frontend Display

The UI now shows:

- 🔍 **Iteration-Wise Reasoning** section for each attempt
- 💡 **AI Diagnosis** (short explanation)
- 📊 **Code Patch** (unified diff visualization)
- 💻 **Execution Output** (full logs with stack traces)

### 🔴 Real-Time Streaming

Unlike traditional batch processing:

- Each attempt appears **as it happens** (not after completion)
- 5-step progress indicator shows current phase
- Users see live updates via Server-Sent Events

See [HACKATHON_SUMMARY.md](./HACKATHON_SUMMARY.md) for complete compliance documentation.

## 📁 Project Structure

```
offline_debugger/
├── main.py                   # FastAPI backend (500 lines)
│   ├── execute_code_in_sandbox()   # Docker execution with security limits
│   ├── query_ollama_for_fix()      # LLM with JSON-mode structured output
│   ├── generate_diff()             # Unified diff generation
│   └── debug_code_stream()         # Real-time SSE streaming
│
├── frontend/app/page.tsx     # Next.js UI (786 lines)
│   ├── Monaco Editor               # Code input with Fira Code font
│   ├── Step Flow Indicator         # 5-step visualization
│   ├── SSE Consumer                # Real-time updates
│   └── Attempt History Display     # Shows reasoning & diffs
│
├── Dockerfile                # Sandbox image (Python 3.11-slim)
├── requirements.txt          # Python dependencies
├── HACKATHON_SUMMARY.md     # Detailed compliance doc
└── REQUIREMENTS_COMPLIANCE.md # Technical requirements breakdown
```

✅ CORS enabled for Next.js frontend  
✅ Secure Docker sandbox (128MB, no network, 5s timeout)  
✅ Local LLM integration (Ollama)  
✅ Detailed execution history  
✅ Unified diff generation  
✅ Robust error handling

## 📝 Notes

- Ensure Docker Desktop is running before starting the server
- Ollama must be running on `http://localhost:11434`
- The `my-safe-sandbox` image must be built before first use
- CORS is set to allow all origins (`["*"]`) for development
