"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import Editor from "@monaco-editor/react";
import {
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
  Rocket,
  Code2,
  Activity,
  ChevronRight,
  Lightbulb,
  Search,
  FileCode,
} from "lucide-react";

interface AttemptHistory {
  attempt: number;
  output: string;
  exit_code: number;
  explanation?: string;
  diff?: string;
  reasoning?: string; // AI's step-by-step reasoning
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

const steps = [
  { id: 1, label: "Initialize", icon: Shield },
  { id: 2, label: "Execute", icon: Terminal },
  { id: 3, label: "Analyze", icon: Bug },
  { id: 4, label: "Generate Fix", icon: Sparkles },
  { id: 5, label: "Verify", icon: CheckCircle2 },
];

export default function AutoFixAI() {
  const [code, setCode] = useState(`# Example: Code with a bug
print("Starting calculation...")
x = 100
y = 0
result = x / y  # This will cause a ZeroDivisionError
print(f"Result: {result}")`);
  const [originalCode, setOriginalCode] = useState("");
  const [fixedCode, setFixedCode] = useState("");
  const [editorTab, setEditorTab] = useState<"current" | "original" | "fixed">(
    "current"
  );
  const [maxRetries, setMaxRetries] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<DebugResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<string>("");
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [executionTime, setExecutionTime] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [liveHistory, setLiveHistory] = useState<AttemptHistory[]>([]);
  const [finalStatus, setFinalStatus] = useState<"solved" | "unsolved" | null>(
    null
  );
  const headerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // GSAP animations on mount
  useEffect(() => {
    if (headerRef.current) {
      gsap.from(headerRef.current, {
        y: -100,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      });
    }
  }, []);

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
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRepair = async () => {
    // Button pulse animation
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
      });
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);
    setLiveHistory([]);
    setFinalStatus(null);
    setCurrentStep(1);
    setLoadingState("Initializing Docker sandbox...");
    setOriginalCode(code);
    setFixedCode("");
    setEditorTab("current");
    const startTime = Date.now();
    setExecutionTime(0);

    // Start with step 1
    setTimeout(() => setCurrentStep(1), 100);

    const timeInterval = setInterval(() => {
      setExecutionTime(((Date.now() - startTime) / 1000).toFixed(1) as any);
    }, 100);

    try {
      // Use fetch with streaming for real-time updates
      const response = await fetch("http://localhost:8000/api/debug/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          max_retries: maxRetries,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Response body is null");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            try {
              const event = JSON.parse(data);

              if (event.type === "status") {
                setLoadingState(event.message);
                setCurrentStep(event.step);
              } else if (event.type === "attempt") {
                // Add new attempt to live history
                setLiveHistory((prev) => [...prev, event.data]);
              } else if (event.type === "complete") {
                // Final result
                setFixedCode(event.data.final_code);
                setCode(event.data.final_code);
                setFinalStatus(event.data.status);
                setResponse({
                  final_code: event.data.final_code,
                  status: event.data.status,
                  history: [], // History is already in liveHistory
                });
              }
            } catch (e) {
              console.error("Failed to parse event:", e);
            }
          }
        }
      }

      clearInterval(timeInterval);
      setExecutionTime(((Date.now() - startTime) / 1000).toFixed(1) as any);
    } catch (err) {
      clearInterval(timeInterval);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      clearInterval(timeInterval);
      setIsLoading(false);
      setLoadingState("");
      setCurrentStep(0);
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
            bgColor = "bg-emerald-500/10";
            textColor = "text-emerald-400";
            icon = <span className="text-emerald-500 mr-2">+</span>;
          } else if (line.startsWith("-") && !line.startsWith("---")) {
            bgColor = "bg-rose-500/10";
            textColor = "text-rose-400";
            icon = <span className="text-rose-500 mr-2">-</span>;
          } else if (line.startsWith("@@")) {
            textColor = "text-cyan-400";
          } else if (line.startsWith("+++") || line.startsWith("---")) {
            textColor = "text-slate-600";
          }

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.02 }}
              className={`${bgColor} ${textColor} px-3 py-1 flex items-start`}
            >
              {icon}
              <span className="whitespace-pre">{line}</span>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 overflow-hidden">
      {/* Top Navbar - Security Banner + System Status */}
      <motion.header
        ref={headerRef}
        className="border-b border-cyan-500/20 bg-slate-950/95 backdrop-blur-xl z-50 flex-shrink-0"
      >
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Logo + Title */}
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <Zap className="w-7 h-7 text-cyan-400" />
                </motion.div>
                <div className="absolute inset-0 blur-xl bg-cyan-400/30 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
                  AutoFix AI
                </h1>
                <p className="text-xs text-slate-400">
                  Autonomous Code Debugging
                </p>
              </div>
            </motion.div>

            {/* Center: Security Features */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-emerald-500/10 border border-purple-500/20 rounded-lg backdrop-blur-sm"
            >
              <Activity className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-slate-300">
                Security Active
              </span>
              <div className="flex items-center gap-4 ml-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-slate-300">128MB</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-slate-300">No Network</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-slate-300">5s Timeout</span>
                </div>
              </div>
            </motion.div>

            {/* Right: System Status */}
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/50 rounded-lg border border-slate-800">
                <Shield className="w-4 h-4 text-slate-400" />
                <motion.div
                  className={`text-xs font-semibold ${
                    systemHealth?.docker === "online"
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {systemHealth?.docker === "online" ? "● Docker" : "● Docker"}
                </motion.div>
              </div>

              <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/50 rounded-lg border border-slate-800">
                <Cpu className="w-4 h-4 text-slate-400" />
                <motion.div
                  className={`text-xs font-semibold ${
                    systemHealth?.ollama === "online"
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {systemHealth?.ollama === "online" ? "● AI" : "● AI"}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Main Content - Single Page Layout */}
      <main className="flex-1 flex flex-col overflow-hidden px-6 py-4 gap-4">
        {/* Step Flow Indicator - Compact */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;

                  return (
                    <div key={step.id} className="flex items-center">
                      <motion.div
                        className="flex items-center gap-2"
                        animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >
                        <motion.div
                          className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                            isCompleted
                              ? "bg-emerald-500/20 border-emerald-500"
                              : isActive
                              ? "bg-cyan-500/20 border-cyan-500"
                              : "bg-slate-800 border-slate-700"
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 ${
                              isCompleted
                                ? "text-emerald-400"
                                : isActive
                                ? "text-cyan-400"
                                : "text-slate-600"
                            }`}
                          />
                        </motion.div>
                        <span
                          className={`text-xs font-medium ${
                            isCompleted
                              ? "text-emerald-400"
                              : isActive
                              ? "text-cyan-400"
                              : "text-slate-600"
                          }`}
                        >
                          {step.label}
                        </span>
                      </motion.div>
                      {index < steps.length - 1 && (
                        <motion.div
                          className={`w-12 h-0.5 mx-3 ${
                            isCompleted
                              ? "bg-emerald-500"
                              : currentStep > step.id
                              ? "bg-cyan-500"
                              : "bg-slate-700"
                          }`}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: currentStep > step.id ? 1 : 0 }}
                          transition={{ duration: 0.5 }}
                        />
                      )}
                    </div>
                  );
                })}
                <motion.div
                  className="ml-4 text-xs text-slate-400"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {loadingState} • {executionTime}s
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Single Row Layout: Editor + Timeline */}
        <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
          {/* Left: Code Editor */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col overflow-hidden"
          >
            {/* Editor Tabs */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditorTab("current")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors ${
                    editorTab === "current"
                      ? "bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400"
                      : "bg-slate-800/50 text-slate-400 hover:text-slate-300"
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5 inline mr-1" />
                  Current Code
                </button>
                <button
                  onClick={() => setEditorTab("original")}
                  disabled={!originalCode}
                  className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                    editorTab === "original"
                      ? "bg-rose-500/20 text-rose-400 border-b-2 border-rose-400"
                      : "bg-slate-800/50 text-slate-400 hover:text-slate-300"
                  }`}
                >
                  <Bug className="w-3.5 h-3.5 inline mr-1" />
                  Original (Broken)
                </button>
                <button
                  onClick={() => setEditorTab("fixed")}
                  disabled={!fixedCode}
                  className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                    editorTab === "fixed"
                      ? "bg-emerald-500/20 text-emerald-400 border-b-2 border-emerald-400"
                      : "bg-slate-800/50 text-slate-400 hover:text-slate-300"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                  Fixed Code
                </button>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400">Retries:</label>
                <motion.input
                  whileFocus={{ scale: 1.05 }}
                  type="number"
                  min={1}
                  max={10}
                  value={maxRetries}
                  onChange={(e) => setMaxRetries(parseInt(e.target.value))}
                  className="w-16 px-2 py-1 bg-slate-900/50 border border-slate-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Monaco Editor */}
            <motion.div
              whileHover={{ boxShadow: "0 0 20px rgba(34, 211, 238, 0.2)" }}
              className="flex-1 rounded-lg overflow-hidden border border-slate-800 bg-slate-950"
            >
              <Editor
                height="100%"
                defaultLanguage="python"
                value={
                  editorTab === "original"
                    ? originalCode
                    : editorTab === "fixed"
                    ? fixedCode
                    : code
                }
                onChange={(value) => {
                  if (editorTab === "current") {
                    setCode(value || "");
                  }
                }}
                theme="vs-dark"
                options={{
                  fontFamily: "Fira Code, monospace",
                  fontSize: 13,
                  fontLigatures: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  lineNumbers: "on",
                  roundedSelection: true,
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                  smoothScrolling: true,
                  padding: { top: 12, bottom: 12 },
                  formatOnType: true,
                  formatOnPaste: true,
                  autoIndent: "full",
                  tabSize: 4,
                  readOnly: editorTab !== "current",
                }}
              />
            </motion.div>

            {/* Compact Button */}
            <motion.button
              ref={buttonRef}
              onClick={handleRepair}
              disabled={isLoading || !code.trim()}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="mt-3 px-4 py-2 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:via-blue-500 hover:to-purple-500 disabled:from-slate-800 disabled:to-slate-800 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing... ({executionTime}s)</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>Launch Debug</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </motion.button>

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="mt-3 p-3 bg-rose-500/10 border border-rose-500/50 rounded-lg flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-rose-400 font-semibold text-sm">Error</p>
                    <p className="text-rose-300 text-xs mt-0.5">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right: Debug Timeline - Scrollable */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bug className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-semibold text-slate-200">
                  Debug Console
                </h2>
              </div>
              {(response || finalStatus) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-slate-400 flex items-center gap-1"
                >
                  <Clock className="w-3 h-3" />
                  {executionTime}s
                </motion.div>
              )}
            </div>

            <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-lg overflow-y-auto p-4 backdrop-blur-sm">
              <AnimatePresence mode="wait">
                {isLoading && liveHistory.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-full space-y-4"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="relative"
                    >
                      <Loader2 className="w-16 h-16 text-cyan-400" />
                      <div className="absolute inset-0 blur-2xl bg-cyan-400/40 animate-pulse"></div>
                    </motion.div>
                    <div className="text-center">
                      <motion.p
                        className="text-cyan-400 text-base font-semibold"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        {loadingState}
                      </motion.p>
                      <p className="text-slate-400 text-sm mt-2">
                        {executionTime}s
                      </p>
                    </div>
                  </motion.div>
                )}

                {!isLoading && liveHistory.length === 0 && !response && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full text-slate-500"
                  >
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles className="w-16 h-16 mb-4" />
                    </motion.div>
                    <p className="text-base font-medium">Ready to debug</p>
                    <p className="text-xs mt-2 text-center max-w-md text-slate-400">
                      Enter Python code and click &quot;Launch Debug&quot;
                    </p>
                  </motion.div>
                )}

                {(liveHistory.length > 0 || response) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    {/* Timeline */}
                    <div className="relative space-y-6">
                      {/* Vertical gradient line */}
                      <div className="absolute left-3 top-6 bottom-6 w-0.5 bg-gradient-to-b from-cyan-500 via-purple-500 to-emerald-500 rounded-full"></div>

                      {liveHistory.map((attempt, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="relative pl-10"
                        >
                          {/* Timeline dot */}
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: idx * 0.1 + 0.05 }}
                            className="absolute left-1 top-2 w-5 h-5 rounded-full bg-slate-950 border-2 border-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-400/50"
                          >
                            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                          </motion.div>

                          <div className="space-y-2">
                            {/* Attempt Header */}
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-slate-400" />
                              <span className="text-sm font-semibold text-slate-200">
                                Attempt {attempt.attempt}
                              </span>
                            </div>

                            {/* Output Log */}
                            <motion.div
                              whileHover={{ scale: 1.005 }}
                              className={`border rounded-lg overflow-hidden ${
                                attempt.exit_code === 0
                                  ? "border-emerald-500/50 bg-emerald-500/5"
                                  : "border-rose-500/50 bg-rose-500/5"
                              }`}
                            >
                              <div
                                className={`px-3 py-2 text-xs font-semibold flex items-center gap-2 ${
                                  attempt.exit_code === 0
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-rose-500/20 text-rose-400"
                                }`}
                              >
                                <Terminal className="w-3.5 h-3.5" />
                                Output{" "}
                                {attempt.exit_code === 0
                                  ? "(Success)"
                                  : `(Exit: ${attempt.exit_code})`}
                              </div>
                              <div className="p-3 font-mono text-xs text-slate-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                                {attempt.output || "(No output)"}
                              </div>
                            </motion.div>

                            {/* AI Insight */}
                            {attempt.explanation && (
                              <motion.div
                                whileHover={{ scale: 1.005 }}
                                className="border border-purple-500/50 bg-purple-500/5 rounded-lg overflow-hidden"
                              >
                                <div className="px-3 py-2 bg-purple-500/20 text-purple-400 text-xs font-semibold flex items-center gap-2">
                                  <Lightbulb className="w-3.5 h-3.5" />
                                  AI Diagnosis
                                </div>
                                <div className="p-3 text-xs text-slate-300">
                                  {attempt.explanation}
                                </div>
                              </motion.div>
                            )}

                            {/* AI Reasoning Steps */}
                            {attempt.reasoning && (
                              <motion.div
                                whileHover={{ scale: 1.005 }}
                                className="border border-blue-500/50 bg-blue-500/5 rounded-lg overflow-hidden"
                              >
                                <div className="px-3 py-2 bg-blue-500/20 text-blue-400 text-xs font-semibold flex items-center gap-2">
                                  <Search className="w-3.5 h-3.5" />
                                  Iteration-Wise Reasoning
                                </div>
                                <div className="p-3 text-xs text-slate-300 whitespace-pre-wrap">
                                  {attempt.reasoning}
                                </div>
                              </motion.div>
                            )}

                            {/* Diff Patch */}
                            {attempt.diff &&
                              attempt.diff !== "No changes made" && (
                                <motion.div
                                  whileHover={{ scale: 1.005 }}
                                  className="border border-cyan-500/50 bg-cyan-500/5 rounded-lg overflow-hidden"
                                >
                                  <div className="px-3 py-2 bg-cyan-500/20 text-cyan-400 text-xs font-semibold flex items-center gap-2">
                                    <FileCode className="w-3.5 h-3.5" />
                                    Code Patch
                                  </div>
                                  <div className="bg-slate-950/50 max-h-40 overflow-y-auto">
                                    {renderDiff(attempt.diff)}
                                  </div>
                                </motion.div>
                              )}
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Final Status - Compact */}
                    {finalStatus && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: liveHistory.length * 0.1 + 0.2,
                        }}
                        whileHover={{ scale: 1.01 }}
                        className={`p-4 rounded-lg border ${
                          finalStatus === "solved"
                            ? "border-emerald-500 bg-emerald-500/10"
                            : "border-rose-500 bg-rose-500/10"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {finalStatus === "solved" ? (
                            <>
                              <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 0.6 }}
                                className="relative"
                              >
                                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                                <div className="absolute inset-0 blur-xl bg-emerald-400/50 animate-pulse"></div>
                              </motion.div>
                              <div>
                                <h3 className="text-base font-bold text-emerald-400">
                                  🎉 Fixed Successfully!
                                </h3>
                                <p className="text-xs text-emerald-300 mt-1">
                                  Code executes without errors
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-10 h-10 text-rose-400" />
                              <div>
                                <h3 className="text-base font-bold text-rose-400">
                                  Unable to Fix
                                </h3>
                                <p className="text-xs text-rose-300 mt-1">
                                  Max retries reached
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
