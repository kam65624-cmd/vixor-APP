import { defineEventHandler } from "h3";

// Static symbol → CoinGecko image URL mapping (top 60 tokens)
const SYMBOL_IMAGE_MAP: Record<string, string> = {
  btc: "https://assets.coingecko.com/coins/images/279/small/bitcoin.png",
  eth: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  sol: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  bnb: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  xrp: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
  doge: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
  ada: "https://assets.coingecko.com/coins/images/975/small/cardano.png",
  avax: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_AVA.png",
  dot: "https://assets.coingecko.com/coins/images/71/small/polkadot-new.png",
  link: "https://assets.coingecko.com/coins/images/877/small/link.png",
  matic: "https://assets.coingecko.com/coins/images/4713/small/polygon.png",
  trx: "https://assets.coingecko.com/coins/images/329/small/tron-logo.png",
  shib: "https://assets.coingecko.com/coins/images/11939/small/shiba_inu.png",
  ltc: "https://assets.coingecko.com/coins/images/128/litecoin-ltc-logo.png",
  uni: "https://assets.coingecko.com/coins/images/12504/small/uniswap.png",
  near: "https://assets.coingecko.com/coins/images/10365/small/near.jpg",
  apt: "https://assets.coingecko.com/coins/images/26463/small/aptos_round.png",
  sui: "https://assets.coingecko.com/coins/images/29350/small/sui-logo.png",
  pepe: "https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg",
  bonk: "https://assets.coingecko.com/coins/images/28620/small/bonk.jpg",
  render: "https://assets.coingecko.com/coins/images/23718/small/render.png",
  fet: "https://assets.coingecko.com/coins/images/12264/small/fetch-ai.jpeg",
  arb: "https://assets.coingecko.com/coins/images/16547/small/arbitrum.png",
  op: "https://assets.coingecko.com/coins/images/1645/small/optimism.png",
  atom: "https://assets.coingecko.com/coins/images/22617/small/atom.png",
  xlm: "https://assets.coingecko.com/coins/images/1005/small/Stellar_symbol_Black.png",
  fil: "https://assets.coingecko.com/coins/images/19782/small/filecoin-fil-logo.png",
  inj: "https://assets.coingecko.com/coins/images/12864/small/INJ.png",
  aave: "https://assets.coingecko.com/coins/images/12648/small/AAVE.png",
  mkr: "https://assets.coingecko.com/coins/images/13457/small/mkr.png",
  usdt: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
  usdc: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png",
  bch: "https://assets.coingecko.com/coins/images/156/small/bitcoin-cash-logo.png",
  icp: "https://assets.coingecko.com/coins/images/11636/small/Internet_Computer_logo.png",
  algo: "https://assets.coingecko.com/coins/images/4380/small/algorand.png",
  vet: "https://assets.coingecko.com/coins/images/4713/small/vechain.png",
  hbar: "https://assets.coingecko.com/coins/images/13573/small/Hedera_HBAR_Logo.png",
  qnt: "https://assets.coingecko.com/coins/images/3685/small/QNT.png",
  egld: "https://assets.coingecko.com/coins/images/12882/small/elrond-egld-logo.png",
  flow: "https://assets.coingecko.com/coins/images/6461/small/flow.png",
  ftm: "https://assets.coingecko.com/coins/images/23131/small/Fantom.png",
  neo: "https://assets.coingecko.com/coins/images/480/small/neo.png",
  eos: "https://assets.coingecko.com/coins/images/739/small/eos.png",
  kava: "https://assets.coingecko.com/coins/images/13421/small/kava.png",
  theta: "https://assets.coingecko.com/coins/images/2542/small/theta-token.png",
  xtz: "https://assets.coingecko.com/coins/images/2568/small/xtz.png",
  snx: "https://assets.coingecko.com/coins/images/3406/small/SNX.png",
  comp: "https://assets.coingecko.com/coins/images/10775/small/COMP.png",
  crv: "https://assets.coingecko.com/coins/images/12124/small/Curve_DAO_Token.png",
  dydx: "https://assets.coingecko.com/coins/images/11636/small/dYdX.png",
  rune: "https://assets.coingecko.com/coins/images/5863/small/rune.png",
  osmo: "https://assets.coingecko.com/coins/images/12155/small/osmosis.png",
  sei: "https://assets.coingecko.com/coins/images/28468/small/Sei_Logo.png",
  tia: "https://assets.coingecko.com/coins/images/26916/small/celestia.png",
  jup: "https://assets.coingecko.com/coins/images/28521/small/JUP.png",
  wif: "https://assets.coingecko.com/coins/images/30818/small/WIF.png",
  jto: "https://assets.coingecko.com/coins/images/28510/small/JTO.png",
  pyth: "https://assets.coingecko.com/coins/images/30137/small/Pyth.png",
  ray: "https://assets.coingecko.com/coins/images/10375/small/raydium.png",
  orca: "https://assets.coingecko.com/coins/images/23511/small/Orca.png",
};

export default defineEventHandler(async (event) => {
  const url = new URL(event.request.url);
  const symbol = url.searchParams.get("symbol")?.toLowerCase().trim();

  if (!symbol) {
    return new Response(
      JSON.stringify({ error: "symbol parameter required" }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=86400",
        },
      },
    );
  }

  const imageUrl = SYMBOL_IMAGE_MAP[symbol];
  if (!imageUrl) {
    return new Response(JSON.stringify({ error: "not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Proxy the image from CoinGecko
  try {
    const res = await fetch(imageUrl, {
      headers: { "User-Agent": "Vixor/1.0" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Upstream ${res.status}`);

    const body = res.body;
    return new Response(body, {
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "image/png",
        "Cache-Control": "public, max-age=604800", // 7 days
        "CDN-Cache-Control": "public, max-age=604800",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "upstream failed" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
});