import { useState, useMemo } from "react";
import {
  CheckCircle2,
  ArrowRight,
  Search,
  Link as LinkIcon,
  LayoutDashboard,
  LogIn,
  UserPlus,
  History as HistoryIcon,
  FileSearch,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Image as ImageIcon,
  Radio,
  ChevronRight,
  Clock,
  Mail,
  Lock,
  User,
} from "lucide-react";

const C = {
  ink: "#0B1622",
  ink2: "#101F30",
  ink3: "#16283C",
  paper: "#EDEAE0",
  paperDim: "#C9C6BB",
  line: "#24374E",
  text: "#E9EBEE",
  textDim: "#8FA0B6",
  textFaint: "#566980",
  teal: "#2DD4BF",
  amber: "#F5A623",
  red: "#E5484D",
};

const fontDisplay = '"Fraunces", Georgia, serif';
const fontBody = '"Inter", -apple-system, BlinkMacSystemFont, sans-serif';
const fontMono = '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace';

const NAV = [
  { id: "home", label: "Home", icon: Radio },
  { id: "auth", label: "Login / Register", icon: LogIn },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "analyzer", label: "News Analyzer", icon: FileSearch },
  { id: "result", label: "Verification Result", icon: ShieldCheck },
  { id: "history", label: "Verification History", icon: HistoryIcon },
];



function toneColor(tone) {
  if (tone === "teal" || tone === "real") return C.teal;
  if (tone === "red" || tone === "fake") return C.red;
  return C.amber;
}

function timeAgo(date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);

  if (s < 60) return "just now";

  const m = Math.floor(s / 60);

  if (m < 60) return `${m}m ago`;

  const h = Math.floor(m / 60);

  if (h < 24) return `${h}h ago`;

  return `${Math.floor(h / 24)}d ago`;
}

function Eyebrow({ children }) {
  return (
    <p
      className="text-xs mb-3"
      style={{
        fontFamily: fontMono,
        color: C.teal,
        letterSpacing: "0.12em",
      }}
    >
      {children}
    </p>
  );
}

function Btn({
  children,
  onClick,
  variant = "primary",
  icon: Icon,
  type = "button",
  disabled,
}) {
  const base =
    "inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition disabled:opacity-60";

  if (variant === "primary") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={base}
        style={{
          backgroundColor: C.teal,
          color: "#06201C",
        }}
      >
        {children}
        {Icon && <Icon size={16} />}
      </button>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={base}
      style={{
        backgroundColor: "transparent",
        color: C.text,
        border: `1px solid ${C.line}`,
      }}
    >
      {children}
      {Icon && <Icon size={16} />}
    </button>
  );
}

function Card({ children, style, className = "" }) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        backgroundColor: C.ink2,
        border: `1px solid ${C.line}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SignalRow({ name, desc, value, note }) {
  const color =
    value == null
      ? C.textFaint
      : value >= 65
      ? C.teal
      : value >= 45
      ? C.amber
      : C.red;

  return (
    <div className="grid grid-cols-[1fr_140px_36px] items-center gap-4">
      <div className="flex flex-col gap-1.5">
        <span
          className="text-sm font-semibold"
          style={{ color: C.text }}
        >
          {name}
        </span>

        <span
          className="text-xs leading-relaxed"
          style={{ color: C.textFaint }}
        >
          {desc}
        </span>

        {note && (
          <span
            className="mt-2 block text-xs leading-relaxed"
            style={{ color: C.textDim }}
          >
            {note}
          </span>
        )}
      </div>

      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: C.ink3 }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${value ?? 0}%`,
            backgroundColor: color,
          }}
        />
      </div>

      <span
        className="text-xs text-right"
        style={{
          fontFamily: fontMono,
          color: C.textDim,
        }}
      >
        {value == null ? "Unavailable" : value}
      </span>
    </div>
  );
}

function Header({ page, setPage }) {
  return (
    <header
      className="sticky top-0 z-50 backdrop-blur"
      style={{
        backgroundColor: "rgba(11,22,34,0.88)",
        borderBottom: `1px solid ${C.line}`,
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-6 px-6 py-4">
        <button
          onClick={() => setPage("home")}
          className="flex items-center gap-2"
          style={{ color: C.text }}
        >
          <CheckCircle2
            size={22}
            style={{ color: C.teal }}
          />

          <span
            style={{
              fontFamily: fontDisplay,
              fontSize: 20,
            }}
          >
            Veritas
          </span>
        </button>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV.map((n) => {
            const active = page === n.id;

            return (
              <button
                key={n.id}
                onClick={() => setPage(n.id)}
                className="px-3 py-2 rounded-full text-sm transition"
                style={{
                  color: active ? C.teal : C.textDim,
                  backgroundColor: active
                    ? "rgba(45,212,191,0.1)"
                    : "transparent",
                }}
              >
                {n.label}
              </button>
            );
          })}
        </nav>

        <div
          className="hidden md:flex items-center gap-2 text-xs whitespace-nowrap"
          style={{ color: C.textFaint }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: C.teal,
              boxShadow:
                "0 0 0 3px rgba(45,212,191,0.15)",
            }}
          />

          <span style={{ fontFamily: fontMono }}>
            VERIFICATION ACTIVE
          </span>
        </div>
      </div>

      <div className="lg:hidden flex overflow-x-auto gap-1 px-4 pb-3 -mt-1">
        {NAV.map((n) => {
          const active = page === n.id;

          return (
            <button
              key={n.id}
              onClick={() => setPage(n.id)}
              className="px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition"
              style={{
                color: active ? C.teal : C.textDim,
                backgroundColor: active
                  ? "rgba(45,212,191,0.1)"
                  : "transparent",
                border: `1px solid ${
                  active
                    ? "rgba(45,212,191,0.3)"
                    : C.line
                }`,
              }}
            >
              {n.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}

function Home({ setPage }) {
  return (
    <div>
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 grid md:grid-cols-[1.15fr_0.85fr] gap-14 items-center">
        <div>
          <Eyebrow>VERIFICATION ENGINE</Eyebrow>

          <h1
            style={{
              fontFamily: fontDisplay,
              color: C.text,
            }}
            className="text-4xl md:text-5xl leading-tight"
          >
            Before you share it,{" "}
            <em
              style={{
                color: C.teal,
                fontStyle: "italic",
              }}
            >
              read its signal.
            </em>
          </h1>

          <p
            className="mt-5 max-w-md text-base"
            style={{ color: C.textDim }}
          >
            Paste an article, a headline, or a link.
            Veritas breaks it down into the signals that
            separate reporting from rumor: source pattern,
            language pressure, and claim consistency.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Btn
              onClick={() => setPage("analyzer")}
              icon={ArrowRight}
            >
              Analyze a story
            </Btn>

            <Btn
              variant="ghost"
              onClick={() => setPage("dashboard")}
            >
              Go to dashboard
            </Btn>
          </div>
        </div>

        <div className="flex justify-center">
          <Card
            style={{
              padding: "28px 30px",
              maxWidth: 300,
              textAlign: "center",
              width: "100%",
            }}
          >
            <p
              className="text-xs mb-2"
              style={{
                fontFamily: fontMono,
                color: C.textFaint,
              }}
            >
              CREDIBILITY OVERVIEW
            </p>

            <svg
              viewBox="0 0 220 140"
              width="220"
              height="140"
              className="mx-auto block"
            >
              <defs>
                <linearGradient
                  id="gaugeGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop
                    offset="0%"
                    stopColor={C.red}
                  />
                  <stop
                    offset="50%"
                    stopColor={C.amber}
                  />
                  <stop
                    offset="100%"
                    stopColor={C.teal}
                  />
                </linearGradient>
              </defs>

              <path
                d="M 20 120 A 90 90 0 0 1 200 120"
                fill="none"
                stroke={C.ink3}
                strokeWidth="14"
                strokeLinecap="round"
              />

              <path
                d="M 20 120 A 90 90 0 0 1 200 120"
                fill="none"
                stroke="url(#gaugeGrad)"
                strokeWidth="14"
                strokeLinecap="round"
              />

              <line
                x1="110"
                y1="120"
                x2="110"
                y2="45"
                stroke={C.text}
                strokeWidth="3"
                strokeLinecap="round"
                transform="rotate(38 110 120)"
              />

              <circle
                cx="110"
                cy="120"
                r="6"
                fill={C.text}
              />
            </svg>

            <div className="mt-1">
              <span
                style={{
                  fontFamily: fontMono,
                  fontSize: 34,
                  fontWeight: 700,
                  color: C.text,
                }}
              >
                72
              </span>

              <span
                style={{
                  fontFamily: fontMono,
                  fontSize: 15,
                  color: C.textFaint,
                }}
              >
                {" "}
                /100
              </span>
            </div>

            <p
              className="text-sm mt-1"
              style={{ color: C.amber }}
            >
              Likely reliable · verify sourcing
            </p>
          </Card>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="max-w-xl mb-10">
          <Eyebrow>METHOD</Eyebrow>

          <h2
            style={{
              fontFamily: fontDisplay,
              color: C.text,
            }}
            className="text-3xl"
          >
            Four signals, read together
          </h2>

          <p
            className="mt-3 text-sm"
            style={{ color: C.textDim }}
          >
            No single signal proves anything alone.
            Veritas weighs multiple indicators together
            before producing an assessment.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Search,
              title: "Source pattern",
              desc: "Publisher history, citations, and reliability indicators.",
            },
            {
              icon: ShieldAlert,
              title: "Language pressure",
              desc: "Urgency, emotional loading, and absolute language patterns.",
            },
            {
              icon: ShieldQuestion,
              title: "Claim consistency",
              desc: "Consistency of the central claim with available reporting.",
            },
            {
              icon: ImageIcon,
              title: "Media forensics",
              desc: "Indicators of manipulation, reuse, or contextual mismatch.",
            },
          ].map((s) => (
            <Card
              key={s.title}
              style={{ padding: "22px" }}
            >
              <s.icon
                size={18}
                style={{
                  color: C.teal,
                  marginBottom: 14,
                }}
              />

              <h3
                style={{
                  fontFamily: fontDisplay,
                  color: C.text,
                }}
                className="text-lg mb-1"
              >
                {s.title}
              </h3>

              <p
                className="text-sm"
                style={{ color: C.textDim }}
              >
                {s.desc}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div
          className="rounded-2xl max-w-2xl mx-auto p-10"
          style={{ backgroundColor: C.paper }}
        >
          <p
            className="text-xs mb-3"
            style={{
              fontFamily: fontMono,
              color: "#B0501E",
              letterSpacing: "0.1em",
            }}
          >
            HOW VERITAS WORKS
          </p>

          <h2
            style={{
              fontFamily: fontDisplay,
              color: C.ink,
            }}
            className="text-2xl mb-3"
          >
            A clearer way to evaluate information.
          </h2>

          <p
            className="text-sm"
            style={{ color: "#3B3A34" }}
          >
            Veritas evaluates multiple credibility
            indicators together to help you understand
            the reliability of information before you
            share it.
          </p>
        </div>
      </section>
    </div>
  );
}

function Auth({ setPage }) {
  const [mode, setMode] = useState("login");

  return (
    <section className="max-w-md mx-auto px-6 py-20">
      <div className="text-center mb-8">
        <Eyebrow>ACCOUNT</Eyebrow>

        <h1
          style={{
            fontFamily: fontDisplay,
            color: C.text,
          }}
          className="text-3xl"
        >
          {mode === "login"
            ? "Welcome back"
            : "Create an account"}
        </h1>

        <p
          className="mt-2 text-sm"
          style={{ color: C.textDim }}
        >
          {mode === "login"
            ? "Log in to access your verification activity."
            : "Create an account to keep track of your verification activity."}
        </p>
      </div>

      <Card style={{ padding: 0 }}>
        <div
          className="flex"
          style={{
            borderBottom: `1px solid ${C.line}`,
          }}
        >
          {["login", "register"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex-1 py-3.5 text-xs uppercase"
              style={{
                fontFamily: fontMono,
                letterSpacing: "0.05em",
                color:
                  mode === m
                    ? C.teal
                    : C.textFaint,
                borderBottom:
                  mode === m
                    ? `2px solid ${C.teal}`
                    : "2px solid transparent",
              }}
            >
              {m === "login"
                ? "Log in"
                : "Register"}
            </button>
          ))}
        </div>

        <form
          className="p-6 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();

            if (mode === "login") {
              const formData = new FormData(e.currentTarget);
              const username = String(formData.get("username") || "").trim();
              const password = String(formData.get("password") || "");

              if (username !== "admin@veritas.com" || password !== "Veritas@123") {
                window.alert("Invalid username or password.");
                return;
              }

              setPage("dashboard");
              return;
            }

            window.alert("Registration is not connected yet. Please use the demo login.");
          }}
        >
          {mode === "register" && (
            <label
              className="flex flex-col gap-1.5 text-xs"
              style={{ color: C.textFaint }}
            >
              Full name

              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2.5"
                style={{
                  backgroundColor: C.ink,
                  border: `1px solid ${C.line}`,
                }}
              >
                <User
                  size={15}
                  style={{ color: C.textFaint }}
                />

                <input
                  className="bg-transparent outline-none w-full text-sm"
                  style={{ color: C.text }}
                  placeholder="Your full name"
                />
              </div>
            </label>
          )}

          <label
            className="flex flex-col gap-1.5 text-xs"
            style={{ color: C.textFaint }}
          >
            Email

            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2.5"
              style={{
                backgroundColor: C.ink,
                border: `1px solid ${C.line}`,
              }}
            >
              <Mail
                size={15}
                style={{ color: C.textFaint }}
              />

              <input
                name="username"
                type="email"
                className="bg-transparent outline-none w-full text-sm"
                style={{ color: C.text }}
                placeholder="you@example.com"
              />
            </div>
          </label>

          <label
            className="flex flex-col gap-1.5 text-xs"
            style={{ color: C.textFaint }}
          >
            Password

            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2.5"
              style={{
                backgroundColor: C.ink,
                border: `1px solid ${C.line}`,
              }}
            >
              <Lock
                size={15}
                style={{ color: C.textFaint }}
              />

              <input
                name="password"
                type="password"
                className="bg-transparent outline-none w-full text-sm"
                style={{ color: C.text }}
                placeholder="xxxxxxx"
              />
            </div>
          </label>

          <Btn
            type="submit"
            icon={
              mode === "login"
                ? LogIn
                : UserPlus
            }
          >
            {mode === "login"
              ? "Log in"
              : "Create account"}
          </Btn>

          <p
            className="text-xs text-center"
            style={{ color: C.textFaint }}
          >
            Your verification activity will be
            available from your dashboard.
          </p>
        </form>
      </Card>
    </section>
  );
}

function Dashboard({
  history,
  setPage,
  setPendingResult,
}) {
  const stats = useMemo(() => {
    if (history.length === 0) {
      return {
        total: 0,
        avg: 0,
        flagged: 0,
      };
    }

    const total = history.length;

    const avg = Math.round(
      history.reduce(
        (a, h) => a + h.composite,
        0
      ) / total
    );

    const flagged = history.filter(
      (h) => h.verdictTone === "red"
    ).length;

    return {
      total,
      avg,
      flagged,
    };
  }, [history]);

  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      <Eyebrow>DASHBOARD</Eyebrow>

      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <h1
          style={{
            fontFamily: fontDisplay,
            color: C.text,
          }}
          className="text-3xl"
        >
          Your verification activity
        </h1>

        <Btn
          onClick={() => setPage("analyzer")}
          icon={ArrowRight}
        >
          New analysis
        </Btn>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <Card style={{ padding: 20 }}>
          <p
            className="text-xs"
            style={{
              fontFamily: fontMono,
              color: C.textFaint,
            }}
          >
            STORIES CHECKED
          </p>

          <p
            style={{
              fontFamily: fontDisplay,
              color: C.text,
            }}
            className="text-4xl mt-2"
          >
            {stats.total}
          </p>
        </Card>

        <Card style={{ padding: 20 }}>
          <p
            className="text-xs"
            style={{
              fontFamily: fontMono,
              color: C.textFaint,
            }}
          >
            AVERAGE SCORE
          </p>

          <p
            style={{
              fontFamily: fontDisplay,
              color: C.text,
            }}
            className="text-4xl mt-2"
          >
            {stats.total ? stats.avg : "—"}
          </p>
        </Card>

        <Card style={{ padding: 20 }}>
          <p
            className="text-xs"
            style={{
              fontFamily: fontMono,
              color: C.textFaint,
            }}
          >
            LOW-CREDIBILITY FLAGS
          </p>

          <p
            style={{
              fontFamily: fontDisplay,
              color: C.red,
            }}
            className="text-4xl mt-2"
          >
            {stats.flagged}
          </p>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2
          style={{
            fontFamily: fontDisplay,
            color: C.text,
          }}
          className="text-xl"
        >
          Recent analyses
        </h2>

        <button
          onClick={() => setPage("history")}
          className="text-xs flex items-center gap-1"
          style={{ color: C.teal }}
        >
          View all
          <ChevronRight size={13} />
        </button>
      </div>

      {history.length === 0 ? (
        <Card
          style={{
            padding: 40,
            textAlign: "center",
            border: `1px dashed ${C.line}`,
          }}
        >
          <p
            className="text-sm"
            style={{ color: C.textFaint }}
          >
            Nothing checked yet Ã¢â‚¬â€ run your first
            story through the analyzer.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {history.slice(0, 4).map((h) => (
            <button
              key={h.id}
              onClick={() => {
                setPendingResult(h);
                setPage("result");
              }}
              className="text-left"
            >
              <Card
                style={{ padding: 16 }}
                className="flex items-center gap-4"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: C.ink3,
                    color: toneColor(
                      h.verdictTone
                    ),
                    fontFamily: fontMono,
                    fontSize: 12,
                  }}
                >
                  {h.composite}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm truncate"
                    style={{ color: C.text }}
                  >
                    {h.input.slice(0, 90) ||
                      "Untitled submission"}
                  </p>

                  <p
                    className="text-xs mt-0.5"
                    style={{ color: C.textFaint }}
                  >
                    {h.verdict} ·{" "}
                    {timeAgo(h.timestamp)}
                  </p>
                </div>

                <ChevronRight
                  size={16}
                  style={{ color: C.textFaint }}
                />
              </Card>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function Analyzer({ onAnalyzed, setPage }) {
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const value = mode === "text" ? text : url;

  const run = async () => {
    const input = value.trim();

    if (!input) {
      setError(true);
      setTimeout(() => setError(false), 900);
      return;
    }

    if (mode === "url") {
      try {
        const parsed = new URL(input);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          throw new Error("Unsupported URL protocol.");
        }
      } catch {
        setError(true);
        window.alert("Please enter a valid article URL beginning with https:// or http://.");
        return;
      }
    }

    setLoading(true);
    setError(false);

    try {
      const response = await fetch(`${(import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "")}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, input }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("The backend returned an unreadable response.");
      }

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "The article could not be analyzed."
        );
      }

      if (!["fake", "real"].includes(data.prediction)) {
        throw new Error("The backend returned an unexpected prediction.");
      }

      const realRaw = Number(data.probability_real);
      const fakeRaw = Number(data.probability_fake);

      if (!Number.isFinite(realRaw) || !Number.isFinite(fakeRaw)) {
        throw new Error("The backend response is missing prediction probabilities.");
      }

      const toPercent = (n) => Math.max(0, Math.min(100, n <= 1 ? n * 100 : n));
      const probabilityReal = toPercent(realRaw);
      const probabilityFake = toPercent(fakeRaw);
      const isFake = data.prediction === "fake";

      const result = {
        ...data,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date(),
        mode,
        input,
        verdict: data.verdict || (isFake ? "Likely Fake News" : "Likely Real News"),
        verdictTone: isFake ? "red" : "teal",
        composite: Math.round(Number(data.confidence ?? probabilityReal)),
        probability_real: probabilityReal,
        probability_fake: probabilityFake,
        signals: data.signals ?? {
          source: null,
          language: null,
          claim: null,
          media: null,
        },
      };

      onAnalyzed(result);
      setPage("result");
    } catch (err) {
      setError(true);
      window.alert(
        err?.message === "Failed to fetch"
          ? "Cannot connect to Veritas. Start the FastAPI backend at http://127.0.0.1:8000 and try again."
          : err?.message || "Something went wrong during analysis."
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <section className="max-w-3xl mx-auto px-6 py-16">
      <Eyebrow>NEWS ANALYZER</Eyebrow>

      <h1
        style={{
          fontFamily: fontDisplay,
          color: C.text,
        }}
        className="text-3xl mb-8"
      >
        Analyze information before you trust it
      </h1>

      <Card style={{ padding: 0 }}>
        <div
          className="flex"
          style={{
            borderBottom: `1px solid ${C.line}`,
          }}
        >
          {[
            {
              id: "text",
              label: "Paste text",
              icon: FileSearch,
            },
            {
              id: "url",
              label: "Article URL",
              icon: LinkIcon,
            },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setMode(t.id)}
              className="flex items-center gap-2 px-5 py-3.5 text-xs uppercase"
              style={{
                fontFamily: fontMono,
                letterSpacing: "0.05em",
                color:
                  mode === t.id
                    ? C.teal
                    : C.textFaint,
                borderBottom:
                  mode === t.id
                    ? `2px solid ${C.teal}`
                    : "2px solid transparent",
              }}
            >
              <t.icon size={13} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {mode === "text" ? (
            <textarea
              rows={7}
              value={text}
              onChange={(e) =>
                setText(e.target.value)
              }
              placeholder="Paste the headline, article body, or a claim you want to verify..."
              className="w-full rounded-xl px-4 py-4 text-sm outline-none resize-y"
              style={{
                backgroundColor: C.ink,
                border: `1px solid ${
                  error ? C.red : C.line
                }`,
                color: C.text,
              }}
            />
          ) : (
            <input
              type="url"
              value={url}
              onChange={(e) =>
                setUrl(e.target.value)
              }
              placeholder="https://example.com/article"
              className="w-full rounded-xl px-4 py-4 text-sm outline-none"
              style={{
                backgroundColor: C.ink,
                border: `1px solid ${
                  error ? C.red : C.line
                }`,
                color: C.text,
              }}
            />
          )}

          <div className="flex items-center justify-between mt-4">
            <span
              className="text-xs"
              style={{
                fontFamily: fontMono,
                color: C.textFaint,
              }}
            >
              {mode === "text"
                ? `${text.length} characters`
                : url
                ? "1 link ready"
                : "No link added"}
            </span>

            <Btn
              onClick={run}
              icon={ArrowRight}
              disabled={loading}
            >
              {loading
                ? "Analyzing..."
                : "Analyze content"}
            </Btn>
          </div>
        </div>
      </Card>

      <p
        className="text-xs mt-6"
        style={{ color: C.textFaint }}
      >
        Veritas evaluates the submitted content across
        multiple credibility indicators to generate a
        structured verification assessment.
      </p>
    </section>
  );
}

function Result({ result, setPage }) {
  if (!result) {
    return (
      <section className="max-w-2xl mx-auto px-6 py-24 text-center">
        <ShieldQuestion
          size={32}
          style={{
            color: C.textFaint,
            margin: "0 auto 16px",
          }}
        />

        <h1
          style={{
            fontFamily: fontDisplay,
            color: C.text,
          }}
          className="text-2xl mb-2"
        >
          Nothing to show yet
        </h1>

        <p
          className="text-sm mb-6"
          style={{ color: C.textFaint }}
        >
          Run a story through the analyzer to see its
          verification result here.
        </p>

        <Btn
          onClick={() => setPage("analyzer")}
          icon={ArrowRight}
        >
          Go to analyzer
        </Btn>
      </section>
    );
  }

  const tone = toneColor(result.verdictTone);

  return (
    <section className="max-w-4xl mx-auto px-6 py-16">
      <Eyebrow>VERIFICATION RESULT</Eyebrow>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <h1
          style={{
            fontFamily: fontDisplay,
            color: C.text,
          }}
          className="text-3xl"
        >
          Verification assessment
        </h1>

        <span
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
          style={{
            backgroundColor: `${tone}20`,
            color: tone,
            border: `1px solid ${tone}50`,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: tone }}
          />

          {result.verdict}
        </span>
      </div>

      <p
        className="text-sm mb-8 rounded-xl p-4"
        style={{
          color: C.textDim,
          backgroundColor: C.ink2,
          border: `1px solid ${C.line}`,
        }}
      >
        {result.mode === "url"
          ? "URL analyzed: "
          : "Input analyzed: "}

        <span style={{ color: C.text }}>
          {result.input.slice(0, 160) ||
            "Empty submission"}
        </span>
      </p>

      <div className="grid md:grid-cols-[260px_1fr] gap-8">
        <Card style={{ padding: 22 }}>
          <p
            className="text-xs"
            style={{
              fontFamily: fontMono,
              color: C.textFaint,
            }}
          >
            MODEL CONFIDENCE
          </p>

          <div className="my-3 flex items-baseline gap-1">
            <span
              style={{
                fontFamily: fontMono,
                fontSize: 44,
                fontWeight: 700,
                color: C.text,
              }}
            >
              {result.composite ?? "—"}
            </span>

            <span
              style={{
                fontFamily: fontMono,
                fontSize: 18,
                color: C.textFaint,
              }}
            >
              /100
            </span>
          </div>

          <div
            className="h-2 rounded-full overflow-hidden"
            style={{
              backgroundColor: C.ink3,
            }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${result.composite ?? "—"}%`,
                background: `linear-gradient(90deg, ${C.red}, ${C.amber}, ${C.teal})`,
              }}
            />
          </div>

          <p
            className="text-xs mt-4 leading-relaxed"
            style={{ color: C.textFaint }}
          >
            Model confidence reflects the classifier prediction.
            It is not an independently verified credibility score.
          </p>
        </Card>

        <div className="flex flex-col gap-5 justify-center">
          <SignalRow
            name="Source pattern"
            desc="Publisher identity and available reliability indicators."
            value={result.signals.source}
          />

          <SignalRow
            name="Language neutrality"
            desc="Higher scores indicate fewer emotional, urgency, and absolute-claim cues"
            value={result.signals.language}
          />
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <Btn
          onClick={() => setPage("analyzer")}
          icon={FileSearch}
        >
          Analyze another
        </Btn>

        <Btn
          variant="ghost"
          onClick={() => setPage("history")}
          icon={HistoryIcon}
        >
          View history
        </Btn>
      </div>
    </section>
  );
}

function History({
  history,
  setPage,
  setPendingResult,
}) {
  return (
    <section className="max-w-4xl mx-auto px-6 py-16">
      <Eyebrow>VERIFICATION HISTORY</Eyebrow>

      <h1
        style={{
          fontFamily: fontDisplay,
          color: C.text,
        }}
        className="text-3xl mb-2"
      >
        {history.length === 0
          ? "Nothing analyzed yet"
          : "Everything you've checked"}
      </h1>

      <p
        className="text-sm mb-8"
        style={{ color: C.textDim }}
      >
        Stories you check collect here so you can
        revisit their verification results later.
      </p>

      {history.length === 0 ? (
        <Card
          style={{
            padding: 56,
            textAlign: "center",
            border: `1px dashed ${C.line}`,
          }}
        >
          <Clock
            size={32}
            style={{
              color: C.textFaint,
              margin: "0 auto 14px",
            }}
          />

          <p
            className="text-sm"
            style={{ color: C.textFaint }}
          >
            Run your first analysis and it will appear
            here.
          </p>

          <div className="mt-5">
            <Btn
              onClick={() => setPage("analyzer")}
              icon={ArrowRight}
            >
              Analyze a story
            </Btn>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {history.map((h) => (
            <button
              key={h.id}
              onClick={() => {
                setPendingResult(h);
                setPage("result");
              }}
              className="text-left"
            >
              <Card
                style={{ padding: 18 }}
                className="flex items-center gap-4"
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-sm"
                  style={{
                    backgroundColor: C.ink3,
                    color: toneColor(
                      h.verdictTone
                    ),
                    fontFamily: fontMono,
                  }}
                >
                  {h.composite}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm truncate"
                    style={{ color: C.text }}
                  >
                    {h.input.slice(0, 100) ||
                      "Untitled submission"}
                  </p>

                  <p
                    className="text-xs mt-1 flex items-center gap-2"
                    style={{ color: C.textFaint }}
                  >
                    <span
                      className="px-2 py-0.5 rounded-full uppercase"
                      style={{
                        fontFamily: fontMono,
                        fontSize: 10,
                        backgroundColor: C.ink3,
                      }}
                    >
                      {h.mode}
                    </span>

                    {h.verdict} ·{" "}
                    {timeAgo(h.timestamp)}
                  </p>
                </div>

                <ChevronRight
                  size={16}
                  style={{ color: C.textFaint }}
                />
              </Card>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export default function VeritasApp() {
  const [page, setPage] = useState("home");
  const [history, setHistory] = useState([]);
  const [currentResult, setCurrentResult] =
    useState(null);

  const handleAnalyzed = (result) => {
    setCurrentResult(result);

    setHistory((prev) => [
      result,
      ...prev,
    ]);
  };

  return (
    <div
      style={{
        backgroundColor: C.ink,
        fontFamily: fontBody,
        minHeight: "100vh",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

        * {
          box-sizing: border-box;
        }

        ::selection {
          background: ${C.teal};
          color: ${C.ink};
        }
      `}</style>

      <Header
        page={page}
        setPage={setPage}
      />

      {page === "home" && (
        <Home setPage={setPage} />
      )}

      {page === "auth" && (
        <Auth setPage={setPage} />
      )}

      {page === "dashboard" && (
        <Dashboard
          history={history}
          setPage={setPage}
          setPendingResult={setCurrentResult}
        />
      )}

      {page === "analyzer" && (
        <Analyzer
          onAnalyzed={handleAnalyzed}
          setPage={setPage}
        />
      )}

      {page === "result" && (
        <Result
          result={currentResult}
          setPage={setPage}
        />
      )}

      {page === "history" && (
        <History
          history={history}
          setPage={setPage}
          setPendingResult={setCurrentResult}
        />
      )}

      <footer
        className="border-t"
        style={{ borderColor: C.line }}
      >
        <div
          className="max-w-6xl mx-auto px-6 py-6 flex justify-between text-xs"
          style={{
            color: C.textFaint,
            fontFamily: fontMono,
          }}
        >
          <span>
            VERITAS · INFORMATION VERIFICATION PLATFORM
          </span>

          <span>v1.0</span>
        </div>
      </footer>
    </div>
  );
}
















