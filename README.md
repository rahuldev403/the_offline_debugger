# AutoFix AI - Automated Code Debugger

A FastAPI backend that executes Python code in a secure Docker sandbox and automatically fixes errors using Ollama LLM.

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
      "diff": "--- original.py\n+++ fixed.py\n@@ -1 +1 @@\n-print(1/0)\n+print(1/1)"
    }
  ]
}
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

## 🎯 Hackathon Features

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
