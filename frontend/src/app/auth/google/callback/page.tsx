"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { saveAuth } from "@/lib/auth-store";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function CallbackHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState("");

    useEffect(() => {
        const code = searchParams.get("code");
        if (!code) {
            setError("No authorization code received from Google.");
            return;
        }

        async function exchangeCode(authCode: string) {
            try {
                const res = await fetch(
                    `${API_BASE}/api/auth/google/callback?code=${encodeURIComponent(authCode)}`
                );
                const data = await res.json();

                if (!res.ok) {
                    setError(data.detail || "Google authentication failed.");
                    return;
                }

                // Store token and user info
                saveAuth(data.token, data.user, true);

                // Redirect to dashboard
                router.push("/dashboard");
            } catch {
                setError("Could not connect to the server. Is the backend running?");
            }
        }

        exchangeCode(code);
    }, [searchParams, router]);

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#0d1117",
                color: "#e6edf3",
                fontFamily: "'Syne', sans-serif",
            }}
        >
            {error ? (
                <div
                    style={{
                        textAlign: "center",
                        maxWidth: 420,
                        padding: "40px 32px",
                        borderRadius: 20,
                        background: "#161b22",
                        border: "1px solid #21262d",
                    }}
                >
                    <div style={{ fontSize: "2rem", marginBottom: 16 }}>⚠️</div>
                    <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 12 }}>
                        Authentication Failed
                    </h2>
                    <p
                        style={{
                            color: "#8b949e",
                            fontSize: "0.9rem",
                            fontFamily: "'Space Mono', monospace",
                            lineHeight: 1.6,
                            marginBottom: 24,
                        }}
                    >
                        {error}
                    </p>
                    <button
                        onClick={() => router.push("/login")}
                        style={{
                            padding: "12px 28px",
                            borderRadius: 12,
                            border: "1px solid #39d98a",
                            background: "rgba(57,217,138,0.08)",
                            color: "#39d98a",
                            fontFamily: "'Space Mono', monospace",
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            cursor: "pointer",
                        }}
                    >
                        ← Back to Login
                    </button>
                </div>
            ) : (
                <div style={{ textAlign: "center" }}>
                    <div
                        style={{
                            width: 40,
                            height: 40,
                            border: "3px solid rgba(57,217,138,0.2)",
                            borderTopColor: "#39d98a",
                            borderRadius: "50%",
                            animation: "spin 0.8s linear infinite",
                            margin: "0 auto 20px",
                        }}
                    />
                    <p
                        style={{
                            color: "#8b949e",
                            fontSize: "0.95rem",
                            fontFamily: "'Space Mono', monospace",
                        }}
                    >
                        Signing you in with Google...
                    </p>
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </div>
            )}
        </div>
    );
}

export default function GoogleCallbackPage() {
    return (
        <Suspense
            fallback={
                <div
                    style={{
                        minHeight: "100vh",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#0d1117",
                        color: "#8b949e",
                        fontFamily: "'Space Mono', monospace",
                    }}
                >
                    Loading...
                </div>
            }
        >
            <CallbackHandler />
        </Suspense>
    );
}
