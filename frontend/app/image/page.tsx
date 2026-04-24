/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import jsPDF from "jspdf";
import { checkApi, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

export default function ImageDetectionPage() {
  useAuth();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [indicators, setIndicators] = useState<string[]>([]);
  const [error, setError] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setShowResult(false);
    setScore(null);
    setIndicators([]);
    setError("");
  };

  const analyzeImage = async () => {
    if (!imageFile) return;
    setError("");
    setAnalyzing(true);
    setShowResult(false);

    try {
      const data = await checkApi.image(imageFile);
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

  const getResultStyle = (value: number | null) => {
    if (value === null) return { title: "No Analysis Yet", msg: "Upload an image to analyze", bg: "bg-gray-100 dark:bg-gray-700", border: "border-gray-400", icon: <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto" /> };
    if (value >= 80) return { title: "Manipulated / Fake Image", msg: "Strong signs of image manipulation detected", bg: "bg-red-100 dark:bg-red-900/20", border: "border-red-500", icon: <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" /> };
    if (value >= 50) return { title: "Suspicious Image", msg: "Possible manipulation detected", bg: "bg-yellow-100 dark:bg-yellow-900/20", border: "border-yellow-500", icon: <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto" /> };
    return { title: "Clean / Real Image", msg: "No manipulation detected", bg: "bg-green-100 dark:bg-green-900/20", border: "border-green-500", icon: <CheckCircle className="w-16 h-16 text-green-500 mx-auto" /> };
  };

  const result = getResultStyle(score);

  const generatePdfReport = async () => {
    if (!imageFile || score === null) return;
    const pdf = new jsPDF("p", "pt", "a4");
    const margin = 40;
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(22);
    pdf.text("IMAGE ANALYSIS REPORT", margin, 50);
    pdf.setFontSize(12); pdf.setFont("helvetica", "normal");
    pdf.text(`File Name: ${imageFile.name}`, margin, 100);
    pdf.text(`Confidence Score: ${score}%`, margin, 120);
    pdf.text(`Generated At: ${new Date().toLocaleString()}`, margin, 140);
    let y = 180;
    pdf.setFont("helvetica", "bold"); pdf.text("Detection Indicators:", margin, y);
    pdf.setFont("helvetica", "normal");
    indicators.forEach((i) => { y += 18; pdf.text(`• ${i}`, margin, y); });
    pdf.save(`Image_Report_${Date.now()}.pdf`);
  };

  return (
    <div>
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-blue-600 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-6">Image Detection</h1>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/20 border border-red-300 text-red-700 dark:text-red-300 text-sm">{error}</div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* UPLOAD */}
        <div className="bg-white dark:bg-gray-800 border rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Upload Image</h2>

          <label className="cursor-pointer block border-2 border-dashed p-8 rounded-lg text-center">
            {preview ? (
              <img src={preview} className="mx-auto rounded-lg max-h-60" alt="preview" />
            ) : (
              <>
                <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p>Select or drop an image</p>
              </>
            )}
            <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
          </label>

          <button
            disabled={!imageFile || analyzing}
            onClick={analyzeImage}
            className="mt-4 w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold disabled:opacity-50"
          >
            {analyzing ? "Analyzing..." : "Analyze Image"}
          </button>
        </div>

        {/* RESULT */}
        <div className="bg-white dark:bg-gray-800 border rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Result</h2>

          {analyzing && (
            <div className="h-60 flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {showResult && !analyzing && (
            <div className="space-y-6">
              <div className={`p-6 rounded-lg border-2 text-center ${result.bg} ${result.border}`}>
                {result.icon}
                <h3 className="text-2xl font-bold mt-2">{result.title}</h3>
                <p className="text-sm mt-1">{result.msg}</p>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Confidence Score</span>
                  <span className="font-bold">{score}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${score! >= 80 ? "bg-red-500" : score! >= 50 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${score}%` }} />
                </div>
              </div>

              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-bold mb-3">Detection Indicators</h4>
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
          )}

          {!analyzing && !showResult && (
            <div className="h-60 flex items-center justify-center text-gray-400">
              Upload an image to begin analysis
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
