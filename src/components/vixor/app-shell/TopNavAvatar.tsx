import { Link, useNavigate } from "@tanstack/react-router";
import { memo, useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/supabase/client";

import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getUserProfile } from "@/shared/data";

// ── Top Nav Avatar — shows real user photo ──────────────────────────────

/** Read Telegram user photo directly from the WebApp API (instant, no server round-trip). */
export function useTelegramPhoto(): string | null {
  const [photo, setPhoto] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const tg = (
        window as unknown as {
          Telegram?: { WebApp?: { initDataUnsafe?: { user?: { photo_url?: string } } } };
        }
      ).Telegram?.WebApp;
      const url = tg?.initDataUnsafe?.user?.photo_url;
      if (url) setPhoto(url);
    } catch {
      // Telegram WebApp API unavailable outside Telegram; safe to ignore.
    }
  }, []);
  return photo;
}

export const TopNavAvatar = memo(function TopNavAvatar() {
  const fetchProfile = useStableServerFn(getUserProfile);
  const tgPhoto = useTelegramPhoto();
  const navigate = useNavigate();

  // Also get Telegram name client-side for the initial fallback
  const [tgName, setTgName] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const tg = (
        window as unknown as {
          Telegram?: {
            WebApp?: { initDataUnsafe?: { user?: { first_name?: string; username?: string } } };
          };
        }
      ).Telegram?.WebApp;
      const user = tg?.initDataUnsafe?.user;
      if (user?.first_name) setTgName(user.first_name);
      else if (user?.username) setTgName(user.username);
    } catch {
      // Telegram WebApp API unavailable outside Telegram; safe to ignore.
    }
  }, []);

  const { data } = useQuery({
    queryKey: ["topnav-profile"],
    queryFn: () => fetchProfile({}),
    staleTime: 60_000,
  });
  const profile = data?.profile;
  // Priority: Telegram client-side photo > server telegram_photo_url > avatar_url
  const photoUrl = tgPhoto || profile?.telegram_photo_url || profile?.avatar_url;
  const displayName = tgName || profile?.display_name || profile?.username || "";
  const initial = (displayName || "U").charAt(0).toUpperCase();
  const [imgErr, setImgErr] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) {
        setUserEmail(data.user.email);
      }
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  const displayUser = userEmail || displayName;
  const truncatedUser =
    displayUser.length > 20 ? displayUser.substring(0, 20) + "..." : displayUser;

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center rounded-full overflow-hidden"
        style={{
          width: "30px",
          height: "30px",
          border: "1px solid var(--color-border)",
          background: photoUrl && !imgErr ? "none" : "var(--gradient-primary)",
          flexShrink: 0,
          minWidth: "44px",
          minHeight: "44px",
          cursor: "pointer",
          padding: 0,
        }}
      >
        {photoUrl && !imgErr ? (
          <img
            src={photoUrl}
            alt={displayName}
            onError={() => setImgErr(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--primary-foreground)" }}>
            {initial}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            background: "rgba(15,17,23,0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            minWidth: "200px",
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            padding: "8px",
          }}
        >
          <div
            style={{
              padding: "12px 14px 10px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              marginBottom: "4px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: "var(--gradient-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span
                style={{ fontSize: "10px", fontWeight: 800, color: "var(--primary-foreground)" }}
              >
                {initial}
              </span>
            </div>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-foreground)" }}>
              {truncatedUser}
            </span>
          </div>

          <Link
            to="/profile"
            onClick={() => setIsOpen(false)}
            style={{
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              borderRadius: "10px",
              transition: "background 0.15s",
              color: "var(--color-foreground)",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            👤 Profile
          </Link>

          <Link
            to="/settings"
            onClick={() => setIsOpen(false)}
            style={{
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              borderRadius: "10px",
              transition: "background 0.15s",
              color: "var(--color-foreground)",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            ⚙️ Settings
          </Link>

          <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />

          <button
            onClick={handleSignOut}
            style={{
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              borderRadius: "10px",
              transition: "background 0.15s",
              color: "#E63946",
              background: "transparent",
              border: "none",
              textAlign: "left",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            🚪 Sign Out
          </button>
        </div>
      )}
    </div>
  );
});
