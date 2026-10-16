import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useStudy } from "@/features/study/StudyProvider";
import { localDate } from "@/features/study/utils";
import type { SchoolworkItem, TuitionItem } from "@/features/study/types";
import { WorkEditor } from "@/components/study/Editors";
import { WorkList } from "@/components/study/StudyRows";
import { PageHeading, SectionHeading } from "@/components/study/StudyUI";
export function SchoolworkPage() {
  const study = useStudy();
  const [item, setItem] = useState<SchoolworkItem | "new" | null>(null);
  const overdue = useMemo(() => study.data.schoolwork.filter((work) => work.status !== "Completed" && work.dueDate < localDate()).length, [study.data.schoolwork]);
  return <><PageHeading eyebrow="Assignments" title="Schoolwork" description="Keep class assignments, teacher instructions, and due dates together." action={<button type="button" className="button button-primary" onClick={() => setItem("new")}><Plus size={16} /> Add schoolwork</button>} /><div className="queue-summary"><div><strong>{study.data.schoolwork.filter((work) => work.status !== "Completed").length}</strong><span>Still to complete</span></div><div><strong className={overdue ? "text-overdue" : ""}>{overdue}</strong><span>Overdue</span></div><div><strong>{study.data.schoolwork.filter((work) => work.status === "Completed").length}</strong><span>Completed</span></div></div><section className="dashboard-section"><SectionHeading title="Assignments" note="Pending work stays visible until you complete or update it." /><div className="panel work-panel"><WorkList items={study.data.schoolwork} kind="school" onEdit={(work) => setItem(work as SchoolworkItem)} emptyTitle="No school assignments yet" /></div></section>{item && <WorkEditor kind="school" existing={item === "new" ? undefined : item} onClose={() => setItem(null)} />}</>;
}
export function TuitionPage() {
  const study = useStudy();
  const [item, setItem] = useState<TuitionItem | "new" | null>(null);
  const overdue = useMemo(() => study.data.tuition.filter((work) => work.status !== "Completed" && work.dueDate < localDate()).length, [study.data.tuition]);
  return <><PageHeading eyebrow="After tuition" title="Tuition work" description="Capture homework while it is fresh. It stays here until you mark it complete." action={<button type="button" className="button button-primary" onClick={() => setItem("new")}><Plus size={16} /> Add tuition work</button>} /><div className="queue-summary"><div><strong>{study.data.tuition.filter((work) => work.status !== "Completed").length}</strong><span>Still to complete</span></div><div><strong className={overdue ? "text-overdue" : ""}>{overdue}</strong><span>Overdue</span></div><div><strong>{study.data.tuition.filter((work) => work.status === "Completed").length}</strong><span>Completed</span></div></div><section className="dashboard-section"><SectionHeading title="Assignments" note="Link a homework item to its chapter whenever it helps." /><div className="panel work-panel"><WorkList items={study.data.tuition} kind="tuition" onEdit={(work) => setItem(work as TuitionItem)} emptyTitle="No tuition homework yet" /></div></section>{item && <WorkEditor kind="tuition" existing={item === "new" ? undefined : item} onClose={() => setItem(null)} />}</>;
}
