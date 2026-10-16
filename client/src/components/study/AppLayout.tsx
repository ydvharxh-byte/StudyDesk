import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Activity, BookOpen, BookText, CalendarDays, ChevronRight, CircleHelp, ClipboardList, Code2, Database, FlaskConical, GraduationCap, LayoutDashboard, Menu, NotebookPen, PanelLeftClose, Settings2, X } from "lucide-react";
import { SUBJECTS, type SubjectId } from "@/features/study/types";
import { useStudy } from "@/features/study/StudyProvider";

const icons: Record<SubjectId, typeof BookOpen> = {
  physics: Activity,
  chemistry: FlaskConical,
  mathematics: NotebookPen,
  "computer-science": Code2,
  "english-core": BookText,
  "physical-education": GraduationCap,
};
const subjects = SUBJECTS;
const navBase = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Daily Planner", href: "/planner", icon: CalendarDays },
  { label: "Schoolwork", href: "/schoolwork", icon: ClipboardList },
  { label: "Tuition Work", href: "/tuition", icon: GraduationCap },
];
const navEnd = [
  { label: "All Chapters", href: "/chapters", icon: BookOpen },
  { label: "Resources", href: "/resources", icon: CircleHelp },
  { label: "Settings & Backup", href: "/settings", icon: Settings2 },
];

function NavItem({ label, href, icon: Icon, onNavigate }: { label: string; href: string; icon: typeof BookOpen; onNavigate?: () => void }) {
  const [location] = useLocation();
  const active = href === "/" ? location === "/" : location === href || location.startsWith(`${href}/`);
  return <Link href={href} onClick={onNavigate} className={`nav-link${active ? " is-active" : ""}`} aria-current={active ? "page" : undefined}><Icon size={17} strokeWidth={1.8} /><span>{label}</span>{active && <span className="nav-active-dot" />}</Link>;
}
function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  return <nav aria-label="Primary navigation"><div className="nav-label">Workspace</div>{navBase.map((item) => <NavItem {...item} key={item.href} onNavigate={onNavigate} />)}<div className="nav-label nav-label-spaced">Subjects</div>{subjects.map((subject) => <NavItem key={subject.id} label={subject.label === "English Core" ? "English" : subject.label} href={`/subject/${subject.id}`} icon={icons[subject.id]} onNavigate={onNavigate} />)}<div className="nav-label nav-label-spaced">Study library</div>{navEnd.map((item) => <NavItem {...item} key={item.href} onNavigate={onNavigate} />)}</nav>;
}
export default function AppLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const study = useStudy();
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span><strong>Study Desk</strong><small>CLASS 11 · 2026–27</small></span><PanelLeftClose className="brand-hint" size={18} /></div><Navigation /><div className="sidebar-bottom"><div className="sidebar-rule" /><div className="local-badge"><span className={`save-dot${study.saveError || study.status === "corrupt" ? " save-dot-error" : ""}`} />{study.status === "corrupt" ? "Storage needs attention" : study.saveError ? "Save needs attention" : "Saved in this browser"}</div><p>Your study data stays on this device.</p></div></aside>
    <div className="main-column"><header className="mobile-header"><button type="button" className="icon-button mobile-menu-button" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={20} /></button><Link href="/" className="mobile-brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>Study Desk</Link><span className="mobile-term">CLASS 11</span></header>
      {mobileOpen && <div className="mobile-nav-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setMobileOpen(false); }}><aside className="mobile-nav-panel"><div className="mobile-nav-head"><div className="brand"><span className="brand-mark"><i /><i /><i /></span><strong>Study Desk</strong></div><button type="button" className="icon-button" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={19} /></button></div><Navigation onNavigate={() => setMobileOpen(false)} /></aside></div>}
      <main className="main-content">{study.status === "corrupt" && <div className="notice notice-warning" role="alert"><Database size={16} /><span>{study.message} Go to <Link href="/settings">Settings & Backup</Link> to restore a backup or reset deliberately.</span><ChevronRight size={16} /></div>}{study.saveError && <div className="notice notice-warning" role="alert">{study.saveError} Visit Settings & Backup before continuing.</div>}{children}</main>
      <footer className="page-footer"><span>Study Desk <span aria-hidden="true">·</span> Class XI</span><span>Personal study data is stored locally in this browser.</span></footer>
    </div>
  </div>;
}
