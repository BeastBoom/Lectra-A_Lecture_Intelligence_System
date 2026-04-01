"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { saveAuth } from "@/lib/auth-store";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const T = {
  dark: { bg: "#0d1117", surface: "#161b22", border: "#21262d", accent: "#39d98a", accentBg: "rgba(57,217,138,0.08)", accentBorder: "rgba(57,217,138,0.3)", text: "#e6edf3", muted: "#8b949e", shadow: "rgba(0,0,0,0.5)" },
  light: { bg: "#f6f8fa", surface: "#ffffff", border: "#d0d7de", accent: "#1a7f4b", accentBg: "rgba(26,127,75,0.08)", accentBorder: "rgba(26,127,75,0.3)", text: "#1c2128", muted: "#57606a", shadow: "rgba(0,0,0,0.1)" },
};
type Th = typeof T.dark;

function getStrength(p: string): { score: number; label: string; color: string } {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[a-z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  const labels = ["", "Weak", "Fair", "Good", "Strong", "Excellent"];
  const colors = ["transparent", "#ef4444", "#f59e0b", "#eab308", "#22c55e", "#39d98a"];
  return { score: s, label: labels[s], color: colors[s] };
}

export default function SignupPage() {
  const router = useRouter();
  const [dark, setDark] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showP, setShowP] = useState(false);
  const [showC, setShowC] = useState(false);
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const t = dark ? T.dark : T.light;
  const strength = useMemo(() => getStrength(pass), [pass]);

  /* ── OAuth ── */
  const oauth = (provider: string) => {
    setBusy(provider); setErr("");
    if (provider === "google") {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";
      const redirectUri = encodeURIComponent("http://localhost:3000/auth/google/callback");
      const scope = encodeURIComponent("email profile");
      window.location.href =
        `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
      return;
    }
    // Other providers — placeholder
    setTimeout(() => {
      setErr(`${provider[0].toUpperCase() + provider.slice(1)} OAuth is not configured yet.`);
      setBusy(null);
    }, 1200);
  };

  /* ── Email submit ── */
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    if (!name || !email || !pass || !confirm) { setErr("Please fill in all fields."); return; }
    if (pass !== confirm) { setErr("Passwords do not match."); return; }
    if (pass.length < 8) { setErr("Password must be at least 8 characters."); return; }
    if (!terms) { setErr("Please accept the terms of service."); return; }
    setBusy("email");
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass, full_name: name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.detail || "Registration failed. Please try again.");
        return;
      }
      // Save token & user info, then go to dashboard
      saveAuth(data.token, data.user, true);
      router.push("/dashboard");
    } catch {
      setErr("Could not connect to the server. Is the backend running?");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <style>{css(t)}</style>
      <div className="ll-page" style={{ background: t.bg }}>
        <div className="ll-blob ll-b1" /><div className="ll-blob ll-b2" />
        <div className="ll-grain" />

        {/* top bar */}
        <div className="ll-topbar">
          <button className="ll-back" onClick={() => router.push("/")}
            style={{ color: t.muted, border: `1px solid ${t.border}`, background: t.surface }}>
            ← Back
          </button>
          <button className="ll-theme-btn" onClick={() => setDark(d => !d)}
            style={{ color: t.muted, border: `1px solid ${t.border}`, background: t.surface }}>
            {dark ? "☀️" : "🌙"}
          </button>
        </div>

        {/* wave decoration */}
        <div className="ll-wave">
          <svg viewBox="0 0 300 120" fill="none">
            <defs>
              <linearGradient id="sg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#39d98a" stopOpacity=".9" /><stop offset="100%" stopColor="#39d98a" stopOpacity="0" /></linearGradient>
              <linearGradient id="sg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a78bfa" stopOpacity=".8" /><stop offset="100%" stopColor="#a78bfa" stopOpacity="0" /></linearGradient>
            </defs>
            {([
              ["M60,110 Q70,20 80,110 Q90,20 100,110", "url(#sg1)", "0s"],
              ["M90,110 Q105,10 120,110 Q135,10 150,110", "url(#sg2)", ".3s"],
              ["M130,110 Q145,30 160,110 Q175,30 190,110", "url(#sg1)", ".6s"],
              ["M170,110 Q182,50 194,110", "url(#sg2)", ".9s"],
            ] as [string, string, string][]).map(([d, stroke, delay], i) => (
              <path key={i} d={d} stroke={stroke} strokeWidth="1.5" fill="none" strokeLinecap="round"
                style={{ strokeDasharray: 300, strokeDashoffset: 300, animation: `llDraw 1.5s ease ${delay} forwards` }} />
            ))}
          </svg>
        </div>

        {/* card */}
        <div className="ll-card"
          style={{ background: dark ? "rgba(22,27,34,.95)" : "rgba(255,255,255,.97)", border: `1px solid ${t.border}`, boxShadow: `0 24px 80px ${t.shadow}` }}>

          <div className="ll-logo" style={{ color: t.accent }}>Lectra</div>
          <h1 className="ll-title" style={{ color: t.text }}>Create Your Account</h1>
          <p className="ll-sub" style={{ color: t.muted }}>Join thousands of learners using AI-powered lecture tools</p>

          {err && <div className="ll-err">{err}</div>}

          {/* OAuth row — sign up with socials */}
          <div className="ll-oauth" style={{ marginBottom: 8 }}>
            {/* Google */}
            <button className="ll-obtn" onClick={() => oauth("google")} disabled={!!busy}
              style={{ background: dark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.04)", border: `1px solid ${t.border}` }} title="Sign up with Google">
              {busy === "google" ? <span className="ll-spin-sm" style={{ borderTopColor: t.accent }} /> : (
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
            </button>

            {/* Apple */}
            <button className="ll-obtn" onClick={() => oauth("apple")} disabled={!!busy}
              style={{ background: dark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.04)", border: `1px solid ${t.border}`, color: t.text }} title="Sign up with Apple">
              {busy === "apple" ? <span className="ll-spin-sm" style={{ borderTopColor: t.accent }} /> : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
              )}
            </button>

            {/* Microsoft */}
            <button className="ll-obtn" onClick={() => oauth("microsoft")} disabled={!!busy}
              style={{ background: dark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.04)", border: `1px solid ${t.border}` }} title="Sign up with Microsoft">
              {busy === "microsoft" ? <span className="ll-spin-sm" style={{ borderTopColor: t.accent }} /> : (
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path d="M11.4 24H0V12.6h11.4V24z" fill="#F1511B" />
                  <path d="M24 24H12.6V12.6H24V24z" fill="#80CC28" />
                  <path d="M11.4 11.4H0V0h11.4v11.4z" fill="#00ADEF" />
                  <path d="M24 11.4H12.6V0H24v11.4z" fill="#FBBC09" />
                </svg>
              )}
            </button>
          </div>

          {/* divider */}
          <div className="ll-divider">
            <div style={{ flex: 1, height: 1, background: t.border }} />
            <span style={{ color: t.muted, fontSize: ".82rem", fontFamily: "monospace", whiteSpace: "nowrap" }}>Or sign up with email</span>
            <div style={{ flex: 1, height: 1, background: t.border }} />
          </div>

          {/* email form */}
          <form onSubmit={submit} className="ll-form">
            {/* Full Name */}
            <div className="ll-field">
              <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)}
                className="ll-input" autoComplete="name"
                style={{ background: dark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)", border: `1px solid ${t.border}`, color: t.text }} />
              <span className="ll-ico">👤</span>
            </div>

            {/* Email */}
            <div className="ll-field">
              <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)}
                className="ll-input" autoComplete="email"
                style={{ background: dark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)", border: `1px solid ${t.border}`, color: t.text }} />
              <span className="ll-ico">✉️</span>
            </div>

            {/* Password */}
            <div className="ll-field">
              <input type={showP ? "text" : "password"} placeholder="Password" value={pass} onChange={e => setPass(e.target.value)}
                className="ll-input" autoComplete="new-password"
                style={{ background: dark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)", border: `1px solid ${t.border}`, color: t.text }} />
              <button type="button" className="ll-ico ll-eye" onClick={() => setShowP(s => !s)}>
                {showP ? "🙈" : "🔒"}
              </button>
            </div>

            {/* Password strength */}
            {pass && (
              <div className="ll-strength-wrap">
                <div className="ll-strength-bar">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="ll-str-seg"
                      style={{ background: i <= strength.score ? strength.color : (dark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)"), transition: "background .3s" }} />
                  ))}
                </div>
                <span className="ll-str-label" style={{ color: strength.color }}>{strength.label}</span>
              </div>
            )}

            {/* Confirm Password */}
            <div className="ll-field">
              <input type={showC ? "text" : "password"} placeholder="Confirm Password" value={confirm} onChange={e => setConfirm(e.target.value)}
                className="ll-input" autoComplete="new-password"
                style={{ background: dark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)", border: `1px solid ${t.border}`, color: t.text }} />
              <button type="button" className="ll-ico ll-eye" onClick={() => setShowC(s => !s)}>
                {showC ? "🙈" : "🔒"}
              </button>
            </div>

            {/* Terms */}
            <label className="ll-terms-label" style={{ color: t.muted }}>
              <div className="ll-chk"
                style={{ border: `1.5px solid ${terms ? t.accent : t.border}`, background: terms ? t.accentBg : "transparent" }}
                onClick={() => setTerms(r => !r)}>
                {terms && <span style={{ color: t.accent, fontSize: ".7rem" }}>✓</span>}
              </div>
              <span>I agree to the{" "}
                <a href="#" style={{ color: t.accent, textDecoration: "none" }}
                  onMouseEnter={e => (e.target as HTMLElement).style.textDecoration = "underline"}
                  onMouseLeave={e => (e.target as HTMLElement).style.textDecoration = "none"}>Terms of Service</a>
                {" "}and{" "}
                <a href="#" style={{ color: t.accent, textDecoration: "none" }}
                  onMouseEnter={e => (e.target as HTMLElement).style.textDecoration = "underline"}
                  onMouseLeave={e => (e.target as HTMLElement).style.textDecoration = "none"}>Privacy Policy</a></span>
            </label>

            <button type="submit" className="ll-continue" disabled={busy === "email"}
              style={{ background: t.accent, color: "#0d1117" }}>
              {busy === "email" ? <span className="ll-spin" /> : "Create Account"}
            </button>
          </form>

          <p className="ll-signup" style={{ color: t.muted }}>
            Already have an account?{" "}
            <a href="/login" onClick={(e) => { e.preventDefault(); router.push("/login"); }}
              style={{ color: t.accent, fontWeight: 700, textDecoration: "none" }}>Sign in</a>
          </p>
        </div>
      </div>
    </>
  );
}

function css(t: Th) {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;700;800&display=swap');

    .ll-page{min-height:100vh;display:flex;align-items:center;justify-content:center;
             position:relative;overflow:hidden;padding:32px 24px;font-family:'Syne',sans-serif;font-size:18px;}
    .ll-grain{position:fixed;inset:0;pointer-events:none;z-index:0;opacity:.02;
      background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      background-size:128px;}
    .ll-blob{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none;animation:llBlob 8s ease-in-out infinite alternate;}
    .ll-b1{width:450px;height:450px;background:rgba(57,217,138,.07);top:-120px;right:-120px;}
    .ll-b2{width:380px;height:380px;background:rgba(124,58,237,.08);bottom:-100px;left:-100px;animation-delay:2s;}
    @keyframes llBlob{from{transform:translate(0,0) scale(1)}to{transform:translate(30px,20px) scale(1.08)}}

    .ll-topbar{position:absolute;top:24px;left:28px;right:28px;display:flex;justify-content:space-between;align-items:center;z-index:10;}
    .ll-back{padding:9px 18px;border-radius:10px;font-family:'Space Mono',monospace;font-size:.82rem;font-weight:700;cursor:pointer;transition:all .2s;}
    .ll-back:hover{opacity:.75;transform:translateX(-2px);}
    .ll-theme-btn{width:38px;height:38px;border-radius:10px;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;transition:all .2s;}
    .ll-theme-btn:hover{transform:scale(1.1);}

    .ll-wave{position:absolute;top:0;left:50%;transform:translateX(-50%);width:340px;height:140px;pointer-events:none;z-index:1;opacity:.9;}
    @keyframes llDraw{to{stroke-dashoffset:0}}

    .ll-card{position:relative;z-index:2;border-radius:28px;padding:48px 48px 40px;width:100%;max-width:500px;
             backdrop-filter:blur(20px);animation:llIn .6s cubic-bezier(.34,1.56,.64,1) both;}
    @keyframes llIn{from{opacity:0;transform:translateY(32px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}

    .ll-logo{font-family:'Syne',sans-serif;font-weight:800;font-size:1.5rem;text-align:center;margin-bottom:14px;letter-spacing:-.02em;}
    .ll-title{font-size:clamp(1.5rem,3.5vw,2rem);font-weight:800;text-align:center;margin-bottom:8px;letter-spacing:-.03em;}
    .ll-sub{font-size:.85rem;text-align:center;margin-bottom:24px;font-family:'Space Mono',monospace;}

    .ll-err{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:#fca5a5;border-radius:12px;
            padding:12px 16px;font-size:.82rem;font-family:'Space Mono',monospace;margin-bottom:16px;line-height:1.5;}

    .ll-form{display:flex;flex-direction:column;gap:14px;}
    .ll-field{position:relative;display:flex;align-items:center;}
    .ll-input{width:100%;padding:15px 52px 15px 20px;border-radius:14px;font-size:.95rem;font-family:'Syne',sans-serif;outline:none;transition:all .25s;}
    .ll-input::placeholder{color:#8b949e;}
    .ll-input:focus{border-color:rgba(57,217,138,.5)!important;box-shadow:0 0 0 3px rgba(57,217,138,.1);}
    .ll-ico{position:absolute;right:16px;font-size:1.1rem;pointer-events:none;}
    .ll-eye{background:none;border:none;cursor:pointer;pointer-events:all;padding:0;display:flex;align-items:center;transition:transform .2s;}
    .ll-eye:hover{transform:scale(1.15);}

    .ll-strength-wrap{display:flex;align-items:center;gap:12px;padding:0 4px;}
    .ll-strength-bar{display:flex;gap:4px;flex:1;}
    .ll-str-seg{height:4px;border-radius:2px;flex:1;}
    .ll-str-label{font-size:.75rem;font-family:'Space Mono',monospace;font-weight:700;min-width:60px;text-align:right;}

    .ll-terms-label{display:flex;align-items:flex-start;gap:10px;font-size:.82rem;cursor:pointer;user-select:none;font-family:'Space Mono',monospace;line-height:1.5;}
    .ll-chk{width:20px;height:20px;border-radius:6px;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0;cursor:pointer;}

    .ll-continue{width:100%;padding:16px;border:none;border-radius:14px;font-family:'Syne',sans-serif;font-size:1.05rem;font-weight:800;
                 cursor:pointer;transition:all .25s;margin-top:4px;display:flex;align-items:center;justify-content:center;}
    .ll-continue:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 28px rgba(57,217,138,.38);filter:brightness(1.05);}
    .ll-continue:disabled{opacity:.7;cursor:not-allowed;}

    .ll-divider{display:flex;align-items:center;gap:14px;margin:20px 0 18px;}

    .ll-oauth{display:flex;gap:14px;justify-content:center;}
    .ll-obtn{width:64px;height:64px;border-radius:16px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .25s;flex-shrink:0;}
    .ll-obtn:hover:not(:disabled){transform:translateY(-4px);box-shadow:0 10px 28px rgba(0,0,0,.25);}
    .ll-obtn:disabled{opacity:.6;cursor:not-allowed;}

    .ll-spin{width:22px;height:22px;border-radius:50%;border:2px solid rgba(13,17,23,.25);border-top-color:#0d1117;animation:llSpin .7s linear infinite;display:inline-block;}
    .ll-spin-sm{width:18px;height:18px;border-radius:50%;border:2px solid rgba(255,255,255,.15);animation:llSpin .7s linear infinite;display:inline-block;}
    @keyframes llSpin{to{transform:rotate(360deg)}}

    .ll-signup{text-align:center;font-size:.88rem;margin-top:20px;font-family:'Space Mono',monospace;}

    @media(max-width:540px){.ll-card{padding:36px 20px 32px;}.ll-title{font-size:1.4rem;}}
  `;
}
