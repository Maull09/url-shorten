# Repository Instructions

## General Working Principles

- Prefer simple, explicit solutions over clever abstractions.
- Change only what is needed for the request; do not refactor unrelated code.
- Follow the repository's existing naming, formatting, and directory conventions.
- Write readable, maintainable code. Optimize only when there is a demonstrated need.
- Do not add fallbacks, backward compatibility, configuration, or abstractions unless the request requires them.
- State important assumptions when they affect implementation or behavior. Ask before making a choice that materially changes scope.
- Keep secrets and local environment values out of source control.

## Software Engineering Principles

- Follow the repository's existing architecture, patterns, and conventions. Avoid introducing new frameworks, libraries, or paradigms unless the request explicitly requires them.
- Keep functions and modules focused on one clear responsibility. Avoid large, monolithic files or classes. Break them into smaller, reusable components when appropriate.
- Favor explicit, readable code over clever or terse solutions. Avoid unnecessary abstractions, indirection, or over-engineering. Use comments to explain "why" rather than "what" or "how."
- Preserve existing public behavior unless the request explicitly changes it. Avoid introducing breaking changes or regressions.
- Use version control effectively: commit small, focused changes with descriptive messages. Avoid committing unrelated changes or temporary debugging code.
- Write tests for new features or bug fixes. Ensure existing tests pass before submitting changes. Use automated testing and continuous integration when available.
- Document your code and design decisions clearly. Update relevant documentation when making changes that affect usage, configuration, or behavior.
- Prioritize security, privacy, and data integrity. Follow best practices for authentication, authorization, input validation, and error handling. Avoid exposing sensitive information or introducing vulnerabilities.
- DRY (Don't Repeat Yourself): Avoid duplicating code or logic. Extract reusable functions, components, or modules when appropriate. Use libraries or frameworks that promote code reuse and maintainability.
- Follow SOLID principles: Design your code to be modular, extensible, and maintainable. Use interfaces, abstractions, and dependency injection when appropriate.
- Use design patterns judiciously: Apply design patterns when they provide clear benefits, but avoid overusing them or forcing them into situations where simpler solutions would suffice.
- KISS (Keep It Simple, Stupid): Strive for simplicity and clarity in your code. Avoid unnecessary complexity, over-engineering, or premature optimization. Focus on solving the problem at hand in the most straightforward way.
- YAGNI (You Aren't Gonna Need It): Avoid implementing features or abstractions that are not currently required. Focus on delivering value and meeting the immediate needs of the project.
- Favor composition over inheritance: Prefer composing smaller, focused components or functions rather than relying heavily on inheritance hierarchies. Use composition to achieve flexibility and maintainability.
- Embrace immutability and functional programming principles when appropriate. Avoid mutable state and side effects that can lead to bugs or unexpected behavior. Use pure functions and immutable data structures when possible.
- Use meaningful variable and function names that convey intent. Avoid abbreviations or cryptic names that make the code harder to understand. Follow consistent naming conventions throughout the codebase.
- Separate of concerns: Keep different aspects of the codebase (e.g., UI, business logic, data access) separate and modular. Use layers or modules to encapsulate functionality and promote maintainability.


## Implementation and Verification

- Understand the affected behavior before editing.
- Keep functions and modules focused on one clear responsibility.
- Prefer descriptive names and straightforward control flow over explanatory comments.
- Preserve existing public behavior unless the request explicitly changes it.
- Run the smallest relevant check, test, type check, lint command, or build after a change when available.
- Report what changed and which verification was actually run.

## Documentation

- Update only the source-of-truth document made inaccurate by the change. Do not update `README.md`, `CHANGELOG.md`, `todo.md`, or unrelated files in `docs/` merely because they exist.
- Update `README.md` only for material purpose, setup, architecture, or current-state changes. Update a focused document in `docs/` only for lasting setup, configuration, operations, or troubleshooting guidance.
- Update `CHANGELOG.md` only for user-facing, release-worthy changes. Update `todo.md` only for meaningful progress, decisions, or newly discovered follow-up work.
- Preserve historical entries and unrelated documentation. Do not rewrite, duplicate, or overwrite existing guidance unless the request specifically requires it.

## Design System

- Read `DESIGN.md` before designing, implementing, reviewing, or refactoring any user-facing interface.
- Treat `DESIGN.md` as the source of truth for the portfolio's visual tokens, typography, layout rhythm, component states, and product voice. Keep UI code aligned with its clean, light, technical, and bold direction.
- Read `docs/ARCHITECTURE.md` for section order, navigation, content structure, and proposed technical architecture before changing those areas.
- Update `DESIGN.md` before implementation when a lasting visual direction, token, or component rule changes. User requests and the portfolio's clarity, accessibility, and content-accuracy requirements take precedence if they conflict.

## Git Workflow

### Start

- Start Git work by fetching the remote and identifying the current default branch. Update the local default branch with a fast-forward-only pull before creating a dedicated, descriptively named branch from it. Do not start feature work from a stale branch, an unrelated open PR, or a branch with uncommitted changes.

### Validate

- Before staging, confirm that the requested change belongs to the current branch and its intended PR. Check for an existing PR or already-merged equivalent change before opening another one. Do not add unrelated documentation, chores, or fixes to a feature branch unless the user explicitly asks to combine them.
- Before committing, run every available applicable local gate: any configured pre-commit hook, lint, focused tests (or the full test suite when appropriate), TypeScript checking, and a production build for application changes. Run a relevant security check such as `npm audit --omit=dev` when dependencies, server code, secrets, authentication, input handling, or personal-data handling are affected. Report unresolved findings; never run automatic security fixes without approval.

### Submit

- Stage only the requested files after reviewing both the working diff and staged diff. Make small, descriptive commits that each pass their relevant checks. Push the branch, create or update one focused PR targeting the current default branch, and state what changed, why, and the checks that actually passed. Avoid "fixup" or "squash" commits unless they are part of a review process.

## Skill Usage

Choose a skill when its purpose directly matches the task. Do not invoke a skill by default for unrelated work.

| Task | Required skill usage |
| --- | --- |
| Writing, reviewing, or refactoring code | Use `clean-code` and `karpathy-guidelines`. Keep changes small, readable, and verifiable. |
| Implementing or reviewing backend code, API routes, database access, authentication, or server-side business logic | Also use `backend-patterns` alongside the applicable code-quality skills. Preserve explicit validation, authorization, error handling, and database boundaries. |
| Reviewing changes for security issues or working on authentication, authorization, input handling, secrets, or personal data | Also use `security-review` before completing the work. Treat its findings as recommendations subject to this repository's privacy and publication requirements. |
| Performing a focused or full codebase security audit | Also use `security-audit` alongside `security-review`. Keep the audit source-first, do not probe live services, and use the skill's full workflow only when the user explicitly requests a comprehensive audit or report artifacts. |
| Designing, implementing, reviewing, or refactoring a user-facing interface | Use `design-principle` and `ui-ux-pro-max` in addition to the applicable code-quality skills. Establish the user, goal, activity, context, conceptual model, feedback, and usability target; record material UI assumptions rather than treating them as facts. Query `ui-ux-pro-max` narrowly: use a design-system search for a new page or system, or an explicit domain/stack search for a focused concern. Treat its results as recommendations; the portfolio's clarity, accessibility, personal branding, and existing repository rules take priority. |
| Building a new UI feature or materially redesigning a page, component, or visual system | Use `frontend-design` and `design-principle` in addition to the code-quality skills. Define a brief, product-specific visual direction before implementation; verify responsiveness, accessibility, task completion, and visual hierarchy afterward. |
| Landing page, portfolio, or marketing-focused redesign | Also use `design-taste-frontend` (Taste Skill) when it fits the brief. Follow the portfolio's visual direction in `DESIGN.md`, with readable content, authentic project visuals, and personal photography. |
| Small visual correction with no design decision | Use the code-quality skills; `frontend-design` is optional. |

Read the selected skill's instructions before acting. If skills conflict, follow the user's request and the repository's requirements first.

## Repository-Specific Context

This section is intentionally project-specific. Replace or remove it when copying this file to another repository.

### URL Shortener Learning Project

- This repository is a full-stack learning project for a URL shortener inspired by Bitly.
- The agreed stack is Next.js App Router, TypeScript, Tailwind CSS, and Supabase Postgres.
- Current scope includes anonymous shortening, email/password Supabase Auth, email confirmation, logout, and an owner-only dashboard for creating, listing, copying, and deleting links. Custom aliases, analytics, password recovery, and public deployment require follow-up scope decisions.
- Support Indonesian (`/id`) and English (`/en`), with `/` redirecting to `/id`. Keep UI, metadata, accessibility labels, and error translations in `src/i18n/messages/` synchronized. Short links remain `/s/[code]` across languages.
- Use Manrope for UI/body text, Lora for display headings, and system monospace for URLs. Follow `DESIGN.md` and the request flow in `docs/ARCHITECTURE.md`.
- Keep UI components in `src/components/`, routes in `src/app/`, domain and data access in `src/lib/`, and SQL migrations in `supabase/migrations/`.
- Access Supabase only from server code. Keep keys in `.env.local`, without a `NEXT_PUBLIC_` prefix. Use the publishable key and a verified user session for dashboard queries; use the secret key only for anonymous creation and public redirects. Enforce owner RLS and never trust an owner ID submitted by a client.
- Auth uses HttpOnly cookies and server verification. Private responses must not be cached. Validate mutation origins against APP_URL, and keep email callback destinations fixed to local routes.
- Never substitute mock link storage when Supabase is unavailable. Test fixtures must remain isolated from production code.
- Keep the implementation easy to trace for a learner. Explain request flow and include focused behavior tests.
- Preserve semantic structure, keyboard access, visible focus, sufficient contrast, responsive layouts, and reduced-motion preferences.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
