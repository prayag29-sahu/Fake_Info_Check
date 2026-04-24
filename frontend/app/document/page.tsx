/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState } from "react";
import Link from "next/link";
import jsPDF from "jspdf";
import { ArrowLeft, FileCheck, AlertTriangle, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { checkApi, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

export default function DocumentPage() {
  useAuth();
  const [docFile, setDocFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [indicators, setIndicators] = useState<string[]>([]);
  const [error, setError] = useState("");

  const handleFileChange = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setDocFile(file);
    setShowResult(false);
    setError("");
    if (file.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  };

  const analyzeDocument = async () => {
    if (!docFile) return;
    setError("");
    setAnalyzing(true);
    setShowResult(false);

    try {
      const data = await checkApi.document(docFile);
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
  };

  const getScoreColor = (v: number | null) => { if (v === null) return "gray"; if (v >= 80) return "red"; if (v >= 50) return "yellow"; return "green"; };

  const getResult = (v: number | null) => {
    if (v === null) return { bg: "bg-gray-200 dark:bg-gray-700", border: "border-gray-500", color: "gray", title: "No Analysis Yet", message: "Upload a document to begin verification", icon: <AlertTriangle className="w-16 h-16 text-gray-500 mx-auto mb-3" /> };
    if (v >= 80) return { bg: "bg-red-100 dark:bg-red-900/20", border: "border-red-500", color: "red", title: "Fake / Manipulated Document", message: "High likelihood of forgery detected", icon: <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-3" /> };
    if (v >= 50) return { bg: "bg-yellow-100 dark:bg-yellow-900/20", border: "border-yellow-500", color: "yellow", title: "Suspicious Document", message: "Possible signs of tampering detected", icon: <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-3" /> };
    return { bg: "bg-green-100 dark:bg-green-900/20", border: "border-green-500", color: "green", title: "Authentic Document", message: "No major signs of manipulation found", icon: <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" /> };
  };

  const result = getResult(score);

  const generatePdfReport = () => {
    if (!docFile) return;
    const pdf = new jsPDF();
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(20);
    pdf.text("DOCUMENT VERIFICATION REPORT", 20, 30);
    pdf.setFontSize(12);
    pdf.text(`File: ${docFile.name}`, 20, 60);
    pdf.text(`Result: ${result.title}`, 20, 80);
    pdf.text(`Confidence Score: ${score}%`, 20, 100);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 120);
    pdf.text("Indicators:", 20, 150);
    let yPos = 170;
    indicators.forEach((item) => { pdf.circle(15, yPos - 3, 2, "F"); pdf.text(item, 25, yPos); yPos += 20; });
    pdf.save(`Document_Report_${Date.now()}.pdf`);
  };

  return (
    <div>
      <Link href="/dashboard" className="text-blue-600 mb-6 inline-flex items-center gap-2 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-2">Document Verify</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">Upload a document to check authenticity</p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/20 border border-red-300 text-red-700 dark:text-red-300 text-sm">{error}</div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* UPLOAD */}
        <div className="bg-white border rounded-xl p-6 dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4">Upload Document</h2>

          <label className="cursor-pointer">
            <div className="border-2 border-dashed rounded-lg p-10 text-center dark:bg-gray-700 dark:border-gray-600">
              {preview ? (
                <img src={preview} alt="Document preview" className="mx-auto mb-4 max-h-60 rounded-lg" />
              ) : docFile ? (
                <FileText className="w-20 h-20 mx-auto mb-4 text-gray-400" />
              ) : (
                <>
                  <FileCheck className="w-20 h-20 mx-auto mb-4 text-gray-400" />
                  <p className="font-medium mb-2">Drag & Drop document</p>
                </>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Supported: PDF, JPG, PNG</p>
              <input type="file" accept=".pdf,image/*" onChange={handleFileChange} className="hidden" />
              <button className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold">Choose File</button>
            </div>
          </label>

          <button
            onClick={analyzeDocument}
            disabled={!docFile || analyzing}
            className="w-full mt-4 px-6 py-3 rounded-lg bg-gradient-to-r from-green-600 to-teal-500 text-white font-semibold disabled:opacity-50"
          >
            {analyzing ? "Analyzing..." : "Analyze Document"}
          </button>
        </div>

        {/* RESULT */}
        <div className="bg-white border rounded-xl p-6 dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4">Detection Result</h2>

          {!docFile && !analyzing && !showResult && (
            <div className="flex items-center justify-center h-64 text-gray-400">
              Upload a document to start analysis
            </div>
          )}

          {analyzing && (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Analyzing document...</p>
            </div>
          )}

          {showResult && !analyzing && score !== null && (
            <div className="space-y-6">
              <div className={`text-center p-6 rounded-lg border-2 ${result.bg} ${result.border}`}>
                {result.icon}
                <h3 className={`text-2xl font-bold ${result.color === "red" ? "text-red-600 dark:text-red-400" : result.color === "yellow" ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"}`}>{result.title}</h3>
                <p className={`mt-2 ${result.color === "red" ? "text-red-700 dark:text-red-300" : result.color === "yellow" ? "text-yellow-700 dark:text-yellow-300" : "text-green-700 dark:text-green-300"}`}>{result.message}</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Authenticity Score</span>
                  <span className={`font-bold ${getScoreColor(score) === "red" ? "text-red-600" : getScoreColor(score) === "yellow" ? "text-yellow-600" : "text-green-600"}`}>{score}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${getScoreColor(score) === "red" ? "bg-red-500" : getScoreColor(score) === "yellow" ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${score}%` }} />
                </div>
              </div>

              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-bold mb-3">Detection Indicators:</h4>
                <ul className="space-y-2">
                  {indicators.map((indicator, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <AlertCircle className={`w-4 h-4 ${getScoreColor(score) === "red" ? "text-red-500" : getScoreColor(score) === "yellow" ? "text-yellow-500" : "text-green-500"}`} />
                      <span className="text-sm">{indicator}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button onClick={generatePdfReport} className="w-full px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700">
                Download Detailed Report (PDF)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
