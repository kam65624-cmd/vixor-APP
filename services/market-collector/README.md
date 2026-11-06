# VIXOR Market Data Collector

خدمة Node.js مستقلة تجمع أسعار Solana من Birdeye مرة واحدة، تخزن آخر snapshot في Redis، وتنشر التغييرات عبر Redis Pub/Sub وSSE للمستخدمين.

## المتغيرات الآمنة

- `BIRDEYE_API_KEY`: يوضع في Secret/Environment Variables على منصة تشغيل الـ Collector فقط. لا تستخدم `VITE_` ولا تضعه في React أو Git.
- `REDIS_URL`: اتصال Redis الخاص بالخدمة.
- `ALLOWED_ORIGINS`: نطاق VIXOR المسموح له بفتح SSE.

انسخ `.env.example` إلى `.env` محليًا فقط، وأضف `.env` إلى ignore. في الإنتاج أضف القيم من Secret Manager في Railway/Fly/Cloud Run أو WebDev Reserved Hosting.

## تشغيل محلي

```bash
cd services/market-collector
npm install
cp .env.example .env
# عدّل REDIS_URL وBIRDEYE_API_KEY
set -a; . ./.env; set +a
npm start
```

اختبار الصحة:

```bash
curl http://localhost:8080/health
curl -N 'http://localhost:8080/stream?tokens=So11111111111111111111111111111111111111112'
```

## ربط العميل

للتوكنات التي تحتوي على `chainId=solana` و`address`، افتح:

```ts
const url = `${import.meta.env.VITE_MARKET_COLLECTOR_URL}/stream?tokens=${addresses.join(",")}`;
const source = new EventSource(url);
source.addEventListener("price", (event) => {
  const snapshot = JSON.parse((event as MessageEvent).data);
  // update the token-specific store only
});
```

`VITE_MARKET_COLLECTOR_URL` عام وليس سرًا. مفتاح Birdeye لا يصل إلى المتصفح.

## الإنتاج

Vercel Serverless مناسب للواجهة لكنه ليس المكان المناسب لعملية polling دائمة وSSE طويل العمر. شغّل هذه الخدمة على منصة persistent، واربطها بـ Redis مُدار، ثم أضف `VITE_MARKET_COLLECTOR_URL` إلى Vercel. أضف `BIRDEYE_API_KEY` و`REDIS_URL` إلى منصة الـ Collector فقط.
