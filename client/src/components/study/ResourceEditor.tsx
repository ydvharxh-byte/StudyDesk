import { useMemo, useState } from "react";
import { RESOURCE_TYPES, SUBJECTS, type ResourceType, type StudyResource, type SubjectId } from "@/features/study/types";
import { useStudy, newId } from "@/features/study/StudyProvider";
import { validWebUrl } from "@/features/study/utils";
import { FormError, Modal } from "./StudyUI";

export default function ResourceEditor({ initialSubjectId, initialChapterId = "", existing, onClose }: { initialSubjectId?: SubjectId; initialChapterId?: string; existing?: StudyResource; onClose: () => void }) {
  const study = useStudy();
  const [subjectId, setSubjectId] = useState<SubjectId>(existing?.subjectId ?? initialSubjectId ?? "physics");
  const [chapterId, setChapterId] = useState(existing?.chapterId ?? initialChapterId);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [url, setUrl] = useState(existing?.url ?? "");
  const [type, setType] = useState<ResourceType>(existing?.type ?? "YouTube lecture");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [error, setError] = useState("");
  const chapters = useMemo(() => study.data.chapters.filter((chapter) => chapter.subjectId === subjectId), [study.data.chapters, subjectId]);
  const changeSubject = (value: SubjectId) => {
    setSubjectId(value);
    if (!study.data.chapters.some((chapter) => chapter.id === chapterId && chapter.subjectId === value)) setChapterId("");
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) { setError("Enter a short resource title."); return; }
    if (!validWebUrl(url.trim())) { setError("Enter a valid link beginning with https:// or http://."); return; }
    study.updateResource({ id: existing?.id ?? newId(), subjectId, chapterId, title: title.trim(), url: url.trim(), type, description: description.trim() });
    onClose();
  };
  return <Modal title={existing ? "Edit resource" : "Add resource"} onClose={onClose}><form className="form-stack" onSubmit={submit}>
    <label className="field"><span>Resource title</span><input autoFocus value={title} maxLength={240} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Chapter 1 lecture" required /></label>
    <label className="field"><span>URL</span><input type="url" value={url} maxLength={2000} onChange={(event) => setUrl(event.target.value)} placeholder="https://" required /></label>
    <div className="form-grid"><label className="field"><span>Subject</span><select value={subjectId} onChange={(event) => changeSubject(event.target.value as SubjectId)}>{SUBJECTS.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label>
      <label className="field"><span>Chapter · optional</span><select value={chapterId} onChange={(event) => setChapterId(event.target.value)}><option value="">Subject-level resource</option>{chapters.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
      <label className="field"><span>Resource type</span><select value={type} onChange={(event) => setType(event.target.value as ResourceType)}>{RESOURCE_TYPES.map((item) => <option key={item}>{item}</option>)}</select></label></div>
    <label className="field"><span>Description · optional</span><textarea value={description} maxLength={2000} onChange={(event) => setDescription(event.target.value)} rows={3} /></label>
    <FormError>{error}</FormError><div className="form-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary">{existing ? "Save resource" : "+ Add Resource"}</button></div>
  </form></Modal>;
}
