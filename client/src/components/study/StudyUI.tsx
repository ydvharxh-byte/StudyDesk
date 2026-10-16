import type { ReactNode } from "react";
import { X } from "lucide-react";
import type { ChapterStatus, PriorityLevel, WorkStatus } from "@/features/study/types";

export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="page-heading"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="page-heading-action">{action}</div>}</div>;
}
export function SectionHeading({ title, note, action }: { title: string; note?: string; action?: ReactNode }) {
  return <div className="section-heading"><div><h2>{title}</h2>{note && <p>{note}</p>}</div>{action && <div>{action}</div>}</div>;
}
export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  return <div className="progress-wrap"><div className="progress-track" role="progressbar" aria-valuenow={safe} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? "Progress"}><span style={{ width: `${safe}%` }} /></div><span className="progress-value">{safe}%</span></div>;
}
export function StatusBadge({ status }: { status: ChapterStatus | WorkStatus }) {
  const names: Record<ChapterStatus | WorkStatus, string> = { "not-started": "Not started", "in-progress": "In progress", completed: "Completed", Pending: "Pending", "In Progress": "In progress", Completed: "Completed" };
  return <span className={`status-badge status-${String(status).toLowerCase().replaceAll(" ", "-")}`}>{names[status]}</span>;
}
export function PriorityBadge({ level, rank }: { level: PriorityLevel; rank?: number }) {
  return <span className={`priority-badge priority-${level.toLowerCase()}`}>{rank !== undefined && <span className="priority-rank">{rank}</span>}{level}</span>;
}
export function EmptyState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return <div className="empty-state"><span className="empty-mark" aria-hidden="true">—</span><div><strong>{title}</strong><p>{detail}</p></div>{action}</div>;
}
export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className={`modal-panel${wide ? " modal-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}><header className="modal-header"><h2>{title}</h2><button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button></header>{children}</section></div>;
}
export function confirmDelete(name: string) {
  return window.confirm(`Delete “${name}”? This cannot be undone.`);
}
export function FormError({ children }: { children?: ReactNode }) {
  return children ? <p className="form-error" role="alert">{children}</p> : null;
}
