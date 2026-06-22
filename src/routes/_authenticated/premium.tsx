import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/premium")({
  head: () => ({ meta: [{ title: "Vixor Pro — Vixor" }] }),
  component: PremiumPage,
});

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with basic trading tools",
    features: [
      { label: "Basic token discovery", included: true },
      { label: "5 price alerts", included: true },
      { label: "Community access", included: true },
      { label: "Basic portfolio tracking", included: true },
      { label: "AI trading signals", included: false },
      { label: "Whale alerts", included: false },
      { label: "Unlimited alerts", included: false },
      { label: "API access", included: false },
      { label: "Priority support", included: false },
      { label: "Custom strategies", included: false },
    ],
    cta: "Current Plan",
    ctaColor: "#4A5568",
    ctaBg: "rgba(255,255,255,0.04)",
    current: true,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For serious meme coin traders",
    badge: "POPULAR",
    features: [
      { label: "Advanced token discovery", included: true },
      { label: "Unlimited price alerts", included: true },
      { label: "Community access", included: true },
      { label: "Full portfolio analytics", included: true },
      { label: "AI trading signals", included: true },
      { label: "Whale alerts", included: true },
      { label: "Unlimited alerts", included: true },
      { label: "API access", included: true },
      { label: "Priority support", included: true },
      { label: "Custom strategies", included: false },
    ],
    cta: "Upgrade to Pro",
    ctaColor: "#fff",
    ctaBg: "#3B82F6",
    current: false,
  },
  {
    name: "Enterprise",
    price: "$99",
    period: "/month",
    description: "For teams and professional traders",
    features: [
      { label: "Everything in Pro", included: true },
      { label: "Custom dashboards", included: true },
      { label: "Team collaboration", included: true },
      { label: "Advanced analytics", included: true },
      { label: "Unlimited AI signals", included: true },
      { label: "Whale tracking API", included: true },
      { label: "Unlimited everything", included: true },
      { label: "Full API access", included: true },
      { label: "24/7 dedicated support", included: true },
      { label: "Custom strategies", included: true },
    ],
    cta: "Contact Sales",
    ctaColor: "#F0F4FC",
    ctaBg: "rgba(255,255,255,0.1)",
    current: false,
  },
];

function PremiumPage() {
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "#F0F4FC" }}>
      {/* Header */}
      <div style={{ padding: "16px 12px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize: "22px", fontWeight: 800, background: "linear-gradient(135deg, #3B82F6, #60A5FA, #A78BFA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Vixor Pro
        </div>
        <p style={{ fontSize: "11px", color: "#7B8BA8", marginTop: "4px" }}>Supercharge your trading with AI-powered tools and real-time intelligence</p>
      </div>

      {/* Plans */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", padding: "12px" }}>
        {PLANS.map((plan) => (
          <div key={plan.name} style={{
            borderRadius: "10px", border: plan.name === "Pro" ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.06)",
            background: plan.name === "Pro" ? "rgba(59,130,246,0.05)" : "#161b2e",
            overflow: "hidden", position: "relative",
          }}>
            {plan.badge && (
              <div style={{
                position: "absolute", top: "8px", right: "-20px", transform: "rotate(45deg)",
                background: "#3B82F6", color: "#fff", fontSize: "7px", fontWeight: 800,
                padding: "2px 24px",
              }}>{plan.badge}</div>
            )}
            <div style={{ padding: "16px 12px 12px" }}>
              <div style={{ fontSize: "14px", fontWeight: 800 }}>{plan.name}</div>
              <div style={{ fontSize: "9px", color: "#7B8BA8", marginTop: "2px" }}>{plan.description}</div>
              <div style={{ marginTop: "10px" }}>
                <span style={{ fontSize: "28px", fontWeight: 800, fontFamily: "monospace" }}>{plan.price}</span>
                <span style={{ fontSize: "11px", color: "#7B8BA8" }}>{plan.period}</span>
              </div>
            </div>
            <div style={{ padding: "0 12px 12px" }}>
              {plan.features.map((f) => (
                <div key={f.label} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "3px 0" }}>
                  <span style={{ fontSize: "10px", color: f.included ? "#22C55E" : "#4A5568" }}>
                    {f.included ? "&#10003;" : "&#10007;"}
                  </span>
                  <span style={{ fontSize: "10px", color: f.included ? "#F0F4FC" : "#4A5568" }}>{f.label}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: "0 12px 12px" }}>
              <button style={{
                width: "100%", padding: "8px", borderRadius: "6px", border: "none",
                background: plan.ctaBg, color: plan.ctaColor,
                fontSize: "11px", fontWeight: 700, cursor: "pointer",
                opacity: plan.current ? 0.6 : 1,
              }}>
                {plan.cta}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div style={{ padding: "0 12px 20px" }}>
        <div style={{ fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>Frequently Asked Questions</div>
        {[
          { q: "Can I cancel anytime?", a: "Yes, you can cancel your subscription at any time. You'll keep access until the end of your billing period." },
          { q: "Is there a free trial?", a: "Yes! Pro comes with a 7-day free trial. No credit card required to start." },
          { q: "What payment methods?", a: "We accept SOL, USDC, credit cards, and crypto via Coinbase Commerce." },
        ].map((faq) => (
          <div key={faq.q} style={{ background: "#161b2e", borderRadius: "6px", padding: "10px 12px", marginBottom: "6px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "4px" }}>{faq.q}</div>
            <div style={{ fontSize: "10px", color: "#7B8BA8", lineHeight: 1.5 }}>{faq.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}