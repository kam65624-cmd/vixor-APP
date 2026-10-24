export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://s3.tradingview.com https://s3.tradingview.com/tv.js https://telegram.org",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https: https://s3.tradingview.com https://cdn.dexscreener.com",
  "connect-src 'self' https://*.supabase.co https://api.twelvedata.com https://api.binance.com https://api.telegram.org https://finnhub.io https://api.finnhub.io wss://*.supabase.co wss://stream.binance.com:9443 https://s3.tradingview.com https://*.tradingview.com https://public-api.birdeye.so https://mainnet.helius-rpc.com https://api.twitter.com https://api.dexscreener.com https://lunarcrush.com https://api.lunarcrush.com https://api.coingecko.com",
  "frame-src https://oauth.telegram.org https://telegram.org https://web.telegram.org https://t.me",
  "frame-ancestors 'self' https://web.telegram.org https://t.me",
].join("; ");
