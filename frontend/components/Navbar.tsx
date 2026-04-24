
"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
    Shield,
    ChevronRight,
    Menu,
    X,
    FileText,
    Image as ImgIcon,
    Video,
    Link2,
    FileCheck,
    Home,
    History,
    User,
    LayoutDashboard
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
    const [open, setOpen] = useState(false);

    const navItems = [
        { id: "Home", href: "/", icon: <Home className="w-5 h-5" />, label: "Home" },
        { id: "dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard" },
        { id: "text", href: "/text", icon: <FileText className="w-5 h-5" />, label: "Text Analysis" },
        { id: "image", href: "/image", icon: <ImgIcon className="w-5 h-5" />, label: "Image Detection" },
        { id: "video", href: "/video", icon: <Video className="w-5 h-5" />, label: "Video Analysis" },
        { id: "url", href: "/url", icon: <Link2 className="w-5 h-5" />, label: "URL Scanner" },
        { id: "document", href: "/document", icon: <FileCheck className="w-5 h-5" />, label: "Document Verify" },
        { id: "history", href: "/history", icon: <History className="w-5 h-5" />, label: "Scan History" },
        { id: "profile", href: "/profile", icon: <User className="w-5 h-5" />, label: "Profile" },
    ];

    return (
        <>
            {/* -----------------------------------------------------
                    DESKTOP VERSION (lg and up)
               ----------------------------------------------------- */}
            <div className="hidden lg:block">
                <nav className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b dark:border-gray-800">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

                        <div className="flex items-center gap-3">
                            {/* MENU BUTTON */}
                            <button
                                title="open sidebar"
                                className="p-2 -ml-20 mr-20 rounded-md border dark:border-gray-700 dark:bg-gray-800 bg-gray-100"
                                onClick={() => setOpen(true)}
                            >
                                <Menu className="w-6 h-6" />
                            </button>

                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-white" />
                            </div>

                            <div>
                                <Link href="/" className="text-lg font-bold">FactChecker AI</Link>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Fake Content Detection
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-10">
                            <ThemeToggle />
                            <Link
                                href="/dashboard"
                                className="px-5 py-2.5 rounded-md bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold flex items-center gap-2"
                            >
                                Start Verification <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </nav>

                {/* DESKTOP SIDEBAR */}
                {open && <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setOpen(false)} />}

                <aside
                    className={`
                    fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 z-50
                    transform transition-transform duration-300 ease-in-out
                    ${open ? "translate-x-0" : "-translate-x-full"}
                `}
                >
                    <button
                        title="open sidebar"
                        className="absolute top-4 right-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-700"
                        onClick={() => setOpen(false)}
                    >
                        <X className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                    </button>

                    <div className="p-6 mt-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <div className="font-bold text-lg">FactChecker AI</div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Detection System
                                </p>
                            </div>
                        </div>

                        <nav className="space-y-2">
                            {navItems.map((item) => (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    onClick={() => setOpen(false)}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </Link>
                            ))}
                        </nav>
                    </div>
                </aside>
            </div>

            {/* -----------------------------------------------------
                    MOBILE + ANDROID VERSION (below lg)
               ----------------------------------------------------- */}
            <div className="lg:hidden block">

                {/* MOBILE NAVBAR */}
                <nav className="sticky top-0 z-40 px-4 py-3 flex justify-between items-center bg-white dark:bg-gray-900 border-b dark:border-gray-800">
                    <button
                        title="open sidebar"
                        className="p-2 rounded-md bg-gray-200 dark:bg-gray-700"
                        onClick={() => setOpen(true)}
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <h1 className="text-xl font-bold">FactChecker AI</h1>

                    <ThemeToggle />
                </nav>

                {/* MOBILE SIDEBAR */}
                {open && (
                    <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setOpen(false)} />
                )}

                <aside
                    className={`fixed top-0 left-0 h-full w-60 bg-white dark:bg-gray-800 shadow-lg z-50
                    transform transition-transform duration-300 ease-in-out
                    ${open ? "translate-x-0" : "-translate-x-full"}`}
                >
                    <button
                        title="open sidebar"
                        className="absolute top-4 right-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-700"
                        onClick={() => setOpen(false)}
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="p-6 mt-10">
                        <nav className="space-y-3">
                            {navItems.map((item) => (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    onClick={() => setOpen(false)}
                                    className="flex gap-3 px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    {item.icon}
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </aside>
            </div>
        </>
    );
}
