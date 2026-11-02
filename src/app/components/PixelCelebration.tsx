import { useEffect, useState, type CSSProperties } from 'react';
import { useReducedMotion } from 'motion/react';

/** Short, decorative burst. Never delays saving or blocks interaction. */
export default function PixelCelebration() {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 1300);
    return () => window.clearTimeout(timer);
  }, []);
  if (!visible || reduceMotion) return null;
  return <div className="pixel-celebration" aria-hidden="true">{Array.from({ length: 28 }, (_, i) => {
    const angle = i * 2.39996;
    const radius = 70 + (i % 5) * 29;
    return <span key={i} style={{
      '--pixel-x': `${Math.cos(angle) * radius}px`,
      '--pixel-y': `${Math.sin(angle) * radius - 60}px`,
      '--pixel-turn': `${(i % 3 - 1) * 90}deg`,
      animationDelay: `${(i % 4) * 25}ms`,
      width: i % 3 === 0 ? 8 : 5,
      height: i % 3 === 0 ? 8 : 5,
    } as CSSProperties}/>;
  })}</div>;
}
