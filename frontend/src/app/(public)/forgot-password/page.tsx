"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const T = {
    dark: { bg: "#0d1117", surface: "#161b22", border: "#21262d", accent: "#39d98a", accentBorder: "rgba(57,217,138,0.3)", text: "#e6edf3", muted: "#8b949e", shadow: "rgba(0,0,0,0.5)" },
    light: { bg: "#f6f8fa", surface: "#ffffff", border: "#d0d7de", accent: "#1a7f4b", accentBorder: "rgba(26,127,75,0.3)", text: "#1c2128", muted: "#57606a", shadow: "rgba(0,0,0,0.1)" },
};
type Th = typeof T.dark;

type Step = "email" | "otp" | "reset" | "done";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [dark, setDark] = useState(true);
    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [pass, setPass] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showP, setShowP] = useState(false);
    const [showC, setShowC] = useState(false);
    const [resetToken, setResetToken] = useState("");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    const t = dark ? T.dark : T.light;

    /* Step 1 — send OTP */
    const sendOtp = async (e: React.FormEvent) => {
        e.preventDefault(); setErr("");
        if (!email) { setErr("Please enter your email address."); return; }
        setBusy(true);
        try {
            const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) { setErr(data.detail || "Something went wrong."); return; }
            setStep("otp");
        } catch { setErr("Could not connect to the server."); } finally { setBusy(false); }
    };

    /* Step 2 — verify OTP */
    const verifyOtp = async (e: React.FormEvent) => {
        e.preventDefault(); setErr("");
        if (!otp || otp.length !== 6) { setErr("Please enter the 6-digit code."); return; }
        setBusy(true);
        try {
            const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp }),
            });
            const data = await res.json();
            if (!res.ok) { setErr(data.detail || "Invalid code."); return; }
            setResetToken(data.token);
            setStep("reset");
        } catch { setErr("Could not connect to the server."); } finally { setBusy(false); }
    };

    /* Step 3 — reset password */
    const resetPassword = async (e: React.FormEvent) => {
        e.preventDefault(); setErr("");
        if (!pass || !confirm) { setErr("Please fill in all fields."); return; }
        if (pass !== confirm) { setErr("Passwords do not match."); return; }
        if (pass.length < 8) { setErr("Password must be at least 8 characters."); return; }
        setBusy(true);
        try {
            const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: resetToken, new_password: pass }),
            });
            const data = await res.json();
            if (!res.ok) { setErr(data.detail || "Failed to reset password."); return; }
            setStep("done");
        } catch { setErr("Could not connect to the server."); } finally { setBusy(false); }
    };

    return (
        <>
            <style>{css(t)}</style>
            <div className="ll-page" style={{ background: t.bg }}>
                <div className="ll-blob ll-b1" /><div className="ll-blob ll-b2" />
                <div className="ll-grain" />

                <div className="ll-topbar">
                    <button className="ll-back" onClick={() => router.push("/login")}
                        style={{ color: t.muted, border: `1px solid ${t.border}`, background: t.surface }}>
                        ← Back to Login
                    </button>
                    <button className="ll-theme-btn" onClick={() => setDark(d => !d)}
                        style={{ color: t.muted, border: `1px solid ${t.border}`, background: t.surface }}>
                        {dark ? "☀️" : "🌙"}
                    </button>
                </div>

                <div className="ll-card"
                    style={{ background: dark ? "rgba(22,27,34,.95)" : "rgba(255,255,255,.97)", border: `1px solid ${t.border}`, boxShadow: `0 24px 80px ${t.shadow}` }}>

                    <div className="ll-logo" style={{ color: t.accent }}>Lectra</div>

                    {/* ── Step indicators ── */}
                    <div className="ll-steps">
                        {["Email", "Verify", "Reset"].map((label, i) => {
                            const stepMap: Step[] = ["email", "otp", "reset"];
                            const current = stepMap.indexOf(step === "done" ? "reset" : step);
                            const isActive = i <= current;
                            return (
                                <div key={label} className="ll-step-item">
                                    <div className="ll-step-circle" style={{
                                        background: isActive ? t.accent : "transparent",
                                        border: `2px solid ${isActive ? t.accent : t.border}`,
                                        color: isActive ? "#0d1117" : t.muted
                                    }}>{i + 1}</div>
                                    <span style={{ color: isActive ? t.text : t.muted, fontSize: ".75rem" }}>{label}</span>
                                </div>
                            );
                        })}
                    </div>

                    {err && <div className="ll-err">{err}</div>}

                    {/* ── Step 1: Email ── */}
                    {step === "email" && (
                        <>
                            <h1 className="ll-title" style={{ color: t.text }}>Forgot Password?</h1>
                            <p className="ll-sub" style={{ color: t.muted }}>
                                Enter your email and we&apos;ll send you a 6-digit verification code.
                            </p>
                            <form onSubmit={sendOtp} className="ll-form">
                                <div className="ll-field">
                                    <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)}
                                        className="ll-input" autoComplete="email"
                                        style={{ background: dark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)", border: `1px solid ${t.border}`, color: t.text }} />
                                    <span className="ll-ico">✉️</span>
                                </div>
                                <button type="submit" className="ll-continue" disabled={busy}
                                    style={{ background: t.accent, color: "#0d1117" }}>
                                    {busy ? <span className="ll-spin" /> : "Send Code"}
                                </button>
                            </form>
                        </>
                    )}

                    {/* ── Step 2: OTP ── */}
                    {step === "otp" && (
                        <>
                            <h1 className="ll-title" style={{ color: t.text }}>Enter Code</h1>
                            <p className="ll-sub" style={{ color: t.muted }}>
                                We sent a 6-digit code to <strong style={{ color: t.text }}>{email}</strong>
                            </p>
                            <form onSubmit={verifyOtp} className="ll-form">
                                <div className="ll-field">
                                    <input type="text" placeholder="000000" value={otp}
                                        onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                        className="ll-input ll-otp-input" maxLength={6} autoComplete="one-time-code"
                                        style={{
                                            background: dark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)", border: `1px solid ${t.border}`, color: t.text,
                                            textAlign: "center", fontSize: "1.8rem", letterSpacing: "12px", fontFamily: "monospace"
                                        }} />
                                </div>
                                <button type="submit" className="ll-continue" disabled={busy}
                                    style={{ background: t.accent, color: "#0d1117" }}>
                                    {busy ? <span className="ll-spin" /> : "Verify Code"}
                                </button>
                                <button type="button" onClick={() => { setOtp(""); setErr(""); sendOtp({ preventDefault: () => { } } as React.FormEvent); }}
                                    className="ll-link" style={{ color: t.muted }}>
                                    Didn&apos;t receive it? Send again
                                </button>
                            </form>
                        </>
                    )}

                    {/* ── Step 3: New Password ── */}
                    {step === "reset" && (
                        <>
                            <h1 className="ll-title" style={{ color: t.text }}>Set New Password</h1>
                            <p className="ll-sub" style={{ color: t.muted }}>Enter your new password below.</p>
                            <form onSubmit={resetPassword} className="ll-form">
                                <div className="ll-field">
                                    <input type={showP ? "text" : "password"} placeholder="New Password" value={pass} onChange={e => setPass(e.target.value)}
                                        className="ll-input" autoComplete="new-password"
                                        style={{ background: dark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)", border: `1px solid ${t.border}`, color: t.text }} />
                                    <button type="button" className="ll-ico ll-eye" onClick={() => setShowP(s => !s)}>
                                        {showP ? "🙈" : "🔒"}
                                    </button>
                                </div>
                                <div className="ll-field">
                                    <input type={showC ? "text" : "password"} placeholder="Confirm Password" value={confirm} onChange={e => setConfirm(e.target.value)}
                                        className="ll-input" autoComplete="new-password"
                                        style={{ background: dark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)", border: `1px solid ${t.border}`, color: t.text }} />
                                    <button type="button" className="ll-ico ll-eye" onClick={() => setShowC(s => !s)}>
                                        {showC ? "🙈" : "🔒"}
                                    </button>
                                </div>
                                <button type="submit" className="ll-continue" disabled={busy}
                                    style={{ background: t.accent, color: "#0d1117" }}>
                                    {busy ? <span className="ll-spin" /> : "Reset Password"}
                                </button>
                            </form>
                        </>
                    )}

                    {/* ── Done ── */}
                    {step === "done" && (
                        <>
                            <div style={{ textAlign: "center", fontSize: "2.5rem", marginBottom: 16 }}>✅</div>
                            <h1 className="ll-title" style={{ color: t.text }}>Password Reset!</h1>
                            <p className="ll-sub" style={{ color: t.muted }}>
                                Your password has been updated. You can now log in with your new password.
                            </p>
                            <button className="ll-continue" onClick={() => router.push("/login")}
                                style={{ background: t.accent, color: "#0d1117" }}>
                                Go to Login
                            </button>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

function css(t: Th) {
    return `
    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;700;800&display=swap');
    .ll-page{min-height:100vh;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;padding:32px 24px;font-family:'Syne',sans-serif;font-size:18px;}
    .ll-grain{position:fixed;inset:0;pointer-events:none;z-index:0;opacity:.02;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:128px;}
    .ll-blob{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none;animation:llBlob 8s ease-in-out infinite alternate;}
    .ll-b1{width:450px;height:450px;background:rgba(57,217,138,.07);top:-120px;right:-120px;}
    .ll-b2{width:380px;height:380px;background:rgba(124,58,237,.08);bottom:-100px;left:-100px;animation-delay:2s;}
    @keyframes llBlob{from{transform:translate(0,0) scale(1)}to{transform:translate(30px,20px) scale(1.08)}}
    .ll-topbar{position:absolute;top:24px;left:28px;right:28px;display:flex;justify-content:space-between;align-items:center;z-index:10;}
    .ll-back{padding:9px 18px;border-radius:10px;font-family:'Space Mono',monospace;font-size:.82rem;font-weight:700;cursor:pointer;transition:all .2s;}
    .ll-back:hover{opacity:.75;transform:translateX(-2px);}
    .ll-theme-btn{width:38px;height:38px;border-radius:10px;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;transition:all .2s;}
    .ll-theme-btn:hover{transform:scale(1.1);}
    .ll-card{position:relative;z-index:2;border-radius:28px;padding:56px 48px 48px;width:100%;max-width:500px;backdrop-filter:blur(20px);animation:llIn .6s cubic-bezier(.34,1.56,.64,1) both;}
    @keyframes llIn{from{opacity:0;transform:translateY(32px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
    .ll-logo{font-family:'Syne',sans-serif;font-weight:800;font-size:1.5rem;text-align:center;margin-bottom:18px;letter-spacing:-.02em;}
    .ll-steps{display:flex;justify-content:center;gap:32px;margin-bottom:28px;}
    .ll-step-item{display:flex;flex-direction:column;align-items:center;gap:6px;}
    .ll-step-circle{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:800;transition:all .3s;}
    .ll-title{font-size:clamp(1.6rem,3.5vw,2.1rem);font-weight:800;text-align:center;margin-bottom:10px;letter-spacing:-.03em;}
    .ll-sub{font-size:.9rem;text-align:center;margin-bottom:24px;font-family:'Space Mono',monospace;line-height:1.6;}
    .ll-err{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:#fca5a5;border-radius:12px;padding:12px 16px;font-size:.82rem;font-family:'Space Mono',monospace;margin-bottom:18px;line-height:1.5;}
    .ll-form{display:flex;flex-direction:column;gap:16px;}
    .ll-field{position:relative;display:flex;align-items:center;}
    .ll-input{width:100%;padding:16px 52px 16px 20px;border-radius:14px;font-size:1rem;font-family:'Syne',sans-serif;outline:none;transition:all .25s;}
    .ll-input::placeholder{color:#8b949e;}
    .ll-input:focus{border-color:rgba(57,217,138,.5)!important;box-shadow:0 0 0 3px rgba(57,217,138,.1);}
    .ll-otp-input{padding:20px!important;}
    .ll-ico{position:absolute;right:16px;font-size:1.1rem;pointer-events:none;}
    .ll-eye{background:none;border:none;cursor:pointer;pointer-events:all;padding:0;display:flex;align-items:center;transition:transform .2s;}
    .ll-eye:hover{transform:scale(1.15);}
    .ll-continue{width:100%;padding:17px;border:none;border-radius:14px;font-family:'Syne',sans-serif;font-size:1.08rem;font-weight:800;cursor:pointer;transition:all .25s;display:flex;align-items:center;justify-content:center;}
    .ll-continue:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 28px rgba(57,217,138,.38);filter:brightness(1.05);}
    .ll-continue:disabled{opacity:.7;cursor:not-allowed;}
    .ll-link{background:none;border:none;cursor:pointer;font-family:'Space Mono',monospace;font-size:.8rem;text-align:center;transition:all .2s;}
    .ll-link:hover{text-decoration:underline;opacity:.8;}
    .ll-spin{width:22px;height:22px;border-radius:50%;border:2px solid rgba(13,17,23,.25);border-top-color:#0d1117;animation:llSpin .7s linear infinite;display:inline-block;}
    @keyframes llSpin{to{transform:rotate(360deg)}}
    @media(max-width:540px){.ll-card{padding:40px 24px 36px;}.ll-title{font-size:1.5rem;}.ll-steps{gap:20px;}}
  `;
}
