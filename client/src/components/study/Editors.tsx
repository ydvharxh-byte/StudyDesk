import { useState } from "react";
import { useStudy, newId } from "@/features/study/StudyProvider";
import { localDate } from "@/features/study/utils";
import { SUBJECTS, TASK_TYPES, type PriorityLevel, type SchoolworkItem, type StudyTask, type TuitionItem, type WorkStatus } from "@/features/study/types";
import { FormError, Modal } from "./StudyUI";

function SubjectSelect({ value, onChange }: { value: StudyTask["subjectId"]; onChange: (value: StudyTask["subjectId"]) => void }) {
  return <label className="field"><span>Subject</span><select value={value} onChange={(event) => onChange(event.target.value as StudyTask["subjectId"])}><option value="other">Other</option>{SUBJECTS.map((subject) => <option key={subject.id} value={subject.id}>{subject.label}</option>)}</select></label>;
}
export function TaskEditor({ existing, initialDate, initialSubjectId, onClose }: { existing?: StudyTask; initialDate?: string; initialSubjectId?: StudyTask["subjectId"]; onClose: () => void }) {
  const study = useStudy();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [subjectId, setSubjectId] = useState<StudyTask["subjectId"]>(existing?.subjectId ?? initialSubjectId ?? "physics");
  const [type, setType] = useState<StudyTask["type"]>(existing?.type ?? "Self-study");
  const [priority, setPriority] = useState<PriorityLevel>(existing?.priority ?? "Medium");
  const [date, setDate] = useState(existing?.date ?? initialDate ?? localDate());
  const [deadline, setDeadline] = useState(existing?.deadline ?? "");
  const [chapterId, setChapterId] = useState(existing?.chapterId ?? "");
  const [error, setError] = useState("");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !date) { setError("Enter a task title and date."); return; }
    const ok = study.updateTask({ id: existing?.id ?? newId(), title, subjectId, type, priority, date, deadline, chapterId, completed: existing?.completed ?? false, createdAt: existing?.createdAt ?? new Date().toISOString() });
    if (!ok) { setError("This same task is already on that date. Edit the existing task or change its date/details."); return; }
    onClose();
  };
  return <Modal title={existing ? "Edit task" : "Add a task"} onClose={onClose}><form className="form-stack" onSubmit={submit}><label className="field"><span>Task title</span><input autoFocus maxLength={240} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Revise vectors" required /></label><div className="form-grid"><SubjectSelect value={subjectId} onChange={setSubjectId} /><label className="field"><span>Task type</span><select value={type} onChange={(event) => setType(event.target.value as StudyTask["type"])}>{TASK_TYPES.map((item) => <option key={item}>{item}</option>)}</select></label><label className="field"><span>Priority</span><select value={priority} onChange={(event) => setPriority(event.target.value as PriorityLevel)}>{["High", "Medium", "Low"].map((item) => <option key={item}>{item}</option>)}</select></label><label className="field"><span>Study date</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label><label className="field"><span>Optional deadline</span><input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} /></label><label className="field"><span>Link to a chapter</span><select value={chapterId} onChange={(event) => setChapterId(event.target.value)}><option value="">No chapter</option>{study.data.chapters.filter((item) => item.subjectId === subjectId).map((chapter) => <option key={chapter.id} value={chapter.id}>{chapter.name}</option>)}</select></label></div><FormError>{error}</FormError><div className="form-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-primary" type="submit">{existing ? "Save changes" : "Add task"}</button></div></form></Modal>;
}

type WorkDraft = { title: string; subjectId: StudyTask["subjectId"]; source: string; assignedDate: string; dueDate: string; status: WorkStatus; instructions: string; resourceUrl: string; chapterId: string };
export function WorkEditor({ kind, existing, onClose }: { kind: "school" | "tuition"; existing?: SchoolworkItem | TuitionItem; onClose: () => void }) {
  const study = useStudy();
  const currentSchool = kind === "school" ? existing as SchoolworkItem | undefined : undefined;
  const currentTuition = kind === "tuition" ? existing as TuitionItem | undefined : undefined;
  const [draft, setDraft] = useState<WorkDraft>({ title: existing?.title ?? "", subjectId: existing?.subjectId ?? "physics", source: currentSchool?.source ?? "", assignedDate: currentSchool?.assignedDate ?? localDate(), dueDate: existing?.dueDate ?? "", status: existing?.status ?? "Pending", instructions: currentSchool?.instructions ?? "", resourceUrl: currentSchool?.resourceUrl ?? "", chapterId: currentTuition?.chapterId ?? "" });
  const [error, setError] = useState("");
  const set = (key: keyof WorkDraft, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.dueDate) { setError("Enter a description and due date."); return; }
    if (kind === "school") {
      if (draft.resourceUrl && !/^https?:\/\//i.test(draft.resourceUrl)) { setError("Enter a complete link starting with http:// or https://."); return; }
      study.updateSchoolwork({ id: existing?.id ?? newId(), title: draft.title.trim(), subjectId: draft.subjectId, source: draft.source.trim(), assignedDate: draft.assignedDate, dueDate: draft.dueDate, status: draft.status, instructions: draft.instructions.trim(), resourceUrl: draft.resourceUrl.trim() });
    } else {
      study.updateTuition({ id: existing?.id ?? newId(), title: draft.title.trim(), subjectId: draft.subjectId, dueDate: draft.dueDate, status: draft.status, chapterId: draft.chapterId });
    }
    onClose();
  };
  return <Modal title={`${existing ? "Edit" : "Add"} ${kind === "school" ? "schoolwork" : "tuition work"}`} onClose={onClose}><form className="form-stack" onSubmit={submit}><label className="field"><span>{kind === "school" ? "Assignment title" : "Task description"}</span><input autoFocus maxLength={240} value={draft.title} onChange={(event) => set("title", event.target.value)} placeholder={kind === "school" ? "e.g. Physics worksheet" : "e.g. Complete problems 1–8"} required /></label><div className="form-grid"><SubjectSelect value={draft.subjectId} onChange={(value) => set("subjectId", value)} />{kind === "school" && <><label className="field"><span>Teacher or source · optional</span><input maxLength={200} value={draft.source} onChange={(event) => set("source", event.target.value)} /></label><label className="field"><span>Assigned date</span><input type="date" value={draft.assignedDate} onChange={(event) => set("assignedDate", event.target.value)} /></label></>}<label className="field"><span>Due date</span><input type="date" value={draft.dueDate} onChange={(event) => set("dueDate", event.target.value)} required /></label><label className="field"><span>Status</span><select value={draft.status} onChange={(event) => set("status", event.target.value as WorkStatus)}>{["Pending", "In Progress", "Completed"].map((item) => <option key={item}>{item}</option>)}</select></label>{kind === "tuition" && <label className="field"><span>Link to a chapter · optional</span><select value={draft.chapterId} onChange={(event) => set("chapterId", event.target.value)}><option value="">No chapter</option>{study.data.chapters.filter((item) => item.subjectId === draft.subjectId).map((chapter) => <option key={chapter.id} value={chapter.id}>{chapter.name}</option>)}</select></label>}</div>{kind === "school" && <><label className="field"><span>Instructions · optional</span><textarea rows={3} maxLength={4000} value={draft.instructions} onChange={(event) => set("instructions", event.target.value)} /></label><label className="field"><span>Resource link · optional</span><input type="url" maxLength={2000} value={draft.resourceUrl} onChange={(event) => set("resourceUrl", event.target.value)} placeholder="https://" /></label></>}<FormError>{error}</FormError><div className="form-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary">{existing ? "Save changes" : "Add work"}</button></div></form></Modal>;
}
