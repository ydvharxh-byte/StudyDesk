import { Link } from "wouter";
import { ArrowRight, BookOpen, Check, Circle, Clock3, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { useStudy } from "@/features/study/StudyProvider";
import { chapterProgress, isRevisionPending, subjectName, type Chapter, type SchoolworkItem, type StudyTask, type TuitionItem } from "@/features/study/types";
import { dateLabel, localDate, validWebUrl } from "@/features/study/utils";
import { confirmDelete, EmptyState, PriorityBadge, ProgressBar, StatusBadge } from "./StudyUI";

export function TaskRow({ task, onEdit, showDate = false }: { task: StudyTask; onEdit: (task: StudyTask) => void; showDate?: boolean }) {
  const { updateTask, removeTask, data } = useStudy();
  const overdue = !task.completed && task.date < localDate();
  const linked = data.chapters.find((chapter) => chapter.id === task.chapterId);
  return <article className={`task-row${task.completed ? " task-done" : ""}`}><button type="button" className={`task-check${task.completed ? " checked" : ""}`} aria-label={task.completed ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`} onClick={() => updateTask({ ...task, completed: !task.completed })}>{task.completed ? <Check size={14} /> : <Circle size={15} />}</button><div className="task-main"><div className="task-title-line"><span className="task-title">{task.title}</span>{overdue && <span className="overdue-label"><Clock3 size={12} />Overdue</span>}</div><div className="row-meta"><span>{subjectName(task.subjectId)}</span><span className="meta-dot" />{task.type}{showDate && <><span className="meta-dot" /><span>{task.deadline ? `Due ${dateLabel(task.deadline, { month: "short", day: "numeric", year: "numeric" })}` : `Scheduled ${dateLabel(task.date, { month: "short", day: "numeric", year: "numeric" })}`}</span></>}{linked && <><span className="meta-dot" /><Link href={`/chapter/${linked.id}`} className="text-link">{linked.name}</Link></>}</div></div><div className="task-trailing"><PriorityBadge level={task.priority} /><div className="row-actions"><button type="button" className="icon-button row-action" onClick={() => onEdit(task)} aria-label={`Edit ${task.title}`}><Pencil size={15} /></button><button type="button" className="icon-button row-action" onClick={() => confirmDelete(task.title) && removeTask(task.id)} aria-label={`Delete ${task.title}`}><Trash2 size={15} /></button></div></div></article>;
}
export function TaskList({ tasks, onEdit, emptyTitle = "Nothing on the list", emptyDetail = "Add a task whenever you have a next step.", showDate = false, separateCompleted = true }: { tasks: StudyTask[]; onEdit: (task: StudyTask) => void; emptyTitle?: string; emptyDetail?: string; showDate?: boolean; separateCompleted?: boolean }) {
  const pending = tasks.filter((task) => !task.completed).sort((a, b) => a.date.localeCompare(b.date) || (a.priority === "High" ? -1 : 0) - (b.priority === "High" ? -1 : 0));
  const complete = tasks.filter((task) => task.completed).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (tasks.length === 0) return <EmptyState title={emptyTitle} detail={emptyDetail} />;
  return <div className="task-list"><div>{pending.map((task) => <TaskRow task={task} key={task.id} onEdit={onEdit} showDate={showDate} />)}</div>{separateCompleted && complete.length > 0 && <details className="completed-details"><summary>Completed <span>{complete.length}</span></summary><div>{complete.map((task) => <TaskRow task={task} key={task.id} onEdit={onEdit} showDate={showDate} />)}</div></details>}{!separateCompleted && complete.map((task) => <TaskRow task={task} key={task.id} onEdit={onEdit} showDate={showDate} />)}</div>;
}

type Work = SchoolworkItem | TuitionItem;
export function WorkRow({ item, kind, onEdit }: { item: Work; kind: "school" | "tuition"; onEdit: (item: Work) => void }) {
  const study = useStudy();
  const today = localDate();
  const overdue = item.status !== "Completed" && !!item.dueDate && item.dueDate < today;
  const school = kind === "school" ? item as SchoolworkItem : undefined;
  const tuition = kind === "tuition" ? item as TuitionItem : undefined;
  const linked = tuition?.chapterId ? study.data.chapters.find((chapter) => chapter.id === tuition.chapterId) : undefined;
  const changeStatus = () => {
    const status = item.status === "Completed" ? "Pending" : "Completed";
    if (school) study.updateSchoolwork({ ...school, status });
    if (tuition) study.updateTuition({ ...tuition, status });
  };
  const remove = () => {
    if (!confirmDelete(item.title)) return;
    school ? study.removeSchoolwork(item.id) : study.removeTuition(item.id);
  };
  const openLink = () => { if (school?.resourceUrl && validWebUrl(school.resourceUrl)) window.open(school.resourceUrl, "_blank", "noopener,noreferrer"); };
  return <article className={`work-row${item.status === "Completed" ? " task-done" : ""}`}><button type="button" className={`task-check${item.status === "Completed" ? " checked" : ""}`} aria-label={item.status === "Completed" ? `Mark ${item.title} incomplete` : `Mark ${item.title} complete`} onClick={changeStatus}>{item.status === "Completed" ? <Check size={14} /> : <Circle size={15} />}</button><div className="task-main"><div className="task-title-line"><span className="task-title">{item.title}</span>{overdue && <span className="overdue-label"><Clock3 size={12} />Overdue</span>}{school?.resourceUrl && validWebUrl(school.resourceUrl) && <button type="button" className="text-link inline-open" onClick={openLink}><ExternalLink size={12} /> Resource</button>}</div><div className="row-meta"><span>{subjectName(item.subjectId)}</span>{school?.source && <><span className="meta-dot" /><span>{school.source}</span></>}{school?.assignedDate && <><span className="meta-dot" /><span>Assigned {dateLabel(school.assignedDate)}</span></>}{linked && <><span className="meta-dot" /><Link href={`/chapter/${linked.id}`} className="text-link">{linked.name}</Link></>}{school?.instructions && <span className="row-note">{school.instructions}</span>}</div></div><div className="work-trailing"><span className={`due-date${overdue ? " due-overdue" : ""}`}>{dateLabel(item.dueDate)}</span><StatusBadge status={item.status} /><div className="row-actions"><button type="button" className="icon-button row-action" onClick={() => onEdit(item)} aria-label={`Edit ${item.title}`}><Pencil size={15} /></button><button type="button" className="icon-button row-action" onClick={remove} aria-label={`Delete ${item.title}`}><Trash2 size={15} /></button></div></div></article>;
}
export function WorkList({ items, kind, onEdit, emptyTitle }: { items: Work[]; kind: "school" | "tuition"; onEdit: (item: Work) => void; emptyTitle: string }) {
  const pending = items.filter((item) => item.status !== "Completed").sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const complete = items.filter((item) => item.status === "Completed");
  if (!items.length) return <EmptyState title={emptyTitle} detail="New assignments will stay here until you mark them complete." />;
  return <div className="work-list"><div>{pending.map((item) => <WorkRow key={item.id} item={item} kind={kind} onEdit={onEdit} />)}</div>{complete.length > 0 && <details className="completed-details"><summary>Completed <span>{complete.length}</span></summary>{complete.map((item) => <WorkRow key={item.id} item={item} kind={kind} onEdit={onEdit} />)}</details>}</div>;
}

export function ChapterRow({ chapter, onEdit, onDelete, onMove }: { chapter: Chapter; onEdit?: (chapter: Chapter) => void; onDelete?: (chapter: Chapter) => void; onMove?: (chapter: Chapter, delta: -1 | 1) => void }) {
  const progress = chapterProgress(chapter);
  const revision = isRevisionPending(chapter);
  return <article className="chapter-row"><Link href={`/chapter/${chapter.id}`} className="chapter-row-main"><span className="chapter-title-line"><strong>{chapter.name}</strong>{chapter.syllabusNote && <span className="chapter-note-mark" title={chapter.syllabusNote}>i</span>}{revision && <span className="revision-pill">Revision</span>}</span>{chapter.section && <span className="chapter-section">{chapter.section}</span>}<ProgressBar value={progress} label={`${chapter.name} checklist progress`} /></Link><div className="chapter-row-status"><PriorityBadge level={chapter.priorityLevel} rank={chapter.priorityRank} /><StatusBadge status={chapter.status} /></div><div className="chapter-row-actions">{onMove && <><button type="button" className="icon-button row-action move-action" onClick={() => onMove(chapter, -1)} aria-label={`Move ${chapter.name} up`}>↑</button><button type="button" className="icon-button row-action move-action" onClick={() => onMove(chapter, 1)} aria-label={`Move ${chapter.name} down`}>↓</button></>}{onEdit && <button type="button" className="icon-button row-action" onClick={() => onEdit(chapter)} aria-label={`Edit ${chapter.name}`}><Pencil size={15} /></button>}{onDelete && <button type="button" className="icon-button row-action" onClick={() => onDelete(chapter)} aria-label={`Delete ${chapter.name}`}><Trash2 size={15} /></button>}<Link href={`/chapter/${chapter.id}`} className="chapter-open" aria-label={`Open ${chapter.name}`}><ArrowRight size={17} /></Link></div></article>;
}
export function ChapterList({ chapters, onEdit, onDelete, onMove, emptyTitle = "No chapters found" }: { chapters: Chapter[]; onEdit?: (chapter: Chapter) => void; onDelete?: (chapter: Chapter) => void; onMove?: (chapter: Chapter, delta: -1 | 1) => void; emptyTitle?: string }) {
  return chapters.length ? <div className="chapter-list">{chapters.map((chapter) => <ChapterRow key={chapter.id} chapter={chapter} onEdit={onEdit} onDelete={onDelete} onMove={onMove} />)}</div> : <EmptyState title={emptyTitle} detail="Try changing the search or filters." />;
}
