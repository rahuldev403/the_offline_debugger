"use client";

import { useState, useEffect } from "react";
import {
  Play,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Zap,
  Terminal,
  Bug,
  Sparkles,
  Clock,
  Shield,
  Cpu,
  Network,
  HardDrive,
} from "lucide-react";

interface AttemptHistory {
  attempt: number;
  output: string;
  exit_code: number;
  explanation?: string;
  diff?: string;
}

interface DebugResponse {
  final_code: string;
  status: "solved" | "unsolved";
  history: AttemptHistory[];
}

interface SystemHealth {
  status: string;
  docker: string;
  ollama: string;
  docker_image: string;
}

export default function AutoFixAI() {
  const [code, setCode] = useState(`# Example: Code with a bug
print("Starting calculation...")
x = 100
y = 0
result = x / y  # This will cause a ZeroDivisionError
print(f"Result: {result}")`);
  const [maxRetries, setMaxRetries] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<DebugResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<string>("");
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [executionTime, setExecutionTime] = useState<number>(0);

  // Check system health on mount and periodically
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch("http://localhost:8000/health");
        const data = await res.json();
        setSystemHealth(data);
      } catch {
        setSystemHealth(null);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleRepair = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);
    setLoadingState("Initializing Docker sandbox...");
    const startTime = Date.now();
    setExecutionTime(0);

    // Update execution time during loading
    const timeInterval = setInterval(() => {
      setExecutionTime(((Date.now() - startTime) / 1000).toFixed(1) as any);
    }, 100);

    try {
      // Simulate loading states
      const loadingStates = [
        "Initializing Docker sandbox...",
        "Executing code securely (5s timeout)...",
        "AI is analyzing errors...",
        "Consulting Ollama LLM...",
        "Generating fixes...",
      ];

      let stateIndex = 0;
      const stateInterval = setInterval(() => {
        if (stateIndex < loadingStates.length - 1) {
          stateIndex++;
          setLoadingState(loadingStates[stateIndex]);
        }
      }, 1500);

      const res = await fetch("http://localhost:8000/api/debug", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          max_retries: maxRetries,
        }),
      });

      clearInterval(stateInterval);
      clearInterval(timeInterval);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to debug code");
      }

      const data: DebugResponse = await res.json();
      setResponse(data);
      setCode(data.final_code);
      setExecutionTime(((Date.now() - startTime) / 1000).toFixed(1) as any);
    } catch (err) {
      clearInterval(timeInterval);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      clearInterval(timeInterval);
      setIsLoading(false);
      setLoadingState("");
    }
  };

  const renderDiff = (diff: string) => {
    const lines = diff.split("\n");
    return (
      <div className="font-mono text-xs overflow-x-auto">
        {lines.map((line, idx) => {
          let bgColor = "";
          let textColor = "text-slate-300";
          let icon = null;

          if (line.startsWith("+") && !line.startsWith("+++")) {
            bgColor = "bg-green-500/10";
            textColor = "text-green-400";
            icon = <span className="text-green-500 mr-2">+</span>;
          } else if (line.startsWith("-") && !line.startsWith("---")) {
            bgColor = "bg-red-500/10";
            textColor = "text-red-400";
            icon = <span className="text-red-500 mr-2">-</span>;
          } else if (line.startsWith("@@")) {
            textColor = "text-cyan-400";
          } else if (line.startsWith("+++") || line.startsWith("---")) {
            textColor = "text-slate-500";
          }

          return (
            <div
              key={idx}
              className={`${bgColor} ${textColor} px-3 py-1 flex items-start`}
            >
              {icon}
              <span className="whitespace-pre">{line}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono">
      {/* Header */}
      <header className="border-b border-cyan-500/30 bg-slate-900/50 backdrop-blur">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Zap className="w-8 h-8 text-cyan-400" />
              <div className="absolute inset-0 blur-xl bg-cyan-400/30"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
                AutoFix AI
              </h1>
              <p className="text-xs text-slate-400">
                Autonomous Code Repair System
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left Column - Code Editor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-semibold text-slate-200">
                  Code Editor
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Max Retries:</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={maxRetries}
                  onChange={(e) => setMaxRetries(parseInt(e.target.value))}
                  className="w-16 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="relative">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-[500px] bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                placeholder="# Paste your Python code here..."
                spellCheck={false}
              />
              <div className="absolute top-3 right-3 text-xs text-slate-600">
                Python
              </div>
            </div>

            <button
              onClick={handleRepair}
              disabled={isLoading || !code.trim()}
              className="w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-green-600 hover:from-cyan-500 hover:to-green-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing... ({executionTime}s)</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>🚀 Start Debugging</span>
                </>
              )}
            </button>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 font-semibold">Error</p>
                  <p className="text-red-300 text-sm mt-1">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Live Repair Timeline */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bug className="w-5 h-5 text-green-400" />
              <h2 className="text-lg font-semibold text-slate-200">
                Live Repair Timeline
              </h2>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg min-h-[500px] max-h-[700px] overflow-y-auto p-6">
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <div className="relative">
                    <Loader2 className="w-16 h-16 text-cyan-400 animate-spin" />
                    <div className="absolute inset-0 blur-2xl bg-cyan-400/30 animate-pulse"></div>
                  </div>
                  <div className="text-center">
                    <p className="text-cyan-400 text-lg font-semibold animate-pulse">
                      {loadingState}
                    </p>
                    <p className="text-slate-400 text-sm mt-2">
                      Execution Time: {executionTime}s
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}

              {!isLoading && !response && (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <Sparkles className="w-16 h-16 mb-4" />
                  <p className="text-lg">No repairs yet</p>
                  <p className="text-sm mt-2">
                    Paste code and click "Start Autonomous Repair"
                  </p>
                </div>
              )}

              {response && (
                <div className="space-y-6">
                  {/* Timeline */}
                  <div className="relative space-y-8">
                    {/* Vertical line */}
                    <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-cyan-500 via-purple-500 to-green-500"></div>

                    {response.history.map((attempt, idx) => (
                      <div key={idx} className="relative pl-16">
                        {/* Timeline dot */}
                        <div className="absolute left-4 top-2 w-5 h-5 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                        </div>

                        <div className="space-y-3">
                          {/* Attempt Header */}
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-semibold text-slate-300">
                              Attempt {attempt.attempt}
                            </span>
                          </div>

                          {/* Output Log */}
                          <div
                            className={`border rounded-lg overflow-hidden ${
                              attempt.exit_code === 0
                                ? "border-green-500/50 bg-green-500/5"
                                : "border-red-500/50 bg-red-500/5"
                            }`}
                          >
                            <div
                              className={`px-3 py-2 text-xs font-semibold flex items-center gap-2 ${
                                attempt.exit_code === 0
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-red-500/20 text-red-400"
                              }`}
                            >
                              <Terminal className="w-4 h-4" />
                              Output{" "}
                              {attempt.exit_code === 0
                                ? "(Success)"
                                : `(Exit Code: ${attempt.exit_code})`}
                            </div>
                            <div className="p-3 font-mono text-xs text-slate-300 whitespace-pre-wrap">
                              {attempt.output || "(No output)"}
                            </div>
                          </div>

                          {/* AI Insight */}
                          {attempt.explanation && (
                            <div className="border border-purple-500/50 bg-purple-500/5 rounded-lg overflow-hidden">
                              <div className="px-3 py-2 bg-purple-500/20 text-purple-400 text-xs font-semibold flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                💡 AI Diagnosis
                              </div>
                              <div className="p-3 text-sm text-slate-300">
                                {attempt.explanation}
                              </div>
                            </div>
                          )}

                          {/* Diff Patch */}
                          {attempt.diff &&
                            attempt.diff !== "No changes made" && (
                              <div className="border border-cyan-500/50 bg-cyan-500/5 rounded-lg overflow-hidden">
                                <div className="px-3 py-2 bg-cyan-500/20 text-cyan-400 text-xs font-semibold flex items-center gap-2">
                                  <Zap className="w-4 h-4" />
                                  Code Patch
                                </div>
                                <div className="bg-slate-950">
                                  {renderDiff(attempt.diff)}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Final Status */}
                  <div
                    className={`p-6 rounded-lg border-2 ${
                      response.status === "solved"
                        ? "border-green-500 bg-green-500/10"
                        : "border-red-500 bg-red-500/10"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {response.status === "solved" ? (
                        <>
                          <div className="relative">
                            <CheckCircle2 className="w-12 h-12 text-green-400" />
                            <div className="absolute inset-0 blur-xl bg-green-400/50 animate-pulse"></div>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-green-400">
                              Code Fixed Successfully!
                            </h3>
                            <p className="text-sm text-green-300 mt-1">
                              The code now executes without errors.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-12 h-12 text-red-400" />
                          <div>
                            <h3 className="text-xl font-bold text-red-400">
                              Unable to Fix
                            </h3>
                            <p className="text-sm text-red-300 mt-1">
                              Maximum retries reached. Manual intervention may
                              be required.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-12">
        <div className="max-w-[1800px] mx-auto px-6 py-4 text-center text-xs text-slate-500">
          <p>AutoFix AI • Powered by Docker + Ollama + FastAPI</p>
        </div>
      </footer>
    </div>
  );
}
