"use client";
import React, { useState } from "react";
import Link from "next/link";
import jsPDF from "jspdf";
import { ArrowLeft, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import { checkApi, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

export default function TextAnalysisPage() {
  useAuth();
  const [textInput, setTextInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [indicators, setIndicators] = useState<string[]>([]);
  const [error, setError] = useState("");

  async function analyzeContent() {
    if (!textInput.trim()) return;
    setError("");
    setAnalyzing(true);
    setShowResult(false);

    try {
      const data = await checkApi.text(textInput);
      // confidence from API is 0–1 or 0–100; normalize to 0–100
      const rawScore = data.confidence;
      const finalScore = rawScore <= 1 ? Math.round(rawScore * 100) : Math.round(rawScore);
      setScore(finalScore);
      setIndicators(data.indicators || []);
      setShowResult(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  const getResultStyle = (value: number | null) => {
    if (value === null) return { title: "No Analysis Yet", msg: "Enter text and click analyze", bg: "bg-gray-200 dark:bg-gray-700", border: "border-gray-500", icon: <AlertTriangle className="w-16 h-16 text-gray-500 mx-auto" />, color: "gray" };
    if (value >= 80) return { title: "Fake / Manipulated Content", msg: "Text strongly indicates misinformation", bg: "bg-red-100 dark:bg-red-900/20", border: "border-red-500", icon: <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />, color: "red" };
    if (value >= 50) return { title: "Suspicious Content", msg: "Some signals indicate possible misinformation", bg: "bg-yellow-100 dark:bg-yellow-900/20", border: "border-yellow-500", icon: <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto" />, color: "yellow" };
    return { title: "Clean / Real Content", msg: "No major misinformation detected", bg: "bg-green-100 dark:bg-green-900/20", border: "border-green-500", icon: <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />, color: "green" };
  };

  const result = getResultStyle(score);

  const generatePdfReport = () => {
    if (!textInput || score === null) return;
    const pdf = new jsPDF("p", "pt", "a4");
    const margin = 40;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.text("TEXT ANALYSIS REPORT", margin, 50);
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Result: ${result.title}`, margin, 100);
    pdf.text(`Confidence Score: ${score}%`, margin, 120);
    pdf.text(`Generated At: ${new Date().toLocaleString()}`, margin, 140);
    let y = 180;
    pdf.setFont("helvetica", "bold");
    pdf.text("Detection Indicators:", margin, y);
    pdf.setFont("helvetica", "normal");
    indicators.forEach((i) => { y += 18; pdf.text(`• ${i}`, margin, y); });
    y += 30;
    pdf.text("Input Text:", margin, y);
    pdf.text(textInput, margin, y + 20, { maxWidth: 520 });
    pdf.save(`Text_Report_${Date.now()}.pdf`);
  };

  return (
    <div className="p-2">
      <Link href="/dashboard" className="text-blue-600 mb-6 inline-flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-2">Text Analysis</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">Detect fake news and misinformation in text content</p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* INPUT */}
        <div className="bg-white border rounded-xl p-6 dark:bg-gray-800 dark:border-gray-700">
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Paste text here..."
            className="w-full h-64 p-4 rounded-lg border dark:bg-gray-700"
          />
          <button
            onClick={analyzeContent}
            disabled={!textInput || analyzing}
            className="w-full mt-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold disabled:opacity-50"
          >
            {analyzing ? "Analyzing..." : "Analyze Text"}
          </button>
        </div>

        {/* RESULT */}
        <div className="bg-white border rounded-xl p-6 dark:bg-gray-800 dark:border-gray-700">
          {analyzing ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : showResult ? (
            <div className="space-y-6">
              <div className={`p-6 text-center rounded-lg border-2 ${result.bg} ${result.border}`}>
                {result.icon}
                <h3 className="text-2xl font-bold mt-2">{result.title}</h3>
                <p className="mt-2">{result.msg}</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Confidence Score</span>
                  <span className={`font-bold ${result.color === "red" ? "text-red-600" : result.color === "yellow" ? "text-yellow-600" : "text-green-600"}`}>{score}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${result.color === "red" ? "bg-red-500" : result.color === "yellow" ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${score}%` }} />
                </div>
              </div>

              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-bold mb-2">Detection Indicators</h4>
                <ul className="space-y-2">
                  {indicators.map((i, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-blue-500" />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>

              <button onClick={generatePdfReport} className="w-full py-3 border rounded-lg font-semibold">
                Download PDF Report
              </button>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              Enter text and analyze
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
