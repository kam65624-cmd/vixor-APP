import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { telegramSignIn } from "@/lib/auth.functions";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, Sparkles, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Sign in — Vixor" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const tgSignIn = useServerFn(telegramSignIn);

  // Auto-detect Telegram WebApp + redirect if already signed in
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user && active) { navigate({ to: "/" }); return; }

      const tg = (window as any).Telegram?.WebApp;
      const initData: string | undefined = tg?.initData;
      if (initData && initData.length > 10) {
        setBusy(true);
        try {
          const { email, password } = await tgSignIn({ data: { initData } });
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          router.invalidate();
          navigate({ to: "/" });
        } catch (e) {
          if (active) setErr(e instanceof Error ? e.message : "Telegram sign-in failed");
        } finally {
          if (active) setBusy(false);
        }
      }
    })();
    return () => { active = false; };
  }, [navigate, router, tgSignIn]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const fn = mode === "signin"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
      const { error } = await fn;
      if (error) throw error;
      router.invalidate();
      navigate({ to: "/" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Auth failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <div className="size-14 rounded-2xl gradient-primary glow-primary mx-auto flex items-center justify-center">
            <BarChart3 className="size-7 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome to Vixor</h1>
          <p className="text-sm text-muted-foreground">AI-powered chart analysis in seconds</p>
        </div>

        <div className="flex gap-1 vixor-card p-1">
          {(["signin", "signup"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 h-9 rounded-lg text-xs font-semibold transition ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              {m === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input type="email" required autoComplete="email" placeholder="you@example.com"
            value={email} onChange={e => setEmail(e.target.value)}
            className="w-full h-12 px-4 rounded-xl bg-card border border-border outline-none focus:border-primary text-sm" />
          <input type="password" required minLength={8} autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder="Password (min 8 chars)"
            value={password} onChange={e => setPassword(e.target.value)}
            className="w-full h-12 px-4 rounded-xl bg-card border border-border outline-none focus:border-primary text-sm" />
          {err && <div className="text-xs text-bearish px-1">{err}</div>}
          <button type="submit" disabled={busy}
            className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 glow-primary disabled:opacity-50">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="text-[10px] text-center text-muted-foreground">
          Inside Telegram? Vixor signs you in automatically.
        </p>
      </div>
    </div>
  );
}
