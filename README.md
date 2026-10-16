# Student Submission Portal

React + Vite (TypeScript) app with Supabase as the backend.

- **Public page (`/`)** — students pick their class, enter their name, and upload up to 6 files (Excel/Word/PowerPoint/PDF) in one submission.
- **Teacher portal (`/portal`, login at `/portal/login`)** — teachers sign in and browse submissions filtered by class, with download links.

## Setup

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run [`supabase/schema.sql`](supabase/schema.sql). It creates the `classes`, `students` (class roster), `submissions` and `submission_files` tables, the `create_submission` RPC, RLS policies, and a private `submissions` storage bucket. The file is safe to re-run.
   Optional: load a class roster from `supabase/seeds/*.sql` (git-ignored because it contains students' names). When a class has a roster, students pick their name from a list instead of typing it, and the portal shows who hasn't submitted yet.
3. Create teacher accounts manually: Dashboard → Authentication → Users → Add user. There is no public sign-up.
4. Copy `.env.example` to `.env` and fill in your project's URL and anon key (Dashboard → Project Settings → API).
5. Install and run:

   ```bash
   npm install
   npm run dev
   ```

## Notes

- Students don't need an account. Files are uploaded with the anon key (storage policy scoped to `insert`), then the submission and its file rows are saved in one transaction by the `create_submission` RPC, which enforces 1–6 files. Anon users cannot insert into the tables directly.
- Only authenticated (teacher) sessions can list submissions or read files back out of storage; downloads use short-lived signed URLs (`createSignedUrl`, 60s).
- Accepted file types: `.xls .xlsx .doc .docx .ppt .pptx .pdf`, max 25MB per file, max 6 files per submission (see `src/lib/fileRules.ts`; the 6-file limit is also enforced in `create_submission`).
- Teachers can add classes directly from the portal; there's no delete-others'-classes policy, only the creator can delete their own class.
