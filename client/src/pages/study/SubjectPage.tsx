import { useMemo, useState } from "react";
import { useRoute } from "wouter";
import { ArrowRight, BookOpen, ExternalLink, Plus, Search, Trash2 } from "lucide-react";
import { useStudy } from "@/features/study/StudyProvider";
import { SUBJECTS, chapterProgress, isRevisionPending, type Chapter, type SubjectId, type StudyResource, type StudyTask, type SchoolworkItem, type TuitionItem } from "@/features/study/types";
import { SYLLABUS_SOURCES } from "@/features/study/seed";
import { localDate, validWebUrl } from "@/features/study/utils";
import { TaskEditor, WorkEditor } from "@/components/study/Editors";
import ChapterEditor from "@/components/study/ChapterEditor";
import ResourceEditor from "@/components/study/ResourceEditor";
import TopicQuestionManager from "@/components/study/TopicQuestionManager";
import { ChapterList, TaskList, WorkList } from "@/components/study/StudyRows";
import { EmptyState, PageHeading, ProgressBar, SectionHeading, confirmDelete } from "@/components/study/StudyUI";

export default function SubjectPage() {
  const [, params] = useRoute("/subject/:subjectId");
  const id = params?.subjectId as SubjectId | undefined;
  const subject = SUBJECTS.find((item) => item.id === id);
  const study = useStudy();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [revisionOnly, setRevisionOnly] = useState(false);
  const [sort, setSort] = useState("priority");
  const [chapterEditor, setChapterEditor] = useState<Chapter | "new" | null>(null);
  const [taskEditor, setTaskEditor] = useState<StudyTask | "new" | null>(null);
  const [workEditor, setWorkEditor] = useState<{ kind: "school" | "tuition"; item: SchoolworkItem | TuitionItem } | null>(null);
  const [resourceEditor, setResourceEditor] = useState<StudyResource | "new" | null>(null);
  const all = study.data.chapters.filter((chapter) => chapter.subjectId === subject?.id);
  const filtered = useMemo(() => {
    const result = all.filter((chapter) => chapter.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()) && (status === "all" || chapter.status === status) && (priority === "all" || chapter.priorityLevel === priority) && (!revisionOnly || isRevisionPending(chapter)));
    return result.sort((a, b) => sort === "progress" ? chapterProgress(a) - chapterProgress(b) : sort === "name" ? a.name.localeCompare(b.name) : a.priorityRank - b.priorityRank);
  }, [all, query, status, priority, revisionOnly, sort]);
  if (!subject) return <div className="panel"><h1>Subject not found</h1><p>Choose a subject from the navigation.</p></div>;
  const completed = all.filter((chapter) => chapter.status === "completed").length;
  const inProgress = all.filter((chapter) => chapter.status === "in-progress").length;
  const notStarted = all.filter((chapter) => chapter.status === "not-started").length;
  const progress = all.length ? all.reduce((sum, chapter) => sum + chapterProgress(chapter), 0) / all.length : 0;
  const tasks = study.data.tasks.filter((task) => task.subjectId === subject.id && task.date === localDate());
  const schoolwork = study.data.schoolwork.filter((item) => item.subjectId === subject.id);
  const tuition = study.data.tuition.filter((item) => item.subjectId === subject.id);
  const resources = study.data.resources.filter((item) => item.subjectId === subject.id);
  const recentlyStudied = all.filter((chapter) => chapter.lastStudied).sort((a, b) => b.lastStudied.localeCompare(a.lastStudied)).slice(0, 3);
  const revision = all.filter(isRevisionPending).slice(0, 4);
  const syllabusSource = SYLLABUS_SOURCES.find((item) => item.subjectId === subject.id);
  const displaySubject = subject.label === "English Core" ? "English" : subject.label;
  return <>
    <PageHeading eyebrow={subject.code ? `Class XI · course ${subject.code}` : "User-managed subject"} title={displaySubject} description={`${all.length} tracked chapter${all.length === 1 ? "" : "s"} · editable study priorities`} action={<button type="button" className="button button-primary" onClick={() => setChapterEditor("new")}><Plus size={16} /> Add chapter</button>} />
    <section className="subject-overview panel"><div className="subject-progress-copy"><span className="eyebrow">Total checklist progress</span><strong>{Math.round(progress)}<small>%</small></strong><ProgressBar value={progress} /></div><div className="subject-status-counts"><div><strong>{completed}</strong><span>Completed</span></div><div><strong>{inProgress}</strong><span>In progress</span></div><div><strong>{notStarted}</strong><span>Not started</span></div></div></section>
    {syllabusSource ? <div className="course-source"><span>Official CBSE curriculum · 2026–27 · Code {syllabusSource.courseCode}</span><a href={syllabusSource.url} target="_blank" rel="noopener noreferrer">View source PDF <ArrowRight size={13} /></a>{syllabusSource.note && <p>{syllabusSource.note}</p>}</div> : <div className="course-source"><span>Personal subject tracker</span><p>No syllabus chapters or exam priorities were prefilled. Add the chapters and topics you use.</p></div>}

    <section className="dashboard-section"><SectionHeading title="Chapter tracker" note={`${filtered.length} of ${all.length} chapters`} action={<div className="search-box subject-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this subject" /></div>} /><div className="filter-toolbar panel"><label className="field filter-field"><span className="sr-only">Completion status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="not-started">Not started</option><option value="in-progress">In progress</option><option value="completed">Completed</option></select></label><label className="field filter-field"><span className="sr-only">Priority filter</span><select value={priority} onChange={(event) => setPriority(event.target.value)}><option value="all">All priorities</option><option>High</option><option>Medium</option><option>Low</option></select></label><label className="field filter-field"><span className="sr-only">Sort chapters</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="priority">Sort: priority</option><option value="progress">Sort: progress</option><option value="name">Sort: name</option></select></label><label className="check-filter"><input type="checkbox" checked={revisionOnly} onChange={(event) => setRevisionOnly(event.target.checked)} />Revision needed</label></div><div className="panel chapter-panel"><ChapterList chapters={filtered} onEdit={setChapterEditor} onDelete={(chapter) => confirmDelete(chapter.name) && study.removeChapter(chapter.id)} emptyTitle={all.length ? "No chapters match" : "No chapters added yet"} /></div></section>

    <div className="subject-two-col"><section className="dashboard-section"><SectionHeading title="Today's tasks" note="Only tasks assigned for today" action={<button type="button" className="text-button" onClick={() => setTaskEditor("new")}><Plus size={15} /> Add task</button>} /><div className="panel task-panel"><TaskList tasks={tasks} onEdit={setTaskEditor} emptyTitle="No tasks for this subject today" emptyDetail="Add a task when you want to set aside time." /></div></section><section className="dashboard-section"><SectionHeading title="Revision pending" /><div className="panel chapter-panel"><ChapterList chapters={revision} emptyTitle="No revision flags" /></div><SectionHeading title="Recently studied" /><div className="panel recent-list">{recentlyStudied.length ? recentlyStudied.map((chapter) => <a href={`/chapter/${chapter.id}`} className="recent-row" key={chapter.id}><span>{chapter.name}</span><small>{chapter.lastStudied}</small><ArrowRight size={14} /></a>) : <p className="muted-copy">Studied chapters appear here after you record a study date.</p>}</div></section></div>

    <section className="dashboard-section"><SectionHeading title="Schoolwork for this subject" action={<a className="text-button" href="/schoolwork">All schoolwork <ArrowRight size={14} /></a>} /><div className="panel work-panel"><WorkList items={schoolwork} kind="school" onEdit={(item) => setWorkEditor({ kind: "school", item: item as SchoolworkItem })} emptyTitle="No schoolwork recorded" /></div></section>
    <section className="dashboard-section"><SectionHeading title="Tuition work for this subject" action={<a className="text-button" href="/tuition">All tuition work <ArrowRight size={14} /></a>} /><div className="panel work-panel"><WorkList items={tuition} kind="tuition" onEdit={(item) => setWorkEditor({ kind: "tuition", item: item as TuitionItem })} emptyTitle="No tuition work recorded" /></div></section>

    <section className="dashboard-section"><SectionHeading title="Resources" note={`${resources.length} saved resource${resources.length === 1 ? "" : "s"}`} action={<button type="button" className="button button-secondary button-small" onClick={() => setResourceEditor("new")}><Plus size={14} /> Add Resource</button>} />
      {resources.length ? <div className="panel resource-list">{resources.map((resource) => {
        const linkedChapter = study.data.chapters.find((chapter) => chapter.id === resource.chapterId);
        return <article className="resource-row" key={resource.id}><div className="resource-icon"><BookOpen size={17} /></div><div className="resource-main"><strong>{resource.title}</strong><span className="resource-kind">{resource.type}</span>{linkedChapter && <p><a className="text-link" href={`/chapter/${linkedChapter.id}`}>{linkedChapter.name}</a></p>}{resource.description && <p>{resource.description}</p>}<span className="resource-url">{resource.url}</span></div><div className="row-actions"><a className="button button-quiet button-small" href={validWebUrl(resource.url) ? resource.url : undefined} target="_blank" rel="noopener noreferrer" onClick={(event) => { if (!validWebUrl(resource.url)) event.preventDefault(); }}><ExternalLink size={14} /> Open</a><button type="button" className="icon-button row-action" aria-label={`Edit ${resource.title}`} onClick={() => setResourceEditor(resource)}>✎</button><button type="button" className="icon-button row-action" aria-label={`Delete ${resource.title}`} onClick={() => confirmDelete(resource.title) && study.removeResource(resource.id)}><Trash2 size={15} /></button></div></article>;
      })}</div> : <div className="panel"><EmptyState title="No resources saved for this subject" detail="Add a video, website, notes, PDF or question bank. You can link it to a chapter or keep it at subject level." action={<button type="button" className="button button-secondary button-small" onClick={() => setResourceEditor("new")}><Plus size={14} /> Add Resource</button>} /></div>}
    </section>

    <TopicQuestionManager subjectId={subject.id} chapters={all} />

    {chapterEditor && <ChapterEditor existing={chapterEditor === "new" ? undefined : chapterEditor} initialSubject={subject.id} onClose={() => setChapterEditor(null)} />}
    {taskEditor && <TaskEditor existing={taskEditor === "new" ? undefined : taskEditor} initialDate={localDate()} initialSubjectId={subject.id} onClose={() => setTaskEditor(null)} />}
    {workEditor && <WorkEditor kind={workEditor.kind} existing={workEditor.item} onClose={() => setWorkEditor(null)} />}
    {resourceEditor && <ResourceEditor initialSubjectId={subject.id} existing={resourceEditor === "new" ? undefined : resourceEditor} onClose={() => setResourceEditor(null)} />}
  </>;
}
