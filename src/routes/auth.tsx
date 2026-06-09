import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { telegramSignIn } from "@/lib/auth.functions";
import { useStableServerFn } from "@/hooks/use-stable-server-fn";
import { BarChart3, Sparkles, Loader2, Eye, EyeOff, TrendingUp, Shield, Zap } from "lucide-react";

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

function AuthPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const tgSignIn = useStableServerFn(telegramSignIn);
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    let active = true;

    // Helper: wait up to 3s for Telegram.WebApp to be injected by the SDK
    const waitForTelegram = (): Promise<any> =>
      new Promise((resolve) => {
        const tg = (window as any).Telegram?.WebApp;
        if (tg) { resolve(tg); return; }
        let attempts = 0;
        const iv = setInterval(() => {
          const t = (window as any).Telegram?.WebApp;
          if (t || attempts++ > 30) { clearInterval(iv); resolve(t ?? null); }
        }, 100);
      });

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user && active) { navigateRef.current({ to: "/" }); return; }

      const tg = await waitForTelegram();
      const initData: string | undefined = tg?.initData;
      if (initData && initData.length > 10) {
        if (active) setBusy(true);
        try {
          const { email, password } = await tgSignIn({ data: { initData } });
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          routerRef.current.invalidate();
          navigateRef.current({ to: "/" });
        } catch (e) {
          if (active) setErr(e instanceof Error ? e.message : "Telegram sign-in failed");
        } finally {
          if (active) setBusy(false);
        }
      }
    })();
    return () => { active = false; };
  }, []);


  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null); setSuccess(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes("Email not confirmed")) {
            setErr("Email not confirmed. Please check your inbox or use a different email.");
          } else if (error.message.includes("Invalid login")) {
            setErr("Wrong email or password. Please try again.");
          } else {
            throw error;
          }
          return;
        }
        router.invalidate();
        navigate({ to: "/" });
      } else {
        // Sign up — use admin path via server fn to skip email confirmation
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: email.split("@")[0] },
          },
        });
        if (error) throw error;
        // Try to sign in immediately (works if email confirmation is disabled)
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) {
          setSuccess("Account created! Check your email to confirm, then sign in.");
          setMode("signin");
        } else {
          router.invalidate();
          navigate({ to: "/" });
        }
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Auth failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

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
                {mode === "signin" ? "Welcome back, trader 👋" : "Start your trading journey"}
              </p>
            </div>
          </div>

          {/* Features strip (signup only) */}
          {mode === "signup" && (
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
          )}

          {/* Mode tabs */}
          <div className="flex gap-1 p-1 bg-card border border-border rounded-2xl">
            {(["signin", "signup"] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setErr(null); setSuccess(null); }}
                className={`flex-1 h-9 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  mode === m
                    ? "gradient-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}>
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</label>
              <input
                type="email" required autoComplete="email"
                placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-card border border-border outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  required minLength={8}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  placeholder="Min 8 characters"
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full h-12 pl-4 pr-12 rounded-xl bg-card border border-border outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all"
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Error / Success messages */}
            {err && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-bearish/10 border border-bearish/20 text-xs text-bearish">
                <span className="mt-0.5">⚠️</span>
                <span>{err}</span>
              </div>
            )}
            {success && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-bullish/10 border border-bullish/20 text-xs text-bullish">
                <span className="mt-0.5">✅</span>
                <span>{success}</span>
              </div>
            )}

            <button type="submit" disabled={busy}
              className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 glow-primary disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98]">
              {busy
                ? <><Loader2 className="size-4 animate-spin" /> Processing…</>
                : <><Sparkles className="size-4" /> {mode === "signin" ? "Sign in" : "Create account"}</>
              }
            </button>
          </form>

          {/* Footer note */}
          <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
            By continuing you agree to our Terms of Service.<br />
            Already in Telegram? Vixor signs you in automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
