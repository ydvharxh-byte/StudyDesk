import { useState } from "react";
import { SUBJECTS, type Chapter, type ChapterStatus, type PriorityLevel, type SubjectId } from "@/features/study/types";
import { useStudy, newId } from "@/features/study/StudyProvider";
import { FormError, Modal } from "./StudyUI";
export default function ChapterEditor({ existing, initialSubject, onClose }: { existing?: Chapter; initialSubject?: SubjectId; onClose: () => void }) {
  const study = useStudy();
  const [name, setName] = useState(existing?.name ?? "");
  const [subjectId, setSubjectId] = useState<SubjectId>(existing?.subjectId ?? initialSubject ?? "physics");
  const [section, setSection] = useState(existing?.section ?? "");
  const [priorityRank, setPriorityRank] = useState(existing?.priorityRank ?? Math.max(0, ...study.data.chapters.filter((item) => item.subjectId === (initialSubject ?? "physics")).map((item) => item.priorityRank)) + 1);
  const [priorityLevel, setPriorityLevel] = useState<PriorityLevel>(existing?.priorityLevel ?? "Medium");
  const [status, setStatus] = useState<ChapterStatus>(existing?.status ?? "not-started");
  const [error, setError] = useState("");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) { setError("Enter a chapter or unit name."); return; }
    if (study.data.chapters.some((item) => item.id !== existing?.id && item.subjectId === subjectId && item.name.trim().toLocaleLowerCase() === name.trim().toLocaleLowerCase())) { setError("A chapter with this name already exists for this subject."); return; }
    study.updateChapter({ id: existing?.id ?? newId(), subjectId, name: name.trim(), section: section.trim() || undefined, syllabusNote: existing?.syllabusNote, priorityRank: Math.max(1, priorityRank), priorityLevel, status, targetDate: existing?.targetDate ?? "", notes: existing?.notes ?? "", importantTopics: existing?.importantTopics ?? "", lastStudied: existing?.lastStudied ?? "", checklist: existing?.checklist ?? { theory: false, notes: false, examples: false, exercises: false, extra: false, test: false, revision1: false, revision2: false } });
    onClose();
  };
  return <Modal title={existing ? "Edit chapter" : "Add a chapter"} onClose={onClose}><form className="form-stack" onSubmit={submit}><label className="field"><span>Chapter or unit name</span><input autoFocus maxLength={200} value={name} onChange={(event) => setName(event.target.value)} required /></label><div className="form-grid"><label className="field"><span>Subject</span><select disabled={!!existing} value={subjectId} onChange={(event) => setSubjectId(event.target.value as SubjectId)}>{SUBJECTS.map((subject) => <option key={subject.id} value={subject.id}>{subject.label}</option>)}</select></label><label className="field"><span>Unit, book or section · optional</span><input maxLength={200} value={section} onChange={(event) => setSection(event.target.value)} /></label><label className="field"><span>Priority rank</span><input type="number" min={1} max={9999} value={priorityRank} onChange={(event) => setPriorityRank(Number(event.target.value))} /></label><label className="field"><span>Priority level</span><select value={priorityLevel} onChange={(event) => setPriorityLevel(event.target.value as PriorityLevel)}>{["High", "Medium", "Low"].map((item) => <option key={item}>{item}</option>)}</select></label><label className="field"><span>Manual study status</span><select value={status} onChange={(event) => setStatus(event.target.value as ChapterStatus)}><option value="not-started">Not Started</option><option value="in-progress">In Progress</option><option value="completed">Completed</option></select></label></div><FormError>{error}</FormError><div className="form-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary">{existing ? "Save changes" : "Add chapter"}</button></div></form></Modal>;
}
