<!--
  Usage: edit <run_scope> below, then paste this whole file into Claude Code
  (or run: claude "$(cat docs/prompts/ui-optimization.md)").
  Run one phase per session so each visual diff stays reviewable.
-->

<run_scope>
Phase: 1
Tasks: all tasks in this phase
Commit: no   <!-- "yes" = one commit per task, using the message format in <output_format> -->
Preferences: none   <!-- e.g. "P1=lucide-style inline SVG, P2=no dark mode" -->
</run_scope>

<role>
You are a senior product designer-engineer. Your job is to improve the look, feel and usability of a finished, working school app without changing what it does. Every change must be visual or interaction-level, verified in the browser, and easy to review.
</role>

<project_context>
Stack (do not change versions): React 19, Vite 8, TypeScript 6, react-router-dom 7, Tailwind CSS v4 through `@tailwindcss/vite`, Supabase JS v2. Lint with `npm run lint` (oxlint). Build with `npm run build`.

Screens:
- `/` (`src/pages/SubmitPage.tsx`): students pick a class, enter their name and upload an Office file (25 MB max). The file ends in a success state with a "Nộp bài khác" button.
- `/portal/login` (`src/pages/LoginPage.tsx`): teacher sign-in.
- `/portal` (`src/pages/PortalPage.tsx`): teachers add classes (shown as chips), filter submissions by class, and download files from a table.
- `src/components/ProtectedRoute.tsx` shows a plain "Đang tải..." text while the session loads.

Current visual language:
- Slate neutrals, an indigo-to-violet gradient for primary actions, rounded-2xl white/90 cards with `backdrop-blur` and an indigo shadow.
- An emoji in a gradient tile serves as each page's icon (📤 🔑 🎓).
- The body has an indigo/white/sky gradient (`src/index.css`).

Current UI problems (the tasks below address them):
1. Button, input, select, card and alert class strings are copy-pasted across all three pages, and small differences are creeping in.
2. Colors are hard-coded Tailwind palette classes. `src/index.css` defines no design tokens.
3. `index.css` asks for the 'Inter' font, but nothing loads it. `index.html` has `lang="en"` on a Vietnamese UI. `index.css` uses the v3 class name `bg-gradient-to-br`.
4. Emoji are used as icons. They render differently on every OS and screen readers read them aloud.
5. The file input is the browser's native control with `file:` styling. It has no drag and drop, no preview of the chosen file, and no remove button.
6. Validation errors appear one at a time in a single banner at the bottom of the form, far from the field that caused them.
7. Loading states are plain text ("Đang tải..."). There are no skeletons, and the layout jumps when data arrives.
8. The empty state is a single grey line ("Chưa có bài nộp nào.").
9. The portal is one long column with no summary. The table forces horizontal scroll on phones.
10. Errors and successes are not announced to screen readers, and focus is not managed after a submit.
11. No 404 page, and every route has the same `<title>`.
</project_context>

<constraints>
Scope:
- UI only. Do not change Supabase queries, storage calls, auth logic, RLS or `schema.sql`.
- Do not change validation rules (`src/lib/fileRules.ts` values) or routing behavior. The exception is adding a 404 route.
- You may restructure JSX and state that exists purely for presentation, such as drag-over state, focus refs, or the open/closed state of a dialog.
- If you notice a non-UI bug, list it under "Follow-ups" and do not fix it.

Language and style:
- UI copy is Vietnamese and addresses the student as "bạn". You may refine wording, but keep the meaning the same.
- Code, identifiers and comments are in English.
- Match the existing code style: single quotes, no semicolons, function components, `handleX` handlers.

Design:
- Keep the identity: indigo/violet primary, slate neutrals, soft rounded cards. Evolve it; do not replace it.
- Do not add runtime dependencies. Write icons as small inline SVG components. Load fonts with a `<link>` in `index.html`; do not add an npm package for them.
- Use Tailwind v4 class names (`bg-linear-to-r`, not `bg-gradient-to-r`). Put tokens in `@theme` in `src/index.css`.

Accessibility (non-negotiable):
- Text contrast meets WCAG AA.
- Every interactive element has a visible `focus-visible` ring.
- Touch targets are at least 40px tall.
- Respect `prefers-reduced-motion`.
- At 375px width there is no horizontal page scroll.
</constraints>

<workflow>
For each task in scope, in order:

1. Read every file listed under "Files" before editing.
2. Plan only where it pays off. Tasks tagged `[plan-first]` either change a layout's structure or touch several pages. For these, write a short `<plan>` block before editing:
   - the component tree before and after (at most 8 lines)
   - the files you will touch
   - the main risk

   For other tasks, edit directly and do not narrate your reasoning.
3. Implement the change.
4. Verify:
   - Run `npm run build` and `npm run lint`. Both must pass with no new warnings.
   - With browser tools, screenshot every affected page at 375px and 1280px, both before and after, and check the result against the acceptance criteria.
   - Without browser tools, mark visual criteria `UNVERIFIED`. Never mark a criterion `PASS` without checking it.
5. Report using the template in <output_format>.

After the last task, print the run summary JSON.
</workflow>

<tasks>

## Phase 1: Foundation

### T1.1 Design tokens, font and document basics
Files: `src/index.css`, `index.html`
Steps:
- In `@theme`, define:
  - brand colors `--color-brand-50` to `--color-brand-700`, mapped to the current indigo values
  - an accent (violet) color
  - semantic colors for success, danger and warning
  - radius tokens
  - one shadow token for cards
- Load Inter with the Vietnamese subset (`&subset=vietnamese` / `display=swap`) through a Google Fonts `<link>`.
- Set `lang="vi"`.
- Replace `bg-gradient-to-br` with `bg-linear-to-br`.
- Add a global `focus-visible` ring style and a `prefers-reduced-motion` rule.
Acceptance criteria:
- [ ] Vietnamese diacritics (ữ, ặ, ở) render in Inter, not a fallback font.
- [ ] `bg-brand-600` and similar token classes work.
- [ ] The UI looks the same as before. This task adds no visible redesign.

### T1.2 UI primitives `[plan-first]`
Files: new `src/components/ui/{Button,TextField,SelectField,Card,Alert,Badge,Spinner,PageHeader}.tsx`, new `src/lib/cn.ts`, all three pages
Steps:
- Follow the API and code style in <examples> (Button).
- Each primitive uses the T1.1 tokens and passes through `...rest` and `ref`. In React 19, `ref` is a regular prop.
- `TextField` and `SelectField` render the label, a hint and an inline error. They connect them with `aria-describedby`, and set `aria-invalid` when there is an error.
- `Alert` takes a `tone` prop (`danger` / `success` / `info`) and renders with `role="alert"` or `role="status"` to match.
- Replace the duplicated markup in all three pages.
Acceptance criteria:
- [ ] No page contains raw input, button, card or alert class strings.
- [ ] Screenshots before and after match apart from deliberate token tweaks.
- [ ] `cn` is a simple class joiner of 10 lines or fewer, with no dependency.

### T1.3 Icon set
Files: new `src/components/ui/icons.tsx`, all pages
Steps:
- Write about 10 inline SVG icons using 24px `currentColor` strokes: upload, file-word, file-excel, file-ppt, download, logout, plus, check, alert, x, search, key, graduation cap.
- Replace the emoji with these icons.
- Decorative icons get `aria-hidden="true"`.
Acceptance criteria:
- [ ] No emoji remain in `src/`.
- [ ] Icons look the same on macOS, Windows and Android.

## Phase 2: Student-facing pages

### T2.1 Submission form redesign `[plan-first]`
Files: `src/pages/SubmitPage.tsx`, new `src/components/FileDropzone.tsx`
Steps:
- Build a dropzone with:
  - a large dashed area that accepts drag and drop or click-to-browse, and is keyboard-focusable (Enter or Space opens the picker)
  - an "active" style while a file is dragged over it
  - accepted formats and the 25 MB limit shown as helper text
- Once a file is chosen, show a file chip instead of the dropzone. The chip has a type icon (Word/Excel/PowerPoint), the file name (truncated), its size from `formatFileSize`, and a "Gỡ file" remove button.
- Run the existing validation as soon as a file is chosen, and show the error inline under the field.
- Show per-field inline errors instead of the single bottom banner. Keep the bottom banner only for upload or server errors.
- After a failed submit, move focus to the first invalid field.
- Replace `document.getElementById` with a `ref`.
- While the file uploads, show a spinner inside the button labeled "Đang nộp...", and disable the form fields.
Acceptance criteria:
- [ ] Dropping a .pdf shows an inline error under the file field immediately.
- [ ] The whole form works with keyboard only.
- [ ] Validation results are the same as before. Only how they are presented changes.

### T2.2 Success state
Files: `src/pages/SubmitPage.tsx`
Steps:
- Show a centered check icon with a subtle scale-in animation (disabled under reduced motion).
- Add a summary card listing the class, the student name, the file name and the time it was submitted (formatted with the `vi-VN` locale).
- Keep the "Nộp bài khác" button as the primary action.
- Move focus to the heading of the success message.
Acceptance criteria:
- [ ] The summary shows the values that were just submitted. Capture them before the form state is reset.
- [ ] A screen reader announces the success (`role="status"`).

### T2.3 Login page polish
Files: `src/pages/LoginPage.tsx`
Steps:
- Use the shared primitives.
- Add a show/hide password toggle with `aria-label` and `aria-pressed`.
- Add a "← Quay lại trang nộp bài" link.
- Restyle the footnote about how teacher accounts are created as a muted info `Alert`.
Acceptance criteria:
- [ ] Error messages show inline above the button with `role="alert"`.
- [ ] Pressing Enter in either field submits the form.

### T2.4 Shared public layout
Files: new `src/components/PublicLayout.tsx`, `src/App.tsx`
Steps:
- Wrap `/` and `/portal/login` in a layout with:
  - a small header containing the app name and logo icon
  - the centered content slot
  - a footer with the teacher login link (on `/`) or the back link (on the login page)
Acceptance criteria:
- [ ] Both public pages share the same header and footer. No route paths change.

## Phase 3: Teacher portal

### T3.1 Portal shell `[plan-first]`
Files: `src/pages/PortalPage.tsx`, new `src/components/portal/*`
Steps:
- Add a sticky top bar with:
  - the logo and "Portal giáo viên" title
  - the signed-in teacher's email, read from the existing `useSession()` session
  - a logout button that shows its icon and keeps its text label
- On screens of 1024px and wider, use a two-column layout: a narrow left column for class management and a wide right column for submissions. Below 1024px, stack them.
- Above the list, show stat tiles for total submissions, number of classes and submissions today. Compute them from data already in state; add no new queries.
Acceptance criteria:
- [ ] The layout has no horizontal scroll at 375px and does not stretch awkwardly at 1440px (cap the width with `max-w-7xl`).
- [ ] The stats match what the table shows for the current filter.

### T3.2 Class management panel
Files: `src/components/portal/ClassPanel.tsx`
Steps:
- Put the add-class input and button in one row with a plus icon.
- Make the class chips selectable. Clicking a chip sets the same `selectedClassId` that the select dropdown uses, so the two stay in sync, and the selected chip is styled as active.
- Add an "Tất cả" chip.
Acceptance criteria:
- [ ] The chips and the select dropdown always show the same selection.
- [ ] Chips are buttons with `aria-pressed`.

### T3.3 Submissions list: table on desktop, cards on mobile
Files: `src/components/portal/SubmissionList.tsx`
Steps:
- At 640px and wider, show the table with:
  - a sticky header and `scope="col"` on header cells
  - a file-type icon next to each file name
  - relative time ("5 phút trước", using `Intl.RelativeTimeFormat('vi')`), with the full timestamp in `title`
  - the download button as an icon plus label
- Below 640px, show one stacked card per submission with the same information.
- Add a client-side search box that filters the rows already loaded by student name. This filters what is displayed only; it adds no new query.
- Give each download button `aria-label="Tải xuống bài của {student_name}"`.
Acceptance criteria:
- [ ] No horizontal scroll at 375px.
- [ ] Searching "nguyen" matches "Nguyễn". Normalize by removing diacritics with NFD.

### T3.4 Loading and empty states
Files: `src/components/ui/Skeleton.tsx`, `src/components/portal/SubmissionList.tsx`, `src/components/ProtectedRoute.tsx`
Steps:
- While loading, show skeleton rows or cards with the same height as the real ones, so the layout does not jump.
- Show a full-page loading screen in `ProtectedRoute` with the logo and a spinner.
- Show an illustrated empty state (an inline SVG plus a heading and a hint). There are two variants:
  - no submissions at all: "Chưa có bài nộp nào" plus a hint to share the link `/`
  - no results for the current search or filter: plus a "Xoá bộ lọc" button
- Add a copy-link button that copies the student submission URL (`window.location.origin + '/'`) and confirms with "Đã sao chép".
Acceptance criteria:
- [ ] The layout does not jump when data arrives.
- [ ] Each empty-state variant appears in the right situation.

### T3.5 Toast feedback
Files: new `src/components/ui/Toast.tsx` (a small context, no dependencies), `src/pages/PortalPage.tsx`
Steps:
- Show toasts for: class added, link copied, and errors (which currently go to the persistent banner).
- Toasts disappear after 4 seconds and have a close button.
- The toast container is `aria-live="polite"`. Error toasts use `role="alert"`.
Acceptance criteria:
- [ ] Errors no longer stay on screen indefinitely.
- [ ] Toasts stack and do not cover the logout button.

## Phase 4: Polish

### T4.1 404 page and page titles
Steps:
- Add a Vietnamese 404 page inside `PublicLayout` with a link home.
- Give each page its own `<title>`. React 19 lets you render `<title>` inside the component. Use these titles: "Nộp bài tập", "Đăng nhập giáo viên", "Portal giáo viên", "Không tìm thấy trang".
Acceptance criteria:
- [ ] Every route shows a distinct browser tab title.

### T4.2 Motion and micro-interactions
Steps:
- Use 150–200 ms transitions on hover and press. Buttons scale to 0.98 when pressed.
- Cards and the success state fade in.
- Disable all of these under `prefers-reduced-motion`.
Acceptance criteria:
- [ ] No animation runs longer than 300 ms.
- [ ] Nothing animates when reduced motion is enabled.

### T4.3 Dark mode (only if Preferences allow)
Steps:
- Add dark values for the T1.1 tokens, applied through `@media (prefers-color-scheme: dark)`.
- Change no component markup except where a component uses a hard-coded color.
Acceptance criteria:
- [ ] Every screen meets AA contrast in dark mode.
- [ ] No white flash on load.

### T4.4 Accessibility audit
Acceptance criteria:
- [ ] A keyboard-only user can complete a submission, a login, adding a class, filtering, and a download.
- [ ] Lighthouse accessibility score is 95 or higher on all routes (`UNVERIFIED` if you cannot run Lighthouse).
- [ ] No `outline-none` without a `focus-visible` replacement.
</tasks>

<preferences>
Ask the user only if <run_scope> does not resolve these. Otherwise use the default.
- P1: Icon style. Default: 1.75px stroke, rounded line icons in the Lucide style.
- P2: Dark mode. Default: skip T4.3.
- P3: Keep the frosted-glass card look (`backdrop-blur`)? Default: keep it, with lighter shadows.
</preferences>

<examples>
These examples fix the format and level of detail. Adapt them to the real code; do not paste them verbatim.

<example name="Button primitive (code style)">
```tsx
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import Spinner from './Spinner'

type Variant = 'primary' | 'secondary' | 'ghost'

const variants: Record<Variant, string> = {
  primary:
    'bg-linear-to-r from-brand-600 to-accent-600 text-white shadow-md shadow-brand-200 hover:from-brand-500 hover:to-accent-500',
  secondary: 'bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50',
  ghost: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
}

interface ButtonProps extends ComponentProps<'button'> {
  variant?: Variant
  loading?: boolean
  icon?: ReactNode
}

export default function Button({ variant = 'primary', loading, icon, disabled, className, children, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        className,
      )}
    >
      {loading ? <Spinner className="h-4 w-4" /> : icon}
      {children}
    </button>
  )
}
```
</example>

<example name="TextField usage (call site)">
```tsx
<TextField
  label="Họ và tên"
  placeholder="Nguyễn Văn A"
  value={studentName}
  onChange={(e) => setStudentName(e.target.value)}
  error={fieldErrors.studentName}
  ref={nameRef}
/>
```
</example>

<example name="Per-task report (one completed task)">
### T3.3 Submissions list: DONE
**Changed:** `src/components/portal/SubmissionList.tsx` (new, +142), `src/pages/PortalPage.tsx` (−61)
**What:** Below the `sm` breakpoint the table becomes stacked cards. Added file-type icons, relative time with the full timestamp on hover, and diacritic-insensitive client-side search.
**Acceptance:**
- [PASS] No horizontal scroll at 375px: checked with a screenshot.
- [PASS] "nguyen" matches "Nguyễn": `normalize('NFD').replace(/\p{M}/gu, '')`.
**Screenshots:** before/after at 375px and 1280px (attached, or described if no browser tools).
**Checks:** `npm run build` ✅ `npm run lint` ✅
**Follow-ups:** none
</example>
</examples>

<output_format>
1. For each `[plan-first]` task: a `<plan>` block, then the edits.
2. For each task: a report that follows the "Per-task report" example. Status is one of `DONE`, `PARTIAL` or `SKIPPED`, and every acceptance criterion is listed as `PASS`, `FAIL` or `UNVERIFIED` with a short reason.
3. If Commit is "yes": one commit per task with the message `<type>(ui): <summary> [T2.1]`, where type is one of feat, style, refactor or a11y.
4. End with exactly one JSON block:

```json
{
  "phase": 1,
  "tasks": [
    { "id": "T1.1", "status": "DONE", "criteria": { "pass": 3, "fail": 0, "unverified": 0 }, "files_changed": ["src/index.css", "index.html"] }
  ],
  "checks": { "build": "pass", "lint": "pass" },
  "screens_verified": ["/ @375", "/ @1280"],
  "open_preferences": [],
  "follow_ups": []
}
```
</output_format>
