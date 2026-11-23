# Family Tree Poster

Family Tree Poster is a browser-based tool for turning a genealogy file into a
print-ready family tree poster that you can arrange and decorate by hand. The
product direction and open questions are in [SPEC.md](SPEC.md); early visual
ideas are in [the mock-ups](docs/mockups/README.md).

![Family Tree Poster screen mock-ups](docs/mockups/overview.png)

## Project status

This repository currently contains the initial application skeleton, not a
working tree editor. Import, layout, editing, themes, and export are planned;
see the [specification](SPEC.md) for scope and milestones.

The planned workflow is to import GEDCOM or JSON family data, choose a chart
and page, arrange the tree, and export a print-ready PDF, SVG, or PNG.

## Run locally

Requirements: Node.js 22.12 or newer.

```sh
npm install
npm run dev
```

Vite prints a local URL to open in your browser. To check the TypeScript source
and create a production build, run:

```sh
npm run typecheck
npm run build
```

## Project layout

- `src/main.ts` and `src/style.css`: browser entry point and starter screen.
- `docs/architecture.md`: planned boundaries for future application features.
- `docs/mockups/`: early product and chart-style mock-ups.
- `SPEC.md`: product goals, planned features, and open technical decisions.
- `research/`: product research.

Keep the import, layout, editing, theme, and export features separate as they
are added. Do not put genealogy data in server services: the app is intended to
run entirely in the browser, without accounts, analytics, or cloud storage.
Only fictional family data should be committed to this repository.

## License

This project is released under the [MIT License](LICENSE).
