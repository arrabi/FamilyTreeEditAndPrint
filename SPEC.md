# Family Tree Poster: mini spec

Status: draft v0.1, 22 Nov 2026. Open questions are at the end; each gets settled in its own issue.

## Problem

Families want a beautiful printed tree on the wall, at a real paper size, that looks the way they want. Today's tools either auto-generate a fixed style with no hand control (web services), or are paid desktop genealogy programs with dated editors and no Arabic support. Nothing open lets you import a tree, auto-fit it to a page, then fine-tune it by hand like a vector drawing and export it for a print shop. See `research/print-tree-tools-2026-11-22.md`.

## Who it's for

Anyone with a family tree file who wants a printable poster. First real test case: a 146-person, 5-generation descendants tree with Arabic and English names, printed on A3.

## Goals

- Import a tree, get a good-looking compact poster in under a minute.
- Hand-edit it freely until it looks right.
- Export files a print shop can use at any size without losing quality.
- Arabic and other right-to-left names look correct everywhere.
- Free, open source, runs entirely in the browser.

## Non-goals (for v1)

- Editing genealogy data itself (births, marriages, sources). Fix data in your genealogy program and re-import.
- Accounts, cloud storage, sharing links, collaboration.
- Ordering prints. We export files; the user takes them to a printer.

## Core features

### 1. Import
- GEDCOM 5.5.1 (and 7 if cheap), via an existing parser (e.g. the Topola library, Apache-2.0).
- A simple JSON format (documented in the repo) for sites that export their own data.
- Pick the root person, chart type (descendants first; ancestors and hourglass later) and number of generations.
- Choose which name to show when a person has several (e.g. Arabic, English, or both).

### 2. Page and auto-fit
- Paper sizes: A4, A3, A2, A1, Letter, Tabloid, custom; portrait or landscape; margins; optional bleed for print shops.
- Page border always visible on the canvas, with a safe-area guide.
- Auto-layout a compact tree that fits the chosen page, readable at print size. Re-run auto-fit at any time.

### 3. Canvas editing (vector-editor feel)
- Zoom and pan; select one or many; drag a person, a couple or a whole branch (children follow their parents).
- Connector lines re-route as boxes move.
- Snap and alignment guides; nudge with arrow keys; undo and redo.
- Hide or show a person or a whole branch (hidden means not printed, never deleted from the data).
- Edit display text on a box without changing the source data (e.g. shorten a long name).
- Add free text (title, dedication, date) and images (a family crest or photo).

### 4. Templates and decoration
- A few starter themes: frame or border, ornaments, background, box style, line style, fonts, title cartouche.
- Themes are plain SVG plus a small JSON config, so the community can add more.
- Bundled open-licensed fonts covering Arabic and Latin (e.g. Amiri, Noto Naskh Arabic, Noto Sans/Serif).

### 5. Chart styles (artistic trees)
A theme decorates the page; a chart style decides how the tree itself is drawn. Styles are swappable at any time, and hand edits are kept when switching where possible.

A style is made of three parts:
- **Person mark:** box, card, leaf, dot, medallion, or name only.
- **Connector:** straight, elbow, smooth curve, or tapering branch (thick near the root, thin at the tips, thickness by number of descendants).
- **Layout:** top-down, sideways (trunk on the right growing left, or the mirror), radial/fan, or organic (positions relaxed so branches fill the page instead of sitting in fixed columns).

Plus text placement (inside the mark, beside it, or along the branch), spouse display (own box, or after a ∞ sign in a lighter colour on the same line), and colour rules (e.g. by living/deceased, by branch, by generation).

**First artistic style: "Leaf tree."** The target look:
- A3 landscape, sideways, trunk on the right edge with the root's name, growing right to left (mirrored for left-to-right languages).
- Each person is a twig with their name written on it, ending in a leaf; children sprout from the parent's leaf.
- Branches are smooth tapering curves in bark colour; thickness shows how big each branch is.
- Leaves are green for living people and autumn orange for deceased people, with slight shade variation so it looks hand-drawn.
- Spouse names follow a ∞ sign in a lighter colour; links to people shown elsewhere use thin dotted lines.
- Title and generation count in the top corner, a small legend (living, deceased, spouse) in the bottom corner.
- Organic layout: twigs push each other apart to fill the page evenly, no overlapping text.
- Everything stays draggable: moving a person bends its twig and moves its sub-branch; curves redraw live.

Sample images in the repo must use fictional names.

### 6. Export
- Vector PDF with embedded fonts, at the exact page size (with bleed if chosen).
- SVG.
- PNG at 300 dpi (or chosen dpi) for print shops that want an image.

### 7. Save and reopen
- Save the whole project (tree data, positions, hidden items, theme, page) as one file the user keeps; reopen later to keep editing.
- Optional autosave in the browser.

## Right-to-left and Arabic

- Arabic letters must join and shape correctly on the canvas and in PDF/SVG exports.
- Mixed Arabic and English on one poster must work (e.g. Arabic name above, English below).
- Option to mirror the whole layout right to left.
- This is the riskiest part technically: prove it in a small spike before building features on top.

## Technical direction (to confirm in early issues)

- TypeScript, Vite, a light UI framework (React or none; decide in the first issue).
- Canvas: Konva or Fabric.js (both MIT). Pick after the Arabic spike.
- Layout: own compact tree layout (tidy-tree style), optionally seeded from Topola's layout.
- PDF: svg2pdf.js plus jsPDF, or pdfkit; must embed fonts and keep text as text where possible.
- Hosting: static site (Vercel or GitHub Pages), preview deploy per PR.
- License: MIT (see LICENSE).

## First milestones

1. Spike: Arabic and English names on a draggable canvas, exported to vector PDF that prints sharp and shapes correctly.
2. Import GEDCOM and JSON, pick root and depth, show the auto-laid-out tree inside an A3 page frame.
3. Drag people and branches, hide branches, undo.
4. Export PDF, SVG and PNG.
5. One decorative theme, then more.
6. Chart styles: the classic box style plus the leaf tree style.
7. Save and reopen projects.

## Done for v1 means

The 146-person, 5-generation test tree imports, auto-fits on A3, can be hand-adjusted, can be shown in both the box style and the leaf tree style, gets a decorative frame, and exports a PDF that a print shop prints sharp, with every Arabic name correct.

## Open questions

- App name.
- React or no framework?
- Konva or Fabric.js (decided by the spike)?
- How much of Topola to reuse: parser only, or its layout too?
- Which chart types after descendants: ancestors, hourglass, fan?
- Should hidden branches leave a small "+N more" marker on the print?
- Photos in boxes in v1, or later?
- Which artistic styles after the leaf tree (e.g. fan with ornaments, roots-and-crown hourglass, botanical vine)?
- Can a user build a style from parts in the app, or only by editing a style file?
