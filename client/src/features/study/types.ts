export const SUBJECTS = [
  { id: "physics", label: "Physics", code: "042", tint: "blue" },
  { id: "chemistry", label: "Chemistry", code: "043", tint: "teal" },
  { id: "mathematics", label: "Mathematics", code: "041", tint: "violet" },
  { id: "computer-science", label: "Computer Science", code: "083", tint: "amber" },
  { id: "english-core", label: "English Core", code: "301", tint: "rose" },
  { id: "physical-education", label: "Physical Education", code: "", tint: "green" },
] as const;

export type SubjectId = (typeof SUBJECTS)[number]["id"];
export type ChapterStatus = "not-started" | "in-progress" | "completed";
export type PriorityLevel = "High" | "Medium" | "Low";
export type TaskType =
  | "Self-study"
  | "School Homework"
  | "Tuition Homework"
  | "Revision"
  | "Test Preparation"
  | "Other";
export const TASK_TYPES: TaskType[] = [
  "Self-study",
  "School Homework",
  "Tuition Homework",
  "Revision",
  "Test Preparation",
  "Other",
];
export type WorkStatus = "Pending" | "In Progress" | "Completed";
export type ResourceType =
  | "YouTube lecture"
  | "Website"
  | "NCERT / official"
  | "PDF notes"
  | "Practice questions"
  | "Question bank"
  | "Test"
  | "Personal link";
export const RESOURCE_TYPES: ResourceType[] = [
  "YouTube lecture",
  "Website",
  "NCERT / official",
  "PDF notes",
  "Practice questions",
  "Question bank",
  "Test",
  "Personal link",
];

export const CHECKLIST_ITEMS = [
  { id: "theory", label: "Theory completed" },
  { id: "notes", label: "Notes prepared" },
  { id: "examples", label: "NCERT examples completed" },
  { id: "exercises", label: "NCERT exercises completed" },
  { id: "extra", label: "Extra questions practised" },
  { id: "test", label: "Chapter test completed" },
  { id: "revision1", label: "First revision completed" },
  { id: "revision2", label: "Second revision completed" },
] as const;
export type ChecklistId = (typeof CHECKLIST_ITEMS)[number]["id"];
export type Checklist = Record<ChecklistId, boolean>;

export interface Chapter {
  id: string;
  subjectId: SubjectId;
  name: string;
  section?: string;
  syllabusNote?: string;
  priorityRank: number;
  priorityLevel: PriorityLevel;
  status: ChapterStatus;
  targetDate: string;
  notes: string;
  importantTopics: string;
  lastStudied: string;
  checklist: Checklist;
}
export interface StudyTask {
  id: string;
  title: string;
  subjectId: SubjectId | "other";
  type: TaskType;
  priority: PriorityLevel;
  date: string;
  deadline: string;
  chapterId: string;
  completed: boolean;
  createdAt: string;
}
export interface DailyChecklistItem {
  id: string;
  title: string;
  date: string;
  completed: boolean;
  createdAt: string;
}
export interface StudyPlan {
  id: string;
  title: string;
  subjectId: SubjectId;
  description: string;
  targetDate: string;
}
export interface SchoolworkItem {
  id: string;
  title: string;
  subjectId: SubjectId | "other";
  source: string;
  assignedDate: string;
  dueDate: string;
  status: WorkStatus;
  instructions: string;
  resourceUrl: string;
}
export interface TuitionItem {
  id: string;
  title: string;
  subjectId: SubjectId | "other";
  dueDate: string;
  status: WorkStatus;
  chapterId: string;
}
export interface StudyResource {
  id: string;
  subjectId: SubjectId;
  chapterId: string;
  title: string;
  url: string;
  type: ResourceType;
  description: string;
}
export interface StudyQuestion {
  id: string;
  text: string;
  priority: PriorityLevel;
  completed: boolean;
  revised: boolean;
}
export interface StudyTopic {
  id: string;
  subjectId: SubjectId;
  chapterId: string;
  title: string;
  priority: PriorityLevel;
  completed: boolean;
  revised: boolean;
  resourceUrl: string;
  questions: StudyQuestion[];
}
export interface SyllabusSource {
  subjectId: SubjectId;
  courseCode: string;
  academicYear: "2026-27";
  title: string;
  url: string;
  note: string;
}
export interface StudyData {
  chapters: Chapter[];
  tasks: StudyTask[];
  dailyChecklist: DailyChecklistItem[];
  studyPlans: StudyPlan[];
  schoolwork: SchoolworkItem[];
  tuition: TuitionItem[];
  resources: StudyResource[];
  topics: StudyTopic[];
}
export interface StudyBackup {
  format: "class-11-study-desk-backup";
  version: 2;
  exportedAt: string;
  data: StudyData;
}
export const emptyChecklist = (): Checklist => ({
  theory: false,
  notes: false,
  examples: false,
  exercises: false,
  extra: false,
  test: false,
  revision1: false,
  revision2: false,
});
export const subjectName = (id: SubjectId | "other") =>
  id === "other" ? "Other" : SUBJECTS.find((subject) => subject.id === id)?.label ?? id;
export const chapterProgress = (chapter: Chapter) => {
  const completed = CHECKLIST_ITEMS.reduce(
    (count, item) => count + Number(chapter.checklist[item.id]),
    0,
  );
  return Math.round((completed / CHECKLIST_ITEMS.length) * 100);
};
export const subjectProgress = (chapters: Chapter[], subjectId: SubjectId) => {
  const matching = chapters.filter((chapter) => chapter.subjectId === subjectId);
  const completed = matching.filter((chapter) => chapter.status === "completed").length;
  const total = matching.length;
  return { completed, total, remaining: total - completed, percentage: total ? Math.round((completed / total) * 100) : 0 };
};
export const isRevisionPending = (chapter: Chapter) =>
  chapter.status === "completed" && (!chapter.checklist.revision1 || !chapter.checklist.revision2);
