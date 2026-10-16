import { useRef, useState } from "react";
import { AlertCircle, Download, FileUp, RotateCcw, ShieldCheck } from "lucide-react";
import { useStudy } from "@/features/study/StudyProvider";
import { exportBackup, parseBackup } from "@/features/study/storage";
import { localDate } from "@/features/study/utils";
import { PageHeading } from "@/components/study/StudyUI";

export default function SettingsPage() {
  const study = useStudy();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const itemCount = study.data.chapters.length + study.data.tasks.length + study.data.dailyChecklist.length + study.data.studyPlans.length + study.data.schoolwork.length + study.data.tuition.length + study.data.resources.length + study.data.topics.length + study.data.topics.reduce((count, topic) => count + topic.questions.length, 0);
  const download = () => {
    setError(""); setMessage("");
    try {
      const backup = exportBackup(study.data);
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = `class-11-study-desk-${localDate()}.json`; anchor.click(); URL.revokeObjectURL(url);
      setMessage("Backup downloaded. Keep a copy somewhere you can find it later.");
    } catch { setError("Could not prepare this backup. Your current data has not been changed."); }
  };
  const importFile = async (file?: File) => {
    setError(""); setMessage("");
    if (!file) return;
    try {
      const restored = parseBackup(await file.text());
      const items = restored.chapters.length + restored.tasks.length + restored.dailyChecklist.length + restored.studyPlans.length + restored.schoolwork.length + restored.tuition.length + restored.resources.length + restored.topics.length + restored.topics.reduce((count, topic) => count + topic.questions.length, 0);
      if (!window.confirm(`This backup is valid and contains ${items} saved items. Importing will replace the study data currently stored in this browser. Continue?`)) return;
      study.importData(restored);
      setMessage(`Backup restored: ${restored.chapters.length} chapters, ${restored.dailyChecklist.length} checklist items, ${restored.studyPlans.length} plans, and ${restored.topics.length} topic groups loaded.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not read this backup. Existing data has not been changed.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  const reset = () => {
    if (!window.confirm("Start with a fresh study desk? All tasks, checklist items, plans, topics, chapter progress, notes, links, and work records currently stored in this browser will be replaced with the original editable syllabus. Export a backup first if you may need this data.")) return;
    study.resetData(); setMessage("Fresh study data loaded. Your old browser data has been replaced."); setError("");
  };
  return <><PageHeading eyebrow="Your data" title="Settings & backup" description="Everything you add stays in this browser unless you export it." />
    <section className="dashboard-section"><div className="settings-local panel"><div className="settings-icon"><ShieldCheck size={19} /></div><div><h2>Stored on this device</h2><p>This is a local-first study desk. It does not send your tasks, checklist items, plans, topics, notes, or chapter progress to a server. Data does <strong>not</strong> automatically sync between devices, browsers, or browser profiles. Export a backup to move it yourself.</p><span className="settings-storage-state"><span className={`save-dot${study.status === "corrupt" || study.saveError ? " save-dot-error" : ""}`} />{study.status === "corrupt" ? "Existing saved data needs repair" : study.saveError ? "Browser storage unavailable" : "Automatic save active in this browser"}</span></div></div></section>
    {(message || error) && <div className={`notice ${error ? "notice-warning" : "notice-success"}`} role={error ? "alert" : "status"}>{error ? <AlertCircle size={16} /> : <ShieldCheck size={16} />}{error || message}</div>}
    <section className="dashboard-section"><div className="panel settings-panel"><div className="settings-copy"><h2>Export a backup</h2><p>Download your chapters, daily checklist, study plans, topic questions, tasks, schoolwork, tuition work, notes, progress and resources as JSON.</p></div><button type="button" className="button button-secondary" disabled={!study.writable} onClick={download}><Download size={16} /> Download JSON</button></div></section>
    <section className="dashboard-section"><div className="panel settings-panel"><div className="settings-copy"><h2>Import a backup</h2><p>Study Desk validates the entire file before making changes. Existing version-one backups are migrated without discarding their saved records. A valid import replaces current browser data only after you confirm; invalid files leave it untouched.</p><label className="button button-secondary file-button"><FileUp size={16} /> Choose JSON backup<input ref={fileRef} type="file" accept="application/json,.json" onChange={(event) => void importFile(event.target.files?.[0])} /></label></div></div></section>
    <section className="dashboard-section"><div className="panel settings-panel settings-danger"><div className="settings-copy"><h2>Start fresh</h2><p>Replace browser data with the original editable syllabus and empty work lists. This cannot be undone without a JSON backup.</p></div><button type="button" className="button button-danger" onClick={reset}><RotateCcw size={15} /> Reset study data</button></div></section>
    <p className="footnote">Initial CBSE syllabus: Class XI, 2026–27. Course sources and subject-specific notes are linked from each subject page. Ranks in this study desk are your editable priority order, not official CBSE weightage.</p>
  </>;
}
