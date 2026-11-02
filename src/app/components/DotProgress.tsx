export default function DotProgress({ percent }: { percent: number }) {
  const dots = Array.from({ length: 180 }, (_, index) => {
    const angle = index * 2.399963229728653;
    const radius = Math.sqrt(index / 179) * 104;
    const filled = index < Math.round(Math.max(0, Math.min(100, percent)) * 1.8);
    return <circle key={index} cx={120 + Math.cos(angle) * radius} cy={120 + Math.sin(angle) * radius} r={filled ? 2.5 : 1.2} fill="currentColor" opacity={filled ? 1 : 0.22}/>;
  });
  return <svg className="dot-progress" viewBox="0 0 240 240" aria-hidden="true">{dots}</svg>;
}
