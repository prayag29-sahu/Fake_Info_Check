"use client";
import { useState, useEffect } from "react";
import { getToken, removeToken } from "./auth";

export function useAuth() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setIsLoggedIn(!!getToken());
        setLoading(false);
    }, []);

    const logout = () => {
        removeToken();
        setIsLoggedIn(false);
        window.location.href = "/login";
    };

    return { isLoggedIn, loading, logout };
}
