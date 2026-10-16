import { z } from "zod";
import { CHECKLIST_ITEMS, RESOURCE_TYPES, SUBJECTS, TASK_TYPES } from "./types";
import type { StudyBackup, StudyData, SubjectId } from "./types";
import { createInitialData } from "./seed";

// Keep this key stable so every existing browser's v1 data is migrated in place.
export const STORAGE_KEY = "class11-study-desk:v1";
const currentSubjectIds = ["physics", "chemistry", "mathematics", "computer-science", "english-core", "physical-education"] as const;
const legacySubjectIds = ["physics", "chemistry", "mathematics", "computer-science", "english-core"] as const;
const subjectIds = [...currentSubjectIds, "other"] as const;
const taskTypes = ["Self-study", "School Homework", "Tuition Homework", "Revision", "Test Preparation", "Other"] as const;
const resourceTypes = ["YouTube lecture", "Website", "NCERT / official", "PDF notes", "Practice questions", "Question bank", "Test", "Personal link"] as const;
const checklistSchema = z.object(
  Object.fromEntries(CHECKLIST_ITEMS.map((item) => [item.id, z.boolean()])) as Record<
    (typeof CHECKLIST_ITEMS)[number]["id"],
    z.ZodBoolean
  >,
);
const id = z.string().min(1).max(120);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal(""));
const safeUrl = z.string().max(2000).refine((value) => {
  if (!value) return true;
  try { return ["https:", "http:"].includes(new URL(value).protocol); } catch { return false; }
}, "URL must use HTTP or HTTPS.");
const chapterSchema = z.object({
  id,
  subjectId: z.enum(currentSubjectIds),
  name: z.string().min(1).max(200),
  section: z.string().max(200).optional(),
  syllabusNote: z.string().max(800).optional(),
  priorityRank: z.number().int().min(1).max(9999),
  priorityLevel: z.enum(["High", "Medium", "Low"]),
  status: z.enum(["not-started", "in-progress", "completed"]),
  targetDate: date,
  notes: z.string().max(10000),
  importantTopics: z.string().max(5000),
  lastStudied: date,
  checklist: checklistSchema,
});
const taskSchema = z.object({
  id,
  title: z.string().min(1).max(240),
  subjectId: z.enum(subjectIds),
  type: z.enum(taskTypes),
  priority: z.enum(["High", "Medium", "Low"]),
  date,
  deadline: date,
  chapterId: z.string().max(120),
  completed: z.boolean(),
  createdAt: z.string().max(80),
});
const dailyChecklistSchema = z.object({ id, title: z.string().min(1).max(240), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), completed: z.boolean(), createdAt: z.string().max(80) });
const studyPlanSchema = z.object({ id, title: z.string().min(1).max(240), subjectId: z.enum(currentSubjectIds), description: z.string().max(3000), targetDate: date });
const schoolworkSchema = z.object({
  id,
  title: z.string().min(1).max(240),
  subjectId: z.enum(subjectIds),
  source: z.string().max(200),
  assignedDate: date,
  dueDate: date,
  status: z.enum(["Pending", "In Progress", "Completed"]),
  instructions: z.string().max(4000),
  resourceUrl: z.string().max(2000),
});
const tuitionSchema = z.object({
  id,
  title: z.string().min(1).max(240),
  subjectId: z.enum(subjectIds),
  dueDate: date,
  status: z.enum(["Pending", "In Progress", "Completed"]),
  chapterId: z.string().max(120),
});
const resourceSchema = z.object({
  id,
  subjectId: z.enum(currentSubjectIds),
  chapterId: z.string().max(120),
  title: z.string().min(1).max(240),
  url: z.string().url().max(2000).refine((value) => ["https:", "http:"].includes(new URL(value).protocol)),
  type: z.enum(resourceTypes),
  description: z.string().max(2000),
});
const questionSchema = z.object({ id, text: z.string().min(1).max(2000), priority: z.enum(["High", "Medium", "Low"]), completed: z.boolean(), revised: z.boolean() });
const topicSchema = z.object({
  id,
  subjectId: z.enum(currentSubjectIds),
  chapterId: z.string().max(120),
  title: z.string().min(1).max(240),
  priority: z.enum(["High", "Medium", "Low"]),
  completed: z.boolean(),
  revised: z.boolean(),
  resourceUrl: safeUrl,
  questions: z.array(questionSchema).max(1000),
});
const legacyChapterSchema = chapterSchema.extend({ subjectId: z.enum(legacySubjectIds) });
const legacyTaskSchema = taskSchema.extend({ subjectId: z.enum([...legacySubjectIds, "other"] as const) });
const legacySchoolworkSchema = schoolworkSchema.extend({ subjectId: z.enum([...legacySubjectIds, "other"] as const) });
const legacyTuitionSchema = tuitionSchema.extend({ subjectId: z.enum([...legacySubjectIds, "other"] as const) });
const legacyResourceSchema = z.object({
  id,
  chapterId: id,
  title: z.string().min(1).max(240),
  url: z.string().url().max(2000).refine((value) => ["https:", "http:"].includes(new URL(value).protocol)),
  type: z.enum(["YouTube lecture", "NCERT / official", "PDF notes", "Practice questions", "Question bank", "Test", "Personal link"]),
  description: z.string().max(2000),
});
const legacyStudyDataSchema = z.object({
  chapters: z.array(legacyChapterSchema).max(2000),
  tasks: z.array(legacyTaskSchema).max(20000),
  schoolwork: z.array(legacySchoolworkSchema).max(10000),
  tuition: z.array(legacyTuitionSchema).max(10000),
  resources: z.array(legacyResourceSchema).max(20000),
}).superRefine((data, context) => {
  const chapterIds = new Set(data.chapters.map((chapter) => chapter.id));
  data.resources.forEach((item, index) => {
    if (!chapterIds.has(item.chapterId)) context.addIssue({ code: "custom", path: ["resources", index, "chapterId"], message: "Resource refers to a missing chapter." });
  });
});
export const studyDataSchema = z.object({
  chapters: z.array(chapterSchema).max(2000),
  tasks: z.array(taskSchema).max(20000),
  dailyChecklist: z.array(dailyChecklistSchema).max(20000),
  studyPlans: z.array(studyPlanSchema).max(5000),
  schoolwork: z.array(schoolworkSchema).max(10000),
  tuition: z.array(tuitionSchema).max(10000),
  resources: z.array(resourceSchema).max(20000),
  topics: z.array(topicSchema).max(20000),
}).superRefine((data, context) => {
  const chapterById = new Map(data.chapters.map((chapter) => [chapter.id, chapter]));
  data.resources.forEach((item, index) => {
    if (!item.chapterId) return;
    const chapter = chapterById.get(item.chapterId);
    if (!chapter) context.addIssue({ code: "custom", path: ["resources", index, "chapterId"], message: "Resource refers to a missing chapter." });
    else if (chapter.subjectId !== item.subjectId) context.addIssue({ code: "custom", path: ["resources", index, "subjectId"], message: "Resource subject must match its linked chapter." });
  });
  data.topics.forEach((topic, index) => {
    if (!topic.chapterId) return;
    const chapter = chapterById.get(topic.chapterId);
    if (!chapter) context.addIssue({ code: "custom", path: ["topics", index, "chapterId"], message: "Topic refers to a missing chapter." });
    else if (chapter.subjectId !== topic.subjectId) context.addIssue({ code: "custom", path: ["topics", index, "subjectId"], message: "Topic subject must match its linked chapter." });
  });
});

export type LoadResult = { data: StudyData; status: "ready" | "empty" | "corrupt"; message?: string };
function migrateV1Data(data: z.infer<typeof legacyStudyDataSchema>): StudyData {
  const chapterById = new Map(data.chapters.map((chapter) => [chapter.id, chapter]));
  return studyDataSchema.parse({
    ...data,
    dailyChecklist: [],
    studyPlans: [],
    topics: [],
    resources: data.resources.map((resource) => ({ ...resource, subjectId: chapterById.get(resource.chapterId)!.subjectId as SubjectId })),
  });
}
export function loadStudyData(): LoadResult {
  if (typeof window === "undefined") return { data: createInitialData(), status: "ready" };
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === null) return { data: createInitialData(), status: "empty" };
    const parsed: unknown = JSON.parse(stored);
    const current = z.object({ version: z.literal(2), data: studyDataSchema }).safeParse(parsed);
    if (current.success) return { data: current.data.data, status: "ready" };
    const previous = z.object({ version: z.literal(1), data: legacyStudyDataSchema }).safeParse(parsed);
    if (previous.success) return { data: migrateV1Data(previous.data.data), status: "ready" };
    return { data: createInitialData(), status: "corrupt", message: "Saved study data could not be read. It has not been overwritten; import a valid backup or choose to start fresh." };
  } catch {
    return { data: createInitialData(), status: "corrupt", message: "Browser storage is unavailable or unreadable. Existing data has not been overwritten." };
  }
}
export function persistStudyData(data: StudyData) {
  const validated = studyDataSchema.parse(data);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, data: validated }));
}
export function exportBackup(data: StudyData): StudyBackup {
  return { format: "class-11-study-desk-backup", version: 2, exportedAt: new Date().toISOString(), data: studyDataSchema.parse(data) };
}
export function parseBackup(text: string): StudyData {
  if (text.length > 15_000_000) throw new Error("That backup is too large to import.");
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error("This file is not valid JSON."); }
  const header = z.object({ format: z.literal("class-11-study-desk-backup"), version: z.union([z.literal(1), z.literal(2)]), exportedAt: z.string().min(1) }).safeParse(parsed);
  if (!header.success) throw new Error("This file is not a valid Study Desk backup: check its format and version.");
  if (header.data.version === 1) {
    const previous = z.object({ format: z.literal("class-11-study-desk-backup"), version: z.literal(1), exportedAt: z.string().min(1), data: legacyStudyDataSchema }).safeParse(parsed);
    if (!previous.success) throw new Error(`This file is not a valid Study Desk backup: ${previous.error.issues[0]?.message ?? "check its contents"}`);
    return migrateV1Data(previous.data.data);
  }
  const current = z.object({ format: z.literal("class-11-study-desk-backup"), version: z.literal(2), exportedAt: z.string().min(1), data: studyDataSchema }).safeParse(parsed);
  if (!current.success) throw new Error(`This file is not a valid Study Desk backup: ${current.error.issues[0]?.message ?? "check its contents"}`);
  return current.data.data;
}
