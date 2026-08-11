const fs = require("fs");
const { Document, Packer, Paragraph, TextRun, Header, Footer, AlignmentType, HeadingLevel, PageNumber, Table, TableRow, TableCell, WidthType, TableLayoutType, BorderStyle, ShadingType, PageBreak, SectionType } = require("docx");

const C = { p:"0F172A", b:"1C2A3D", s:"5B6B7D", a:"1B6B7A", sf:"EDF3F5", w:"FFFFFF", g:"808080" };
const hc = (h)=>h.replace("#","");
const NB={style:BorderStyle.NONE,size:0,color:"FFFFFF"};
const tB={top:NB,bottom:NB,left:NB,right:NB,insideHorizontal:NB,insideVertical:NB};
const cB={style:BorderStyle.SINGLE,size:4,color:hc(C.s)};

function h1(t){return new Paragraph({heading:HeadingLevel.HEADING_1,spacing:{before:500,after:200},children:[new TextRun({text:t,bold:true,size:32,color:hc(C.p),font:{ascii:"Calibri",eastAsia:"SimHei"}})]});}
function h2(t){return new Paragraph({heading:HeadingLevel.HEADING_2,spacing:{before:400,after:160},children:[new TextRun({text:t,bold:true,size:28,color:hc(C.p),font:{ascii:"Calibri",eastAsia:"SimHei"}})]});}
function h3(t){return new Paragraph({heading:HeadingLevel.HEADING_3,spacing:{before:300,after:120},children:[new TextRun({text:t,bold:true,size:24,color:hc(C.p),font:{ascii:"Calibri",eastAsia:"SimHei"}})]});}
function p(t){return new Paragraph({alignment:AlignmentType.LEFT,spacing:{line:312,after:100},children:[new TextRun({text:t,size:22,color:hc(C.b),font:{ascii:"Calibri",eastAsia:"Microsoft YaHei"}})]});}
function pb(l,t){return new Paragraph({alignment:AlignmentType.LEFT,spacing:{line:312,after:100},children:[new TextRun({text:l,bold:true,size:22,color:hc(C.p),font:{ascii:"Calibri",eastAsia:"Microsoft YaHei"}}),new TextRun({text:t,size:22,color:hc(C.b),font:{ascii:"Calibri",eastAsia:"Microsoft YaHei"}})]});}
function pk(l,v){return new Paragraph({alignment:AlignmentType.LEFT,spacing:{line:312,after:80},border:{left:{style:BorderStyle.SINGLE,size:6,color:hc(C.a),space:8}},indent:{left:300},children:[new TextRun({text:l+": ",bold:true,size:21,color:hc(C.a),font:{ascii:"Calibri",eastAsia:"SimHei"}}),new TextRun({text:v,size:21,color:hc(C.b),font:{ascii:"Calibri",eastAsia:"Microsoft YaHei"}})]});}

function tbl(headers,rows){
  const w=Math.floor(100/headers.length);
  return new Table({
    width:{size:100,type:WidthType.PERCENTAGE},layout:TableLayoutType.FIXED,
    borders:{top:cB,bottom:cB,left:cB,right:cB,insideHorizontal:cB,insideVertical:cB},
    rows:[
      new TableRow({tableHeader:true,cantSplit:true,children:headers.map(h=>new TableCell({width:{size:w,type:WidthType.PERCENTAGE},shading:{type:ShadingType.CLEAR,fill:hc(C.a)},children:[new Paragraph({spacing:{before:50,after:50},children:[new TextRun({text:h,bold:true,size:18,color:hc(C.w),font:{ascii:"Calibri",eastAsia:"SimHei"}})]})]}))}),
      ...rows.map((r,i)=>new TableRow({cantSplit:true,children:r.map(c=>new TableCell({width:{size:w,type:WidthType.PERCENTAGE},shading:i%2===1?{type:ShadingType.CLEAR,fill:hc(C.sf)}:undefined,children:[new Paragraph({spacing:{before:40,after:40},children:[new TextRun({text:c,size:18,color:hc(C.b),font:{ascii:"Calibri",eastAsia:"Microsoft YaHei"}})]})]}))}))
    ]
  });
}

const sep=()=>new Paragraph({spacing:{before:100,after:100},border:{top:{style:BorderStyle.SINGLE,size:2,color:hc(C.a),space:6}},children:[]});

// ═══ COVER ═══
const coverChildren=[
  new Paragraph({spacing:{before:4000},children:[]}),
  new Paragraph({indent:{left:1200,right:800},spacing:{after:400},border:{bottom:{style:BorderStyle.SINGLE,size:6,color:hc(C.g),space:8}},children:[new TextRun({text:"V I X O R   A R C H I T E C T U R E   V 2",size:18,color:hc(C.g),font:{ascii:"Calibri"},characterSpacing:30})]}),
  new Paragraph({indent:{left:1200},spacing:{after:200,line:800,lineRule:"atLeast"},children:[new TextRun({text:"\u0628\u062D\u062B OSS \u0627\u0644\u0645\u0639\u0645\u0642",size:72,bold:true,color:hc(C.w),font:{eastAsia:"SimHei",ascii:"Arial"}})]}),
  new Paragraph({indent:{left:1200},spacing:{after:100,line:600,lineRule:"atLeast"},children:[new TextRun({text:"\u0648\u0645\u0635\u0641\u0648\u0641\u0629 \u0627\u0644\u062A\u0643\u0627\u0645\u0644 \u0648\u0627\u0644\u0647\u064A\u0643\u0644 \u0627\u0644\u062C\u062F\u064A\u062F",size:36,color:hc(C.g),font:{eastAsia:"Microsoft YaHei",ascii:"Arial"}})]}),
  new Paragraph({indent:{left:1200},spacing:{after:800},children:[new TextRun({text:"5 Deliverables | 7 Categories | 22 OSS Projects | File-Level Mapping",size:22,color:hc(C.g),font:{ascii:"Calibri"}})]}),
  new Paragraph({indent:{left:1400},spacing:{after:60},border:{left:{style:BorderStyle.SINGLE,size:6,color:hc(C.g),space:8}},children:[new TextRun({text:"\u062A\u0627\u0631\u064A\u062E: 2026-08-09",size:20,color:hc(C.g),font:{ascii:"Calibri",eastAsia:"Microsoft YaHei"}})]}),
  new Paragraph({indent:{left:1400},spacing:{after:60},border:{left:{style:BorderStyle.SINGLE,size:6,color:hc(C.g),space:8}},children:[new TextRun({text:"\u0627\u0644\u0646\u0633\u062E\u0629: Research-Only (Zero Code Changes)",size:20,color:hc(C.g),font:{ascii:"Calibri",eastAsia:"Microsoft YaHei"}})]}),
  new Paragraph({indent:{left:1400},spacing:{after:60},border:{left:{style:BorderStyle.SINGLE,size:6,color:hc(C.g),space:8}},children:[new TextRun({text:"\u0627\u0644\u062D\u0627\u0644\u0629: \u0645\u0639\u0644\u0642 \u062D\u062A\u0649 \u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645",size:20,color:hc(C.g),font:{ascii:"Calibri",eastAsia:"Microsoft YaHei"}})]}),
  new Paragraph({spacing:{before:2000},children:[]}),
  new Paragraph({indent:{left:1200,right:800},border:{top:{style:BorderStyle.SINGLE,size:2,color:hc(C.g),space:8}},children:[new TextRun({text:"VIXOR \u2014 Confidential",size:16,color:hc(C.g),font:{ascii:"Calibri"}})]}),
];

const coverSection={properties:{page:{size:{width:11906,height:16838},margin:{top:0,bottom:0,left:0,right:0}}},
  children:[new Table({width:{size:100,type:WidthType.PERCENTAGE},layout:TableLayoutType.FIXED,borders:tB,
    rows:[new TableRow({height:{value:16838,rule:"exact"},children:[new TableCell({shading:{type:ShadingType.CLEAR,fill:"162235"},borders:{top:NB,bottom:NB,left:NB,right:NB},children:coverChildren})]})]})]};

// ═══ BODY CONTENT ═══
const body=[];

// TOC placeholder
body.push(new Paragraph({spacing:{before:200,after:200},children:[new TextRun({text:"\u0641\u0647\u0631\u0633 \u0627\u0644\u0645\u062D\u062A\u0648\u064A\u0627\u062A",bold:true,size:32,color:hc(C.p),font:{eastAsia:"SimHei"}})]}));
body.push(p("\u0627\u0644\u0642\u0637\u0631\u064A\u0629 \u0627\u0644\u0623\u0648\u0644\u0649: \u0628\u062D\u062B OSS \u0627\u0644\u0645\u0634\u0627\u0631\u064A\u0639 \u0627\u0644\u0645\u0641\u062A\u0648\u062D\u0629 (7 \u0641\u0626\u0627\u062A, 22 \u0645\u0634\u0631\u0648\u0639)"));
body.push(p("\u0627\u0644\u0642\u0637\u0631\u064A\u0629 \u0627\u0644\u062B\u0627\u0646\u064A\u0629: \u0645\u0635\u0641\u0648\u0641\u0629 \u0627\u0644\u062A\u0643\u0627\u0645\u0644 (A-E Classification + File-Level Mapping)"));
body.push(p("\u0627\u0644\u0642\u0637\u0631\u064A\u0629 \u0627\u0644\u062B\u0627\u0644\u062B\u0629: \u0627\u0644\u0647\u064A\u0643\u0644 \u0627\u0644\u062C\u062F\u064A\u062F (Architecture V2)"));
body.push(p("\u0627\u0644\u0642\u0637\u0631\u064A\u0629 \u0627\u0644\u0631\u0627\u0628\u0639\u0629: \u0647\u064A\u0643\u0644 \u0627\u0644\u0635\u0641\u062D\u0627\u062A (Page Architecture V2)"));
body.push(p("\u0627\u0644\u0642\u0637\u0631\u064A\u0629 \u0627\u0644\u062E\u0627\u0645\u0633\u0629: \u0627\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A\u0629 \u0627\u0644\u062A\u062D\u0648\u064A\u0644 (Migration Strategy)"));

body.push(new Paragraph({children:[new PageBreak()]}));

// ═══ DELIVERABLE 1: OSS RESEARCH ═══
body.push(h1("\u0627\u0644\u0642\u0637\u0631\u064A\u0629 \u0627\u0644\u0623\u0648\u0644\u0649: \u0628\u062D\u062B \u0627\u0644\u0645\u0634\u0627\u0631\u064A\u0639 \u0627\u0644\u0645\u0641\u062A\u0648\u062D\u0629 (OSS Research)"));
body.push(p("\u0647\u0630\u0627 \u0627\u0644\u0642\u0633\u0645 \u064A\u063A\u0637\u064A 22 \u0645\u0634\u0631\u0648\u0639\u0627\u064B \u0645\u0641\u062A\u0648\u062D \u0627\u0644\u0645\u0635\u062F\u0631 \u0639\u0628\u0631 7 \u0641\u0626\u0627\u062A. \u0643\u0644 \u0645\u0634\u0631\u0648\u0639 \u0645\u0631\u0628\u0648\u0637 \u0628\u0645\u0644\u0641\u0627\u062A VIXOR \u0627\u0644\u0645\u062D\u062F\u062F\u0629 \u0648\u0645\u0635\u0646\u0641 A-E. \u0627\u0644\u062A\u0635\u0646\u064A\u0641\u0627\u062A: A=\u062A\u0643\u0627\u0645\u0644 \u0645\u0628\u0627\u0634\u0631, B=\u0645\u062D\u0648\u0644/\u062E\u062F\u0645\u0629, C=\u0645\u0631\u062C\u0639 \u0647\u064A\u0643\u0644\u064A, D=\u0645\u0631\u062C\u0639 UX, E=\u0644\u0627 \u064A\u064F\u0633\u062A\u062E\u062F\u0645."));

// Cat 1
body.push(h2("\u0627\u0644\u0641\u0626\u0629 1: \u0627\u0644\u062A\u062F\u0627\u0648\u0644 \u0648\u0627\u0644\u062A\u0646\u0641\u064A\u0630 (Trading & Execution)"));

body.push(h3("1.1 CCXT v4.5 \u2014 \u0645\u062F\u0645\u062C \u062D\u0627\u0644\u064A\u0627\u064B | \u062A\u0635\u0646\u064A\u0641: A"));
body.push(p("\u0645\u0643\u062A\u0628\u0629 JavaScript \u0644\u0644\u062A\u062F\u0627\u0648\u0644 \u0639\u0628\u0631 100+ \u0628\u0648\u0631\u0635\u0629. \u0645\u062F\u0645\u062C \u0641\u064A VIXOR \u0639\u0628\u0631 ccxt ^4.5.64 \u0641\u064A package.json. \u064A\u0648\u0641\u0631 \u0648\u0627\u062C\u0647\u0629 \u0645\u0648\u062D\u062F\u0629 \u0644\u0644\u0623\u0648\u0627\u0645\u0631 \u0648\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0633\u0648\u0642 \u0648WebSocket."));
body.push(pk("\u0627\u0644\u0645\u0644\u0641\u0627\u062A","ccxt-generic-adapter.ts, binance-adapter.ts, bybit-adapter.ts, okx-adapter.ts, exness-adapter.ts"));
body.push(pk("\u0627\u0644\u0646\u0642\u0627\u0637","\u062A\u063A\u0637\u064A\u0629 \u0648\u0627\u0633\u0639\u0629 (Binance/Bybit/OKX/Exness), API \u0645\u0648\u062D\u062F, WebSocket"));
body.push(pk("\u0627\u0644\u0636\u0639\u0641","\u062D\u062C\u0645 \u0643\u0628\u064A\u0631 (externalized \u0641\u064A vite.config.ts), \u0644\u0627 \u064A\u062F\u0639\u0645 Solana DEX \u0645\u0628\u0627\u0634\u0631\u0629"));

body.push(h3("1.2 Hummingbot | \u062A\u0635\u0646\u064A\u0641: C"));
body.push(p("\u0645\u0646\u0635\u0629 \u062A\u062F\u0627\u0648\u0644 \u0645\u0641\u062A\u0648\u062D\u0629 (Python): market making, arbitrage, DEX trading. \u0647\u064A\u0643\u0644 V2 \u0645\u0639 Strategy Controller + Executor + Data Feed. \u0646\u0645\u0637 Connectors \u0644\u0644\u0628\u0648\u0631\u0635\u0627\u062A."));
body.push(pk("\u0627\u0644\u0627\u0633\u062A\u0644\u0647\u0627\u0645","pure-function strategies \u0644\u062A\u062D\u0633\u064A\u0646 arbitrage/strategies/base.ts, Connector pattern \u0644\u062A\u062D\u0633\u064A\u0646 trading/gateway/adapters/"));

body.push(h3("1.3 FreqTrade | \u062A\u0635\u0646\u064A\u0641: C"));
body.push(p("\u0631\u0648\u0628\u0648\u062A \u062A\u062F\u0627\u0648\u0644 \u0639\u0645\u0644\u0627\u062A (Python) \u0645\u0639 backtesting engine + hyperopt. strategy classes \u0645\u0639 populate_indicators/populate_entry/exit_trend."));
body.push(pk("\u0627\u0644\u0627\u0633\u062A\u0644\u0647\u0627\u0645","backtesting architecture \u0644backtest/engine/simulator.ts, strategy lifecycle \u0644strategy/runtime/script-runtime.ts"));

// Cat 2
body.push(h2("\u0627\u0644\u0641\u0626\u0629 2: \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0633\u0648\u0642 (Market Data)"));

body.push(h3("2.1 TradingView Lightweight Charts v5.2 | \u062A\u0635\u0646\u064A\u0641: A"));
body.push(p("\u0645\u0643\u062A\u0628\u0629 \u0631\u0633\u0648\u0645 \u0628\u064A\u0627\u0646\u064A\u0629 \u062E\u0641\u064A\u0641\u0629. \u0645\u062F\u0645\u062C \u0639\u0628\u0631 lightweight-charts ^5.2.0 + lightweight-charts-indicators ^0.4.2."));
body.push(pk("\u0627\u0644\u0645\u0644\u0641\u0627\u062A","CandlestickChart.tsx, DexChart.tsx, MiniSparkline.tsx (Recharts), EquityChart.tsx (Recharts)"));

body.push(h3("2.2 DeFiLlama SDK | \u062A\u0635\u0646\u064A\u0641: B"));
body.push(p("SDK \u0645\u0641\u062A\u0648\u062D \u0644\u0628\u064A\u0627\u0646\u0627\u062A DeFi: TVL, fees, yields, prices. API \u0645\u062C\u0627\u0646\u064A \u0628\u062F\u0648\u0646 rate limit. 200+ chains."));
body.push(pk("\u0627\u0644\u062A\u0643\u0627\u0645\u0644","\u0625\u0636\u0627\u0641\u0629 shared/market-data/defillama.client.ts \u0644\u0635\u0641\u062D\u0627\u062A yield.tsx, curves.tsx, portfolio.tsx"));

body.push(h3("2.3 Binance WebSocket | \u062A\u0635\u0646\u064A\u0641: A"));
body.push(p("\u0645\u062F\u0645\u062C \u062D\u0627\u0644\u064A\u0627\u064B \u0639\u0628\u0631 shared/market-data/binance-ws.ts. \u064A\u0648\u0641\u0631 real-time prices \u0644\u0640 use-live-prices.ts hook."));
body.push(pk("\u0627\u0644\u0645\u0644\u0641\u0627\u062A","binance-ws.ts, use-live-prices.ts \u2192 \u064A\u063A\u0630\u064A radar.tsx, discover.tsx, signals.tsx"));

body.push(h3("2.4 TwelveData | \u062A\u0635\u0646\u064A\u0641: A"));
body.push(p("OHLCV + forex data. \u0645\u062F\u0645\u062C \u0639\u0628\u0631 domains/market/server/twelvedata.ts. \u064A\u063A\u0630\u064A analysis engine \u0648charts page."));
body.push(pk("\u0627\u0644\u0645\u0644\u0641\u0627\u062A","twelvedata.ts \u2192 analysis/server/run-analysis.ts, charts.tsx"));

// Cat 3
body.push(h2("\u0627\u0644\u0641\u0626\u0629 3: \u0630\u0643\u0627\u0621 \u0627\u0644\u062A\u0648\u0643\u0646\u0627\u062A (Token Intelligence)"));

body.push(h3("3.1 Birdeye API | \u062A\u0635\u0646\u064A\u0641: A"));
body.push(p("on-chain analytics \u0644\u0640 Solana + EVM. \u0645\u062F\u0645\u062C \u0639\u0628\u0631 discovery/clients/birdeye.client.ts. \u064A\u0648\u0641\u0631 token metadata, trade data, whale tracking."));
body.push(pk("\u0627\u0644\u0645\u0644\u0641\u0627\u062A","birdeye.client.ts \u2192 discovery/functions.ts (scoring), discover.tsx"));

body.push(h3("3.2 LunarCrush | \u062A\u0635\u0646\u064A\u0641: A"));
body.push(p("Social sentiment \u0644\u0644\u0639\u0645\u0644\u0627\u062A. \u0645\u062F\u0645\u062C \u0639\u0628\u0631 discovery/clients/lunarcrush.client.ts. Galaxy Score + AltRank \u0644\u0640 Discovery scoring."));
body.push(pk("\u0627\u0644\u0645\u0644\u0641\u0627\u062A","lunarcrush.client.ts \u2192 discovery/scoring.ts (social weight)"));

body.push(h3("3.3 DexScreener | \u062A\u0635\u0646\u064A\u0641: A"));
body.push(p("DEX analytics. \u0645\u062F\u0645\u062C \u0639\u0628\u0631 3 \u0645\u0644\u0641\u0627\u062A: dexscreener.ts (REST), dexscreener-ws.ts (WS), dexscreener.client.ts (Discovery)."));
body.push(pk("\u0627\u0644\u0645\u0644\u0641\u0627\u062A","dexscreener.ts, dexscreener-ws.ts, dexscreener.client.ts \u2192 discover.tsx, token.$symbol.tsx, use-discover-live-prices.ts"));

body.push(h3("3.4 Helius RPC | \u062A\u0635\u0646\u064A\u0641: A"));
body.push(p("Solana on-chain data. \u0645\u062F\u0645\u062C \u0639\u0628\u0631 shared/market-data/helius-rpc.ts + discovery/clients/helius.client.ts. Smart money wallets + DEX data."));
body.push(pk("\u0627\u0644\u0645\u0644\u0641\u0627\u062A","helius-rpc.ts, helius.client.ts \u2192 whale.tsx, discovery/scoring.ts"));

body.push(h3("3.5 Twitter/X Client | \u062A\u0635\u0646\u064A\u0641: A"));
body.push(p("Social signals. \u0645\u062F\u0645\u062C \u0639\u0628\u0631 discovery/clients/twitter.client.ts. \u064A\u063A\u0630\u064A scoring \u0648discovery."));
body.push(pk("\u0627\u0644\u0645\u0644\u0641\u0627\u062A","twitter.client.ts \u2192 discovery/scoring.ts, discovery/functions.ts"));

body.push(h3("3.6 Mobula | \u062A\u0635\u0646\u064A\u0641: A"));
body.push(p("Multi-chain market data. \u0645\u062F\u0645\u062C \u0639\u0628\u0631 discovery/clients/mobula.client.ts. \u064A\u0643\u0645\u0644 Birdeye/LunarCrush."));
body.push(pk("\u0627\u0644\u0645\u0644\u0641\u0627\u062A","mobula.client.ts \u2192 discovery/functions.ts, use-live-prices.ts"));

// Cat 4
body.push(h2("\u0627\u0644\u0641\u0626\u0629 4: \u0627\u0644\u062A\u062D\u0644\u064A\u0644 \u0648\u0627\u0644\u0628\u0643\u062A\u0633\u062A\u064A\u0646\u062C (Analytics & Backtesting)"));

body.push(h3("4.1 tulip node | \u062A\u0635\u0646\u064A\u0641: B"));
body.push(p("\u0645\u0643\u062A\u0628\u0629 JS \u0644\u0644\u0645\u0624\u0634\u0631\u0627\u062A \u0627\u0644\u062A\u0642\u0646\u064A\u0629 (RSI, MACD, Bollinger, ATR) \u0628\u0646\u0641\u0633 \u0645\u0646\u0637 TALib. 100+ \u0645\u0624\u0634\u0631. VIXOR \u0644\u062F\u064A\u0647 \u0645\u0624\u0634\u0631\u0627\u062A \u0645\u062E\u0635\u0635\u0629 \u0641\u064A analysis/engine/indicators/"));
body.push(pk("\u0627\u0644\u062A\u0643\u0627\u0645\u0644","\u0625\u0636\u0627\u0641\u0629 tulip-node \u0648\u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0627\u0644\u0645\u0624\u0634\u0631\u0627\u062A \u0627\u0644\u0645\u062E\u0635\u0635\u0629: indicator-math.ts, regime-detector.ts, strategy-scorer.ts"));

body.push(h3("4.2 Backtrader | \u062A\u0635\u0646\u064A\u0641: C"));
body.push(p("\u0625\u0637\u0627\u0631 backtesting (Python). Cerebro engine + Strategy + Analyzers + Sizers. VIXOR \u0644\u062F\u064A\u0647 \u0645\u062Dر\u0643 \u0623\u0628\u0633\u0637 \u0641\u064A backtest/engine/"));
body.push(pk("\u0627\u0644\u0627\u0633\u062A\u0644\u0647\u0627\u0645","Analyzer pattern \u0644metrics.ts, Sizer pattern \u0644risk-reward.ts, Observer \u0644event hooks"));

// Cat 5
body.push(h2("\u0627\u0644\u0641\u0626\u0629 5: \u0627\u0644\u0631\u0633\u0648\u0645 \u0627\u0644\u0628\u064A\u0627\u0646\u064A\u0629 (Charts & Visualization)"));

body.push(h3("5.1 Recharts | \u062A\u0635\u0646\u064A\u0641: A"));
body.push(p("\u0645\u0643\u062A\u0628\u0629 React charts. \u0645\u062F\u0645\u062C \u0639\u0628\u0631 recharts ^2.15.4. \u064A\u0633\u062A\u062E\u062F\u0645 \u0644\u0640 MiniSparkline (Line) \u0648EquityChart (AreaChart)."));
body.push(pk("\u0627\u0644\u0645\u0644\u0641\u0627\u062A","MiniSparkline.tsx, EquityChart.tsx, ui/chart.tsx (shadcn wrappers)"));

body.push(h3("5.2 ECharts | \u062A\u0635\u0646\u064A\u0641: D"));
body.push(p("\u0645\u0643\u062A\u0628\u0629 Apache. heatmap, treemap, sankey, graph, radar. \u064A\u0645\u0643\u0646 \u0625\u0636\u0627\u0641\u062A\u0647 \u0644\u0644\u062F\u0627\u0634\u0628\u0648\u0631\u062F\u0627\u062A \u0627\u0644\u0645ت\u0642د\u0645\u0629. \u0627\u0644\u0639\u064A\u0628: \u062Dجم 1MB+."));
body.push(pk("\u0627\u0644\u062A\u0643\u0627\u0645\u0644 \u0627\u0644\u0645\u0642\u062A\u0631\u062D","\u0625ضافة \u0644\u0635فحات: radar.tsx, pnl.tsx, portfolio.tsx, whale.tsx (network graph)"));

body.push(h3("5.3 TradingView Embed Widgets | \u062A\u0635ن\u064A\u0641: A"));
body.push(p("\u0645دمج \u0639بر 4 \u0645كونات: TradingViewChart.tsx (full widget), TradingViewMiniChart.tsx, TradingViewTechAnalysis.tsx, TradingViewTickerTape.tsx."));
body.push(pk("\u0627\u0644ملفا\u062A","\u064Aغذي charts.tsx, token.$symbol.tsx, radar.tsx"));

// Cat 6
body.push(h2("\u0627\u0644فئة 6: Frontend & UI"));

body.push(h3("6.1 shadcn/ui + Radix UI | \u062Aصنيف: A"));
body.push(p("\u0645دمج: shadcn/ui (45 \u0645كون) + Radix UI (22 packages) + Framer Motion ^12.40.0 + Tailwind CSS 4.2. \u0647ذا \u0647و stack \u0627ل\u0640 UI \u0627لأساس\u064A."));
body.push(pk("\u0627لملفا\u062A","components/ui/ (45 files), components/vixor/ (44 files), styles.css"));

body.push(h3("6.2 TanStack Query + Router + Virtual | \u062Aصنيف: A"));
body.push(p("\u0645دمج: @tanstack/react-query ^5.83, @tanstack/react-router 1.170, @tanstack/react-start 1.168, @tanstack/react-virtual ^3.14. \u0647ذا \u0647و stack \u0627ل\u0640 data/routing \u0627لأساس\u064A."));
body.push(pk("\u0627\u0644ملفا\u062A","routes/ (41 files), shared/hooks/use-stable-server-fn.ts, shared/utils/virtual-list.tsx"));

body.push(h3("6.3 Zustand | \u062Aصني\u0641: A"));
body.push(p("\u0645دمج \u0639بر zustand ^5.0.14. \u064Aستخد\u0645 \u0644\u0640 client state management. \u0645\u0643\u0645\u0644 \u0644\u0640 TanStack Query (server state)."));

body.push(h3("6.4 Tremor | \u062Aصني\u0641: E"));
body.push(p("React dashboard components. \u0645ب\u0646\u064A \u0639\u0644\u0649 Tailwind. \u0644\u0627 \u064Aحت\u0627\u062C: shadcn/ui + Recharts \u064Aغطي\u0627\u0646 \u0643\u0644 \u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0627\u0644\u062F\u0627\u0634\u0628\u0648\u0631\u062F."));

// Cat 7
body.push(h2("\u0627\u0644\u0641ئ\u0629 7: AI & Agent Frameworks"));

body.push(h3("7.1 Vercel AI SDK v6 | \u062A\u0635\u0646ي\u0641: A"));
body.push(p("\u0645د\u0645\u062C \u0639ب\u0631 ai ^6.0.224. \u064Aست\u062Eد\u0645 \u0641\u064A MOXI (moxi/functions.ts), Debate (debate/engine/), Chart Intelligence, Experiment. \u0645ع @ai-sdk/openai, @ai-sdk/google, @ai-sdk/openai-compatible."));
body.push(pk("\u0627\u0644م\u0644ف\u0627\u062A","moxi/server/agent.ts, debate/engine/debate.engine.ts, chart-intelligence/chart-vision.ts, experiment/runner.ts"));

body.push(h3("7.2 Mastra | \u062Aصني\u0641: B"));
body.push(p("\u0625طا\u0631 AI agent (TypeScript). يدع\u0645 tool-use, memory, RAG, workflow. \u064aمكن أن يحل محل Vercel AI SDK \u0644ـ MOXI agents لأنه مصمم لـ multi-agent workflows."));
body.push(pk("\u0627\u0644\u062Aكام\u0644","\u062Aحسين moxi/agents.ts + moxi/server/*.agent.ts + debate/engine/ \u0628\u0627\u0633\u062a\u062eد\u0627م Mastra tool-use"));

body.push(h3("7.3 CrewAI | \u062A\u0635ني\u0641: C"));
body.push(p("\u0625طا\u0631 multi-agent (Python). \u064aدعم task delegation, role-based agents, sequential/parallel execution. \u0645فيد \u0644\u062aحسين debate engine وMOXI agent dispatch."));
body.push(pk("\u0627\u0644\u0627س\u062a\u0644\u0647\u0627\u0645","multi-agent patterns \u0644debate/engine/debate.engine.ts, role dispatch \u0644moxi/agents.ts"));

body.push(h3("7.4 LangChain | \u062A\u0635ن\u064a\u0641: E"));
body.push(p("\u0625طار LLM orchestration. \u0645ع\u0642د جدا\u064B \u0644احتياجات VIXOR. Vercel AI SDK + Mastra \u0623بسط وأ\u0643ثر TypeScript-native."));

// ═══ DELIVERABLE 2: INTEGRATION MATRIX ═══
body.push(new Paragraph({children:[new PageBreak()]}));
body.push(h1("\u0627\u0644\u0642\u0637\u0631\u064a\u0629 \u0627\u0644\u062b\u0627\u0646\u064a\u0629: \u0645\u0635\u0641\u0648\u0641\u0629 \u0627\u0644\u062a\u0643\u0627\u0645\u0644 (Integration Matrix)"));
body.push(p("\u062c\u062f\u0648\u0644 A-E classification \u0645\u0639 \u0631\u0628\u0637 \u0643\u0644 \u0645\u0634\u0631\u0648\u0639 \u0628\u0627\u0644\u0645\u0644\u0641\u0627\u062a \u0627\u0644\u0645\u062d\u062f\u062f\u0629 \u0641\u064a VIXOR."));

body.push(h2("A = \u062a\u0643\u0627\u0645\u0644 \u0645\u0628\u0627\u0634\u0631 (14 \u0645\u0634\u0631\u0648\u0639)"));
body.push(tbl(
  ["\u0627\u0644\u0645\u0634\u0631\u0648\u0639","\u0627\u0644\u062d\u0627\u0644\u0629","\u0627\u0644\u0645\u0644\u0641\u0627\u062a \u0627\u0644\u0645\u062a\u0623\u062b\u0631\u0629"],
  [
    ["CCXT v4.5","\u0645\u062f\u0645\u062c","trading/gateway/adapters/*, arbitrage/exchanges/*"],
    ["Lightweight Charts","\u0645\u062f\u0645\u062c","CandlestickChart.tsx, DexChart.tsx"],
    ["Recharts","\u0645\u062f\u0645\u062c","MiniSparkline.tsx, EquityChart.tsx, ui/chart.tsx"],
    ["TradingView Widgets","\u0645\u062f\u0645\u062c","TradingViewChart.tsx, MiniChart.tsx, TechAnalysis.tsx, TickerTape.tsx"],
    ["Birdeye","\u0645\u062f\u0645\u062c","discovery/clients/birdeye.client.ts"],
    ["LunarCrush","\u0645\u062f\u0645\u062c","discovery/clients/lunarcrush.client.ts"],
    ["DexScreener","\u0645\u062f\u0645\u062c","market-data/dexscreener*.ts, discovery/clients/dexscreener.client.ts"],
    ["Helius RPC","\u0645\u062f\u0645\u062c","market-data/helius-rpc.ts, discovery/clients/helius.client.ts"],
    ["Twitter/X","\u0645\u062f\u0645\u062c","discovery/clients/twitter.client.ts"],
    ["Mobula","\u0645\u062f\u0645\u062c","discovery/clients/mobula.client.ts"],
    ["Binance WS","\u0645\u062f\u0645\u062c","market-data/binance-ws.ts"],
    ["TwelveData","\u0645\u062f\u0645\u062c","market/server/twelvedata.ts"],
    ["Vercel AI SDK","\u0645\u062f\u0645\u062c","moxi/, debate/, chart-intelligence/, experiment/"],
    ["shadcn/ui + Radix","\u0645\u062f\u0645\u062c","components/ui/ (45), components/vixor/ (44)"],
  ]
));

body.push(h2("B = \u0645\u062d\u0648\u0644/\u062e\u062f\u0645\u0629 (3 \u0645\u0634\u0627\u0631\u064a\u0639)"));
body.push(tbl(
  ["\u0627\u0644\u0645\u0634\u0631\u0648\u0639","\u0627\u0644\u0625\u0636\u0627\u0641\u0629","\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u062c\u062f\u064a\u062f","\u0627\u0644\u0635\u0641\u062d\u0627\u062a \u0627\u0644\u0645\u0633\u062a\u0641\u064a\u062f\u0629"],
  [
    ["DeFiLlama SDK","TVL/yield data","shared/market-data/defillama.client.ts","yield.tsx, curves.tsx, portfolio.tsx"],
    ["tulip node","\u0645\u0624\u0634\u0631\u0627\u062a ت\u0642\u0646\u064a\u0629","analysis/engine/indicators/tulip-adapter.ts","analyze.tsx, analysis.$id.tsx"],
    ["Mastra","AI agent framework","moxi/mastra-adapter.ts","copilot, moxi agents"],
  ]
));

body.push(h2("C = \u0645\u0631\u062c\u0639 \u0647\u064a\u0643\u0644\u064a (4 \u0645\u0634\u0627\u0631\u064a\u0639)"));
body.push(tbl(
  ["\u0627\u0644\u0645\u0634\u0631\u0648\u0639","\u0627\u0644\u0627\u0633\u062a\u0644\u0647\u0627\u0645","\u0627\u0644\u0645\u0644\u0641\u0627\u062a \u0627\u0644\u0645\u0633\u062a\u0641\u064a\u062f\u0629"],
  [
    ["Hummingbot","pure-function strategies, Connector pattern","arbitrage/strategies/base.ts, trading/gateway/adapters/"],
    ["FreqTrade","backtesting architecture, strategy lifecycle","backtest/engine/*, strategy/runtime/*"],
    ["Backtrader","Analyzer, Sizer, Observer patterns","backtest/engine/metrics.ts, analysis/engine/risk/risk-reward.ts"],
    ["CrewAI","multi-agent, role dispatch","debate/engine/debate.engine.ts, moxi/agents.ts"],
  ]
));

body.push(h2("D = \u0645\u0631\u062c\u0639 UX (1 \u0645\u0634\u0631\u0648\u0639)"));
body.push(tbl(
  ["\u0627\u0644\u0645\u0634\u0631\u0648\u0639","\u0627\u0644\u0627\u0633\u062a\u0644\u0647\u0627\u0645","\u0627\u0644\u0635\u0641\u062d\u0627\u062a"],
  [
    ["ECharts","heatmap, treemap, sankey, radar","radar.tsx, pnl.tsx, portfolio.tsx, whale.tsx"],
  ]
));

body.push(h2("E = \u0644\u0627 \u064a\u064f\u0633\u062a\u062e\u062f\u0645 (2 \u0645\u0634\u0631\u0648\u0639)"));
body.push(tbl(
  ["\u0627\u0644\u0645\u0634\u0631\u0648\u0639","\u0627\u0644\u0633\u0628\u0628"],
  [
    ["Tremor","shadcn/ui + Recharts \u064a\u063a\u0637\u064a\u0627\u0646 \u0643\u0644 \u0627\u062d\u062a\u064a\u0627\u062c. \u0625\u0636\u0627\u0641\u0629 \u0645\u0632\u062f\u0648\u062c\u0629 \u0644\u0644\u062d\u0632\u0645\u0629."],
    ["LangChain","\u0645\u0639\u0642\u062f \u062c\u062f\u0627\u064b. Vercel AI SDK + Mastra \u0623\u0628\u0633\u0637 \u0648TypeScript-native."],
  ]
));

// ═══ DELIVERABLE 3: ARCHITECTURE V2 ═══
body.push(new Paragraph({children:[new PageBreak()]}));
body.push(h1("\u0627\u0644\u0642\u0637\u0631\u064a\u0629 \u0627\u0644\u062b\u0627\u0644\u062b\u0629: \u0627\u0644\u0647\u064a\u0643\u0644 \u0627\u0644\u062c\u062f\u064a\u062f (Architecture V2)"));
body.push(p("\u0647\u064a\u0643\u0644 VIXOR \u0627\u0644\u0645\u0642\u062a\u0631\u062d \u0645\u0639 \u0646\u0642\u0627\u0637 \u062a\u0643\u0627\u0645\u0644 OSS. \u0627\u0644\u0647\u064a\u0643\u0644 \u0627\u0644\u062d\u0627\u0644\u064a: TanStack Start (SSR) + React 19 + Supabase + Vercel AI SDK. \u0627\u0644\u0647\u064a\u0643\u0644 V2 \u064a\u0636\u064a\u0641 3 \u0637\u0628\u0642\u0627\u062a \u062c\u062f\u064a\u062f\u0629."));

body.push(h2("\u0627\u0644\u0637\u0628\u0642\u0629 1: Presentation (\u063a\u064a\u0631 \u0645\u062a\u063a\u064a\u0631\u0629)"));
body.push(p("Routes (41 file) + Components (44 vixor + 45 shadcn) + Hooks. \u0644\u0627 \u062a\u063a\u064a\u064a\u0631 \u0647\u064a\u0643\u0644\u064a. \u0627\u0644\u062a\u062d\u0633\u064a\u0646\u0627\u062a \u0627\u0644\u0645\u0642\u062a\u0631\u062d\u0629: ECharts \u0644\u0644\u062f\u0627\u0634\u0628\u0648\u0631\u062f\u0627\u062a \u0627\u0644\u0645\u062a\u0642\u062f\u0645\u0629 (radar, pnl, whale)."));

body.push(h2("\u0627\u0644\u0637\u0628\u0642\u0629 2: Domain Logic (\u062a\u062d\u0633\u064a\u0646 \u0645\u062d\u062f\u0648\u062f)"));
body.push(p("18 domain \u0645\u0648\u062c\u0648\u062f\u0629. \u0627\u0644\u062a\u063a\u064a\u064a\u0631 \u0627\u0644\u0623\u0633\u0627\u0633\u064a: \u062a\u062d\u0644\u064a\u0644/engine/indicators/ \u064a\u0633\u062a\u062e\u062f\u0645 tulip-node \u0628\u062f\u0644 \u0627\u0644\u0645\u0624\u0634\u0631\u0627\u062a \u0627\u0644\u0645\u062e\u0635\u0635\u0629. backtest/engine/ \u064a\u0633\u062a\u0644\u0647\u0645 Observer/Analyzer/Sizer \u0645\u0646 Backtrader."));

body.push(h2("\u0627\u0644\u0637\u0628\u0642\u0629 3: Data & Market (\u062a\u0648\u0633\u064a\u0639)"));
body.push(p("\u0625\u0636\u0627\u0641\u0629 DeFiLlama client \u0641\u064a shared/market-data/ \u0644\u0628\u064a\u0627\u0646\u0627\u062a TVL/yield. \u062a\u062d\u0633\u064a\u0646 price-resolver.ts \u0644\u064a\u062f\u0639\u0645 DeFiLlama \u0643\u0645\u0635\u062f\u0631 7 \u0644\u0640 DeFi data. \u0627\u0644\u0645\u0635\u0627\u062f\u0631 \u0627\u0644\u062d\u0627\u0644\u064a\u0629: Binance WS, DexScreener WS/REST, Helius RPC, Alchemy RPC, Finnhub, TwelveData."));

body.push(h2("\u0627\u0644\u0637\u0628\u0642\u0629 4: Intelligence (\u062a\u062d\u0633\u064a\u0646 MOXI)"));
body.push(p("\u062a\u0642\u064a\u064a\u0645 Mastra \u0643\u0625\u0637\u0627\u0631 multi-agent \u0644\u0640 MOXI. \u0627\u0644\u0645\u0644\u0641\u0627\u062a \u0627\u0644\u0645\u062a\u0623\u062b\u0631\u0629: moxi/agents.ts (agent registry), moxi/server/*.agent.ts (4 agents), debate/engine/ (multi-round debate). Mastra \u064a\u0648\u0641\u0631 tool-use \u0645\u062a\u0643\u0627\u0645\u0644 + memory + workflow \u0645\u0645\u0627 \u064a\u0642\u0644\u0644 \u0627\u0644\u0643\u0648\u062f \u0627\u0644\u0645\u062e\u0635\u0635."));

body.push(h2("\u0627\u0644\u0637\u0628\u0642\u0629 5: Infrastructure (\u063a\u064a\u0631 \u0645\u062a\u063a\u064a\u0631\u0629)"));
body.push(p("Supabase (DB+Auth+RLS), Upstash Redis (cache), Sentry (monitoring), Mixpanel (analytics), Vercel (deploy). \u0644\u0627 \u062a\u063a\u064a\u064a\u0631. \u0627\u0644\u0645\u0644\u0641\u0627\u062a: shared/supabase/*, shared/cache.ts, shared/sentry.ts, shared/analytics.ts."));

body.push(h2("\u062a\u062f\u0641\u0642 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u0642\u062a\u0631\u062d"));
body.push(p("\u0627\u0644\u062a\u062f\u0641\u0642 \u0627\u0644\u062d\u0627\u0644\u064a: Client \u2192 TanStack Router \u2192 Server Functions (domain/) \u2192 Supabase. \u0627\u0644\u062a\u062f\u0641\u0642 V2: \u0646\u0641\u0633 \u0627\u0644\u062a\u062f\u0641\u0642 + Market Data Layer (shared/market-data/ + DeFiLlama) \u2192 Intelligence Layer (MOXI + Mastra)."));

// ═══ DELIVERABLE 4: PAGE ARCHITECTURE V2 ═══
body.push(new Paragraph({children:[new PageBreak()]}));
body.push(h1("\u0627\u0644\u0642\u0637\u0631\u064a\u0629 \u0627\u0644\u0631\u0627\u0628\u0639\u0629: \u0647\u064a\u0643\u0644 \u0627\u0644\u0635\u0641\u062d\u0627\u062a (Page Architecture V2)"));
body.push(p("\u062a\u0641\u0635\u064a\u0644 \u062a\u0643\u0627\u0645\u0644 OSS \u0644\u0643\u0644 \u0635\u0641\u062d\u0629 \u0645\u0646 41 \u0635\u0641\u062d\u0629. \u0641\u0642\u0637 \u0627\u0644\u0635\u0641\u062d\u0627\u062a \u0627\u0644\u0645\u062a\u0623\u062b\u0631\u0629 \u0628\u0627\u0644\u062a\u0643\u0627\u0645\u0644 \u0627\u0644\u062c\u062f\u064a\u062f."));

body.push(tbl(
  ["\u0627\u0644\u0635\u0641\u062d\u0629","\u0627\u0644\u0645\u0644\u0641","OSS \u0627\u0644\u062d\u0627\u0644\u064a","OSS \u0627\u0644\u062c\u062f\u064a\u062f","\u0627\u0644\u062a\u0623\u062b\u064a\u0631"],
  [
    ["discover.tsx","routes/_authenticated/discover.tsx","Birdeye, DexScreener, LunarCrush, Mobula, Twitter","DeFiLlama (TVL)","\u0625\u0636\u0627\u0641\u0629 TVL/yield \u0644\u0643\u0644 token"],
    ["token.$symbol.tsx","routes/_authenticated/token.$symbol.tsx","Lightweight Charts, DexScreener WS","tulip-node (indicators)","\u0645\u0624\u0634\u0631\u0627\u062a \u0623\u0643\u062b\u0631 \u062f\u0642\u0629"],
    ["charts.tsx","routes/_authenticated/charts.tsx","TradingView Widgets, TwelveData, Lightweight Charts","\u0644\u0627 \u064a\u0648\u062c\u062f","\u0645\u0633\u062a\u0642\u0631"],
    ["radar.tsx","routes/_authenticated/radar.tsx","Binance WS, DexScreener WS, TradingViewMiniChart","ECharts (heatmap)","\u062f\u0627\u0634\u0628\u0648\u0631\u062f \u062d\u0631\u0627\u0631\u0629 \u0627\u0644\u0633\u0648\u0642"],
    ["yield.tsx","routes/_authenticated/yield.tsx","\u0644\u0627 \u064a\u0648\u062c\u062f","DeFiLlama","\u0628\u064a\u0627\u0646\u0627\u062a TVL + yields + fees"],
    ["portfolio.tsx","routes/_authenticated/portfolio.tsx","Recharts (EquityChart)","ECharts (treemap), DeFiLlama","\u062a\u0648\u0632\u064a\u0639 + TVL \u0644\u0643\u0644 position"],
    ["pnl.tsx","routes/_authenticated/pnl.tsx","Recharts","ECharts","\u0631\u0633\u0648\u0645 \u0623\u0639\u0645\u0642"],
    ["whale.tsx","routes/_authenticated/whale.tsx","Helius RPC","ECharts (network graph)","\u0631\u0633\u0645 \u0639\u0644\u0627\u0642\u0627\u062a \u0627\u0644\u062d\u0648\u0627\u0645"],
    ["backtest.tsx","routes/_authenticated/backtest.tsx","Backtest Engine","Backtrader patterns","\u062a\u062d\u0633\u064a\u0646 metrics + analyzers"],
    ["analyze.tsx","routes/_authenticated/analyze.tsx","Analysis Engine, TwelveData","tulip-node","\u0645\u0624\u0634\u0631\u0627\u062a 100+ \u0628\u062f\u0644 5"],
    ["signals.tsx","routes/_authenticated/signals.tsx","Signal Tracking, Binance WS","\u0644\u0627 \u064a\u0648\u062c\u062f","\u0645\u0633\u062a\u0642\u0631"],
    ["trade-desk.tsx","routes/_authenticated/trade-desk.tsx","CCXT, TradingView","\u0644\u0627 \u064a\u0648\u062c\u062f","\u0645\u0633\u062a\u0642\u0631"],
    ["curves.tsx","routes/_authenticated/curves.tsx","\u0644\u0627 \u064a\u0648\u062c\u062f","DeFiLlama","\u064a\u064a\u0644\u062f \u0628\u064a\u0627\u0646\u0627\u062a \u0645\u0646 \u0635\u0641\u0631"],
    ["vision.tsx","routes/_authenticated/vision.tsx","Chart Intelligence, Vercel AI SDK","Mastra","\u062a\u062d\u0633\u064a\u0646 AI vision pipeline"],
    ["Copilot (global)","components/vixor/CopilotDrawer.tsx","Vercel AI SDK, MOXI","Mastra","\u062a\u062d\u0633\u064a\u0646 tool-use + memory"],
  ]
));

// ═══ DELIVERABLE 5: MIGRATION STRATEGY ═══
body.push(new Paragraph({children:[new PageBreak()]}));
body.push(h1("\u0627\u0644\u0642\u0637\u0631\u064a\u0629 \u0627\u0644\u062e\u0627\u0645\u0633\u0629: \u0627\u0633\u062a\u0631\u0627\u062a\u064a\u062c\u064a\u0629 \u0627\u0644\u062a\u062d\u0648\u064a\u0644 (Migration Strategy)"));
body.push(p("\u062e\u0637\u0629 \u062a\u062d\u0648\u064a\u0644 \u0644\u0643\u0644 \u0645\u0643\u0648\u0646 OSS \u062c\u062f\u064a\u062f (B \u0641\u0642\u0637). \u0627\u0644\u0645\u0643\u0648\u0646\u0627\u062a A \u0645\u062f\u0645\u062c\u0629 \u0623\u0635\u0644\u0627\u064b \u0648\u0644\u0627 \u062a\u062d\u062a\u0627\u062c \u062a\u062d\u0648\u064a\u0644. C/D \u0645\u0631\u0627\u062c\u0639 \u0641\u0642\u0637."));

body.push(h2("\u0627\u0644\u0645\u0631\u062d\u0644\u0629 1: DeFiLlama SDK"));
body.push(pb("\u0627\u0644\u0647\u062f\u0641: ","\u0625\u0636\u0627\u0641\u0629 TVL, yields, fees \u0644\u0635\u0641\u062d\u0627\u062a yield.tsx, curves.tsx, portfolio.tsx"));
body.push(pb("\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u062c\u062f\u064a\u062f: ","src/shared/market-data/defillama.client.ts"));
body.push(pb("\u0627\u0644\u062a\u0639\u062f\u064a\u0644\u0627\u062a: ","1) \u0625\u0646\u0634\u0627\u0621 defillama.client.ts (fetch TVL, yields, fees, token prices). 2) \u062a\u0639\u062f\u064a\u0644 price-resolver.ts \u0644\u064a\u0636\u064a\u0641 DeFiLlama \u0643\u0645\u0635\u062f\u0631 backup. 3) \u062a\u0639\u062f\u064a\u0644 yield.tsx \u0644\u0639\u0631\u0636 TVL data. 4) \u062a\u0639\u062f\u064a\u0644 portfolio.tsx \u0644\u0639\u0631\u0636 DeFi positions. 5) \u0625\u0636\u0627\u0641\u0629 caching \u0641\u064a shared/cache.ts"));
body.push(pb("\u0627\u0644\u0645\u062e\u0627\u0637\u0631: ","\u0645\u0646\u062e\u0641\u0636\u0629. API \u0645\u062c\u0627\u0646\u064a \u0628\u062f\u0648\u0646 rate limit. \u0625\u0636\u0627\u0641\u0629 \u0645\u0633\u062a\u0642\u0644\u0629 \u0644\u0627 \u062a\u0624\u062b\u0631 \u0639\u0644\u0649 \u0645\u0643\u0648\u0646\u0627\u062a \u0623\u062e\u0631\u0649."));

body.push(h2("\u0627\u0644\u0645\u0631\u062d\u0644\u0629 2: tulip node"));
body.push(pb("\u0627\u0644\u0647\u062f\u0641: ","\u0627\u0633\u062a\u0628\u062f\u0627\u0644 \u0627\u0644\u0645\u0624\u0634\u0631\u0627\u062a \u0627\u0644\u0645\u062e\u0635\u0635\u0629 \u0628\u0640 tulip-node (100+ \u0645\u0624\u0634\u0631 \u0645\u0642\u0627\u0631\u0646\u0629 \u0628\u0640 5)"));
body.push(pb("\u0627\u0644\u0645\u0644\u0641\u0627\u062a \u0627\u0644\u0645\u062a\u0623\u062b\u0631\u0629: ","analysis/engine/indicators/index.ts, indicator-math.ts, regime-detector.ts, strategy-scorer.ts"));
body.push(pb("\u0627\u0644\u062a\u0639\u062f\u064a\u0644\u0627\u062a: ","1) \u0625\u0636\u0627\u0641\u0629 tulip-node \u0643\u062a\u0628\u0639\u064a\u0629. 2) \u0625\u0646\u0634\u0627\u0621 tulip-adapter.ts \u064a\u063a\u0644\u0641 tulip \u0628\u0648\u0627\u062c\u0647\u0629 VIXOR. 3) \u062a\u0639\u062f\u064a\u0644 indicator-math.ts \u0644\u064a\u0633\u062a\u062e\u062f\u0645 tulip \u062f\u0627\u062e\u0644\u064a\u0627\u064b. 4) \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0627\u062e\u062a\u0628\u0627\u0631\u0627\u062a. 5) \u062a\u062d\u0642\u0642 \u0645\u0646 \u0623\u0646 \u0627\u0644\u0646\u062a\u0627\u0626\u062c \u0645\u0637\u0627\u0628\u0642\u0629 (regime-detector.test.ts, scoring.test.ts)"));
body.push(pb("\u0627\u0644\u0645\u062e\u0627\u0637\u0631: ","\u0645\u062a\u0648\u0633\u0637\u0629. \u064a\u062c\u0628 \u0627\u0644\u062a\u0623\u0643\u062f \u0645\u0646 \u0623\u0646 \u0627\u0644\u0646\u062a\u0627\u0626\u062c \u0645\u0637\u0627\u0628\u0642\u0629 \u0644\u0644\u0645\u0624\u0634\u0631\u0627\u062a \u0627\u0644\u062d\u0627\u0644\u064a\u0629. regression tests \u0645\u0637\u0644\u0648\u0628\u0629."));

body.push(h2("\u0627\u0644\u0645\u0631\u062d\u0644\u0629 3: Mastra (\u062a\u0642\u064a\u064a\u0645)"));
body.push(pb("\u0627\u0644\u0647\u062f\u0641: ","\u062a\u062d\u0633\u064a\u0646 MOXI agents \u0628\u0640 tool-use \u0645\u062a\u0643\u0627\u0645\u0644 + workflow engine"));
body.push(pb("\u0627\u0644\u0645\u0644\u0641\u0627\u062a \u0627\u0644\u0645\u062a\u0623\u062b\u0631\u0629: ","moxi/agents.ts, moxi/server/agent.ts, moxi/server/*.agent.ts, debate/engine/debate.engine.ts"));
body.push(pb("\u0627\u0644\u062a\u0639\u062f\u064a\u0644\u0627\u062a: ","1) \u062a\u0642\u064a\u064a\u0645 Mastra \u0643\u0645\u0627 \u0647\u0648 (POC \u0641\u064a branch \u0645\u0646\u0641\u0635\u0644). 2) \u0625\u0646\u0634\u0627\u0621 moxi/mastra-adapter.ts \u064a\u063a\u0644\u0641 Mastra agents \u0628\u0648\u0627\u062c\u0647\u0629 VIXOR. 3) \u0646\u0642\u0644 tool definitions \u0645\u0646 moxi/tools.ts \u0625\u0644\u0649 Mastra format. 4) \u062a\u062d\u062f\u064a\u062b debate engine \u0644\u064a\u0633\u062a\u062e\u062f\u0645 Mastra workflow. 5) A/B testing \u0645\u0639 Vercel AI SDK \u0627\u0644\u062d\u0627\u0644\u064a"));
body.push(pb("\u0627\u0644\u0645\u062e\u0627\u0637\u0631: ","\u0639\u0627\u0644\u064a\u0629. \u062a\u063a\u064a\u064a\u0631 \u0623\u0633\u0627\u0633\u064a \u0641\u064A MOXI. \u064a\u062C\u0628 POC \u0623\u0648\u0644\u0627\u064B. \u0644\u0627 \u064A\u064F\u0637\u0644\u0628 \u0641\u064A Task 2-7. \u064A\u064F\u0642\u064A\u0645 \u0628\u0639\u062F FULL SYSTEM TEST."));

body.push(h2("\u0645\u0644\u062e\u0635 \u0627\u0644\u062a\u062d\u0648\u064a\u0644"));
body.push(tbl(
  ["\u0627\u0644\u0645\u0631\u062d\u0644\u0629","\u0627\u0644\u0645\u0643\u0648\u0646","\u0627\u0644\u0623\u0648\u0644\u0648\u064a\u0629","\u0627\u0644\u0645\u062e\u0627\u0637\u0631","\u0627\u0644\u062A\u0648\u0642\u064a\u062a"],
  [
    ["1","DeFiLlama SDK","\u0645\u062a\u0648\u0633\u0637\u0629","\u0645\u0646\u062e\u0641\u0636\u0629","\u0628\u0639\u062f Task 2"],
    ["2","tulip node","\u0639\u0627\u0644\u064a\u0629","\u0645\u062a\u0648\u0633\u0637\u0629","\u0628\u0639\u062f Task 4"],
    ["3","Mastra (POC)","\u0645\u0646\u062e\u0641\u0636\u0629","\u0639\u0627\u0644\u064a\u0629","\u0628\u0639\u062d FULL SYSTEM TEST"],
    ["-","ECharts (D)","\u0645\u0646\u062e\u0641\u0636\u0629","\u0645\u0646\u062e\u0641\u0636\u0629","\u0639\u0646\u062f \u0627\u0644\u0637\u0644\u0628"],
    ["-","C references","\u0645\u0646\u062e\u0641\u0636\u0629","\u0644\u0627 \u062a\u0648\u062c\u062f","\u062A\u0639\u062F\u064A\u0644\u0627\u062A \u062A\u062Fر\u064A\u062C\u064A\u0629"],
  ]
));

// ═══ BUILD DOC ═══
const doc = new Document({
  styles:{default:{document:{run:{font:{ascii:"Calibri",eastAsia:"Microsoft YaHei"},size:22,color:hc(C.b)},paragraph:{spacing:{line:312}}},heading1:{run:{font:{ascii:"Calibri",eastAsia:"SimHei"},size:32,bold:true,color:hc(C.p)}},heading2:{run:{font:{ascii:"Calibri",eastAsia:"SimHei"},size:28,bold:true,color:hc(C.p)}},heading3:{run:{font:{ascii:"Calibri",eastAsia:"SimHei"},size:24,bold:true,color:hc(C.p)}}}},
  sections:[
    coverSection,
    {properties:{page:{size:{width:11906,height:16838},margin:{top:1440,bottom:1440,left:1701,right:1417}}},
      headers:{default:new Header({children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({text:"VIXOR Architecture V2 \u2014 OSS Research",size:16,color:hc(C.g),font:{ascii:"Calibri"}})]})]})},
      footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({children:[PageNumber.CURRENT],size:18,color:hc(C.g)})]})]})},
      children:body
    }
  ]
});

Packer.toBuffer(doc).then(buf=>{
  fs.writeFileSync("/home/z/my-project/download/VIXOR_Architecture_V2_OSS_Research.docx",buf);
  console.log("DONE: /home/z/my-project/download/VIXOR_Architecture_V2_OSS_Research.docx");
}).catch(e=>{console.error("ERROR:",e);process.exit(1);});
