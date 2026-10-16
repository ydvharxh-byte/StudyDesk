import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createInitialData } from "./seed";
import { loadStudyData, persistStudyData } from "./storage";
import type { Chapter, DailyChecklistItem, SchoolworkItem, StudyData, StudyPlan, StudyResource, StudyTask, StudyTopic, TuitionItem } from "./types";

type Store = ReturnType<typeof loadStudyData> & { saveError?: string };
interface StudyContextValue extends Store {
  writable: boolean;
  updateTask: (item: StudyTask) => boolean;
  removeTask: (id: string) => void;
  updateDailyChecklistItem: (item: DailyChecklistItem) => void;
  removeDailyChecklistItem: (id: string) => void;
  updateStudyPlan: (item: StudyPlan) => void;
  removeStudyPlan: (id: string) => void;
  updateSchoolwork: (item: SchoolworkItem) => void;
  removeSchoolwork: (id: string) => void;
  updateTuition: (item: TuitionItem) => void;
  removeTuition: (id: string) => void;
  updateChapter: (item: Chapter) => void;
  removeChapter: (id: string) => void;
  updateResource: (item: StudyResource) => void;
  removeResource: (id: string) => void;
  updateTopic: (item: StudyTopic) => void;
  removeTopic: (id: string) => void;
  importData: (data: StudyData) => void;
  resetData: () => void;
}
const StudyContext = createContext<StudyContextValue | null>(null);
export const newId = () => globalThis.crypto?.randomUUID?.() ?? `item-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
function replaceById<T extends { id: string }>(items: T[], item: T) {
  const index = items.findIndex((current) => current.id === item.id);
  return index < 0 ? [...items, item] : items.map((current, i) => (i === index ? item : current));
}
export function StudyProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(() => loadStudyData());
  const writable = store.status !== "corrupt" && !store.saveError;
  useEffect(() => {
    if (store.status === "corrupt" || store.saveError) return;
    try {
      persistStudyData(store.data);
      if (store.status === "empty") setStore((current) => current.status === "empty" ? { ...current, status: "ready" } : current);
    } catch {
      setStore((current) => ({ ...current, saveError: "Could not save to this browser. Check available storage before continuing." }));
    }
  }, [store.data, store.status, store.saveError]);
  const change = (transform: (current: StudyData) => StudyData) => {
    setStore((current) => {
      if (current.status === "corrupt" || current.saveError) return current;
      return { ...current, data: transform(current.data), status: "ready" };
    });
  };
  const value = useMemo<StudyContextValue>(() => ({
    ...store,
    writable,
    updateTask: (item) => {
      if (!writable) return false;
      const normalized = item.title.trim().toLocaleLowerCase();
      const duplicate = store.data.tasks.some((task) => task.id !== item.id && task.date === item.date && task.subjectId === item.subjectId && task.type === item.type && task.title.trim().toLocaleLowerCase() === normalized);
      if (duplicate) return false;
      change((data) => ({ ...data, tasks: replaceById(data.tasks, { ...item, title: item.title.trim() }) }));
      return true;
    },
    removeTask: (id) => change((data) => ({ ...data, tasks: data.tasks.filter((item) => item.id !== id) })),
    updateDailyChecklistItem: (item) => change((data) => ({ ...data, dailyChecklist: replaceById(data.dailyChecklist, item) })),
    removeDailyChecklistItem: (id) => change((data) => ({ ...data, dailyChecklist: data.dailyChecklist.filter((item) => item.id !== id) })),
    updateStudyPlan: (item) => change((data) => ({ ...data, studyPlans: replaceById(data.studyPlans, item) })),
    removeStudyPlan: (id) => change((data) => ({ ...data, studyPlans: data.studyPlans.filter((item) => item.id !== id) })),
    updateSchoolwork: (item) => change((data) => ({ ...data, schoolwork: replaceById(data.schoolwork, item) })),
    removeSchoolwork: (id) => change((data) => ({ ...data, schoolwork: data.schoolwork.filter((item) => item.id !== id) })),
    updateTuition: (item) => change((data) => ({ ...data, tuition: replaceById(data.tuition, item) })),
    removeTuition: (id) => change((data) => ({ ...data, tuition: data.tuition.filter((item) => item.id !== id) })),
    updateChapter: (item) => change((data) => ({ ...data, chapters: replaceById(data.chapters, item) })),
    removeChapter: (id) => change((data) => ({
      ...data,
      chapters: data.chapters.filter((item) => item.id !== id),
      resources: data.resources.filter((item) => item.chapterId !== id),
      topics: data.topics.map((item) => item.chapterId === id ? { ...item, chapterId: "" } : item),
      tasks: data.tasks.map((item) => item.chapterId === id ? { ...item, chapterId: "" } : item),
      tuition: data.tuition.map((item) => item.chapterId === id ? { ...item, chapterId: "" } : item),
    })),
    updateResource: (item) => change((data) => ({ ...data, resources: replaceById(data.resources, item) })),
    removeResource: (id) => change((data) => ({ ...data, resources: data.resources.filter((item) => item.id !== id) })),
    updateTopic: (item) => change((data) => ({ ...data, topics: replaceById(data.topics, item) })),
    removeTopic: (id) => change((data) => ({ ...data, topics: data.topics.filter((item) => item.id !== id) })),
    importData: (data) => setStore({ data, status: "ready" }),
    resetData: () => setStore({ data: createInitialData(), status: "ready" }),
  }), [store, writable]);
  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}
export function useStudy() {
  const context = useContext(StudyContext);
  if (!context) throw new Error("useStudy must be used inside StudyProvider.");
  return context;
}
