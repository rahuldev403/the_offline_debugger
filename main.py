"""
AutoFix AI - FastAPI Backend
A robust backend that executes Python code in a secure Docker sandbox
and uses Ollama LLM to fix errors automatically.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import docker
from docker.errors import ContainerError, ImageNotFound, APIError
import requests
import difflib
import json
import time
import os
from pathlib import Path

app = FastAPI(
    title="AutoFix AI",
    description="Automated Python code debugging using Docker sandbox and LLM",
    version="1.0.0"
)

# CORS Configuration - Allow all origins for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Docker client initialization
try:
    docker_client = docker.from_env()
except Exception as e:
    print(f"Warning: Docker client initialization failed: {e}")
    docker_client = None


# Pydantic Models
class DebugRequest(BaseModel):
    code: str = Field(..., description="Python code to execute and debug")
    max_retries: int = Field(default=3, ge=1, le=10, description="Maximum retry attempts")


class AttemptHistory(BaseModel):
    attempt: int
    output: str
    exit_code: int
    explanation: Optional[str] = None
    diff: Optional[str] = None


class DebugResponse(BaseModel):
    final_code: str
    status: str  # "solved" or "unsolved"
    history: List[AttemptHistory]


def execute_code_in_sandbox(code: str, timeout: int = 5) -> tuple[str, int]:
    """
    Execute Python code in a secure Docker container with file mounting.
    
    Args:
        code: Python code to execute
        timeout: Execution timeout in seconds
        
    Returns:
        Tuple of (output, exit_code)
    """
    if docker_client is None:
        raise HTTPException(
            status_code=503,
            detail="Docker is not available. Please ensure Docker is running."
        )
    
    # Save code to file
    script_path = Path("user_script.py")
    try:
        with open(script_path, "w") as f:
            f.write(code)
    except Exception as e:
        return f"Failed to write script: {str(e)}", 1
    
    container = None
    try:
        # Check if sandbox image exists
        try:
            docker_client.images.get("my-safe-sandbox")
        except ImageNotFound:
            raise HTTPException(
                status_code=404,
                detail="Docker image 'my-safe-sandbox' not found. Please build it first using the provided Dockerfile."
            )
        
        # Get current working directory and mount it
        cwd = os.getcwd()
        
        # Run container with CRITICAL SECURITY CONSTRAINTS
        container = docker_client.containers.run(
            image="my-safe-sandbox",
            command="python /app/user_script.py",
            volumes={cwd: {'bind': '/app', 'mode': 'rw'}},
            mem_limit="128m",           # CRITICAL: Memory limit for security
            network_disabled=True,      # CRITICAL: Network disabled for security
            detach=True,
            remove=False
        )
        
        # Strict 5-second timeout implementation
        try:
            result = container.wait(timeout=timeout)
            logs = container.logs().decode('utf-8')
            exit_code = result.get('StatusCode', 1)
            
            # Cleanup
            container.remove()
            
            return logs, exit_code
            
        except Exception as timeout_ex:
            # Timeout occurred - kill container
            container.kill()
            container.remove()
            return "TIMEOUT ERROR: Execution exceeded 5 seconds. Possible infinite loop detected.", 124
        
    except ImageNotFound:
        return "Docker Error: Image 'my-safe-sandbox' not found. Please build it first.\nRun: docker build -t my-safe-sandbox .", 1
    except APIError as e:
        if container:
            try:
                container.remove(force=True)
            except:
                pass
        return f"Docker API Error: {str(e)}", 1
    except Exception as e:
        if container:
            try:
                container.remove(force=True)
            except:
                pass
        return f"Unexpected error: {str(e)}", 1


def query_ollama_for_fix(code: str, error: str) -> dict:
    """
    Query Ollama LLM to fix the code based on the error with structured JSON output.
    
    Args:
        code: The failing code
        error: The error message
        
    Returns:
        Dict with 'explanation' and 'fixed_code'
    """
    system_prompt = """You are an expert Python debugging assistant. Analyze the code and error, then respond with ONLY a valid JSON object.

Your response MUST be valid JSON with this exact structure:
{
  "explanation": "Single sentence explaining why the bug occurred",
  "fixed_code": "Complete corrected Python code"
}

Do not include markdown, code blocks, or any text outside the JSON object."""

    user_prompt = f"""CODE:
{code}

ERROR:
{error}

Return ONLY the JSON object with explanation and fixed_code."""

    full_prompt = f"{system_prompt}\n\n{user_prompt}"

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3",
                "prompt": full_prompt,
                "stream": False,
                "format": "json"
            },
            timeout=30
        )
        response.raise_for_status()
        
        result = response.json()
        llm_output = result.get("response", "")
        
        # Parse the JSON response from LLM
        try:
            fix_data = json.loads(llm_output)
            explanation = fix_data.get("explanation", "AI provided a fix")
            fixed_code = fix_data.get("fixed_code", code)
            
            # Clean up any markdown that might have slipped through
            fixed_code = fixed_code.strip()
            if fixed_code.startswith("```python"):
                fixed_code = fixed_code[9:]
            if fixed_code.startswith("```"):
                fixed_code = fixed_code[3:]
            if fixed_code.endswith("```"):
                fixed_code = fixed_code[:-3]
            
            return {
                "explanation": explanation.strip(),
                "fixed_code": fixed_code.strip()
            }
            
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            cleaned = llm_output.strip()
            if "```python" in cleaned:
                start = cleaned.find("```python") + 9
                end = cleaned.find("```", start)
                if end > start:
                    cleaned = cleaned[start:end]
            return {
                "explanation": "AI attempted to fix the code",
                "fixed_code": cleaned.strip() if cleaned else code
            }
            
    except requests.exceptions.ConnectionError:
        raise HTTPException(
            status_code=503,
            detail="Cannot connect to Ollama. Please ensure Ollama is running on http://localhost:11434"
        )
    except requests.exceptions.Timeout:
        raise HTTPException(
            status_code=504,
            detail="Ollama request timed out"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error querying Ollama: {str(e)}"
        )


def generate_diff(old_code: str, new_code: str) -> str:
    """
    Generate unified diff between old and new code.
    
    Args:
        old_code: Original code
        new_code: Fixed code
        
    Returns:
        Unified diff string
    """
    old_lines = old_code.splitlines(keepends=True)
    new_lines = new_code.splitlines(keepends=True)
    
    diff = difflib.unified_diff(
        old_lines,
        new_lines,
        fromfile="original.py",
        tofile="fixed.py",
        lineterm=""
    )
    
    return "".join(diff)


@app.post("/api/debug", response_model=DebugResponse)
async def debug_code(request: DebugRequest):
    """
    Main endpoint: Execute Python code in sandbox and auto-fix errors using LLM.
    
    Process:
    1. Execute code in Docker sandbox (5s timeout, 128MB RAM, no network)
    2. If success (exit code 0), return result
    3. If failure, query Ollama LLM for a fix
    4. Generate diff and repeat up to max_retries times
    """
    current_code = request.code
    history: List[AttemptHistory] = []
    
    for attempt in range(1, request.max_retries + 1):
        # Step 1: Execute code in sandbox
        output, exit_code = execute_code_in_sandbox(current_code, timeout=5)
        
        # Step 2: Check if successful
        if exit_code == 0:
            # Success!
            history.append(
                AttemptHistory(
                    attempt=attempt,
                    output=output,
                    exit_code=exit_code,
                    explanation="Code executed successfully",
                    diff=None
                )
            )
            
            return DebugResponse(
                final_code=current_code,
                status="solved",
                history=history
            )
        
        # Step 3: Code failed, query LLM for fix
        fix_result = query_ollama_for_fix(current_code, output)
        explanation = fix_result.get("explanation", "No explanation provided")
        fixed_code = fix_result.get("fixed_code", current_code)
        
        # Step 4: Generate diff
        diff = generate_diff(current_code, fixed_code)
        
        # Step 5: Record attempt in history
        history.append(
            AttemptHistory(
                attempt=attempt,
                output=output,
                exit_code=exit_code,
                explanation=explanation,
                diff=diff if diff.strip() else "No changes made"
            )
        )
        
        # Update code for next iteration
        current_code = fixed_code
    
    # Max retries exhausted
    return DebugResponse(
        final_code=current_code,
        status="unsolved",
        history=history
    )


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "AutoFix AI",
        "status": "running",
        "docker_available": docker_client is not None
    }


@app.get("/health")
async def health_check():
    """Detailed health check for all dependencies"""
    health = {
        "status": "healthy",
        "docker": "offline",
        "ollama": "offline",
        "docker_image": "not_found"
    }
    
    # Check Docker
    try:
        if docker_client:
            docker_client.ping()
            health["docker"] = "online"
            
            # Check if sandbox image exists
            try:
                docker_client.images.get("my-safe-sandbox")
                health["docker_image"] = "ready"
            except ImageNotFound:
                health["docker_image"] = "not_found"
    except Exception:
        health["docker"] = "offline"
    
    # Check Ollama
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=2)
        if response.status_code == 200:
            health["ollama"] = "online"
        else:
            health["ollama"] = "offline"
    except Exception:
        health["ollama"] = "offline"
    
    # Determine overall status
    if health["docker"] == "online" and health["ollama"] == "online" and health["docker_image"] == "ready":
        health["status"] = "healthy"
    else:
        health["status"] = "degraded"
    
    return health


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
