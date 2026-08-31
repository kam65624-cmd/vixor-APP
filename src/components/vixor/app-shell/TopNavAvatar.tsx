import { Link } from "@tanstack/react-router";
import { memo, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

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

  return (
    <Link
      to="/profile"
      className="flex items-center justify-center rounded-full overflow-hidden"
      style={{
        width: "30px",
        height: "30px",
        border: "1px solid var(--color-border)",
        textDecoration: "none",
        background: photoUrl && !imgErr ? "none" : "var(--gradient-primary)",
        flexShrink: 0,
        minWidth: "44px",
        minHeight: "44px",
      }}
    >
      {photoUrl && !imgErr ? (
        <img
          src={photoUrl}
          alt={displayName}
          onError={() => setImgErr(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" as const }}
        />
      ) : (
        <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--primary-foreground)" }}>
          {initial}
        </span>
      )}
    </Link>
  );
});
