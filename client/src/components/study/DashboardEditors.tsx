import { useState } from "react";
import { SUBJECTS, type DailyChecklistItem, type StudyPlan, type SubjectId } from "@/features/study/types";
import { useStudy, newId } from "@/features/study/StudyProvider";
import { localDate } from "@/features/study/utils";
import { FormError, Modal } from "./StudyUI";

export function DailyChecklistEditor({ existing, onClose }: { existing?: DailyChecklistItem; onClose: () => void }) {
  const study = useStudy();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [date, setDate] = useState(existing?.date ?? localDate());
  const [error, setError] = useState("");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !date) { setError("Enter a checklist item and date."); return; }
    study.updateDailyChecklistItem({ id: existing?.id ?? newId(), title: title.trim(), date, completed: existing?.completed ?? false, createdAt: existing?.createdAt ?? new Date().toISOString() });
    onClose();
  };
  return <Modal title={existing ? "Edit checklist item" : "Add daily checklist item"} onClose={onClose}><form className="form-stack" onSubmit={submit}>
    <label className="field"><span>Checklist item</span><input autoFocus maxLength={240} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Read one chapter" required /></label>
    <label className="field"><span>Checklist date</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
    <FormError>{error}</FormError><div className="form-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary">{existing ? "Save item" : "Add item"}</button></div>
  </form></Modal>;
}

export function StudyPlanEditor({ existing, onClose }: { existing?: StudyPlan; onClose: () => void }) {
  const study = useStudy();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [subjectId, setSubjectId] = useState<SubjectId>(existing?.subjectId ?? "physics");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [targetDate, setTargetDate] = useState(existing?.targetDate ?? "");
  const [error, setError] = useState("");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) { setError("Enter a name for this study plan."); return; }
    study.updateStudyPlan({ id: existing?.id ?? newId(), title: title.trim(), subjectId, description: description.trim(), targetDate });
    onClose();
  };
  return <Modal title={existing ? "Edit study plan" : "Create study plan"} onClose={onClose}><form className="form-stack" onSubmit={submit}>
    <label className="field"><span>Plan name</span><input autoFocus maxLength={240} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Revise mechanics" required /></label>
    <div className="form-grid"><label className="field"><span>Subject</span><select value={subjectId} onChange={(event) => setSubjectId(event.target.value as SubjectId)}>{SUBJECTS.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label><label className="field"><span>Target date · optional</span><input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} /></label></div>
    <label className="field"><span>Plan details · optional</span><textarea rows={3} maxLength={3000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add the steps you want to cover." /></label>
    <FormError>{error}</FormError><div className="form-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary">{existing ? "Save plan" : "Create plan"}</button></div>
  </form></Modal>;
}
