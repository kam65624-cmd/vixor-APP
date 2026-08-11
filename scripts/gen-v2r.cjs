const fs = require("fs");
const { Document, Packer, Paragraph, TextRun, Header, Footer, AlignmentType, HeadingLevel, PageNumber, Table, TableRow, TableCell, WidthType, TableLayoutType, BorderStyle, ShadingType, PageBreak } = require("docx");

const C = { p:"0F172A", b:"1C2A3D", s:"5B6B7D", a:"1B6B7A", sf:"EDF3F5", w:"FFFFFF", g:"808080" };
const hc = h => h.replace("#","");
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const tB = { top:NB, bottom:NB, left:NB, right:NB, insideHorizontal:NB, insideVertical:NB };
const cB = { style: BorderStyle.SINGLE, size: 4, color: hc(C.s) };

const h1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before:500,after:200 }, children: [new TextRun({ text:t, bold:true, size:32, color:hc(C.p), font:{ascii:"Calibri",eastAsia:"SimHei"} })] });
const h2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before:400,after:160 }, children: [new TextRun({ text:t, bold:true, size:28, color:hc(C.p), font:{ascii:"Calibri",eastAsia:"SimHei"} })] });
const h3 = t => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before:300,after:120 }, children: [new TextRun({ text:t, bold:true, size:24, color:hc(C.p), font:{ascii:"Calibri",eastAsia:"SimHei"} })] });
const p = t => new Paragraph({ alignment: AlignmentType.LEFT, spacing: { line:312,after:100 }, children: [new TextRun({ text:t, size:22, color:hc(C.b), font:{ascii:"Calibri",eastAsia:"Microsoft YaHei"} })] });
const pb = (l,t) => new Paragraph({ alignment: AlignmentType.LEFT, spacing: { line:312,after:100 }, children: [
  new TextRun({ text:l, bold:true, size:22, color:hc(C.p), font:{ascii:"Calibri",eastAsia:"Microsoft YaHei"} }),
  new TextRun({ text:t, size:22, color:hc(C.b), font:{ascii:"Calibri",eastAsia:"Microsoft YaHei"} })
] });
const pk = (l,v) => new Paragraph({ alignment: AlignmentType.LEFT, spacing: { line:312,after:80 }, border: { left: { style:BorderStyle.SINGLE, size:6, color:hc(C.a), space:8 } }, indent: { left:300 }, children: [
  new TextRun({ text:l+": ", bold:true, size:21, color:hc(C.a), font:{ascii:"Calibri",eastAsia:"SimHei"} }),
  new TextRun({ text:v, size:21, color:hc(C.b), font:{ascii:"Calibri",eastAsia:"Microsoft YaHei"} })
] });

function tbl(headers, rows) {
  const w = Math.floor(100/headers.length);
  return new Table({
    width:{size:100,type:WidthType.PERCENTAGE}, layout:TableLayoutType.FIXED,
    borders:{top:cB,bottom:cB,left:cB,right:cB,insideHorizontal:cB,insideVertical:cB},
    rows:[
      new TableRow({ tableHeader:true, cantSplit:true, children: headers.map(h => new TableCell({
        width:{size:w,type:WidthType.PERCENTAGE},
        shading:{type:ShadingType.CLEAR,fill:hc(C.a)},
        children:[new Paragraph({spacing:{before:50,after:50},children:[new TextRun({text:h,bold:true,size:18,color:hc(C.w),font:{ascii:"Calibri",eastAsia:"SimHei"}})]})]
      }))}),
      ...rows.map((r,i) => new TableRow({ cantSplit:true, children: r.map(c => new TableCell({
        width:{size:w,type:WidthType.PERCENTAGE},
        shading: i%2===1 ? {type:ShadingType.CLEAR,fill:hc(C.sf)} : undefined,
        children:[new Paragraph({spacing:{before:40,after:40},children:[new TextRun({text:c,size:18,color:hc(C.b),font:{ascii:"Calibri",eastAsia:"Microsoft YaHei"}})]})]
      }))}))
    ]
  });
}

// COVER
const coverChildren = [
  new Paragraph({spacing:{before:3500},children:[]}),
  new Paragraph({indent:{left:1200,right:800},spacing:{after:400},border:{bottom:{style:BorderStyle.SINGLE,size:6,color:hc(C.g),space:8}},children:[new TextRun({text:"V I X O R   A R C H I T E C T U R E   V 2   R E V I S E D",size:18,color:hc(C.g),font:{ascii:"Calibri"},characterSpacing:25})]}),
  new Paragraph({indent:{left:1200},spacing:{after:200,line:800,lineRule:"atLeast"},children:[new TextRun({text:"VIXOR Product + Intelligence Architecture",size:64,bold:true,color:hc(C.w),font:{ascii:"Arial"}})]}),
  new Paragraph({indent:{left:1200},spacing:{after:100,line:600,lineRule:"atLeast"},children:[new TextRun({text:"\u0627\u0644\u0647\u064a\u0643\u0644 \u0627\u0644\u0645\u0646\u062a\u062c\u064A \u0648\u0644\u064A\u0633 \u0645\u062C\u0631\u062F \u062A\u0643\u0627\u0645\u0644 \u0645\u0643\u062A\u0628\u0627\u062A",size:32,color:hc(C.g),font:{eastAsia:"Microsoft YaHei",ascii:"Arial"}})]}),
  new Paragraph({indent:{left:1200},spacing:{after:800},children:[new TextRun({text:"Capability-Driven | Experience-Layer | Page Consolidation | User Journey",size:20,color:hc(C.g),font:{ascii:"Calibri"}})]}),
  new Paragraph({indent:{left:1400},spacing:{after:60},border:{left:{style:BorderStyle.SINGLE,size:6,color:hc(C.g),space:8}},children:[new TextRun({text:"\u0627\u0644\u062A\u0627\u0631\u064A\u062E: 2026-08-09  |  Research-Only (Zero Code Changes)",size:19,color:hc(C.g),font:{ascii:"Calibri",eastAsia:"Microsoft YaHei"}})]}),
  new Paragraph({indent:{left:1400},spacing:{after:60},border:{left:{style:BorderStyle.SINGLE,size:6,color:hc(C.g),space:8}},children:[new TextRun({text:"\u0627\u0644\u062D\u0627\u0644\u0629: \u0645\u0639\u0644\u0642 \u062D\u062A\u0649 \u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645",size:19,color:hc(C.g),font:{ascii:"Calibri",eastAsia:"Microsoft YaHei"}})]}),
  new Paragraph({spacing:{before:2500},children:[]}),
  new Paragraph({indent:{left:1200,right:800},border:{top:{style:BorderStyle.SINGLE,size:2,color:hc(C.g),space:8}},children:[new TextRun({text:"VIXOR \u2014 Confidential",size:16,color:hc(C.g),font:{ascii:"Calibri"}})]}),
];

const body = [];

// ═══ SECTION 1: FEEDBACK SUMMARY ═══
body.push(h1("\u0627\u0644\u0642\u0633\u0645 1: \u0645\u0644\u062E\u0635 \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629 \u0648\u0627\u0644\u062A\u062D\u0648\u064A\u0644 \u0627\u0644\u0645\u0637\u0644\u0648\u0628"));
body.push(p("\u0627\u0644\u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u0623\u0648\u0644 \u0623\u062C\u0627\u0628 \u0639\u0646 \u0645\u0627 \u0646\u0633\u062A\u062E\u062F\u0645 \u0628\u0634\u0643\u0644 \u0645\u0645\u062A\u0627\u0632 \u0644\u0643\u0646\u0647 \u0641\u064A \u0627\u0644\u0623\u0633\u0627\u0633 \u0643\u0627\u0646 \u062A\u0642\u0631\u064A\u0631 \u062A\u0643\u0627\u0645\u0644 \u0645\u0643\u062A\u0628\u0627\u062A \u0648\u0644\u064A\u0633 \u0647\u064A\u0643\u0644 \u0645\u0646\u062A\u062C. \u0647\u0630\u0627 \u0627\u0644\u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u0645\u0631\u062C\u0639 \u064A\u062D\u0648\u0644 \u0627\u0644\u0646\u062A\u064A\u062C\u0629 \u0645\u0646 \u0645\u0642\u0627\u0631\u0628\u0629 \u0627\u0644\u062A\u0643\u0627\u0645\u0644 \u0625\u0644\u0649 \u0645\u0642\u0627\u0631\u0628\u0629 \u0627\u0644\u0642\u062F\u0631\u0629 \u0639\u0644\u0649 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0648\u0627\u0644\u0642\u0631\u0627\u0631."));

body.push(h2("\u0627\u0644\u0646\u0642\u0627\u0637 \u0627\u0644\u0645\u062D\u0641\u0648\u0638\u0629 \u0645\u0646 \u0627\u0644\u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u0623\u0648\u0644"));
body.push(p("1. \u0627\u0643\u062A\u0634\u0627\u0641 \u0623\u0646 VIXOR \u0644\u062F\u064A\u0647 infrastructure \u0643\u0628\u064A\u0631 \u0645\u062F\u0645\u062C \u0628\u0627\u0644\u0641\u0639\u0644 (14 \u0645\u0634\u0631\u0648\u0639 A) \u0645\u0639 file-level mapping. \u0647\u0630\u0627 \u064A\u0645\u0646\u0639 \u0625\u0639\u0627\u062F\u0629 \u0628\u0646\u0627\u0621 \u0645\u0627 \u0648\u062C\u0648\u062F \u0623\u0635\u0644\u0627\u064B."));
body.push(p("2. Data Sources Stack \u0645\u0645\u062A\u0627\u0632: Market (Binance WS, CCXT, TwelveData) + Crypto/DEX (DexScreener, Birdeye, Helius, Mobula) + Social (LunarCrush, Twitter) + DeFi (DeFiLlama \u0645\u0642\u062A\u0631\u062D)."));
body.push(p("3. Migration Strategy \u0628\u0627\u0644\u0645\u0631\u0627\u062D\u0644 (DeFiLlama \u2192 tulip POC \u2192 Mastra POC) \u0645\u0646\u0647\u062C \u0635\u062D\u064A\u062D."));

body.push(h2("\u0627\u0644\u0646\u0642\u0627\u0637 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629 \u062A\u0635\u062D\u064A\u062D"));
body.push(p("1. \u0643\u0644\u0645\u0629 \u0623 = \u0645\u062F\u0645\u062C \u0644\u0627 \u062A\u0639\u0646\u064A end-to-end \u0645\u0643\u062A\u0645\u0644. Data \u2192 Normalization \u2192 Domain \u2192 MOXI \u2192 UX. \u0648\u062C\u0648\u062F dexscreener.client.ts \u0644\u0627 \u064A\u0639\u0646\u064A Token Intelligence \u0643\u0627\u0645\u0644\u0629."));
body.push(p("2. \u0646\u0627\u0642\u0635 Experience/Decision Layer: \u0627\u0644\u062A\u0642\u0631\u064A\u0631 \u0644\u064A\u0633 \u0628\u064A\u0646 \u0643\u064A\u0641 \u062A\u062D\u0648\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0625\u0644\u0649 \u0642\u0631\u0627\u0631 \u0644\u0644\u0645\u0633\u062A\u062E\u062F\u0645."));
body.push(p("3. \u0646\u0627\u0642\u0635 Page Consolidation: 41 route \u062F\u0648\u0646 audit. \u0627\u0644\u0647\u062F\u0641: 41 \u2192 12 core experience."));
body.push(p("4. \u0646\u0627\u0642\u0635 Information Hierarchy: Charts \u0644\u0625\u062B\u0628\u0627\u062A \u0627\u0644\u0642\u0631\u0627\u0631 \u0648\u0644\u064A\u0633 \u0644\u0645\u0644\u0621 \u0627\u0644\u0634\u0627\u0634\u0629."));
body.push(p("5. \u062A\u0643\u0644 \u0645\u0635\u062F\u0631 \u0628\u064A\u0627\u0646\u0627\u062A \u064A\u062C\u0628 \u064A\u0646\u062A\u062C capability \u0645\u0633\u062A\u062E\u062F\u0645 \u0641\u064A User Journey."));

// ═══ SECTION 2: CAPABILITY MAP ═══
body.push(new Paragraph({children:[new PageBreak()]}));
body.push(h1("\u0627\u0644\u0642\u0633\u0645 2: Capability Map \u2014 \u0643\u0644 OSS \u064A\u0633\u0627\u0648\u064A \u0642\u062F\u0631\u0629 \u0645\u0633\u062A\u062E\u062F\u0645 \u062D\u0642\u064A\u0642\u064A\u0629"));
body.push(p("\u0627\u0644\u0642\u0627\u0639\u062F\u0629: \u0623\u064A integration \u0644\u0627 \u064A\u0646\u062A\u062C \u0639\u0646\u0647 capability \u0645\u0633\u062A\u062E\u062F\u0645\u0629 \u0641\u064A User Journey = \u0644\u0627 \u0646\u062F\u062E\u0644\u0647. \u0643\u0644 \u0645\u0634\u0631\u0648\u0639 \u0645\u0631\u0628\u0648\u0637 \u0628\u0640 Capability \u0645\u062D\u062F\u062F \u0648\u0644\u064A\u0633 \u0645\u062C\u0631\u062F \u0627\u0633\u0645 \u0645\u0643\u062A\u0628\u0629."));

body.push(h2("Market & Price Data \u2192 Unified Market Intelligence"));
body.push(tbl(
  ["\u0627\u0644\u0645\u0634\u0631\u0648\u0639","\u0627\u0644\u062D\u0627\u0644\u0629","\u064A\u0646\u062A\u062C ا\u064A\u0634","User Journey","\u0627\u0644\u0645\u0644\u0641\u0627\u062A"],
  [
    ["Binance WS","A","Real-time prices","\u0643\u0644 \u0635\u0641\u062D\u0629","binance-ws.ts, use-live-prices.ts"],
    ["CCXT","A","Unified execution","Trade Desk, Arbitrage","trading/gateway/adapters/*"],
    ["TwelveData","A","OHLCV + Forex","Analyze, Charts","market/server/twelvedata.ts"],
    ["DexScreener","A","DEX pairs + prices","Discover, Token, Radar","dexscreener*.ts"],
    ["Finnhub","A","Forex/Stocks quotes","Market data fallback","finnhub-quotes.ts"],
  ]
));

body.push(h2("Token Intelligence \u2192 On-Chain + Social Intelligence"));
body.push(tbl(
  ["\u0627\u0644\u0645\u0634\u0631\u0648\u0639","\u0627\u0644\u062D\u0627\u0644\u0629","\u064A\u0646\u062A\u062C \u0627\u064A\u0634","User Journey","\u0627\u0644\u0645\u0644\u0641\u0627\u062A"],
  [
    ["Birdeye","A","Token metadata + trade data","Discover, Token Intelligence","birdeye.client.ts"],
    ["Helius RPC","A","Smart money + on-chain","Whale, Discovery scoring","helius-rpc.ts, helius.client.ts"],
    ["LunarCrush","A","Social sentiment + Galaxy Score","Discover scoring, MOXI context","lunarcrush.client.ts"],
    ["Twitter/X","A","Social signals","Discovery scoring, Narrative","twitter.client.ts"],
    ["Mobula","A","Multi-chain market data","Discover, Token Intelligence","mobula.client.ts"],
  ]
));

body.push(h2("DeFi Data \u2192 Protocol Health + Yield Intelligence"));
body.push(tbl(
  ["\u0627\u0644\u0645\u0634\u0631\u0648\u0639","\u0627\u0644\u062D\u0627\u0644\u0629","\u064A\u0646\u062A\u062C \u0627\u064A\u0634","User Journey","\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0645\u0642\u062A\u0631\u062D"],
  [
    ["DeFiLlama","B","TVL + yields + fees + protocol health","Yield, Curves, Portfolio","shared/market-data/defillama.client.ts"],
  ]
));

body.push(h2("Charts & Visualization \u2192 Decision Evidence"));
body.push(tbl(
  ["\u0627\u0644\u0645\u0634\u0631\u0648\u0639","\u0627\u0644\u062D\u0627\u0644\u0629","\u064A\u0646\u062A\u062C \u0627\u064A\u0634","User Journey"],
  [
    ["Lightweight Charts","A","Candlestick + DEX charts","Analyze, Token, Trade Desk"],
    ["Recharts","A","Sparklines + Equity","Dashboard, PnL"],
    ["TradingView Widgets","A","Full chart + TA + ticker","Charts, Radar, Token"],
    ["ECharts","D","Heatmap, Radar, Network, Sankey","Radar, Whale, Portfolio, PnL"],
  ]
));

body.push(h2("AI & Intelligence \u2192 MOXI Decision Engine"));
body.push(tbl(
  ["\u0627\u0644\u0645\u0634\u0631\u0648\u0639","\u0627\u0644\u062D\u0627\u0644\u0629","\u064A\u0646\u062A\u062C \u0627\u064A\u0634","User Journey"],
  [
    ["Vercel AI SDK","A","LLM orchestration","MOXI, Debate, Vision, Experiment"],
    ["Mastra","B (POC)","Multi-agent workflow + tool-use","MOXI agents (after POC)"],
  ]
));

body.push(h2("Indicators & Analysis \u2192 Signal Quality"));
body.push(tbl(
  ["\u0627\u0644\u0645\u0634\u0631\u0648\u0639","\u0627\u0644\u062D\u0627\u0644\u0629","\u064A\u0646\u062A\u062C \u0627\u064A\u0634","User Journey"],
  [
    ["tulip node","B (POC)","100+ technical indicators","Analyze, Signal Engine"],
    ["Custom Indicators","A","RSI, MACD, Bollinger, ATR, SMC","Regime + Scoring + Signals"],
  ]
));

// ═══ SECTION 3: ARCHITECTURE V2 ═══
body.push(new Paragraph({children:[new PageBreak()]}));
body.push(h1("\u0627\u0644\u0642\u0633\u0645 3: VIXOR Architecture V2 \u2014 \u0627\u0644\u0647\u064A\u0643\u0644 \u0627\u0644\u0645\u0646\u062A\u062C\u064A"));
body.push(p("\u0627\u0644\u0647\u064A\u0643\u0644 \u0627\u0644\u062C\u062F\u064A\u062F \u064A\u062E\u062A\u0644\u0641 \u0639\u0646 \u0627\u0644\u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u0623\u0648\u0644 \u0641\u064A \u0646\u0642\u0637\u0629 \u062C\u0648\u0647\u0631\u064A\u0629: \u0625\u0636\u0627\u0641\u0629 Experience Layer + Decision Layer. \u0647\u0630\u064A\u0646 \u0627\u0644\u0637\u0628\u0642\u062A\u064A\u0646 \u0647\u0645\u0627 \u0627\u0644\u0644\u064A \u064A\u062D\u0648\u0644\u0648\u0646 VIXOR \u0645\u0646 dashboard \u0645\u0644\u064A\u0621 \u0628\u0627\u0644\u0623\u062F\u0648\u0627\u062A \u0625\u0644\u0649 \u0645\u0646\u062A\u062C \u0630\u0643\u064A \u0645\u062A\u0643\u0627\u0645\u0644."));

body.push(h2("\u0627\u0644\u0637\u0628\u0642\u0629 1: VIXOR EXPERIENCE LAYER (\u062C\u062F\u064A\u062F\u0629)"));
body.push(p("\u0647\u0630\u0647 \u0627\u0644\u0637\u0628\u0642\u0629 \u0647\u064A \u0627\u0644\u0644\u064A \u062A\u062D\u062F\u062F \u0645\u0627 \u064A\u0631\u0627\u0647 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0648\u0643\u064A\u0641. \u0644\u064A\u0633\u062A \u0645\u062C\u0631\u062F \u0635\u0641\u062D\u0627\u062A \u0648UI \u0645\u0633\u062A\u0642\u0644\u0629. \u0647\u064A \u062A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 User Journey \u0648\u0627\u0644\u0642\u0631\u0627\u0631 \u0648\u0627\u0644\u062A\u0639\u0644\u064A\u0645."));
body.push(pk("\u0627\u0644\u0645\u0644\u0641\u0627\u062A","\u064A\u062D\u062A\u0627\u062C \u0625\u0646\u0634\u0627\u0621: shared/experience/ \u0643\u0640 domain \u062C\u062F\u064A\u062F"));
body.push(pk("\u0627\u0644\u0645\u062D\u062A\u0648\u064A\u0627\u062A","User Journey engine, Information Hierarchy, Page orchestrator, Notification context"));

body.push(h2("\u0627\u0644\u0637\u0628\u0642\u0629 2: DECISION LAYER (\u062C\u062F\u064A\u062F\u0629)"));
body.push(p("\u0647\u0630\u0647 \u0627\u0644\u0637\u0628\u0642\u0629 \u062A\u062D\u0648\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0625\u0644\u0649 \u0642\u0631\u0627\u0631. \u0647\u064A \u0627\u0644\u0644\u064A \u062A\u0631\u0628\u0637 Signal + Analysis + Intelligence \u0645\u0639 MOXI \u0648\u062A\u0646\u062A\u062C Opportunity Ranking. \u062F\u0648\u0646\u0647\u0627 VIXOR \u064A\u0628\u0642\u0649 dashboard \u0628\u0628\u064A\u0627\u0646\u0627\u062A \u0628\u0644\u0627 \u0642\u0631\u0627\u0631."));
body.push(pk("\u0627\u0644\u0645\u0644\u0641\u0627\u062A","shared/decision/ \u0643\u0640 domain \u062C\u062F\u064A\u062F \u0623\u0648 \u062A\u0648\u0633\u064A\u0639 \u0641\u064A moxi/"));
body.push(pk("\u0627\u0644\u0645\u062D\u062A\u0648\u064A\u0627\u062A","Opportunity Ranking, Confidence scoring, Risk assessment, Setup builder"));

body.push(h2("\u0627\u0644\u0637\u0628\u0642\u0629 3: DOMAIN ENGINES (\u0645\u0648\u062C\u0648\u062F\u0629 - \u062A\u062D\u0633\u064A\u0646)"));
body.push(p("\u0647\u0630\u0647 \u0627\u0644\u0645\u062D\u0631\u0643 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0644VIXOR. Signal Engine + Analysis Engine + Portfolio Engine. \u0645\u0648\u062C\u0648\u062F\u0629 \u0644\u0643\u0646 \u062A\u062D\u062A\u0627\u062C \u0625\u0639\u0627\u062F\u0629 \u0631\u0628\u0637\u0647\u0627 \u0628\u0627\u0644\u0640 Decision Layer."));
body.push(pk("Signal Engine","signal-tracking/ \u2014 transition-engine.ts, functions.ts, types.ts (LOCKED post 1.2C)"));
body.push(pk("Analysis Engine","analysis/ \u2014 engine/, indicators/, patterns/, smc/, regime/, risk/"));
body.push(pk("Portfolio Engine","trades/ + backtest/ \u2014 journal, metrics, simulator"));

body.push(h2("\u0627\u0644\u0637\u0628\u0642\u0629 4: INTELLIGENCE DATA (\u062A\u0648\u0633\u064A\u0639)"));
body.push(p("\u062C\u0645\u064A\u0639 \u0645\u0635\u0627\u062F\u0631 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A: Market (Binance/CCXT/TwelveData) + Token (Birdeye/Helius/DexScreener/Mobula) + Social (LunarCrush/Twitter) + DeFi (DeFiLlama \u0645\u0642\u062A\u0631\u062D). \u0643\u0644 \u0645\u0635\u062F\u0631 \u064A\u0631\u0628\u0637 \u0628\u0640 Capability \u0645\u062D\u062F\u062F."));
body.push(pk("\u0627\u0644\u0645\u0644\u0641\u0627\u062A","shared/market-data/*, discovery/clients/*, market/server/*"));

body.push(h2("\u0627\u0644\u0637\u0628\u0642\u0629 5: MOXI INTELLIGENCE (\u062A\u062D\u0633\u064A\u0646)"));
body.push(p("\u0645\u0648\u062C\u0648\u062F \u062D\u0627\u0644\u064A\u0627\u064B (moxi/ + debate/ + chart-intelligence/ + experiment/). \u0627\u0644\u062A\u062D\u0633\u064A\u0646: Mastra POC \u0644\u0640 multi-agent, tool-use \u0645\u062A\u0643\u0627\u0645\u0644, memory workflow. \u0644\u0627 \u064A\u064F\u0646\u0641\u0630 \u0625\u0644\u0627 \u0628\u0639\u062F POC + A/B testing."));

body.push(h2("\u0627\u0644\u0637\u0628\u0642\u0629 6: INFRASTRUCTURE (\u063A\u064A\u0631 \u0645\u062A\u063A\u064A\u0631\u0629)"));
body.push(p("Supabase (DB+Auth+RLS), Upstash Redis (cache), Sentry (monitoring), Mixpanel (analytics), Vercel (deploy). \u0645\u0644\u0641\u0627\u062A: shared/supabase/*, shared/cache.ts, shared/sentry.ts"));

// ═══ SECTION 4: USER JOURNEY ═══
body.push(new Paragraph({children:[new PageBreak()]}));
body.push(h1("\u0627\u0644\u0642\u0633\u0645 4: VIXOR User Journey \u2014 \u0627\u0644\u062A\u062F\u0641\u0642 \u0627\u0644\u0645\u0646\u062A\u062C\u064A"));
body.push(p("\u0647\u0630\u0627 \u0647\u0648 \u0627\u0644\u062A\u062F\u0641\u0642 \u0627\u0644\u0644\u064A \u064A\u062D\u0648\u0644 VIXOR \u0645\u0646 dashboard \u0645\u0644\u064A\u0621 \u0628\u0627\u0644\u0623\u062F\u0648\u0627\u062A \u0625\u0644\u0649 \u0645\u0646\u062A\u062C \u0630\u0643\u064A. \u0643\u0644 \u0645\u0631\u062D\u0644\u0629 \u062A\u062D\u062A\u0627\u062C \u0642\u062F\u0631\u0629 + OSS + \u0645\u0644\u0641\u0627\u062A."));

body.push(h2("\u0627\u0644\u0645\u0631\u062D\u0644\u0629 1: DISCOVER \u2014 \u0627\u0643\u062A\u0634\u0627\u0641"));
body.push(pb("\u0627\u0644\u0642\u062F\u0631\u0629: ","\u0627\u0643\u062A\u0634\u0627\u0641 \u0641\u0631\u0635 + memecoins + trending tokens \u0645\u0639 liquidity + social + on-chain context"));
body.push(pb("\u0627\u0644\u0645\u0635\u0627\u062F\u0631: ","DexScreener (pairs+prices), Birdeye (metadata+trades), Helius (smart money), LunarCrush (sentiment), Twitter (signals), Mobula (multi-chain)"));
body.push(pb("\u0627\u0644\u0645\u0644\u0641\u0627\u062A: ","discover.tsx, discovery/functions.ts, discovery/scoring.ts, discovery/clients/*"));
body.push(pb("\u0627\u0644\u062A\u062Dس\u064A\u0646 \u0627\u0644\u0645\u0637\u0644\u0648\u0628: ","\u0625\u0636\u0627\u0641\u0629 DeFiLlama (TVL/yield) \u0644\u0643\u0644 token. ranking algorithm \u064A\u062F\u0645\u062C DeFi data."));

body.push(h2("\u0627\u0644\u0645\u0631\u062D\u0644\u0629 2: ANALYZE \u2014 \u062Aح\u0644\u064A\u0644"));
body.push(pb("\u0627\u0644\u0642د\u0631\u0629: ","\u062A\u062D\u0644ي\u0644 \u0641\u0646\u064A + SMC + regime detection + pattern recognition \u0644\u0623\u064A token"));
body.push(pb("\u0627\u0644\u0645\u0635\u0627\u062F\u0631: ","TwelveData (OHLCV), Custom Indicators (RSI/MACD/Bollinger/ATR), SMC (BOS/CHOCH/OB/FVG/Liquidity), Patterns (candlestick/chart/harmonic)"));
body.push(pb("\u0627\u0644\u0645\u0644\u0641\u0627\u062A: ","analyze.tsx, analysis.$id.tsx, analysis/engine/*"));
body.push(pb("\u0627\u0644\u062A\u062Dس\u064Aن: ","tulip-node POC \u0644\u0632يادة indicators \u0645ن 5 \u0625\u0644\u0649 100+. \u0644\u0627 replacement \u062F\u0648\u0646 regression tests."));

body.push(h2("\u0627\u0644\u0645\u0631\u062D\u0644\u0629 3: MOXI DECISION \u2014 \u0627\u0644\u0642ر\u0627\u0631 \u0627\u0644\u0630ك\u064A"));
body.push(pb("\u0627\u0644\u0642\u062F\u0631\u0629: ","MOXI \u064Aج\u0645ع Discovery + Analysis + User Context \u0648\u064Aق\u062Aر\u062D: Opportunity Rank + Confidence + Risk + Setup"));
body.push(pb("\u0627\u0644\u0645صا\u062F\u0631: ","Vercel AI SDK (LLM), moxi/agents.ts (4 agents), debate/engine/ (multi-round), chart-intelligence/ (vision), tool-registry/"));
body.push(pb("\u0627\u0644\u0645لف\u0627\u062A: ","CopilotDrawer.tsx, moxi/functions.ts, moxi/context-engine.ts, moxi/server/*.agent.ts"));
body.push(pb("\u0627\u0644\u062A\u062Dس\u064Aن: ","Mastra POC \u0644multi-agent workflow. A/B \u0645ع Vercel AI SDK. \u0644\u0627 migration \u0642بل evaluation."));

body.push(h2("\u0627\u0644\u0645\u0631\u062D\u0644ة 4: SETUP + EXECUTE \u2014 \u0627\u0644\u062Aنف\u064Aذ"));
body.push(pb("\u0627\u0644\u0642\u062F\u0631\u0629: ","\u0625\u0639\u062Fاد signal + risk parameters + execution \u0639\u0628ر CEX/DEX"));
body.push(pb("\u0627\u0644\u0645\u0635ا\u062F\u0631: ","CCXT (Binance/Bybit/OKX/Exness), Jupiter (Solana DEX), Axiom (Solana DEX), Wallet adapters (MetaMask/Phantom/WalletConnect)"));
body.push(pb("\u0627\u0644\u0645\u0644فا\u062A: ","trade-desk.tsx, signals.tsx, trading/gateway/*, arbitrage/*, wallet/adapters/*"));

body.push(h2("\u0627\u0644\u0645\u0631\u062D\u0644\u0629 5: TRACK + REVIEW \u2014 \u0627\u0644\u0645تابعة \u0648\u0627\u0644مراج\u0639ة"));
body.push(pb("\u0627\u0644\u0642\u062F\u0631\u0629: ","\u062Aتبع signal lifecycle (pending\u2192active\u2192tp1\u2192tp2\u2192tp3/sl/invalidated) + journal + review + learning"));
body.push(pb("\u0627\u0644\u0645\u0635\u0627\u062F\u0631: ","Binance WS (real-time alerts), Lightweight Charts + Recharts + TradingView (visual tracking)"));
body.push(pb("\u0627\u0644\u0645\u0644فا\u062A: ","signals.tsx, journal.tsx, pnl.tsx, portfolio.tsx, signal-tracking/transition-engine.ts (LOCKED)"));

body.push(h2("\u0627\u0644\u0645ر\u062D\u0644\u0629 6: LEARN \u2014 \u0627\u0644\u062A\u0639ل\u0645 \u0648\u0627\u0644تحس\u064A\u0646"));
body.push(pb("\u0627\u0644\u0642\u062F\u0631\u0629: ","MOXI \u064A\u062A\u0639ل\u0645 \u0645ن journal + review + results. Backtest + experiment \u0644\u062Aحس\u064A\u0646 strategies."));
body.push(pb("\u0627\u0644\u0645صا\u062F\u0631: ","backtest/engine/*, experiment/runner.ts + evolution.ts, moxi/server/analyst.agent.ts + coach.agent.ts"));

// ═══ SECTION 5: PAGE CONSOLIDATION ═══
body.push(new Paragraph({children:[new PageBreak()]}));
body.push(h1("\u0627\u0644\u0642\u0633\u0645 5: Page Consolidation \u2014 41 Route \u2192 12 Core Experience"));
body.push(p("\u0647\u0630\u0627 \u0647و audit \u0643\u0644 41 route \u0648\u0642را\u0631 \u0645\u0635\u064Aر\u0647ا. \u0627\u0644\u0647\u062F\u0641: \u062A\u0642ل\u064Aل \u0627\u0644\u062Aشتت \u0648\u062C\u0639ل \u0643ل experience \u0644\u0647\u0627 goal \u0648\u0627ض\u062D. \u0627\u0644\u0635فح\u0627\u062A \u0627\u0644\u0645\u062D\u0630وف\u0629 \u062A\u062Aحو\u0644 \u0625\u0644\u0649 subviews/drawers/modals/tabs."));

body.push(h2("12 Core Experience \u0648\u0635ف\u062Dا\u062A\u0647\u0627"));
body.push(tbl(
  ["#","\u0627\u0644\u062A\u062C\u0631\u0628\u0629","\u0627\u0644\u0645\u0644\u0641","\u0627\u0644\u0647د\u0641","\u0627\u0644\u0645\u0635\u0627\u062F\u0631 OSS \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629"],
  [
    ["1","Command Center (Home)","index.tsx","\u0645\u0627 \u064A\u0645\u0631 \u0627\u0644\u0622\u0646 + \u0627\u0644\u0642را\u0631 \u0627\u0644\u0623\u0647\u0645","Binance WS, MOXI"],
    ["2","Discover","discover.tsx","\u0627\u0643\u062A\u0634\u0627ف \u0641ر\u0635","DexScreener, Birdeye, Helius, LunarCrush, Mobula, Twitter"],
    ["3","Asset Intelligence","token.$symbol.tsx","\u0630كاء token كا\u0645\u0644","Lightweight Charts, all discovery clients"],
    ["4","Analyze","analyze.tsx + analysis.$id.tsx","\u062Aحل\u064Aل فن\u064A + SMC","TwelveData, indicators, SMC, patterns"],
    ["5","Charts","charts.tsx","\u0631سوم \u0645ت\u0642دمة","TradingView Widgets"],
    ["6","Setup / Signal","signals.tsx","\u0625\u0639\u062Fاد + signals","Signal Tracking engine"],
    ["7","Trade Desk","trade-desk.tsx","\u062Aنف\u064Aذ","CCXT, Jupiter, Axiom"],
    ["8","Track","signals.tsx (active tab)","\u0645تابع\u0629 signals","Binance WS, Lightweight Charts"],
    ["9","Portfolio","portfolio.tsx","\u0645حفظة + PnL","Recharts, DeFiLlama, ECharts"],
    ["10","Journal / Review","journal.tsx","\u0645راج\u0639\u0629 + \u062Aعل\u0645","MOXI analyst, backtest"],
    ["11","MOXI (Copilot)","CopilotDrawer.tsx (global)","\u0642را\u0631 \u0630\u0643\u064A","Vercel AI SDK, Mastra (POC)"],
    ["12","Settings","settings.tsx","\u0625\u0639دا\u062F\u0627\u062A","\u0644ا OSS"],
  ]
));

body.push(h2("\u0627\u0644\u0635فح\u0627\u062A \u0627\u0644\u0645حذوف\u0629 / \u0627\u0644\u0645\u062Fمجة"));
body.push(tbl(
  ["\u0627\u0644\u0635ف\u062D\u0629","\u0627\u0644\u0645ص\u064Aر","\u0627\u0644\u062A\u0641ص\u064A\u0644"],
  [
    ["radar.tsx","Subview in Command Center","\u064A\u0635بح tab \u0641\u064A Home"],
    ["whale.tsx","Subview in Discover/Asset Intelligence","Tab \u0641\u064A token page"],
    ["bags.tsx","Subview in Portfolio","Tab \u0641\u064A Portfolio"],
    ["pulse.tsx","Subview in Command Center","Tab \u0641\u064A Home"],
    ["alpha.tsx","Subview in Discover","Filter in Discover"],
    ["predictions.tsx","MOXI panel","MOXI context"],
    ["curves.tsx","Subview in Portfolio","Tab \u0641\u064A Portfolio"],
    ["yield.tsx","Subview in Portfolio","Tab \u0641\u064A Portfolio"],
    ["perpetuals.tsx","Subview in Trade Desk","Tab \u0641\u064A Trade Desk"],
    ["swap.tsx","Drawer/Modal in Trade Desk","Action from Trade Desk"],
    ["wallet-web3.tsx","Settings subpage","\u062C\u0632\u0621 \u0645ن Settings"],
    ["activity-web3.tsx","Drawer in Portfolio","Activity panel"],
    ["backtest.tsx","Subview in Journal","Tab \u0641\u064A Journal"],
    ["experiments.tsx","Subview in Journal","Tab \u0641\u064A Journal"],
    ["daily-loop.tsx","MOXI panel","MOXI context"],
    ["arbitrage.tsx","Subview in Trade Desk","Tab \u0641\u064A Trade Desk"],
    ["vision.tsx","MOXI tool","MOXI chart analysis"],
    ["brokers.tsx","Settings subpage","\u062C\u0632\u0621 \u0645\u0646 Settings"],
    ["notifications.tsx","Global drawer","\u0644\u0627 \u064Aح\u062Aاج route"],
    ["premium.tsx","Modal","\u0645ن modal/upsell"],
    ["rewards.tsx","Subview in Settings","Tab \u0641\u064A Settings"],
    ["referral.tsx","Subview in Settings","Tab \u0641\u064A Settings"],
    ["communities.tsx","Delete","\u0644ا \u064Aوج\u062F value \u062Dا\u0644\u064A\u0627\u064B"],
    ["trackers.tsx","Merge with signals.tsx","Filter/tab"],
    ["admin/api-keys.tsx","Keep (admin-only)","\u0644ا \u064Aت\u0623\u062Bر"],
    ["profile.tsx","Merge in Settings","Tab \u0641\u064A Settings"],
  ]
));

// ═══ SECTION 6: INFORMATION HIERARCHY ═══
body.push(new Paragraph({children:[new PageBreak()]}));
body.push(h1("\u0627\u0644\u0642\u0633\u0645 6: Information Hierarchy \u2014 \u0627\u0644\u0631سوم \u0644\u0625\u062B\u0628\u0627\u062A \u0627\u0644\u0642\u0631\u0627\u0631 \u0648\u0644\u064A\u0633 \u0644\u0645\u0644\u0621 \u0627\u0644\u0634ا\u0634\u0629"));
body.push(p("\u0647\u0630\u0627 \u0647\u0648 \u0627\u0644\u0646مط \u0627\u0644\u0644\u064A \u064Aم\u0646ع VIXOR \u0645\u0646 \u0627لظهور \u0643\u0640 dashboard \u0645\u0644\u064A\u0621 \u0628\u0627\u0644\u0623\u062Fو\u0627\u062A (chart chart chart). \u0643\u0644 صفح\u0629 \u062A\u0628\u062F\u0623 \u0628\u0633\u0624\u0627\u0644 \u0648\u062A\u0646\u0647\u064A \u0628\u0625\u062B\u0628\u0627\u062A."));

body.push(h2("\u0627\u0644\u062Aرتي\u0628 \u0644\u0643\u0644 \u0635\u0641\u062D\u0629"));
body.push(tbl(
  ["\u0627\u0644\u0645\u0633\u062A\u0648\u0649","\u0627\u0644\u0633\u0624\u0627\u0644","\u0627\u0644\u0646\u0648\u0639","\u0645\u062B\u0627\u0644"],
  [
    ["1","WHAT MATTERS NOW","\u0642\u0631\u0627\u0631 / \u0625\u0634\u0639\u0627\u0631","\u0645\u0627 \u064A\u062Dت\u0627\u062C \u0627نته\u0627\0631 \u0641\u0648\u0631\u0627\u064B?"],
    ["2","WHY","\u0633ب\u0628 / \u062A\u062Dل\u064A\u0644","\u0644\u0645\u0627ذ\u0627 \u0647ذ\u0627 \u0627\u0644\u0642\u0631\u0627\u0631?"],
    ["3","WHAT SHOULD I DO","\u062A\u0648ص\u064A\u0629 / \u0625جر\u0627\u0621","MOXI \u064A\u0642تر\u062D setup"],
    ["4","WHAT IS THE RISK","\u0645خا\u0637\u0631","Risk parameters + confidence"],
    ["5","WHAT HAPPENS NEXT","\u062Aو\u0642\u0639ا\u062A","Scenarios + next steps"],
    ["6","EVIDENCE","\u0631سو\u0645 \u0628ي\u0627\u0646\u064A\u0629","Charts \u0644\u0625\u062B\u0628\u0627\u062A \u0627\u0644\u0642ر\u0627\u0631"],
  ]
));

body.push(h2("\u062Aطبي\u0642 ع\u0644\u0649 Command Center"));
body.push(p("\u0627\u0644\u0645\u0633\u062A\u0648\u0649 1: \u0625\u0634ع\u0627\u0631 \u0641\u0648\u0631\u064A \u0625\u0630\u0627 signal \u0628\u0644غ TP1 \u0623و SL \u0623و token حدث \u0641\u064A whale activity."));
body.push(p("\u0627\u0644\u0645\u0633\u062A\u0648\u0649 2: \u0644\u0645\u0627ذ\u0627 signal TP1? \u0644\u0623\u0646 RSI \u0643\u0627ن \u0641\u064A oversold + BOS \u0639\u0644\u0649 4H + whale accumulation."));
body.push(p("\u0627\u0644\u0645\u0633\u062A\u0648\u0649 3: \u0627\u062Aحرق TP2 \u0623و ضع stop \u0639ند entry."));
body.push(p("\u0627\u0644\u0645\u0633\u062A\u0648\u0649 4: R:R = 3.2:1, confidence 78%, max loss 2%."));
body.push(p("\u0627\u0644\u0645\u0633\u062A\u0648\u0649 5: \u0625\u0630ت \u0628لغ TP2, partial profit + trail stop. \u0625\u0630\u0627 rejected, SL ب\u064Aفوت."));
body.push(p("\u0627\u0644\u0645\u0633\u062A\u0648\u0649 6: \u0631\u0633م candlestick + volume profile + whale transactions (ECharts heatmap)."));

// ═══ SECTION 7: MOXI ARCHITECTURE ═══
body.push(new Paragraph({children:[new PageBreak()]}));
body.push(h1("\u0627\u0644\u0642\u0633\u0645 7: MOXI Architecture V2"));
body.push(p("\u0645\u0648\u062C\u0648\u062F حا\u0644\u064A\u0627\u064B: moxi/functions.ts (endpoint), moxi/agents.ts (registry), moxi/server/agent.ts (base), 4 agents (analyst, coach, governor, hunter), moxi/tools.ts, moxi/context-engine.ts, moxi/prompt.ts, moxi/persona.ts."));

body.push(h2("\u0627\u0644\u0645ش\u0643ل\u0629 ا\u0644\u062Dا\u0644ي\u0629"));
body.push(p("MOXI \u0627\u0644\u062Dا\u0644\u064A \u064A\u0639م\u0644 ك\u0640 chatbot + tools. \u064Aرد \u0639\u0644\u0649 \u0627\u0644\u0645ست\u062E\u062F\u0645 \u0644\u0643ن \u0644\u0627 \u064A\u0642\u0648\u062F initiative. \u0627\u0644\u0645ست\u062E\u062F\u0645 \u064Aجب \u0623\u0646 \u064A\u0633\u0623\u0644 \u0623\u0648\u0644\u0627\u064B. MOXI \u0644\u0627 \u064A\u062Cه\u0632 decision \u0628\u0646فس\u0647. \u0627\u0644\u0623\u062Cه\u0632\u0629 \u0645فتوحة \u0648\u0644كن ل\u0627 decision layer. Vercel AI SDK \u064A\u0639م\u0644 \u0644\u0643\u0646 multi-agent workflow \u0645\u062Dد\u0648\u062F."));

body.push(h2("MOXI V2 \u0645\u0642\u062A\u0631\u062D"));
body.push(p("1. MOXI \u064A\u062Cه\u0632 proactive insights (\u0644\u0627 ينتظ\u0631 \u0633\u0624\u0627\u0644)."));
body.push(p("2. MOXI \u064A\u0631ب\u0637 Discovery + Analysis + User Context \u2192 Opportunity Ranking. هذ\u0627 Decision Layer."));
body.push(p("3. Mastra POC \u0644\u062A\u062Dس\u064A\u0646 multi-agent workflow (analyst + coach + governor + hunter \u064A\u062Aحا\u062F\u062B\u0648\u0646 \u0628\u0628\u0639ض, ل\u0627 يست\u0642طعو\u0646)."));
body.push(p("4. A/B testing: Mastra vs Vercel AI SDK \u0639\u0644\u0649 tool calling, memory, workflow, latency, cost, context management."));
body.push(pb("\u0645\u0644ف\u0627\u062A \u0627\u0644\u062A\u0623\u062B\u064A\u0631: ","moxi/agents.ts, moxi/server/agent.ts, moxi/server/*.agent.ts, debate/engine/debate.engine.ts, moxi/context-engine.ts, moxi/tools.ts"));

// ═══ SECTION 8: MIGRATION STRATEGY V2 ═══
body.push(new Paragraph({children:[new PageBreak()]}));
body.push(h1("\u0627\u0644\u0642\u0633\u0645 8: Migration Strategy V2 \u2014 \u0645ب\u0646\u064A \u0639\u0644\u0649 Business Value"));
body.push(p("\u0627\u0644\u062Aرتي\u0628 \u0644\u064A\u0633 حس\u0628 \u0627\u0644\u0645\u0643\u062Aب\u0629 \u0648\u0644ك\u0646 \u062Dس\u0628: Business Value x Technical Value x Risk x Dependency. \u0643\u0644 integration \u064A\u062Cب \u064Aن\u062A\u062C capability \u0645\u0633\u062A\u062E\u062F\u0645 \u0641\u0639\u0644\u064A \u0641\u064A User Journey."));

body.push(tbl(
  ["\u0627\u0644\u0645ر\u062D\u0644\u0629","\u0627\u0644\u0645\u0643\u0648\u0646","\u0627\u0644\u0642\u062F\u0631\u0629 \u0644\u0644\u0645\u0633\u062A\u062E\u062F\u0645","\u0627\u0644\u0645خا\u0637\u0631","\u0627\u0644\u0645\u0644ف \u0627\u0644\u0645\u0642\u062A\u0631\u062D","\u0627\u0644\u062A\u0648\u0642\u064A\u062A"],
  [
    ["1","DeFiLlama SDK","TVL/yield/fees \u0644\0640 yield+curves+portfolio","\u0645\u0646\u062Eفض\u0629","shared/market-data/defillama.client.ts","\u0628\u0639د Task 2"],
    ["2","tulip-node POC","100+ indicator \u0644\u0640 analyze (POC + comparison \u0623\u0648\u0644\u0627\u064B)","\u0645ت\u0648س\u0637\u0629","analysis/engine/indicators/tulip-adapter.ts","\u0628\u0639د Task 4"],
    ["3","Mastra POC","Multi-agent workflow \u0644\u0640 MOXI (POC + A/B)","\u0639\u0627\u0644\u064A\u0629","moxi/mastra-adapter.ts","\u0628\u0639د FULL TEST"],
    ["4","ECharts","Heatmap/Radar/Network \u0644\u0640 radar+whale+portfolio","\u0645\u0646\u062E\u0641\u0636\u0629","components/vixor/charts/echarts/","\u0639\u0646\u062F \u0627\u0644\u0637\u0644\u0628"],
    ["5","Experience Layer","User Journey + Decision + Info Hierarchy","\u0645توس\u0637\u0629","shared/experience/ (new domain)","\u0645\u0639 Task 2"],
    ["6","Decision Layer","Opportunity Rank + Confidence + Risk","\u0645\2Bلط\u0629","shared/decision/ (new domain)","\u0645\u0639 Task 3"],
    ["7","Page Consolidation","41 \u2192 12 core experience","\u0645توس\u0637\u0629","routes/* (restructure)","\u0645ع Task 5"],
  ]
));

body.push(h2("\u0642\u0627عد\u0629 \u0627ل\u062Dرك"));
body.push(pb("1. ","أ\u064A Integration \u0644\u0627 \u064A\u0646\u062A\u062C \u0639\u0646\u0647 capability \u0645\u0633\u062A\u062E\u062F\u0645\u0629 \u0641\u064A User Journey = \u0644\u0627 \u0646\u062F\u062E\u0644\u0647."));
body.push(pb("2. ","\u0643\u0644 POC (tulip, Mastra) \u064A\u062C\u0628 \u064A\u0643\u0648\u0646 ف\u064A branch \u0645\u0646\u0641\u0635\u0644. \u0644\u0627 migration \u0642\u0628\u0644 comparison."));
body.push(pb("3. ","ا\u0644\u0645\u0644\u0641\u0627\u062A LOCKED \u0641\u064A Task 1.2C (signal-tracking/) \u0644\u0627 \u062A\u064F\u0645\u0633."));
body.push(pb("4. ","\u0627\u0644\u062A\u0631\062A\u064A\u0628 \u064A\u062Eض\u0639 \u0644\0640 Business Value \u0623\u0648\u0644\u0627\u064B, Technical Value \u062B\u0627\u0646\u064A\u0627\u064B."));

body.push(h2("\u0645\u0627 \u0644\u0627 \u064A\u062A\u063A\u064A\u0631"));
body.push(p("Infrastructure (Supabase/Redis/Vercel/Sentry) \u0644\u0627 \u064A\u062A\u063A\u064A\u0631. Frontend stack (shadcn/Radix/Tailwind/Framer Motion/Zustand/TanStack) \u0644\u0627 \u064A\u062A\u063A\u064A\u0631. 14 \u0645\u0634ر\u0648\u0639 A \u0645\u062F\u0645\u062C\u0629 \u0628\u0627\u0642\u064A \u0644\u0643ن \u062Aحت\u0627\u062C end-to-end validation. 4 \u0645ش\u0627ر\u064A\u0639 C (Hummingbot/FreqTrade/Backtrader/CrewAI) \u0645راج\u0639 \u0641\u0642\u0637 \u0644\u062A\u062D\u0633\u064A\u0646 patterns. ECharts (D) \u064A\u0636ا\u0641 ع\u0646\u062F \u0627\u0644\u0637\u0644\u0628. Tremor + LangChain = E (\u0644\u0627 \u0646\u0633\u062A\u062E\u062F\u0645)."));

// BUILD DOC
const doc = new Document({
  styles:{default:{document:{run:{font:{ascii:"Calibri",eastAsia:"Microsoft YaHei"},size:22,color:hc(C.b)},paragraph:{spacing:{line:312}}},heading1:{run:{font:{ascii:"Calibri",eastAsia:"SimHei"},size:32,bold:true,color:hc(C.p)}},heading2:{run:{font:{ascii:"Calibri",eastAsia:"SimHei"},size:28,bold:true,color:hc(C.p)}},heading3:{run:{font:{ascii:"Calibri",eastAsia:"SimHei"},size:24,bold:true,color:hc(C.p)}}}},
  sections:[
    {properties:{page:{size:{width:11906,height:16838},margin:{top:0,bottom:0,left:0,right:0}}}, children:[new Table({width:{size:100,type:WidthType.PERCENTAGE},layout:TableLayoutType.FIXED,borders:tB, rows:[new TableRow({height:{value:16838,rule:"exact"}, children:[new TableCell({shading:{type:ShadingType.CLEAR,fill:"162235"}, borders:{top:NB,bottom:NB,left:NB,right:NB}, children:coverChildren})]})]})]},
    {properties:{page:{size:{width:11906,height:16838},margin:{top:1440,bottom:1440,left:1701,right:1417}}}, headers:{default:new Header({children:[new Paragraph({alignment:AlignmentType.RIGHT, children:[new TextRun({text:"VIXOR Architecture V2 Revised \u2014 Product + Intelligence",size:16,color:hc(C.g),font:{ascii:"Calibri"}})]})]})}, footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER, children:[new TextRun({children:[PageNumber.CURRENT],size:18,color:hc(C.g)})]})]})}, children:body }
  ]
});

Packer.toBuffer(doc).then(buf=>{
  fs.writeFileSync("/home/z/my-project/download/VIXOR_Architecture_V2_Revised.docx",buf);
  console.log("DONE: VIXOR_Architecture_V2_Revised.docx");
}).catch(e=>{console.error("ERROR:",e);process.exit(1);});
