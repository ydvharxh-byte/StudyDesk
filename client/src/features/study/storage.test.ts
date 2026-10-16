import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialData } from "./seed";
import { exportBackup, loadStudyData, parseBackup, persistStudyData, STORAGE_KEY } from "./storage";
import { subjectProgress } from "./types";

const memoryWindow = (memory: Map<string, string>) => vi.stubGlobal("window", { localStorage: { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value) } });

describe("Study Desk local storage, migration and progress", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("seeds the five existing CBSE syllabi without inventing Physical Education chapters", () => {
    const memory = new Map<string, string>();
    memoryWindow(memory);
    const result = loadStudyData();
    expect(result.status).toBe("empty");
    expect(new Set(result.data.chapters.map((item) => item.subjectId)).size).toBe(5);
    expect(result.data.chapters.some((chapter) => chapter.name === "Waves")).toBe(true);
    expect(result.data.chapters.some((chapter) => chapter.name === "Computational Thinking and Programming - I")).toBe(true);
    expect(result.data.chapters.some((chapter) => chapter.subjectId === "physical-education")).toBe(false);
    expect(result.data.dailyChecklist).toEqual([]);
    expect(result.data.studyPlans).toEqual([]);
    expect(result.data.topics).toEqual([]);
  });

  it("saves and reloads checklist items, plans, resources and topic questions after refresh", () => {
    const memory = new Map<string, string>();
    memoryWindow(memory);
    const data = createInitialData();
    const chapter = data.chapters[0]!;
    chapter.notes = "Review the worked examples.";
    data.tasks.push({ id: "test-task", title: "Review measurements", subjectId: "physics", type: "Self-study", priority: "High", date: "2026-10-16", deadline: "2026-10-18", chapterId: chapter.id, completed: true, createdAt: "2026-10-16T10:00:00.000Z" });
    data.dailyChecklist.push({ id: "check-1", title: "Read the lesson", date: "2026-10-16", completed: true, createdAt: "2026-10-16T10:00:00.000Z" });
    data.studyPlans.push({ id: "plan-1", title: "Mechanics revision", subjectId: "physics", description: "Revise the first two units", targetDate: "2026-10-20" });
    data.resources.push({ id: "resource-1", subjectId: "physics", chapterId: chapter.id, title: "Lecture", url: "https://example.com/lecture", type: "YouTube lecture", description: "Recorded lesson" });
    data.topics.push({ id: "topic-1", subjectId: "physics", chapterId: chapter.id, title: "Vector resolution", priority: "High", completed: true, revised: false, resourceUrl: "https://example.com/vectors", questions: [{ id: "question-1", text: "Resolve a vector into components.", priority: "Medium", completed: false, revised: true }] });
    persistStudyData(data);
    const reloaded = loadStudyData();
    expect(reloaded.status).toBe("ready");
    expect(reloaded.data.chapters[0]?.notes).toBe("Review the worked examples.");
    expect(reloaded.data.tasks[0]?.completed).toBe(true);
    expect(reloaded.data.dailyChecklist[0]?.completed).toBe(true);
    expect(reloaded.data.studyPlans[0]?.title).toBe("Mechanics revision");
    expect(reloaded.data.resources[0]?.subjectId).toBe("physics");
    expect(reloaded.data.topics[0]?.questions[0]?.revised).toBe(true);
    expect(JSON.parse(memory.get(STORAGE_KEY) ?? "{}").version).toBe(2);
  });

  it("round-trips an extended JSON backup", () => {
    const original = createInitialData();
    original.dailyChecklist.push({ id: "daily", title: "Read", date: "2026-10-16", completed: false, createdAt: "2026-10-16T10:00:00.000Z" });
    original.studyPlans.push({ id: "plan", title: "Review", subjectId: "physical-education", description: "Personal plan", targetDate: "" });
    const parsed = parseBackup(JSON.stringify(exportBackup(original)));
    expect(parsed.chapters).toHaveLength(original.chapters.length);
    expect(parsed.dailyChecklist).toEqual(original.dailyChecklist);
    expect(parsed.studyPlans[0]?.subjectId).toBe("physical-education");
    expect(parsed.resources).toEqual([]);
  });

  it("migrates valid v1 browser data and backups without losing chapters, notes, tasks or chapter resources", () => {
    const memory = new Map<string, string>();
    memoryWindow(memory);
    const current = createInitialData();
    current.chapters[0]!.notes = "Preserve this note";
    current.tasks.push({ id: "old-task", title: "Old task", subjectId: "physics", type: "Revision", priority: "Medium", date: "2026-10-16", deadline: "", chapterId: "", completed: false, createdAt: "2026-10-16T10:00:00.000Z" });
    const chapter = current.chapters[0]!;
    const legacy = {
      chapters: current.chapters,
      tasks: current.tasks,
      schoolwork: current.schoolwork,
      tuition: current.tuition,
      resources: [{ id: "old-resource", chapterId: chapter.id, title: "Old link", url: "https://example.com/old", type: "Personal link", description: "Saved before update" }],
    };
    memory.set(STORAGE_KEY, JSON.stringify({ version: 1, data: legacy }));
    const migrated = loadStudyData();
    expect(migrated.status).toBe("ready");
    expect(migrated.data.chapters[0]?.notes).toBe("Preserve this note");
    expect(migrated.data.tasks[0]?.id).toBe("old-task");
    expect(migrated.data.resources[0]?.subjectId).toBe(chapter.subjectId);
    expect(migrated.data.dailyChecklist).toEqual([]);
    expect(migrated.data.studyPlans).toEqual([]);
    expect(migrated.data.topics).toEqual([]);
    const legacyBackup = { format: "class-11-study-desk-backup", version: 1, exportedAt: new Date().toISOString(), data: legacy };
    const imported = parseBackup(JSON.stringify(legacyBackup));
    expect(imported.resources[0]?.subjectId).toBe(chapter.subjectId);
    persistStudyData(migrated.data);
    expect(JSON.parse(memory.get(STORAGE_KEY) ?? "{}").version).toBe(2);
  });

  it("derives subject progress from chapter statuses rather than stored percentages", () => {
    const data = createInitialData();
    const first = { ...data.chapters[0]!, id: "a", status: "completed" as const };
    const second = { ...data.chapters[0]!, id: "b", status: "in-progress" as const };
    const midway = subjectProgress([first, second], "physics");
    expect(midway).toEqual({ completed: 1, total: 2, remaining: 1, percentage: 50 });
    const complete = subjectProgress([first, { ...second, status: "completed" }], "physics");
    expect(complete.percentage).toBe(100);
    expect(subjectProgress([], "physical-education")).toEqual({ completed: 0, total: 0, remaining: 0, percentage: 0 });
  });

  it("rejects malformed imports and preserves corrupt stored bytes rather than overwriting them", () => {
    expect(() => parseBackup('{"format":"wrong"}')).toThrow(/not a valid Study Desk backup/);
    const memory = new Map<string, string>([[STORAGE_KEY, "not json"]]);
    memoryWindow(memory);
    const before = memory.get(STORAGE_KEY);
    expect(loadStudyData().status).toBe("corrupt");
    expect(memory.get(STORAGE_KEY)).toBe(before);
  });

  it("rejects non-web URLs and resources linked to the wrong chapter before import", () => {
    const backup = exportBackup(createInitialData());
    const chapter = backup.data.chapters[0]!;
    backup.data.resources.push({ id: "bad-link", subjectId: chapter.subjectId, chapterId: chapter.id, title: "Unsafe", url: "javascript:alert(1)", type: "Personal link", description: "" });
    expect(() => parseBackup(JSON.stringify(backup))).toThrow();
    const wrongSubject = exportBackup(createInitialData());
    const linked = wrongSubject.data.chapters[0]!;
    wrongSubject.data.resources.push({ id: "wrong-subject", subjectId: "chemistry", chapterId: linked.id, title: "Mismatched", url: "https://example.com", type: "Website", description: "" });
    expect(() => parseBackup(JSON.stringify(wrongSubject))).toThrow(/match its linked chapter/);
  });
});
