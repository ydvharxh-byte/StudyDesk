import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowUpRight, BookOpen, ExternalLink, Search } from "lucide-react";
import { useStudy } from "@/features/study/StudyProvider";
import { RESOURCE_TYPES, SUBJECTS } from "@/features/study/types";
import { validWebUrl } from "@/features/study/utils";
import { EmptyState, PageHeading } from "@/components/study/StudyUI";

export default function ResourcesPage() {
  const study = useStudy();
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("all");
  const [type, setType] = useState("all");
  const entries = useMemo(() => study.data.resources.filter((resource) => {
    const chapter = study.data.chapters.find((item) => item.id === resource.chapterId);
    return (subject === "all" || resource.subjectId === subject) && (type === "all" || resource.type === type) && `${resource.title} ${resource.description} ${chapter?.name ?? ""} ${SUBJECTS.find((item) => item.id === resource.subjectId)?.label ?? ""}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
  }), [study.data.resources, study.data.chapters, subject, type, query]);
  return <><PageHeading eyebrow="Study library" title="Resources" description="A single shelf for subject and chapter-linked study materials." />
    <div className="filter-toolbar panel"><label className="search-box chapter-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search resources or chapters" /></label><label className="field filter-field"><span className="sr-only">Subject filter</span><select value={subject} onChange={(event) => setSubject(event.target.value)}><option value="all">All subjects</option>{SUBJECTS.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label><label className="field filter-field"><span className="sr-only">Resource type filter</span><select value={type} onChange={(event) => setType(event.target.value)}><option value="all">All resource types</option>{RESOURCE_TYPES.map((item) => <option key={item}>{item}</option>)}</select></label></div>
    {entries.length ? <div className="panel resource-list global-resource-list">{entries.map((resource) => {
      const chapter = study.data.chapters.find((item) => item.id === resource.chapterId);
      const subjectName = SUBJECTS.find((item) => item.id === resource.subjectId)?.label ?? "Subject";
      return <article className="resource-row" key={resource.id}><div className="resource-icon"><BookOpen size={17} /></div><div className="resource-main"><strong>{resource.title}</strong><span className="resource-kind">{resource.type} · {subjectName}</span>{chapter ? <p><Link href={`/chapter/${chapter.id}`} className="text-link">{chapter.name} <ArrowUpRight size={12} /></Link></p> : <p>Subject-level resource</p>}{resource.description && <p>{resource.description}</p>}</div><a className="button button-quiet button-small" href={validWebUrl(resource.url) ? resource.url : undefined} target="_blank" rel="noopener noreferrer" onClick={(event) => { if (!validWebUrl(resource.url)) event.preventDefault(); }}><ExternalLink size={14} /> Open link</a></article>;
    })}</div> : <div className="panel"><EmptyState title={study.data.resources.length ? "No resources match" : "No resources saved yet"} detail={study.data.resources.length ? "Try a different search or filter." : "Open a subject page and choose + Add Resource."} /></div>}
  </>;
}
