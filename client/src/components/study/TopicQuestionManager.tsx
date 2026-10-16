import { useMemo, useState } from "react";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { useStudy, newId } from "@/features/study/StudyProvider";
import { SUBJECTS, type Chapter, type PriorityLevel, type StudyQuestion, type StudyTopic, type SubjectId } from "@/features/study/types";
import { validWebUrl } from "@/features/study/utils";
import { EmptyState, FormError, Modal, PriorityBadge, SectionHeading, confirmDelete } from "./StudyUI";

function TopicEditor({ subjectId, chapters, existing, onClose }: { subjectId: SubjectId; chapters: Chapter[]; existing?: StudyTopic; onClose: () => void }) {
  const study = useStudy();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [chapterId, setChapterId] = useState(existing?.chapterId ?? "");
  const [priority, setPriority] = useState<PriorityLevel>(existing?.priority ?? "Medium");
  const [resourceUrl, setResourceUrl] = useState(existing?.resourceUrl ?? "");
  const [error, setError] = useState("");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) { setError("Enter a topic name."); return; }
    if (resourceUrl.trim() && !validWebUrl(resourceUrl.trim())) { setError("Enter a valid optional link beginning with https:// or http://."); return; }
    study.updateTopic({ id: existing?.id ?? newId(), subjectId, chapterId, title: title.trim(), priority, completed: existing?.completed ?? false, revised: existing?.revised ?? false, resourceUrl: resourceUrl.trim(), questions: existing?.questions ?? [] });
    onClose();
  };
  return <Modal title={existing ? "Edit topic" : "Add high-priority topic"} onClose={onClose}><form className="form-stack" onSubmit={submit}>
    <label className="field"><span>Topic</span><input autoFocus maxLength={240} value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
    <div className="form-grid"><label className="field"><span>Chapter · optional</span><select value={chapterId} onChange={(event) => setChapterId(event.target.value)}><option value="">General / not chapter-linked</option>{chapters.map((chapter) => <option key={chapter.id} value={chapter.id}>{chapter.name}</option>)}</select></label><label className="field"><span>Priority</span><select value={priority} onChange={(event) => setPriority(event.target.value as PriorityLevel)}>{["High", "Medium", "Low"].map((item) => <option key={item}>{item}</option>)}</select></label></div>
    <label className="field"><span>Topic resource URL · optional</span><input type="url" maxLength={2000} value={resourceUrl} onChange={(event) => setResourceUrl(event.target.value)} placeholder="https://" /></label>
    <FormError>{error}</FormError><div className="form-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary">{existing ? "Save topic" : "Add topic"}</button></div>
  </form></Modal>;
}

function QuestionEditor({ existing, onClose, onSave }: { existing?: StudyQuestion; onClose: () => void; onSave: (item: StudyQuestion) => void }) {
  const [text, setText] = useState(existing?.text ?? "");
  const [priority, setPriority] = useState<PriorityLevel>(existing?.priority ?? "Medium");
  const [error, setError] = useState("");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!text.trim()) { setError("Enter an exam question."); return; }
    onSave({ id: existing?.id ?? newId(), text: text.trim(), priority, completed: existing?.completed ?? false, revised: existing?.revised ?? false });
    onClose();
  };
  return <Modal title={existing ? "Edit exam question" : "Add exam question"} onClose={onClose}><form className="form-stack" onSubmit={submit}>
    <label className="field"><span>Question</span><textarea autoFocus rows={4} maxLength={2000} value={text} onChange={(event) => setText(event.target.value)} required /></label>
    <label className="field"><span>Priority</span><select value={priority} onChange={(event) => setPriority(event.target.value as PriorityLevel)}>{["High", "Medium", "Low"].map((item) => <option key={item}>{item}</option>)}</select></label>
    <FormError>{error}</FormError><div className="form-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary">{existing ? "Save question" : "Add question"}</button></div>
  </form></Modal>;
}

type CompletionFilter = "all" | "open" | "completed" | "revised";
function matchesCompletion(item: { completed: boolean; revised: boolean }, filter: CompletionFilter) {
  if (filter === "open") return !item.completed;
  if (filter === "completed") return item.completed;
  if (filter === "revised") return item.revised;
  return true;
}
function matchesPriority(item: { priority: PriorityLevel }, filter: string) {
  return filter === "all" || item.priority === filter;
}
function FilterToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="topic-check"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span>{label}</span></label>;
}
export default function TopicQuestionManager({ subjectId, chapters }: { subjectId: SubjectId; chapters: Chapter[] }) {
  const study = useStudy();
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>("all");
  const [topicEditor, setTopicEditor] = useState<StudyTopic | "new" | null>(null);
  const [questionEditor, setQuestionEditor] = useState<{ topic: StudyTopic; question?: StudyQuestion } | null>(null);
  const chapterName = (chapterId: string) => chapters.find((chapter) => chapter.id === chapterId)?.name ?? "General";
  const topics = useMemo(() => study.data.topics.filter((topic) => topic.subjectId === subjectId)
    .map((topic) => ({ topic, questions: topic.questions.filter((question) => matchesPriority(question, priorityFilter) && matchesCompletion(question, completionFilter)) }))
    .filter(({ topic, questions }) => (matchesPriority(topic, priorityFilter) && matchesCompletion(topic, completionFilter)) || questions.length > 0)
    .sort((a, b) => chapterName(a.topic.chapterId).localeCompare(chapterName(b.topic.chapterId)) || a.topic.title.localeCompare(b.topic.title)),
  [study.data.topics, subjectId, priorityFilter, completionFilter, chapters]);
  const openNewTopic = () => { setPriorityFilter("all"); setCompletionFilter("all"); setTopicEditor("new"); };
  const updateTopic = (topic: StudyTopic, patch: Partial<StudyTopic>) => study.updateTopic({ ...topic, ...patch });
  const updateQuestion = (topic: StudyTopic, question: StudyQuestion) => updateTopic(topic, { questions: topic.questions.some((item) => item.id === question.id) ? topic.questions.map((item) => item.id === question.id ? question : item) : [...topic.questions, question] });
  const priorityOptions = <><option value="all">All priorities</option><option>High</option><option>Medium</option><option>Low</option></>;
  const completionOptions = <><option value="all">All completion states</option><option value="open">Not completed</option><option value="completed">Completed</option><option value="revised">Revised</option></>;
  const subjectLabel = SUBJECTS.find((subject) => subject.id === subjectId)?.label ?? subjectId;
  return <section className="dashboard-section topic-manager"><SectionHeading title="High-Priority Topics & Questions" note={`${topics.length} topic${topics.length === 1 ? "" : "s"} · user-managed priorities`} action={<button type="button" className="button button-secondary button-small" onClick={openNewTopic}><Plus size={14} /> Add Topic</button>} />
    <div className="topic-filters panel"><label className="field filter-field"><span className="sr-only">Filter topics by priority</span><select aria-label="Filter topics and questions by priority" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>{priorityOptions}</select></label><label className="field filter-field"><span className="sr-only">Filter topics and questions by completion</span><select aria-label="Filter topics and questions by completion status" value={completionFilter} onChange={(event) => setCompletionFilter(event.target.value as CompletionFilter)}>{completionOptions}</select></label><span className="topic-filter-hint">Priorities are yours to set; no exam weighting is assumed.</span></div>
    {topics.length ? <div className="topic-list">{topics.map(({ topic, questions }) => {
      const chapterMatch = chapters.find((chapter) => chapter.id === topic.chapterId);
      const topicVisible = matchesPriority(topic, priorityFilter) && matchesCompletion(topic, completionFilter);
      const visibleQuestions = completionFilter === "all" && priorityFilter === "all" ? topic.questions : questions;
      return <article className="topic-card panel" key={topic.id}><header className="topic-card-head"><div className="topic-title-block"><div className="topic-name-line"><h3>{topic.title}</h3><PriorityBadge level={topic.priority} /></div><small>{chapterMatch?.name ?? `${subjectLabel} · general topic`}</small></div><div className="row-actions"><button type="button" className="icon-button row-action" aria-label={`Edit topic ${topic.title}`} onClick={() => setTopicEditor(topic)}><Pencil size={15} /></button><button type="button" className="icon-button row-action" aria-label={`Delete topic ${topic.title}`} onClick={() => confirmDelete(topic.title) && study.removeTopic(topic.id)}><Trash2 size={15} /></button></div></header>
        {topic.resourceUrl && validWebUrl(topic.resourceUrl) && <a className="topic-resource-link" href={topic.resourceUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={13} /> Topic resource</a>}
        {topicVisible && <div className="topic-state-controls"><FilterToggle label="Completed" checked={topic.completed} onChange={(completed) => updateTopic(topic, { completed })} /><FilterToggle label="Revised" checked={topic.revised} onChange={(revised) => updateTopic(topic, { revised })} /></div>}
        <div className="question-section"><div className="question-heading"><strong>Important exam questions</strong><button type="button" className="text-button" onClick={() => setQuestionEditor({ topic })}><Plus size={13} /> Add question</button></div>
          {visibleQuestions.length ? <div className="question-list">{visibleQuestions.map((question) => <div className="question-row" key={question.id}><p>{question.text}</p><PriorityBadge level={question.priority} /><div className="question-state-controls"><FilterToggle label="Completed" checked={question.completed} onChange={(completed) => updateQuestion(topic, { ...question, completed })} /><FilterToggle label="Revised" checked={question.revised} onChange={(revised) => updateQuestion(topic, { ...question, revised })} /></div><div className="row-actions"><button type="button" className="icon-button row-action" aria-label="Edit question" onClick={() => setQuestionEditor({ topic, question })}><Pencil size={14} /></button><button type="button" className="icon-button row-action" aria-label="Delete question" onClick={() => confirmDelete(question.text) && updateTopic(topic, { questions: topic.questions.filter((item) => item.id !== question.id) })}><Trash2 size={14} /></button></div></div>)}</div> : <p className="muted-copy">No questions recorded yet. Add the questions you want to practise for this topic.</p>}
        </div>
      </article>;
    })}</div> : <div className="panel"><EmptyState title="No topics added yet" detail="Add the topics and exam questions you want to prioritize for this subject. Priorities are personal and fully editable." action={<button type="button" className="button button-secondary button-small" onClick={openNewTopic}><Plus size={14} /> Add Topic</button>} /></div>}
    {topicEditor && <TopicEditor subjectId={subjectId} chapters={chapters} existing={topicEditor === "new" ? undefined : topicEditor} onClose={() => setTopicEditor(null)} />}
    {questionEditor && <QuestionEditor existing={questionEditor.question} onClose={() => setQuestionEditor(null)} onSave={(question) => updateQuestion(questionEditor.topic, question)} />}
  </section>;
}
