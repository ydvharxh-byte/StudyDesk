import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Check, Circle, Pencil, Plus, Trash2 } from "lucide-react";
import { useStudy, newId } from "@/features/study/StudyProvider";
import { localDate, dateLabel, fullDateLabel } from "@/features/study/utils";
import { SUBJECTS, subjectProgress, subjectName, type DailyChecklistItem, type SchoolworkItem, type StudyPlan, type StudyTask } from "@/features/study/types";
import { TaskEditor, WorkEditor } from "@/components/study/Editors";
import { DailyChecklistEditor, StudyPlanEditor } from "@/components/study/DashboardEditors";
import { TaskList, WorkList } from "@/components/study/StudyRows";
import { EmptyState, PageHeading, ProgressBar, SectionHeading, confirmDelete } from "@/components/study/StudyUI";

export default function Dashboard() {
  const study = useStudy();
  const today = localDate();
  const [checklistEditor, setChecklistEditor] = useState<DailyChecklistItem | "new" | null>(null);
  const [taskEditor, setTaskEditor] = useState<StudyTask | "new" | null>(null);
  const [schoolEditor, setSchoolEditor] = useState<SchoolworkItem | "new" | null>(null);
  const [planEditor, setPlanEditor] = useState<StudyPlan | "new" | null>(null);
  const checklist = useMemo(() => study.data.dailyChecklist.filter((item) => item.date === today).sort((a, b) => Number(a.completed) - Number(b.completed) || a.createdAt.localeCompare(b.createdAt)), [study.data.dailyChecklist, today]);
  const completedChecklist = checklist.filter((item) => item.completed).length;
  const studyTasks = study.data.tasks;
  const schoolwork = study.data.schoolwork;
  const plans = study.data.studyPlans;
  return <>
    <PageHeading eyebrow="Your study space" title="A clear plan for today." description={fullDateLabel()} />

    <section className="dashboard-section">
      <SectionHeading title="Daily Checklist" note={`${completedChecklist} of ${checklist.length} completed`} action={<button type="button" className="button button-primary button-small" onClick={() => setChecklistEditor("new")}><Plus size={14} /> Add item</button>} />
      <div className="panel daily-checklist-panel">
        {checklist.length ? <>
          <ProgressBar value={checklist.length ? completedChecklist / checklist.length * 100 : 0} label="Daily checklist completion" />
          {checklist.map((item) => <article className={`daily-checklist-row${item.completed ? " is-complete" : ""}`} key={item.id}>
            <button type="button" className={`task-check${item.completed ? " checked" : ""}`} aria-label={item.completed ? `Mark ${item.title} incomplete` : `Mark ${item.title} complete`} onClick={() => study.updateDailyChecklistItem({ ...item, completed: !item.completed })}>{item.completed ? <Check size={14} /> : <Circle size={15} />}</button>
            <span className="daily-checklist-title">{item.title}</span>
            {item.date !== today && <small>{dateLabel(item.date, { month: "short", day: "numeric" })}</small>}
            <div className="row-actions"><button type="button" className="icon-button row-action" aria-label={`Edit ${item.title}`} onClick={() => setChecklistEditor(item)}><Pencil size={14} /></button><button type="button" className="icon-button row-action" aria-label={`Delete ${item.title}`} onClick={() => confirmDelete(item.title) && study.removeDailyChecklistItem(item.id)}><Trash2 size={14} /></button></div>
          </article>)}
        </> : <EmptyState title="Your checklist is clear" detail="Add the small tasks you want to check off today." action={<button type="button" className="button button-secondary button-small" onClick={() => setChecklistEditor("new")}><Plus size={14} /> Add item</button>} />}
      </div>
    </section>

    <section className="dashboard-section">
      <SectionHeading title="To-Do List" note="Study tasks and pending schoolwork stay on their assigned dates." />
      <div className="todo-columns">
        <section className="todo-subsection"><SectionHeading title="Study tasks" note={`${studyTasks.filter((task) => !task.completed).length} pending`} action={<button type="button" className="text-button" onClick={() => setTaskEditor("new")}><Plus size={14} /> Add task</button>} /><div className="panel task-panel"><TaskList tasks={studyTasks} onEdit={setTaskEditor} showDate emptyTitle="No study tasks yet" emptyDetail="Add a task with a subject, priority and date." /></div></section>
        <section className="todo-subsection"><SectionHeading title="Schoolwork" note={`${schoolwork.filter((item) => item.status !== "Completed").length} pending`} action={<button type="button" className="text-button" onClick={() => setSchoolEditor("new")}><Plus size={14} /> Add schoolwork</button>} /><div className="panel work-panel"><WorkList items={schoolwork} kind="school" onEdit={(item) => setSchoolEditor(item as SchoolworkItem)} emptyTitle="No schoolwork waiting" /></div></section>
      </div>
    </section>

    <section className="dashboard-section">
      <SectionHeading title="Study Plans" note={`${plans.length} saved plan${plans.length === 1 ? "" : "s"}`} action={<button type="button" className="button button-secondary button-small" onClick={() => setPlanEditor("new")}><Plus size={14} /> Create plan</button>} />
      {plans.length ? <div className="panel study-plan-list">{plans.map((plan) => <article className="study-plan-row" key={plan.id}><div className="study-plan-main"><strong>{plan.title}</strong><div className="row-meta"><span>{subjectName(plan.subjectId)}</span>{plan.targetDate && <><span className="meta-dot" /><span>Target {dateLabel(plan.targetDate, { month: "short", day: "numeric", year: "numeric" })}</span></>}</div>{plan.description && <p>{plan.description}</p>}</div><Link className="button button-quiet button-small" href={`/subject/${plan.subjectId}`}>Open subject</Link><div className="row-actions"><button type="button" className="icon-button row-action" aria-label={`Edit ${plan.title}`} onClick={() => setPlanEditor(plan)}><Pencil size={14} /></button><button type="button" className="icon-button row-action" aria-label={`Delete ${plan.title}`} onClick={() => confirmDelete(plan.title) && study.removeStudyPlan(plan.id)}><Trash2 size={14} /></button></div></article>)}</div> : <div className="panel"><EmptyState title="No study plans yet" detail="Create a plan to keep a subject focus and target date in view." action={<button type="button" className="button button-secondary button-small" onClick={() => setPlanEditor("new")}><Plus size={14} /> Create plan</button>} /></div>}
    </section>

    <section className="dashboard-section subject-progress-section">
      <SectionHeading title="Subject-Wise Progress Bars" note="Based on chapters marked Completed; each subject updates with your chapter status." />
      <div className="subject-progress-list panel">{SUBJECTS.map((subject) => {
        const progress = subjectProgress(study.data.chapters, subject.id);
        return <Link className="subject-progress-row" href={`/subject/${subject.id}`} key={subject.id}>
          <span className="subject-progress-name">{subject.label === "English Core" ? "English" : subject.label}</span>
          <ProgressBar value={progress.percentage} label={`${subject.label} chapter completion`} />
          <span className="subject-progress-counts">{progress.completed} completed · {progress.remaining} remaining</span>
        </Link>;
      })}</div>
    </section>

    {checklistEditor && <DailyChecklistEditor existing={checklistEditor === "new" ? undefined : checklistEditor} onClose={() => setChecklistEditor(null)} />}
    {taskEditor && <TaskEditor existing={taskEditor === "new" ? undefined : taskEditor} initialDate={today} onClose={() => setTaskEditor(null)} />}
    {schoolEditor && <WorkEditor kind="school" existing={schoolEditor === "new" ? undefined : schoolEditor} onClose={() => setSchoolEditor(null)} />}
    {planEditor && <StudyPlanEditor existing={planEditor === "new" ? undefined : planEditor} onClose={() => setPlanEditor(null)} />}
  </>;
}
