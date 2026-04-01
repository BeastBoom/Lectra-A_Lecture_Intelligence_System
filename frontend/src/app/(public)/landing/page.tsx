"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/* ─── Theme tokens ─────────────────────────────────────────────────────────── */
const T = {
  dark: {
    bg: "#0d1117", surface: "#161b22", border: "#21262d",
    accent: "#39d98a", accentBg: "rgba(57,217,138,0.08)",
    accentBorder: "rgba(57,217,138,0.30)", accentGlow: "rgba(57,217,138,0.18)",
    text: "#e6edf3", muted: "#8b949e", shadow: "rgba(0,0,0,0.45)",
  },
  light: {
    bg: "#f6f8fa", surface: "#ffffff", border: "#d0d7de",
    accent: "#1a7f4b", accentBg: "rgba(26,127,75,0.08)",
    accentBorder: "rgba(26,127,75,0.30)", accentGlow: "rgba(26,127,75,0.14)",
    text: "#1c2128", muted: "#57606a", shadow: "rgba(0,0,0,0.08)",
  },
};
type Th = typeof T.dark;

/* ─── Static data ──────────────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: "Features",    id: "features"  },
  { label: "How It Works",id: "pipeline"  },
  { label: "Tech Stack",  id: "tech"      },
  { label: "About",       id: "cta"       },
];

const STEPS = [
  { icon: "⬆️", label: "1. Upload",     desc: "Upload lecture audio"    },
  { icon: "🔊", label: "2. Denoise",    desc: "FFmpeg noise removal"     },
  { icon: "🎙️", label: "3. Transcribe", desc: "STT converts to text"    },
  { icon: "🧠", label: "4. Filter",     desc: "LLM extracts key content" },
  { icon: "📚", label: "5. Generate",   desc: "Notes, quizzes & cards"   },
];

const PROBLEMS = [
  { icon: "🎙️", title: "Poor Audio Quality",   desc: "Classroom recordings suffer from background noise, humming fans, fluctuating mic levels, and faint voices that make lectures nearly impossible to follow." },
  { icon: "💬", title: "Information Overload",  desc: "Lectures are filled with off-topic tangents, informal discussions, and irrelevant content that buries the exam-critical material students actually need." },
  { icon: "✋", title: "Manual Revision Effort",desc: "Students spend hours manually transcribing and summarizing recordings instead of focusing on understanding — an inefficient process with no AI assistance." },
];

const FEATURES = [
  { icon: "🔇", title: "Noise Reduction",    desc: "FFmpeg & Python audio libraries preprocess raw classroom audio, removing noise and normalizing sound levels." },
  { icon: "📝", title: "Auto Transcription", desc: "Pretrained Speech-to-Text models convert refined audio into accurate, readable lecture transcripts."          },
  { icon: "🧠", title: "Smart Filtering",    desc: "LLM intelligently filters irrelevant content, keeping only syllabus-relevant and meaningful material."        },
  { icon: "📖", title: "Structured Notes",   desc: "AI-generated organized notes formatted for easy study and review, structured by topic and importance."        },
  { icon: "🃏", title: "Auto Flashcards",    desc: "Key concepts automatically extracted and turned into revision flashcards for effective memorization."          },
  { icon: "❓", title: "Exam-Ready Quizzes", desc: "Automatically generated quizzes based on lecture content to test understanding and exam readiness."            },
];

const TECH = ["React.js","Tailwind CSS","Python","FastAPI","PostgreSQL","MongoDB","FFmpeg","LLM Models","STT Models"];

const OUTPUT_ROWS = [
  { label: "Structured Notes", pct: 92 },
  { label: "Flashcards (24)",  pct: 78 },
  { label: "Quiz Questions",   pct: 65 },
  { label: "Summary",          pct: 100},
];

/* ─── Page ─────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const router = useRouter();
  const [dark, setDark]   = useState(true);
  const [step, setStep]   = useState(0);
  const [sy,   setSy]     = useState(0);
  const [vis,  setVis]    = useState<Record<string,boolean>>({});
  const refs = useRef<Record<string,HTMLElement>>({});

  const t = dark ? T.dark : T.light;
  const v = (id: string) => !!vis[id];

  /* pipeline pulse */
  useEffect(() => {
    const id = setInterval(() => setStep(s => (s+1) % 5), 1400);
    return () => clearInterval(id);
  }, []);

  /* nav shadow on scroll */
  useEffect(() => {
    const fn = () => setSy(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* intersection observer — repeat on every scroll */
  useEffect(() => {
    const obs = new IntersectionObserver(entries =>
      entries.forEach(e => {
        const id = (e.target as HTMLElement).dataset.aid;
        if (id) setVis(p => ({ ...p, [id]: e.isIntersecting }));
      }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    Object.values(refs.current).forEach(r => r && obs.observe(r));
    return () => obs.disconnect();
  }, []);

  const ref = (id: string) => (el: HTMLElement | null) => {
    if (el) { el.dataset.aid = id; refs.current[id] = el; }
  };
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  /* hover helpers */
  const cardHover = {
    onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
      Object.assign(e.currentTarget.style, { borderColor: t.accent, transform: "translateY(-6px) scale(1.02)", boxShadow: `0 16px 48px ${t.accentGlow}` });
    },
    onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
      Object.assign(e.currentTarget.style, { borderColor: t.border, transform: "translateY(0) scale(1)", boxShadow: "none" });
    },
  };
  const pillHover = {
    onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
      Object.assign(e.currentTarget.style, { borderColor: t.accent, color: t.accent, background: t.accentBg, transform: "translateY(-4px)" });
    },
    onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
      Object.assign(e.currentTarget.style, { borderColor: t.border, color: t.muted, background: t.surface, transform: "translateY(0)" });
    },
  };

  /* animation style helpers */
  const fadeIn = (visible: boolean): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(40px)",
    transition: "opacity .65s ease, transform .65s ease",
  });
  const cardAnim = (visible: boolean, delay: number): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0) scale(1)" : "translateY(28px) scale(0.97)",
    transition: `opacity .5s ease ${delay}s, transform .5s ease ${delay}s, border-color .25s, box-shadow .25s`,
  });

  return (
    <>
      <style>{styles(t, dark)}</style>
      <div className="lp-grain" />
      <div className="lp-root" style={{ background: t.bg, color: t.text }}>

        {/* ── NAV ──────────────────────────────────────────────────────── */}
        <nav style={{
          background: dark ? "rgba(13,17,23,0.92)" : "rgba(255,255,255,0.92)",
          borderBottom: `1px solid ${t.border}`,
          backdropFilter: "blur(16px)",
          boxShadow: sy > 60 ? `0 4px 32px ${t.shadow}` : "none",
        }}>
          <div className="lp-logo" style={{ color: t.accent }} onClick={scrollTop}>Lectra</div>

          <ul className="lp-navlinks">
            {NAV_LINKS.map(({ label, id }) => (
              <li key={id}>
                <a href="#" style={{ color: t.muted }}
                  onClick={e => { e.preventDefault(); scrollTo(id); }}
                  onMouseEnter={e => (e.target as HTMLElement).style.color = t.accent}
                  onMouseLeave={e => (e.target as HTMLElement).style.color = t.muted}
                >{label}</a>
              </li>
            ))}
          </ul>

          <div className="lp-nav-right">
            <button className="lp-theme-btn"
              style={{ background: dark ? "rgba(57,217,138,0.1)" : "rgba(0,0,0,0.07)", border: `1px solid ${t.border}`, color: t.text }}
              onClick={() => setDark(d => !d)}>
              {dark ? "☀️ Light" : "🌙 Dark"}
            </button>
            <button className="lp-login-btn"
              style={{ background: t.accent, color: "#0d1117" }}
              onClick={() => router.push("/login")}>
              Login
            </button>
          </div>
        </nav>

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section className="lp-hero">
          <div className="lp-hero-glow" style={{ background: `radial-gradient(ellipse 700px 500px at 65% 50%, ${t.accentBg}, transparent)` }} />

          <div className="lp-hero-content">
            <div className="lp-badge lp-fi1" style={{ border: `1px solid ${t.accentBorder}`, background: t.accentBg, color: t.accent }}>
              <span className="lp-dot" style={{ background: t.accent }} />
              Deeptech · AI-Powered Learning 
            </div>

            <h1 className="lp-h1 lp-fi2" style={{ color: t.text }}>
              Turn Classroom Chaos<br />
              <span style={{ color: t.accent }}>into Academic Clarity</span>
            </h1>

            <p className="lp-sub lp-fi3" style={{ color: t.muted }}>
              Lectra converts noisy classroom audio into structured notes, flashcards,
              and exam-ready summaries — fully automated with AI.
            </p>

            <div className="lp-hero-btns lp-fi4">
              <button className="lp-btn-primary"
                style={{ border: `1px solid ${t.accent}`, background: t.accentBg, color: t.accent }}
                onClick={() => scrollTo("features")}>
                Explore Features →
              </button>
              <button className="lp-btn-ghost"
                style={{ border: `1px solid ${t.border}`, color: t.muted, background: "transparent" }}
                onClick={() => scrollTo("pipeline")}>
                How It Works ▶
              </button>
            </div>

            <div className="lp-stats lp-fi5">
              {[["Audio → Text","STT Models"],["Noise Removal","FFmpeg"],["AI Summaries","LLM Powered"]].map(([val,lbl],i) => (
                <div key={val} className="lp-stat" style={{ borderRight: i < 2 ? `1px solid ${t.border}` : "none" }}>
                  <div className="lp-stat-val" style={{ color: t.accent }}>{val}</div>
                  <div className="lp-stat-lbl" style={{ color: t.muted }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero visual */}
          <div className="lp-hero-visual lp-fi3">
            {/* Waveform card */}
            <div style={{ position: "relative", marginBottom: 40 }}>
              <div className="lp-float-badge lp-fb-top" style={{ background: t.surface, border: `1px solid ${t.accentBorder}`, color: t.accent }}>
                🔇 Noise Removed
              </div>
              <div className="lp-vis-card" style={{ background: t.surface, border: `1px solid ${t.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#ef4444", animation: "lpPulse 2s infinite", flexShrink: 0 }} />
                  <span style={{ color: t.accent, fontSize: "0.78rem", fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.08em" }}>LIVE PROCESSING</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 3, height: 56 }}>
                  {Array.from({ length: 28 }).map((_, i) => (
                    <div key={i} style={{ flex: 1, borderRadius: 3, minHeight: 4, background: `linear-gradient(180deg,${t.accent},${dark?"#7c3aed":"#6d28d9"})`, animation: "lpWave .9s ease-in-out infinite alternate", animationDelay: `${i * 0.06}s` }} />
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, fontSize: "0.72rem", fontFamily: "monospace", color: t.muted }}>
                  <span>lecture_recording.mp3</span>
                  <span style={{ color: t.accent }}>→ Processing</span>
                </div>
              </div>
            </div>

            {/* Output card */}
            <div style={{ position: "relative" }}>
              <div className="lp-float-badge lp-fb-bot" style={{ background: t.surface, border: `1px solid ${t.accentBorder}`, color: t.accent }}>
                🧠 LLM Filtered
              </div>
              <div className="lp-vis-card" style={{ background: t.surface, border: `1px solid ${t.border}` }}>
                <div style={{ fontSize: "0.72rem", fontFamily: "monospace", color: t.accent, marginBottom: 16, fontWeight: 700, letterSpacing: "0.08em" }}>OUTPUT MATERIALS</div>
                {OUTPUT_ROWS.map((row, i) => (
                  <div key={i} style={{ marginBottom: i < 3 ? 14 : 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", fontFamily: "monospace", color: t.muted, marginBottom: 6 }}>
                      <span>{row.label}</span>
                      <span style={{ color: t.accent }}>{row.pct}%</span>
                    </div>
                    <div style={{ height: 6, background: t.border, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${row.pct}%`, background: `linear-gradient(90deg,${t.accent},${dark?"#a78bfa":"#7c3aed"})`, borderRadius: 4, animation: `lpFill 2s ease ${i*0.3}s both` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── PROBLEMS ─────────────────────────────────────────────────── */}
        <section id="problems" ref={ref("sec-prob")} className="lp-section" style={fadeIn(v("sec-prob"))}>
          <SecHeader tag="The Problem" title="Why Students Struggle with Lectures" desc="Three core challenges that Lectra is built to solve." t={t} />
          <div className="lp-grid3">
            {PROBLEMS.map((p, i) => (
              <div key={i} ref={ref(`prob-${i}`)} className="lp-card"
                style={{ background: t.surface, border: `1px solid ${t.border}`, ...cardAnim(v(`prob-${i}`), i * 0.12) }}
                {...cardHover}>
                <div className="lp-icon" style={{ background: t.accentBg, border: `1px solid ${t.accentBorder}` }}>{p.icon}</div>
                <h3 className="lp-card-h" style={{ color: t.text }}>{p.title}</h3>
                <p className="lp-card-p" style={{ color: t.muted }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── PIPELINE ─────────────────────────────────────────────────── */}
        <section id="pipeline" ref={ref("sec-pipe")} className="lp-section"
          style={{ background: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", ...fadeIn(v("sec-pipe")) }}>
          <SecHeader tag="Pipeline" title="How Lectra Works" desc="A fully automated 5-step AI pipeline from raw audio to study material." t={t} />
          <div className="lp-pipeline">
            {STEPS.map((s, i) => (
              <div key={i} ref={ref(`step-${i}`)} className="lp-step"
                style={{ opacity: v(`step-${i}`) ? 1 : 0, transform: v(`step-${i}`) ? "translateY(0)" : "translateY(28px)", transition: `opacity .5s ease ${i*.1}s, transform .5s ease ${i*.1}s` }}>
                <div className="lp-step-icon" style={{
                  background: step === i ? t.accentBg : t.surface,
                  border: `2px solid ${step === i ? t.accent : t.border}`,
                  boxShadow: step === i ? `0 0 28px ${t.accentGlow}` : "none",
                }}>
                  <span style={{ fontSize: "1.8rem" }}>{s.icon}</span>
                </div>
                <div className="lp-step-lbl" style={{ color: step === i ? t.accent : t.muted }}>{s.label}</div>
                <div className="lp-step-desc" style={{ color: t.muted }}>{s.desc}</div>
                {i < STEPS.length - 1 && <div className="lp-step-arr" style={{ color: t.accentBorder }}>→</div>}
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────────────────────────────── */}
        <section id="features" ref={ref("sec-feat")} className="lp-section" style={fadeIn(v("sec-feat"))}>
          <SecHeader tag="Features" title="Everything You Need to Ace Exams" desc="Lectra's AI pipeline automatically generates all the study material you need." t={t} />
          <div className="lp-grid3">
            {FEATURES.map((f, i) => (
              <div key={i} ref={ref(`feat-${i}`)} className="lp-card"
                style={{ background: t.surface, border: `1px solid ${t.border}`, ...cardAnim(v(`feat-${i}`), (i % 3) * 0.1) }}
                {...cardHover}>
                <div className="lp-icon" style={{ background: t.accentBg }}>{f.icon}</div>
                <h3 className="lp-card-h" style={{ color: t.text }}>{f.title}</h3>
                <p className="lp-card-p" style={{ color: t.muted }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── TECH STACK ───────────────────────────────────────────────── */}
        <section id="tech" ref={ref("sec-tech")} className="lp-section"
          style={{ background: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", ...fadeIn(v("sec-tech")) }}>
          <SecHeader tag="Tech Stack" title="Built with Modern AI Tools" desc="A robust, production-ready stack powering every layer of Lectra." t={t} />
          <div className="lp-pills">
            {TECH.map((tech, i) => (
              <div key={i} ref={ref(`tech-${i}`)} className="lp-pill"
                style={{ background: t.surface, border: `1px solid ${t.border}`, color: t.muted,
                  opacity: v(`tech-${i}`) ? 1 : 0,
                  transform: v(`tech-${i}`) ? "translateY(0)" : "translateY(14px)",
                  transition: `opacity .4s ease ${i*.06}s, transform .4s ease ${i*.06}s, border-color .2s, color .2s, background .2s`,
                }}
                {...pillHover}>
                {tech}
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <section id="cta" ref={ref("sec-cta")} className="lp-section" style={fadeIn(v("sec-cta"))}>
          <div className="lp-cta" style={{ background: t.surface, border: `1px solid ${t.border}` }}>
            <div className="lp-cta-glow" style={{ background: "radial-gradient(circle at 50% 50%, rgba(57,217,138,0.08), transparent 70%)" }} />
            <span className="lp-tag" style={{ color: t.accent, background: t.accentBg, border: `1px solid ${t.accentBorder}`, display: "inline-block", marginBottom: 20 }}>Get Started</span>
            <h2 style={{ color: t.text, fontSize: "clamp(1.8rem,3vw,2.8rem)", fontWeight: 800, marginBottom: 18, letterSpacing: "-0.03em" }}>Stop Struggling. Start Learning Smarter.</h2>
            <p style={{ color: t.muted, maxWidth: 540, margin: "0 auto 36px", fontSize: "1.05rem", lineHeight: 1.7 }}>
              Upload your lecture audio and let Lectra&apos;s AI pipeline do the heavy lifting — accurate transcription, smart filtering, and instant study materials.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="lp-btn-primary lp-btn-lg" style={{ background: t.accent, border: `1px solid ${t.accent}`, color: "#0d1117" }} onClick={() => router.push("/login")}>Get Started Now →</button>
              <button className="lp-btn-ghost lp-btn-lg"   style={{ border: `1px solid ${t.border}`, color: t.muted, background: "transparent" }} onClick={() => scrollTo("pipeline")}>See How It Works</button>
            </div>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────────────────────────── */}
        <footer style={{ borderTop: `1px solid ${t.border}`, padding: "28px 52px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div className="lp-logo" style={{ color: t.accent }} onClick={scrollTop}>Lectra</div>
          <div style={{ color: t.muted, fontSize: "0.88rem", fontFamily: "monospace" }}>Automated Lecture Intelligence System </div>
          <div style={{ color: t.muted }}></div>
        </footer>
      </div>
    </>
  );
}

/* ─── Section header ───────────────────────────────────────────────────────── */
function SecHeader({ tag, title, desc, t }: { tag: string; title: string; desc: string; t: Th }) {
  return (
    <div className="lp-sec-hdr">
      <span className="lp-tag" style={{ color: t.accent, background: t.accentBg, border: `1px solid ${t.accentBorder}` }}>{tag}</span>
      <h2 className="lp-sec-title" style={{ color: t.text }}>{title}</h2>
      <p className="lp-sec-desc" style={{ color: t.muted }}>{desc}</p>
    </div>
  );
}

/* ─── Styles ───────────────────────────────────────────────────────────────── */
function styles(t: Th, _dark: boolean) {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;700;800&display=swap');

    .lp-grain{position:fixed;inset:0;pointer-events:none;z-index:200;opacity:.018;
      background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      background-size:128px;}

    .lp-root{min-height:100vh;font-family:'Syne',sans-serif;font-size:18px;transition:background .4s,color .4s;}

    /* NAV */
    nav{display:flex;align-items:center;justify-content:space-between;padding:0 52px;height:70px;position:sticky;top:0;z-index:100;transition:box-shadow .3s;}
    .lp-logo{font-family:'Syne',sans-serif;font-weight:800;font-size:1.6rem;letter-spacing:-.03em;cursor:pointer;user-select:none;}
    .lp-logo:hover{opacity:.75;}
    .lp-navlinks{display:flex;align-items:center;gap:32px;list-style:none;}
    .lp-navlinks a{text-decoration:none;font-size:1rem;font-weight:600;transition:color .2s;cursor:pointer;}
    .lp-nav-right{display:flex;align-items:center;gap:12px;}
    .lp-theme-btn{padding:9px 18px;border-radius:10px;font-family:'Space Mono',monospace;font-size:.82rem;font-weight:700;cursor:pointer;transition:all .25s;display:flex;align-items:center;gap:6px;white-space:nowrap;}
    .lp-theme-btn:hover{transform:scale(1.04);}
    .lp-login-btn{padding:10px 26px;border-radius:10px;border:none;font-family:'Syne',sans-serif;font-size:1rem;font-weight:800;cursor:pointer;transition:all .25s;}
    .lp-login-btn:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(57,217,138,.35);}

    /* HERO */
    .lp-hero{display:grid;grid-template-columns:1fr 1fr;gap:56px;padding:90px 52px 80px;align-items:center;position:relative;overflow:hidden;}
    .lp-hero-glow{position:absolute;inset:0;pointer-events:none;}
    .lp-hero-content{position:relative;z-index:1;}
    .lp-fi1{animation:lpUp .5s ease .1s both;}
    .lp-fi2{animation:lpUp .5s ease .2s both;}
    .lp-fi3{animation:lpUp .5s ease .3s both;}
    .lp-fi4{animation:lpUp .5s ease .4s both;}
    .lp-fi5{animation:lpUp .5s ease .5s both;}
    .lp-badge{display:inline-flex;align-items:center;gap:8px;padding:7px 16px;border-radius:100px;font-size:.82rem;font-family:'Space Mono',monospace;margin-bottom:28px;font-weight:700;}
    .lp-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;animation:lpPulse 2s infinite;}
    .lp-h1{font-size:clamp(2.4rem,4.2vw,3.8rem);font-weight:800;line-height:1.08;letter-spacing:-.04em;margin-bottom:22px;}
    .lp-sub{font-size:1.08rem;line-height:1.8;max-width:500px;margin-bottom:40px;}
    .lp-hero-btns{display:flex;gap:14px;margin-bottom:44px;flex-wrap:wrap;}
    .lp-stats{display:flex;align-items:stretch;}
    .lp-stat{padding-right:28px;margin-right:28px;display:flex;flex-direction:column;justify-content:center;}
    .lp-stat:last-child{padding-right:0;margin-right:0;border-right:none!important;}
    .lp-stat-val{font-size:.9rem;font-weight:800;font-family:'Space Mono',monospace;margin-bottom:4px;}
    .lp-stat-lbl{font-size:.75rem;font-family:'Space Mono',monospace;opacity:.7;}
    .lp-hero-visual{position:relative;overflow:visible;}

    /* BUTTONS */
    .lp-btn-primary,.lp-btn-ghost{padding:15px 30px;border-radius:10px;font-family:'Space Mono',monospace;font-size:.9rem;font-weight:700;cursor:pointer;transition:all .25s;}
    .lp-btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(57,217,138,.28);}
    .lp-btn-ghost:hover{transform:translateY(-2px);}
    .lp-btn-lg{padding:17px 36px!important;font-size:1rem!important;}

    /* VISUAL */
    .lp-vis-card{border-radius:16px;padding:22px 24px;}
    .lp-float-badge{position:absolute;padding:7px 16px;border-radius:100px;font-family:monospace;font-size:.72rem;font-weight:700;white-space:nowrap;z-index:10;}
    .lp-fb-top{top:-22px;right:16px;animation:lpFloat 3s ease-in-out infinite;}
    .lp-fb-bot{bottom:-22px;left:16px;animation:lpFloat 3s ease-in-out infinite 1.5s;}

    /* SECTIONS */
    .lp-section{padding:90px 52px;}
    .lp-sec-hdr{text-align:center;margin-bottom:64px;}
    .lp-tag{display:inline-block;padding:6px 16px;border-radius:100px;font-size:.8rem;font-family:'Space Mono',monospace;font-weight:700;margin-bottom:18px;letter-spacing:.05em;}
    .lp-sec-title{font-size:clamp(1.8rem,3vw,2.6rem);font-weight:800;letter-spacing:-.03em;margin-bottom:14px;}
    .lp-sec-desc{font-size:1.05rem;max-width:560px;margin:0 auto;line-height:1.75;}

    /* CARDS */
    .lp-grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}
    .lp-card{border-radius:20px;padding:36px 30px;cursor:default;}
    .lp-icon{width:60px;height:60px;border-radius:16px;display:flex;align-items:center;justify-content:center;margin-bottom:22px;font-size:1.8rem;}
    .lp-card-h{font-size:1.15rem;font-weight:700;margin-bottom:14px;}
    .lp-card-p{font-size:.9rem;line-height:1.75;font-family:'Space Mono',monospace;}

    /* PIPELINE */
    .lp-pipeline{display:flex;align-items:flex-start;justify-content:center;overflow-x:auto;padding-bottom:8px;}
    .lp-step{display:flex;flex-direction:column;align-items:center;gap:12px;position:relative;min-width:150px;flex-shrink:0;}
    .lp-step-icon{width:76px;height:76px;border-radius:20px;display:flex;align-items:center;justify-content:center;transition:all .4s;}
    .lp-step-lbl{font-size:.82rem;font-weight:700;font-family:'Space Mono',monospace;transition:color .3s;text-align:center;}
    .lp-step-desc{font-size:.72rem;font-family:'Space Mono',monospace;text-align:center;max-width:110px;line-height:1.5;}
    .lp-step-arr{position:absolute;right:-14px;top:24px;font-size:1.5rem;font-weight:700;pointer-events:none;}

    /* PILLS */
    .lp-pills{display:flex;flex-wrap:wrap;gap:14px;justify-content:center;max-width:760px;margin:0 auto;}
    .lp-pill{padding:12px 26px;border-radius:100px;font-family:'Space Mono',monospace;font-size:.88rem;font-weight:700;cursor:default;transition:all .25s;}

    /* CTA */
    .lp-cta{border-radius:28px;padding:72px 56px;text-align:center;position:relative;overflow:hidden;}
    .lp-cta-glow{position:absolute;inset:0;pointer-events:none;}

    /* KEYFRAMES */
    @keyframes lpUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
    @keyframes lpPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.7)}}
    @keyframes lpWave{from{height:5px}to{height:50px}}
    @keyframes lpFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
    @keyframes lpFill{from{width:0%}}

    /* RESPONSIVE */
    @media(max-width:1024px){
      .lp-hero{grid-template-columns:1fr;padding:56px 32px 48px;}
      nav{padding:0 32px;}
      .lp-grid3{grid-template-columns:1fr;}
      .lp-section{padding:70px 32px;}
      .lp-step-arr{display:none;}
      .lp-cta{padding:48px 32px;}
    }
    @media(max-width:640px){
      .lp-navlinks{display:none;}
      .lp-h1{font-size:2.2rem;}
      .lp-stats{flex-direction:column;gap:14px;}
      .lp-stat{padding-right:0!important;margin-right:0!important;border-right:none!important;}
    }
  `;
}
