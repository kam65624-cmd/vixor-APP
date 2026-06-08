export function getTelegramInitData(): string | null {
  if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
    return (window as any).Telegram.WebApp.initData || null;
  }
  return null;
}

export function isInsideTelegram(): boolean {
  return !!getTelegramInitData();
}

export function openTelegramInvoice(url: string) {
  if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
    (window as any).Telegram.WebApp.openInvoice(url, (status: string) => {
      console.log("Invoice status:", status);
    });
  }
}
