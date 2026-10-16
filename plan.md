# Class 11 Study Desk — scoped implementation plan

## Preserve the existing product

Continue the already approved React, TypeScript and Vite study website in `/home/ubuntu/studydeck`. Do not reinitialize or redesign it. Keep the original five officially sourced CBSE 2026–27 trackers, chapter details, planner, work queues, routes, local-first behavior, current visual system and existing records. The approved English choice remains English Core (301). No account, server or database is required.

## Requested homepage changes

Keep the established page shell and reorder only its main content into four sections: (1) a persistent date-scoped Daily Checklist with add/edit/delete/check-off and completed/total count; (2) a To-Do List combining pending schoolwork and study tasks, keeping existing subject, priority, due-date and item actions; (3) a persistent Study Plans list with add/edit/delete; (4) dynamically calculated subject-wise manual-status progress bars for Physics, Chemistry, Mathematics, Computer Science, English and Physical Education, including completed and remaining chapter counts. Remove unrelated dashboard-only summary blocks that would break this exact order; preserve the corresponding planner and subject features on their existing pages. Compute every percentage from saved chapter status and current chapter counts, never hardcode it.

Physical Education is a user-managed subject because no PE curriculum or priorities were supplied for this change. Add it to the subject registry and subject routes, with no invented chapters or exam priorities; its progress begins at 0/0 until the user creates chapters. Make the existing chapter editor able to create these user-entered chapters.

## Resources and chapter-wise exam topics

Extend each subject page with a visible `+ Add Resource` section and all of that subject’s saved resources, grouped by chapter when a chapter is selected. Support subject and optional chapter, title, HTTP(S) URL, resource type and optional description; provide add/edit/delete and working open-link controls. Preserve existing chapter-linked links and make them appear in the new subject-level view and global Resources page. Keep the existing chapter detail resource controls, adapting them to the subject-aware resource record.

Add a `High-Priority Topics & Questions` manager to all six subject pages. Organize topics under a chapter when provided; allow general/unlinked topics for skill-based material. Each topic supports a priority (High/Medium/Low), complete/revised toggles and an optional validated resource URL. Each topic can contain editable exam questions with their own priority and complete/revised state. Provide add/edit/delete for topics and questions and filters for priority and completion/revision state. Do not fabricate topic priorities, “important” exam questions, or a Physical Education syllabus; render a clear empty state and let the user curate new entries. Existing chapter `importantTopics` notes and saved resources must remain intact.

## Persistence and compatibility

Add version-two data collections for daily checklist items, study plans and topic/question groups; continue using the existing browser storage key. Validate version-two records before saving. Migrate valid version-one records in place without losing any chapter, task, work item, resource, note or checklist state; infer old resources’ subject from their linked chapter. Invalid stored data remains untouched and repairable. Export version-two backups; accept and migrate existing version-one backups and fully validate before replacement. Keep all changes local to the current browser and retain the existing no-sync explanation.

## Main modules

- `client/src/features/study/types.ts`: six-subject registry, data models, progress derivation.
- `client/src/features/study/seed.ts`: preserve the five directly CBSE-sourced syllabi; PE remains user-managed and unseeded.
- `client/src/features/study/storage.ts`: version-two validation, version-one migration, backup compatibility.
- `client/src/features/study/StudyProvider.tsx`: local persistence and create/update/delete state operations.
- `client/src/pages/study/Dashboard.tsx`: four requested homepage sections and editable daily/plan entries.
- `client/src/pages/study/SubjectPage.tsx`: subject resources, resource editor, topic/questions manager and existing chapter/work features.
- `client/src/components/study/ResourceEditor.tsx`, plus reusable checklist, plan and topic/question editors under `client/src/components/study/`.
- `client/src/pages/study/ResourcesPage.tsx`: existing global resource library, updated for unlinked/subject-level records.
- `client/src/components/study/AppLayout.tsx` and `client/public/manus-routes.json`: add the PE navigation entry; retain the dynamic subject route.
- `client/src/index.css`: add only styling needed for the new panels and progress rows, using the existing tokens.

## Visual and runtime constraints

Retain the quiet warm-neutral, sage-accent academic layout, typography, row density and responsive desktop/mobile shell. Do not add decorative sections or redesign other pages. Continue using the installed React/TypeScript/Wouter/Vite stack and the static dev/build commands. The app remains browser-local, with no sync claim. Keep the existing route manifest valid and update it only if source routes change.
