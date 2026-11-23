# Printable, editable family tree posters: what already exists

Researched 22-23 Nov 2026 for Muhammad's idea of a standalone app: import a genealogy, auto-fit a compact tree to A4/A3 with page borders, drag people and branches by hand like Illustrator, hide branches, decorative templates and frames, export vector PDF and high-res image. Arabic names must render right to left.

## Summary

Nothing found does the whole list, and nothing found says it handles Arabic. The desktop genealogy programs come closest on the editing side: Family Tree Maker, Progeny's Charting Companion and Heredis (Windows) all let you drag individual boxes, remove a person or branch from the chart, add backgrounds or ornaments and print to a set paper size, but they are paid desktop programs that expect your tree inside them, they are not open source, and none states Arabic or right-to-left support. The open-source side has good GEDCOM import and clean SVG/PDF export (Topola Viewer, active, Apache-2.0) but no hand layout, no page frame and no ornaments; people in the Gramps community print big trees by exporting SVG and fixing it in Inkscape. So the gap Muhammad describes is real. Recommendation: build new, as a browser app on an MIT canvas library (Konva or Fabric.js), reusing Topola (Apache-2.0) for GEDCOM parsing and a first layout. Avoid tldraw as a base: its license forbids shipping it as a standalone product and requires a paid licence to remove its watermark. For the Khalil print right now, the free workaround is GEDCOM, then Topola Viewer, then export SVG, then finish by hand in Inkscape or Illustrator.

## Closest matches against the wish list

| Tool | Type, price | Import | Fit to page / sizes | Drag single boxes | Hide branches | Templates, ornaments | Export | Arabic / RTL |
|---|---|---|---|---|---|---|---|---|
| Family Tree Maker (Mackiev) | Windows/Mac desktop, paid | Its own tree; GEDCOM import (program feature) | Page Setup, poster layout across pages; charts over 200 in can't print | Yes ("click and drag individual boxes"), resets if chart options change | Yes ("Remove Person from Chart"), or export a branch | Background image, box/line styles, embellishments folder, saved templates | PDF (used for ChartMasters orders); image/vector not stated | Not stated |
| Progeny Charting Companion | Desktop add-on to a genealogy program, paid | Reads your genealogy program's file | Custom page size, size to fit, tiling with crop marks | Yes ("move rectangles" in ancestor, descendant, hourglass, bowtie) | Prune selected branches | "Ornamental borders: vector, hundreds of options", gradients | PDF, SVG, PNG, JPG, DXF and more | Not stated (UI in 18 languages, list not given) |
| Heredis (Windows) | Desktop, paid | Its own tree, GEDCOM category exists | Unlimited size, printed over pages with overlap or one long strip; right-to-left orientation option for the layout | Yes, drag a selection, Shift keeps generation axis, undo | Untick people to exclude; blur private people | Themes, box styles, image backgrounds | Print or PDF (detail not read) | Not stated |
| MacFamilyTree 11 (Synium) | Mac only, US$69.99 list | GEDCOM 5.5.1 and 7 | Custom pagination, one chart over several pages | "Change positioning and rotation of chart elements" | Not stated | Not stated for charts | PDF | UTF-8 import; Arabic not in UI languages; RTL not stated |
| Topola Viewer (open source) | Browser app, Apache-2.0, active (library release 22 Nov 2026) | GEDCOM, GEDZIP with photos, Gramps and webtrees plugins | "Print the whole genealogy tree"; no page-size fitting stated | No | Branches can be hidden/unhidden (from a Gramps forum thread) | No | PDF, PNG, SVG | Not stated |

### What each leaves out

- Family Tree Maker: closest overall, but you have to move the Arabic tree into FTM, Arabic/RTL rendering is unknown, it's closed and paid, and manual moves reset when options change. Not shareable as a public tool.
- Charting Companion: strongest on ornaments and vector export, but tied to a desktop genealogy program, Windows-centred, editing feature dates from 2015, Arabic unknown.
- Heredis: good drag and exclude controls on Windows; the Mac version's designed charts "can't be fully personalized"; Arabic unknown.
- MacFamilyTree: Mac-only, chart decoration not described, Arabic UI absent.
- Topola Viewer: free, open, imports GEDCOM and exports vector, but it is a viewer: no dragging, no page frame, no templates.

## Other services checked

- MyHeritage: 18 chart styles, edit fonts, frames, photo size and facts shown, own background picture; PDF download. Poster printing stopped 1 Jan 2023. Dragging and hiding not stated.
- MyCanvas: GEDCOM upload to a decorative poster (standard, combination, descendant, fan; up to 9 generations), editable text, backgrounds, embellishments, five themes. Printed posters only, 16x20 to 36x48 in, from $40 for 24x18. No PDF/vector download, no A3/A4, dragging not stated.
- Family ChartMasters: print shop. Takes a PDF exported from your program (via FTM up to 16 ft long), or makes a chart from your GEDCOM as a paid custom job (2015 page: 40+ designs, $15/hour data entry). Not a self-serve editor.
- RootsMagic wallcharts: rearrange and size boxes, pictures, background; saved as .RMC and sent to the print service. Export formats not stated.
- TreeDraw (SpanSoft): free-form drag of elements and lines, PDF/metafile/bitmap export; manual dated 2017; GEDCOM import not confirmed.
- Not checked in depth: Ancestry's own charts, Legacy, Genelines, TreeSeek (search results pointed to older or fan-chart-only material).

## Open source checked

- topola (library): TypeScript, D3, SVG; ancestors, descendants, hourglass, relatives, "fancy" charts. Apache-2.0 (npm). Good starting point for parsing and first layout.
- family-chart (donatso): D3 interactive tree library, MIT on GitHub (npm says ISC), ~786 stars, last npm release Oct 2025. Data editing, styling, SVG/HTML cards; no stated GEDCOM, drag-to-place, or export. Paid "Premium" add-on exists.
- GVExport (webtrees module): Graphviz "all in one tree", exports SVG, PDF, PNG, JPG. Needs a webtrees server. No hand layout.
- webtrees-descendants-chart (magicsunday): D3 descendants chart up to 25 generations, SVG/PNG export, GPL-3.0, version 2.8.0 on 19 Nov 2026; the only page that mentions RTL (details panel side). Needs webtrees.
- ged2dot + LibreOffice GEDCOM extension: GEDCOM to Graphviz, MPL-2.0; the extension imports into LibreOffice Draw where the layout can be hand-edited. Closest open "editable vector" route, but Graphviz layouts are generic and there is no page frame or ornament.
- Gramps: Graph View add-on and FamilyTreeView add-on (scale to page size, SVG export, Windows issues). Forum advice for posters: export SVG, then fix by hand in Inkscape or yEd.
- gedcom-svg-fanchart: drop a GEDCOM, get an SVG fan chart, MIT; fan only.
- family-tree-grapher: small JS GEDCOM to SVG descendants tree; early, no releases.

## Bases for building it

- Konva (MIT, v10.10, release 20 Nov 2026) or Fabric.js (MIT, v7.4, Oct 2026): canvas objects with drag, select, group, transform; Fabric also exports SVG. Either fits "Illustrator-like" editing.
- Excalidraw (MIT): whiteboard look, hand-drawn style; less suited to precise print layout.
- tldraw (v5.6): avoid. Its license forbids distributing it "as a standalone product", shows a watermark unless you buy a Business License, and hobby use needs a separate free licence application.
- svg2pdf.js and pdfkit (both MIT, active): vector PDF export with embedded fonts, which is what keeps Arabic text crisp at A3.
- Paper.js (MIT): vector drawing, useful for ornament paths.

## Suggested shape if he builds it

1. Import GEDCOM (topola's parser) or the site's own JSON.
2. Pick a root person, depth and paper (A4/A3/custom, portrait/landscape); auto-layout a compact tree inside the page frame.
3. Canvas (Konva): drag a person or a whole branch, hide/show branches, undo.
4. Templates: frame and ornament SVGs, title cartouche, fonts (an Arabic font such as Amiri or Noto Naskh embedded).
5. Export vector PDF and SVG, and PNG at 300 dpi for a print shop.
6. Runs fully in the browser so nobody's family data leaves their computer; publish on GitHub under MIT or Apache-2.0.

Risks to check early: right-to-left text and Arabic shaping inside the canvas library and in the PDF export (test before anything else), and how the auto-fit behaves with 146 people on A3.

## Sources read

- https://www.myheritage.com/help/en/articles/12851469-how-can-i-edit-the-chart-style
- https://blog.myheritage.com/2022/12/sunset-notice-for-printing-posters-of-family-tree-charts/
- https://intercom.help/mycanvas/en/articles/10828328-how-to-turn-your-gedcom-file-into-a-family-tree-poster
- https://classic.mycanvas.com/family-tree-poster
- https://support.mackiev.com/700533-Customize-Format-and-Save-your-Chart-in-Family-Tree-Maker
- https://support.mackiev.com/754878-Ordering-Printed-Charts-through-Family-ChartMasters
- https://thechartchick.blogspot.com/2015/11/new-family-chartmasters-website.html
- https://progenygenealogy.com/blogs/announcing-charting-companion-with-new-direct-chart-editing/
- https://progenygenealogy.com/products/family-tree-charts/better-formatting-control/
- https://progenygenealogy.com/products/family-tree-charts/feature-comparison/
- https://rootsmagic.com/Wallcharts/RootsMagic.aspx
- https://help.heredis.com/en/windows-unlimited-size-tree-chart-ancestors-descendant-and-hourglass/
- https://help.heredis.com/en/mac-predetermined-size-tree-charts-single-page-chart-designed-chart-fan-chart-2/
- https://treedraw.spansoft.org/manual/html/move.php
- https://www.syniumsoftware.com/macfamilytree/tech-specs
- https://github.com/PeWu/topola-viewer
- https://github.com/PeWu/topola
- https://github.com/donatso/family-chart
- https://cdn.jsdelivr.net/npm/family-chart@0.9.0/README.md
- https://github.com/Neriderc/GVExport
- https://packagist.org/packages/magicsunday/webtrees-descendants-chart
- https://github.com/vmiklos/ged2dot
- https://extensions.libreoffice.org/extensions/gedcom
- https://gramps.discourse.group/t/printable-visualization-of-the-complete-family-tree/2260
- https://gramps.discourse.group/t/new-familytreeview-addon/6641?page=17
- https://github.com/nliautaud/gedcom-svg-fanchart
- https://github.com/jlcarr/family-tree-grapher
- https://tldraw.dev/legal/tldraw-license
- https://tldraw.dev/pricing
- npm registry entries for konva, fabric, @excalidraw/excalidraw, tldraw, topola, family-chart, paper, pdfkit, svg2pdf.js (licence and last release)
