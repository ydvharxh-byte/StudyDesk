import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useStudy } from "@/features/study/StudyProvider";
import { SUBJECTS, chapterProgress, isRevisionPending, type Chapter } from "@/features/study/types";
import ChapterEditor from "@/components/study/ChapterEditor";
import { ChapterList } from "@/components/study/StudyRows";
import { PageHeading, SectionHeading, confirmDelete } from "@/components/study/StudyUI";
export default function AllChapters() {
  const study = useStudy();
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("all");
  const [status, setStatus] = useState("all");
  const [revision, setRevision] = useState(false);
  const [sort, setSort] = useState("priority");
  const [editor, setEditor] = useState<Chapter | "new" | null>(null);
  const chapters = useMemo(() => {
    const list = study.data.chapters.filter((chapter) => chapter.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()) && (subject === "all" || chapter.subjectId === subject) && (status === "all" || chapter.status === status) && (!revision || isRevisionPending(chapter)));
    return list.sort((a, b) => sort === "progress" ? chapterProgress(a) - chapterProgress(b) : sort === "name" ? a.name.localeCompare(b.name) : a.priorityRank - b.priorityRank || a.subjectId.localeCompare(b.subjectId));
  }, [study.data.chapters, query, subject, status, revision, sort]);
  const move = (chapter: Chapter, delta: -1 | 1) => {
    const siblings = study.data.chapters.filter((item) => item.subjectId === chapter.subjectId).sort((a, b) => a.priorityRank - b.priorityRank);
    const index = siblings.findIndex((item) => item.id === chapter.id);
    const other = siblings[index + delta];
    if (!other) return;
    study.updateChapter({ ...chapter, priorityRank: other.priorityRank });
    study.updateChapter({ ...other, priorityRank: chapter.priorityRank });
  };
  const done = study.data.chapters.filter((chapter) => chapter.status === "completed").length;
  return <><PageHeading eyebrow="Syllabus overview" title="All chapters" description="Search every subject, set study priorities, and see what still needs attention." action={<button type="button" className="button button-primary" onClick={() => setEditor("new")}><Plus size={16} /> Add chapter</button>} /><div className="chapter-summary"><strong>{study.data.chapters.length}</strong><span>tracked</span><span className="summary-divider" /><strong>{done}</strong><span>completed</span><span className="summary-divider" /><strong>{study.data.chapters.filter((chapter) => chapter.status !== "completed").length}</strong><span>incomplete</span></div><section className="dashboard-section"><SectionHeading title="Chapter tracker" note={`${chapters.length} result${chapters.length === 1 ? "" : "s"}`} /><div className="filter-toolbar panel"><label className="search-box chapter-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search chapters" /></label><label className="field filter-field"><span className="sr-only">Subject filter</span><select value={subject} onChange={(event) => setSubject(event.target.value)}><option value="all">All subjects</option>{SUBJECTS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label className="field filter-field"><span className="sr-only">Status filter</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="not-started">Not started</option><option value="in-progress">In progress</option><option value="completed">Completed</option></select></label><label className="field filter-field"><span className="sr-only">Sort chapters</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="priority">Sort: priority</option><option value="progress">Sort: progress</option><option value="name">Sort: name</option></select></label><label className="check-filter"><input type="checkbox" checked={revision} onChange={(event) => setRevision(event.target.checked)} />Revision needed</label></div><div className="panel chapter-panel"><ChapterList chapters={chapters} onEdit={setEditor} onDelete={(chapter) => confirmDelete(chapter.name) && study.removeChapter(chapter.id)} onMove={move} /></div><p className="footnote">Priority ranks are your editable study order—not CBSE marks or chapter weightage. Use the arrows to reorder chapters within a subject.</p></section>{editor && <ChapterEditor existing={editor === "new" ? undefined : editor} onClose={() => setEditor(null)} />}</>;
}
