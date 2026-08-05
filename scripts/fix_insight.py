import re

with open('/home/z/my-project/src/routes/_authenticated/index.tsx', 'r') as f:
    lines = f.readlines()

# Find the InsightCard function body and replace it
start_marker = '  const config = {
    bullish: {
      color: "var(--color-bullish)",'
end_marker = '// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n// Main Page'

start_idx = None
end_idx = None
for i, line in enumerate(lines):
    if '  const config = {' in line and i > 410 and 'bullish' in lines[i+1]:
        start_idx = i
    if start_idx and '// Main Page' in line:
        end_idx = i
        break

if start_idx and end_idx:
    new_block = '''  const config = {
    bullish: { color: "var(--color-bullish)", gradient: "from-[rgba(34,211,166,0.1)] via-transparent to-transparent", borderColor: "rgba(34,211,166,0.2)", glowColor: "rgba(34,211,166,0.15)", Icon: TrendingUp, badge: "BULLISH" },
    bearish: { color: "var(--color-bearish)", gradient: "from-[rgba(251,70,103,0.1)] via-transparent to-transparent", borderColor: "rgba(251,70,103,0.2)", glowColor: "rgba(251,70,103,0.15)", Icon: ArrowDownRight, badge: "BEARISH" },
    neutral: { color: "var(--color-primary)", gradient: "from-[rgba(99,102,241,0.1)] via-transparent to-transparent", borderColor: "rgba(99,102,241,0.2)", glowColor: "rgba(99,102,241,0.15)", Icon: Bot, badge: "NEUTRAL" },
    alert: { color: "var(--color-neutral-wait)", gradient: "from-[rgba(245,158,11,0.1)] via-transparent to-transparent", borderColor: "rgba(245,158,11,0.2)", glowColor: "rgba(245,158,11,0.15)", Icon: AlertTriangle, badge: "ALERT" },
  };

  const c = config[type];
  const TypeIcon = c.Icon;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={"relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br " + c.gradient}
      style={{ border: "1px solid " + c.borderColor, boxShadow: "0 8px 40px " + c.glowColor }}
    >
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-[60px] animate-pulse pointer-events-none" style={{ background: c.glowColor }} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl" style={{ background: "color-mix(in srgb, " + c.color + " 12%, transparent)", border: "1px solid " + c.borderColor, boxShadow: "0 0 24px " + c.glowColor }}>
              <TypeIcon size={18} style={{ color: c.color, strokeWidth: 2.2 }} />
            </div>
            <div>
              <h4 className="text-[13px] font-bold text-foreground">{title}</h4>
              <span className="text-[10px] flex items-center gap-1" style={{ color: c.color }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: c.color }} />
                {type === "bullish" ? "Strong signal" : type === "alert" ? "High alert" : "Monitoring"}
              </span>
            </div>
          </div>
          <span className="px-3 py-1 text-[10px] font-bold rounded-full" style={{ background: "color-mix(in srgb, " + c.color + " 12%, transparent)", color: c.color, border: "1px solid " + c.borderColor }}>
            {c.badge}
          </span>
        </div>
        <p className="text-[12px] leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>{description}</p>
        {actionLabel && (
          <motion.button onClick={onAction} whileTap={{ scale: 0.95 }} className="mt-4 px-5 py-2 text-[11px] font-bold rounded-xl flex items-center gap-2 cursor-pointer" style={{ background: c.color, color: "white", boxShadow: "0 4px 20px " + c.glowColor }}>
            <Zap size={12} />{actionLabel}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

'''
    lines = lines[:start_idx] + [new_block] + lines[end_idx:]
    with open('/home/z/my-project/src/routes/_authenticated/index.tsx', 'w') as f:
        f.writelines(lines)
    print(f'SUCCESS: replaced lines {start_idx+1} to {end_idx}')
else:
    print(f'NOT FOUND: start={start_idx}, end={end_idx}')