# CLAUDE.md

Guidance for Claude (and any coding agent) working in this repo.

## What this is

A standalone, open-source browser app that turns a genealogy file into a print-ready family tree poster you can edit by hand, like a vector drawing tool. See `SPEC.md` for the product spec and `research/` for the market research.

## Owner's rule

"Branch, code, push, and let me inspect. After I approve, then merge."

Never merge to `main`, publish a release or change repo settings without the owner's explicit approval.

## Engineering process

1. **Issues first.** Every feature, bug or chore is a GitHub issue. Work one issue at a time; one PR per issue unless told otherwise. Open questions go inside the issue and are settled when the issue is picked up.
2. **UI features: spec, then mock-ups, then code.** For anything with UI, first write a short mini spec in the issue (goal, what the user sees, edge cases, out of scope), then picture mock-ups. Start implementing only after the owner approves the spec and a mock-up.
3. **Branch.** Cut a feature branch from current `main` (e.g. `feat/12-page-frame`).
4. **Build and check.** Before pushing, run build, lint, type check and tests. Add or update tests for the change. Never skip, disable or weaken a test to get green.
5. **PR.** Body has `Closes #N`, what changed, what was tested, and a short manual testing checklist. Include screenshots for UI changes.
6. **Preview site.** Every PR gets a preview deployment (Vercel preview or equivalent). Send the preview link to the owner to test.
7. **Merge only on approval.** After the owner approves: merge, confirm the issue closed and the production deploy succeeded.
8. **Leftovers become issues.** When an issue closes with work left over, file each leftover point as its own new issue.

## Engineering standards

- TypeScript, strict mode. Small, focused modules; keep the layout engine, the canvas editor and the exporters separate and testable without a browser where possible.
- Everything runs in the browser. No server, no accounts, no analytics; a user's family data never leaves their computer.
- Arabic and other right-to-left scripts are first-class. Any change that touches text must be checked with Arabic names on screen and in the exported PDF.
- Exports must stay vector (PDF, SVG) with fonts embedded; raster (PNG) only as an extra.
- Sample data in the repo must be fictional. Never commit a real family tree; real people, many living, would be published.
- Keep dependencies few and permissively licensed (MIT, Apache-2.0, BSD, MPL). Check a library's license before adding it. Do not use tldraw (its license bars standalone distribution and requires a watermark).
- Keep `README.md` and `SPEC.md` current when behavior changes.
- Commit messages: short imperative summary line, with the issue number.
