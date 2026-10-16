import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Plus } from "lucide-react";
import { useStudy } from "@/features/study/StudyProvider";
import { SUBJECTS, TASK_TYPES, type StudyTask } from "@/features/study/types";
import { dateLabel, localDate } from "@/features/study/utils";
import { TaskEditor } from "@/components/study/Editors";
import { TaskList } from "@/components/study/StudyRows";
import { PageHeading, SectionHeading } from "@/components/study/StudyUI";

export default function Planner() {
  const study = useStudy();
  const today = localDate();
  const [selectedDate, setSelectedDate] = useState(today);
  const [subject, setSubject] = useState("all");
  const [type, setType] = useState("all");
  const [editor, setEditor] = useState<StudyTask | "new" | null>(null);
  const datedTasks = useMemo(() => study.data.tasks.filter((task) => task.date === selectedDate && (subject === "all" || task.subjectId === subject) && (type === "all" || task.type === type)), [study.data.tasks, selectedDate, subject, type]);
  const overdue = useMemo(() => study.data.tasks.filter((task) => !task.completed && task.date < today && (subject === "all" || task.subjectId === subject) && (type === "all" || task.type === type)), [study.data.tasks, today, subject, type]);
  const upcoming = study.data.tasks.filter((task) => !task.completed && task.date > selectedDate && (subject === "all" || task.subjectId === subject) && (type === "all" || task.type === type)).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);
  const changeDay = (offset: number) => { const [year, month, day] = selectedDate.split("-").map(Number); const next = new Date(year, month - 1, day + offset); setSelectedDate(localDate(next)); };
  return <><PageHeading eyebrow="Plan your time" title="Daily planner" description="Choose a date, make a plan, and keep each task where you assigned it." action={<button type="button" className="button button-primary" onClick={() => setEditor("new")}><Plus size={16} /> Quick add</button>} />
    <div className="planner-controls panel"><div className="date-navigator"><button type="button" className="icon-button" onClick={() => changeDay(-1)} aria-label="Previous day"><ArrowLeft size={17} /></button><label className="field date-select"><span className="sr-only">Choose date</span><input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label><button type="button" className="icon-button" onClick={() => changeDay(1)} aria-label="Next day"><ArrowRight size={17} /></button><button type="button" className="button button-quiet today-button" onClick={() => setSelectedDate(today)}>Today</button></div><div className="planner-filters"><label className="field filter-field"><span className="sr-only">Filter by subject</span><select value={subject} onChange={(event) => setSubject(event.target.value)}><option value="all">All subjects</option>{SUBJECTS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}<option value="other">Other</option></select></label><label className="field filter-field"><span className="sr-only">Filter by task type</span><select value={type} onChange={(event) => setType(event.target.value)}><option value="all">All task types</option>{TASK_TYPES.map((item) => <option key={item}>{item}</option>)}</select></label></div></div>
    <section className="dashboard-section"><SectionHeading title={selectedDate === today ? "Today's tasks" : dateLabel(selectedDate, { weekday: "long", month: "long", day: "numeric", year: "numeric" })} note={`${datedTasks.filter((task) => !task.completed).length} remaining · ${datedTasks.filter((task) => task.completed).length} completed`} action={<span className="planner-date-icon"><CalendarDays size={17} /></span>} /><div className="panel task-panel"><TaskList tasks={datedTasks} onEdit={setEditor} showDate={false} emptyTitle="No tasks for this date" emptyDetail="Add one here, or leave the date open until you need it." /></div></section>
    {overdue.length > 0 && <section className="dashboard-section"><SectionHeading title="Overdue · not rescheduled" note="These tasks remain on their assigned dates until you move them." /><div className="panel task-panel"><TaskList tasks={overdue} onEdit={setEditor} showDate separateCompleted={false} /></div></section>}
    <section className="dashboard-section"><SectionHeading title="Coming up" note="The next incomplete tasks, in date order" /><div className="panel task-panel"><TaskList tasks={upcoming} onEdit={setEditor} showDate emptyTitle="Nothing queued beyond this date" emptyDetail="Future-dated plans will show here without changing today's schedule." /></div></section>
    {editor && <TaskEditor existing={editor === "new" ? undefined : editor} initialDate={selectedDate} onClose={() => setEditor(null)} />}
  </>;
}
