/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Image as ImgIcon,
  Video,
  Link2,
  FileCheck,
  ChevronRight,
  Play,
  ShieldCheck,
  ScanSearch,
  Bot,
  Fingerprint,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

import { getToken } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  // 🔐 auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = getToken();
    setIsLoggedIn(!!token);
    setChecked(true);
  }, []);

  const handleStart = () => {
    if (!checked) return;
    if (isLoggedIn) router.push("/dashboard");
    else router.push("/login");
  };

  const cardClass =
    "bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all dark:bg-gray-800 dark:border-gray-700";

  const quick = [
    { icon: <FileText />, title: "Text Analysis", href: "/text" },
    { icon: <ImgIcon />, title: "Image Detection", href: "/image" },
    { icon: <Video />, title: "Video Analysis", href: "/video" },
    { icon: <Link2 />, title: "URL Scanner", href: "/url" },
    { icon: <FileCheck />, title: "Document Verify", href: "/document" }, // fixed
  ];


  return (
    <div className="min-h-screen">
      <div className="hidden lg:block">
        {/* HERO SECTION */}
        <section className="py-24 text-center relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">

          {/* SAFE OVERLAY – NO ERROR */}
          <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-blue-300 via-purple-300 to-teal-300 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900"></div>

          <div className="max-w-4xl mx-auto px-6 relative z-10">
            <h1 className="text-5xl font-extrabold mb-6 leading-tight">
              AI-Powered Fake Content &{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600">
                Document Fraud Detection
              </span>
            </h1>

            <p className="text-xl text-gray-700 dark:text-gray-300 mb-10 leading-relaxed">
              A next-generation verification platform that detects manipulated images,
              deepfake videos, fake documents, phishing URLs, and AI-generated text
              using advanced Machine Learning and Forensic Analysis.
            </p>

            <div className="flex gap-4 justify-center">

              {/*  AUTH BUTTON */}
              <button
                onClick={handleStart}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold flex items-center gap-2 shadow-lg"
              >
                Start Verification <ChevronRight className="w-5 h-5" />
              </button>

              <button className="px-8 py-4 rounded-xl bg-white border font-semibold flex items-center gap-2 dark:bg-gray-800 dark:border-gray-700">
                <Play className="w-5 h-5" /> Watch Demo
              </button>
            </div>
          </div>
        </section>

        {/* WHAT WE DETECT */}
        <section className="py-20 max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-14">What Our AI Can Detect</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow hover:shadow-lg transition">
              <ScanSearch className="w-12 h-12 text-blue-600 mb-3" />
              <h3 className="text-xl font-bold mb-2">Fake Images</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Detect AI-generated, photoshopped, and manipulated images with pixel-level forensics.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow hover:shadow-lg transition">
              <Video className="w-12 h-12 text-purple-600 mb-3" />
              <h3 className="text-xl font-bold mb-2">Deepfake Videos</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Identify face swapping, lip-sync issues, motion inconsistencies, and AI video artifacts.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow hover:shadow-lg transition">
              <FileCheck className="w-12 h-12 text-green-600 mb-3" />
              <h3 className="text-xl font-bold mb-2">Fraud Documents</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Verify documents like ID cards, PAN/Aadhaar, invoices, certificates, and legal papers.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow hover:shadow-lg transition">
              <Bot className="w-12 h-12 text-teal-600 mb-3" />
              <h3 className="text-xl font-bold mb-2">AI Text Detection</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Detect fake news, misinformation, AI-generated articles, and biased statements.
              </p>
            </div>

          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-6xl mx-auto px-6">

            <h2 className="text-4xl font-bold text-center mb-14">How Our AI Verification Works</h2>

            <div className="grid lg:grid-cols-3 gap-10">

              <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-md">
                <ShieldCheck className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">1. Upload Content</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Upload text, image, video, document or URL to start the verification process.
                </p>
              </div>

              <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-md">
                <Fingerprint className="w-12 h-12 text-purple-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">2. AI Forensic Analysis</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Our system extracts metadata, pixel patterns, anomalies, deepfake signals & fraud traces.
                </p>
              </div>

              <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-md">
                <CheckCircle className="w-12 h-12 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">3. Authenticity Report</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Get a detailed confidence score, manipulation indicators, threat level & downloadable report.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* QUICK ACCESS MODULES */}
        <section className="py-20 max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-10">
            Start Detecting Fake Content
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quick.map((q, i) => (
              <Link key={i} href={q.href} className={cardClass}>
                <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center mb-4 text-black">
                  {q.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{q.title}</h3>
                <span className="text-blue-600 flex items-center gap-2">
                  Try Now <ChevronRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* TRUSTED BY */}
        {/* <section className="py-20 bg-white dark:bg-gray-800">
        <h2 className="text-3xl font-bold text-center mb-6">Trusted By</h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          Leading companies rely on our fraud detection & deepfake detection solutions.
        </p>

        <div className="flex justify-center flex-wrap gap-10 opacity-80">
          <img src="https://i.imgur.com/fK5DSuV.png" className="h-12" />
          <img src="https://i.imgur.com/c0iW3nT.png" className="h-12" />
          <img src="https://i.imgur.com/7rFDz1X.png" className="h-12" />
          <img src="https://i.imgur.com/6mPZGO0.png" className="h-12" />
        </div>
      </section> */}

        {/* DEEPFAKE HIGHLIGHT */}
        <section className="py-20 max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-14">Deepfake Detection Made Simple</h2>

          <div className="grid lg:grid-cols-2 gap-10">
            <img
              alt="Deepfake detection example"
              src="/2.png"
              width={500}
              className="rounded-2xl shadow-lg"
            />

            <div>
              <h3 className="font-bold text-2xl mb-4">Detect Deepfake Videos with 99% Accuracy</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Our AI analyzes facial movements, lip synchronization, lighting consistency,
                audio alignment, and GAN artifacts to detect deepfake videos with high accuracy.
              </p>

              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-green-600" /> Face-Swap Detection
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-green-600" /> Lip-Sync Verification
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-green-600" /> AI Artifact Analysis
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* DOCUMENT FRAUD SECTION */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-6xl mx-auto px-6">

            <h2 className="text-4xl font-bold text-center mb-14">Document Fraud Detection</h2>

            <div className="grid lg:grid-cols-2 gap-10">
              <img
                alt="img"
                src="1.jpg"
                width={400}
                className="rounded-2xl shadow-lg"
              />

              <div>
                <h3 className="font-bold text-2xl mb-4">Verify Certificates, IDs, Licenses & More</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                  Our document forensics engine scans metadata, signatures, tampering regions,
                  font inconsistencies, stamp forgery and layout mismatches to detect fake documents.
                </p>

                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="text-red-600" /> Signature Forgery Detection
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="text-red-600" /> Metadata Tampering Checks
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="text-red-600" /> Seal / Stamp Validation
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="py-20 max-w-5xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>

          <div className="space-y-6">
            {[
              "How does your AI detect deepfake videos?",
              "Can your platform detect AI-generated text?",
              "What types of documents can be verified?",
              "Is my uploaded data kept private?",
              "How accurate is the fraud detection?",
            ].map((q, i) => (
              <details
                key={i}
                className="p-4 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer"
              >
                <summary className="font-semibold">{q}</summary>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Our system uses advanced ML, metadata analysis, neural forensics and GAN detection
                  models to ensure reliable results.
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-gray-900 text-white py-10">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-10">

            <div>
              <h3 className="font-bold text-xl mb-3">FactChecker AI</h3>
              <p className="text-gray-400">
                AI-powered fake content and fraud detection platform.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Quick Links</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/dashboard">Dashboard</Link></li>
                <li><Link href="/text">Text Analysis</Link></li>
                <li><Link href="/image">Image Detection</Link></li>
                <li><Link href="/video">Video Analysis</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Contact</h4>
              <p className="text-gray-300">support@factchecker.ai</p>
              <p className="text-gray-300">+91 98765 43210</p>
            </div>

          </div>

          <p className="text-center text-gray-500 mt-10">
            © 2025 FactChecker AI. All rights reserved.
          </p>
        </footer>
      </div>

      <div className="lg:hidden block">

        {/* ---------------- MOBILE HERO SECTION ---------------- */}
        <section className="py-14 px-4 text-center bg-gradient-to-b from-blue-100 to-purple-100 dark:from-gray-900 dark:to-gray-800">
          <h1 className="text-3xl font-extrabold leading-snug">
            AI-Powered Fake Content
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              & Document Detection
            </span>
          </h1>

          <p className="text-gray-600 dark:text-gray-300 mt-3 text-sm">
            Scan images, videos, text, URLs & documents instantly.
          </p>

          <div className="flex flex-col gap-3 mt-6 max-w-xs mx-auto">
            <Link
              href="/dashboard"
              className="py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold"
            >
              Start Verification
            </Link>

            <button className="py-3 rounded-xl bg-white border dark:bg-gray-800 dark:border-gray-700">
              <Play className="w-4 h-4 inline-block mr-1" /> Watch Demo
            </button>
          </div>
        </section>

        {/* ---------------- MOBILE WHAT WE DETECT ---------------- */}
        <section className="mt-10 px-4">
          <h2 className="text-xl font-bold mb-4">What We Detect</h2>

          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow flex gap-3">
              <ScanSearch className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="font-semibold">Fake Images</h3>
                <p className="text-xs text-gray-500">AI-generated & edited images detection.</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow flex gap-3">
              <Video className="w-8 h-8 text-purple-600" />
              <div>
                <h3 className="font-semibold">Deepfake Detection</h3>
                <p className="text-xs text-gray-500">Face-swap, lip-sync & motion analysis.</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow flex gap-3">
              <FileCheck className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="font-semibold">Document Fraud</h3>
                <p className="text-xs text-gray-500">Forgery, stamp & metadata checks.</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow flex gap-3">
              <Bot className="w-8 h-8 text-teal-600" />
              <div>
                <h3 className="font-semibold">AI Text Detection</h3>
                <p className="text-xs text-gray-500">Fake news & AI-generated content.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- MOBILE HOW IT WORKS ---------------- */}
        <section className="mt-14 px-4">
          <h2 className="text-xl font-bold mb-4">How It Works</h2>

          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
              <ShieldCheck className="w-8 h-8 text-blue-600 mb-2" />
              <h3 className="font-semibold">1. Upload Content</h3>
              <p className="text-xs text-gray-500">Upload any image, video, URL, or document.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
              <Fingerprint className="w-8 h-8 text-purple-600 mb-2" />
              <h3 className="font-semibold">2. AI Analysis</h3>
              <p className="text-xs text-gray-500">Our AI checks deepfake signals & inconsistencies.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
              <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
              <h3 className="font-semibold">3. Get Report</h3>
              <p className="text-xs text-gray-500">Download PDF with confidence score.</p>
            </div>
          </div>
        </section>

        {/* ---------------- MOBILE QUICK ACCESS ---------------- */}
        <section className="mt-14 px-4">
          <h2 className="text-xl font-bold mb-4">Start Scanning</h2>

          <div className="grid grid-cols-2 gap-4">
            {quick.map((q, i) => (
              <Link
                key={i}
                href={q.href}
                className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-gray-700 flex items-center justify-center mb-2">
                  {q.icon}
                </div>
                <p className="text-sm font-semibold">{q.title}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ---------------- MOBILE DEEPFAKE SECTION ---------------- */}
        <section className="mt-14 px-4">
          <h2 className="text-xl font-bold mb-4">Deepfake Detection</h2>

          <img src="/2.png" className="rounded-xl shadow mb-3" />

          <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
            AI analyzes face movement, lip-sync & lighting mismatches.
          </p>

          <ul className="text-xs space-y-1">
            <li className="flex items-center gap-2"><CheckCircle className="text-green-600" /> Face-Swap Detection</li>
            <li className="flex items-center gap-2"><CheckCircle className="text-green-600" /> Lip-Sync Verification</li>
            <li className="flex items-center gap-2"><CheckCircle className="text-green-600" /> AI Artifact Analysis</li>
          </ul>
        </section>

        {/* ---------------- MOBILE DOCUMENT SECTION ---------------- */}
        <section className="mt-14 px-4">
          <h2 className="text-xl font-bold mb-4">Document Verification</h2>

          <img src="/1.jpg" className="rounded-xl shadow mb-3" />

          <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
            Detect signature forgery, metadata tampering & fake stamps.
          </p>

          <ul className="text-xs space-y-1">
            <li className="flex items-center gap-2"><AlertTriangle className="text-red-600" /> Signature Forgery</li>
            <li className="flex items-center gap-2"><AlertTriangle className="text-red-600" /> Metadata Issues</li>
            <li className="flex items-center gap-2"><AlertTriangle className="text-red-600" /> Stamp Validation</li>
          </ul>
        </section>

        {/* ---------------- MOBILE FAQ ---------------- */}
        <section className="mt-14 px-4">
          <h2 className="text-xl font-bold mb-4">FAQ</h2>

          <div className="space-y-3">
            {[
              "How does your AI detect deepfake videos?",
              "Can the system detect AI text?",
              "What documents can be verified?",
              "Is uploaded data private?",
            ].map((q, i) => (
              <details key={i} className="p-3 rounded-xl bg-white dark:bg-gray-800 border dark:border-gray-700">
                <summary className="font-semibold text-sm">{q}</summary>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">
                  Our machine learning engine performs multi-layer analysis for accuracy.
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ---------------- MOBILE FOOTER ---------------- */}
        <footer className="mt-16 py-6 bg-gray-900 text-white text-center text-xs">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-10">

            <div>
              <h3 className="font-bold text-xl mb-3">FactChecker AI</h3>
              <p className="text-gray-400">
                AI-powered fake content and fraud detection platform.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Quick Links</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/dashboard">Dashboard</Link></li>
                <li><Link href="/text">Text Analysis</Link></li>
                <li><Link href="/image">Image Detection</Link></li>
                <li><Link href="/video">Video Analysis</Link></li>
                <li><Link href="/decument">Document Analysis</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Contact</h4>
              <p className="text-gray-300">support@factchecker.ai</p>
              <p className="text-gray-300">+91 98765 43210</p>
            </div>

          </div>

          <p className="text-center text-gray-500 mt-10">
            © 2025 FactChecker AI. All rights reserved.
          </p>
        </footer>

      </div>


    </div>

  );
}
