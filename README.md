# Student Submission Portal

React + Vite (TypeScript) app with Supabase as the backend.

- **Public page (`/`)** — students pick their class, enter their name, and upload a file (Excel/Word/PowerPoint).
- **Teacher portal (`/portal`, login at `/portal/login`)** — teachers sign in and browse submissions filtered by class, with download links.

## Setup

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run [`supabase/schema.sql`](supabase/schema.sql) once. It creates the `classes` and `submissions` tables, RLS policies, and a private `submissions` storage bucket.
3. Create teacher accounts manually: Dashboard → Authentication → Users → Add user. There is no public sign-up.
4. Copy `.env.example` to `.env` and fill in your project's URL and anon key (Dashboard → Project Settings → API).
5. Install and run:

   ```bash
   npm install
   npm run dev
   ```

## Notes

- Students don't need an account — form submissions and file uploads use the anon key, allowed by RLS/storage policies scoped only to `insert`.
- Only authenticated (teacher) sessions can list submissions or read files back out of storage; downloads use short-lived signed URLs (`createSignedUrl`, 60s).
- Accepted file types: `.xls .xlsx .doc .docx .ppt .pptx`, max 25MB (see `src/lib/fileRules.ts`).
- Teachers can add classes directly from the portal; there's no delete-others'-classes policy, only the creator can delete their own class.
