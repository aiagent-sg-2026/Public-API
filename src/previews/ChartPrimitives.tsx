export function Sparkline({ values, label }: { values: number[]; label: string }) {
  const clean = values.filter(Number.isFinite).slice(-60)
  const points = clean.length > 1 ? clean : [clean[0] ?? 0, clean[0] ?? 0]
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const path = points.map((value, index) => `${(index / (points.length - 1)) * 100},${34 - ((value - min) / range) * 27}`).join(" ")
  return <svg className="market-sparkline" viewBox="0 0 100 38" preserveAspectRatio="none" role="img" aria-label={label}><defs><linearGradient id="marketArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3975f7" stopOpacity=".28"/><stop offset="1" stopColor="#3975f7" stopOpacity="0"/></linearGradient></defs><polygon points={`0,38 ${path} 100,38`} fill="url(#marketArea)"/><polyline points={path} fill="none" stroke="#3975f7" strokeWidth="1.8" vectorEffect="non-scaling-stroke"/></svg>
}
