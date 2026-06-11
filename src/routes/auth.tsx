// ============================================================================
// Vixor Auth Page — Telegram-first authentication
// ============================================================================
// Primary: Telegram WebApp auto-signin (when opened inside Telegram)
// Fallback: Telegram Login Widget (when opened in browser)
// Backup: Email/password (hidden behind "Other sign-in options")
// ============================================================================
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/shared/supabase/client";
import { telegramSignIn } from "@/domains/user/auth.functions";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import {
  BarChart3,
  Sparkles,
  Loader2,
  Eye,
  EyeOff,
  TrendingUp,
  Shield,
  Zap,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Mail,
} from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Sign in — Vixor" }] }),
  component: AuthPage,
});

const features = [
  { icon: BarChart3, label: "AI Chart Analysis", desc: "Instant pattern recognition" },
  { icon: TrendingUp, label: "Trade Setups", desc: "Entry, SL & TP levels" },
  { icon: Shield, label: "Risk Management", desc: "Protect your capital" },
  { icon: Zap, label: "200 Free Points", desc: "Start analyzing today" },
];

/** Telegram bot username — must match the bot linked to this app */
const TELEGRAM_BOT_USERNAME = "VixorAIBot";

function AuthPage() {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [tgStatus, setTgStatus] = useState<"detecting" | "webapp" | "widget" | "manual">("detecting");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [emailMode, setEmailMode] = useState<"signin" | "signup">("signin");
  const [success, setSuccess] = useState<string | null>(null);
  const tgSignIn = useStableServerFn(telegramSignIn);
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const widgetMountedRef = useRef(false);

  // ── Step 1: Detect environment & auto-signin if inside Telegram WebApp ──
  useEffect(() => {
    let active = true;

    const waitForTelegram = (): Promise<any> =>
      new Promise((resolve) => {
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.initData) {
          resolve(tg);
          return;
        }
        let attempts = 0;
        const iv = setInterval(() => {
          const t = (window as any).Telegram?.WebApp;
          if ((t?.initData && t.initData.length > 10) || attempts++ > 20) {
            clearInterval(iv);
            resolve(t?.initData ? t : null);
          }
        }, 100);
      });

    (async () => {
      // Check if already logged in
      const { data } = await supabase.auth.getUser();
      if (data.user && active) {
        navigateRef.current({ to: "/" });
        return;
      }

      const tg = await waitForTelegram();
      const initData: string | undefined = tg?.initData;

      if (initData && initData.length > 10) {
        // ── Inside Telegram WebApp — auto-signin ──
        if (active) {
          setTgStatus("webapp");
          setBusy(true);
        }
        try {
          const { email, password } = await tgSignIn({ data: { initData } });
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          navigateRef.current({ to: "/" });
        } catch (e) {
          if (active) setErr(e instanceof Error ? e.message : "Telegram sign-in failed");
        } finally {
          if (active) setBusy(false);
        }
      } else {
        // ── Outside Telegram — show Telegram Login Widget + fallback ──
        if (active) setTgStatus("widget");
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  // ── Step 2: Mount Telegram Login Widget when in browser mode ──
  useEffect(() => {
    if (tgStatus !== "widget") return;
    if (widgetMountedRef.current) return;
    widgetMountedRef.current = true;

    // Define the callback that Telegram Login Widget calls
    (window as any).onTelegramAuth = async (user: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
      hash: string;
    }) => {
      setBusy(true);
      setErr(null);
      try {
        // Use the Telegram auth data to create/signin via our server function
        const { email, password } = await tgSignIn({
          data: {
            // For widget auth, we send the whole user object as JSON
            // The server function will verify the hash
            initData: JSON.stringify(user),
          },
        });
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigateRef.current({ to: "/" });
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Telegram sign-in failed");
      } finally {
        setBusy(false);
      }
    };

    // Create the Telegram Login Widget script element
    const container = widgetContainerRef.current;
    if (!container) return;

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", TELEGRAM_BOT_USERNAME);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-auth-url", "");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-return-to", window.location.origin + "/auth");
    container.appendChild(script);
  }, [tgStatus]);

  // ── Email/password submit handler ──
  const submitEmail = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setBusy(true);
      setErr(null);
      setSuccess(null);
      try {
        if (emailMode === "signin") {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
            if (error.message.includes("Email not confirmed")) {
              setErr("Email not confirmed. Please check your inbox or use Telegram sign-in.");
            } else if (error.message.includes("Invalid login")) {
              setErr("Wrong email or password. Please try again.");
            } else {
              throw error;
            }
            return;
          }
          navigateRef.current({ to: "/" });
        } else {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: window.location.origin,
              data: { display_name: email.split("@")[0] },
            },
          });
          if (error) throw error;
          const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
          if (signInErr) {
            setSuccess("Account created! Check your email to confirm, then sign in.");
            setEmailMode("signin");
          } else {
            navigateRef.current({ to: "/" });
          }
        }
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Auth failed. Please try again.");
      } finally {
        setBusy(false);
      }
    },
    [email, password, emailMode],
  );

  // ── Still detecting Telegram environment ──
  if (tgStatus === "detecting") {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Detecting environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-info/8 blur-3xl" />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-7">
          {/* Logo + Brand */}
          <div className="text-center space-y-4">
            <div className="relative inline-flex">
              <div className="size-16 rounded-2xl gradient-primary glow-primary flex items-center justify-center">
                <BarChart3 className="size-8 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <div className="absolute -top-1 -right-1 size-5 rounded-full bg-bullish flex items-center justify-center">
                <Sparkles className="size-2.5 text-primary-foreground" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Vixor AI</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {tgStatus === "webapp" ? "Signing in with Telegram..." : "Sign in with Telegram"}
              </p>
            </div>
          </div>

          {/* Features strip */}
          <div className="grid grid-cols-2 gap-2">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="vixor-card p-3 flex items-start gap-2">
                <div className="size-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="size-3.5 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-semibold">{label}</div>
                  <div className="text-[10px] text-muted-foreground">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Error message */}
          {err && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-bearish/10 border border-bearish/20 text-xs text-bearish">
              <span className="mt-0.5">&#9888;&#65039;</span>
              <span>{err}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-bullish/10 border border-bullish/20 text-xs text-bullish">
              <span className="mt-0.5">&#9989;</span>
              <span>{success}</span>
            </div>
          )}

          {/* ── Telegram Sign-in Section ── */}
          {tgStatus === "webapp" ? (
            /* Inside Telegram — show loading spinner */
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Authenticating with Telegram...</p>
            </div>
          ) : (
            /* Outside Telegram — show Telegram Login Widget */
            <div className="flex flex-col items-center gap-4">
              <div className="text-center space-y-2">
                <div className="size-12 rounded-2xl bg-[#2AABEE]/15 flex items-center justify-center mx-auto">
                  <MessageCircle className="size-6 text-[#2AABEE]" />
                </div>
                <p className="text-sm font-medium">Sign in with Telegram</p>
                <p className="text-xs text-muted-foreground">
                  Use your Telegram account for instant access
                </p>
              </div>

              {/* Telegram Login Widget container */}
              <div
                ref={widgetContainerRef}
                className="flex justify-center min-h-[44px]"
              />

              {/* Fallback: manual Telegram auth link */}
              <a
                href={`https://t.me/${TELEGRAM_BOT_USERNAME}?start=vixor_auth`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 rounded-xl bg-[#2AABEE] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#229ED9] transition-colors active:scale-[0.98]"
              >
                <MessageCircle className="size-5" />
                Open in Telegram
              </a>
            </div>
          )}

          {/* ── Divider ── */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-background text-muted-foreground">or</span>
            </div>
          </div>

          {/* ── Email/Password fallback (collapsible) ── */}
          <div>
            <button
              onClick={() => setShowEmailForm((v) => !v)}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <Mail className="size-3.5" />
              Sign in with email
              {showEmailForm ? (
                <ChevronUp className="size-3.5" />
              ) : (
                <ChevronDown className="size-3.5" />
              )}
            </button>

            {showEmailForm && (
              <form onSubmit={submitEmail} className="mt-3 space-y-3">
                {/* Mode tabs */}
                <div className="flex gap-1 p-1 bg-card border border-border rounded-2xl">
                  {(["signin", "signup"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setEmailMode(m);
                        setErr(null);
                        setSuccess(null);
                      }}
                      className={`flex-1 h-8 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        emailMode === m
                          ? "gradient-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {m === "signin" ? "Sign in" : "Create account"}
                      </button>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-card border border-border outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      minLength={8}
                      autoComplete={emailMode === "signin" ? "current-password" : "new-password"}
                      placeholder="Min 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 pl-4 pr-12 rounded-xl bg-card border border-border outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                    >
                      {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full h-11 rounded-xl bg-card border border-border text-foreground font-semibold flex items-center justify-center gap-2 hover:bg-card-hover disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                  {busy ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <Mail className="size-4" /> {emailMode === "signin" ? "Sign in" : "Create account"}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Footer note */}
          <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
            By continuing you agree to our Terms of Service.
            <br />
            {tgStatus === "webapp"
              ? "Signed in automatically via Telegram."
              : "Open this app in Telegram for instant sign-in."}
          </p>
        </div>
      </div>
    </div>
  );
}
