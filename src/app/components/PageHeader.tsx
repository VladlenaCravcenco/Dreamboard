import type { ReactNode } from 'react';

/** One heading style for every top-level screen. */
export default function PageHeader({ eyebrow, title, caption, action }: { eyebrow?: ReactNode; title: ReactNode; caption?: ReactNode; action?: ReactNode }) {
  return <header className="page-header">
    <div>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="board-heading">{title}</h1>
      {caption && <p className="page-caption">{caption}</p>}
    </div>
    {action && <div className="page-header-action">{action}</div>}
  </header>;
}
