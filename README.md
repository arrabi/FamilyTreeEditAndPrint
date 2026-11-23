# Family Tree Edit & Print

A browser app for creating and editing a print-ready family tree poster. The
app can currently import GEDCOM 5.5.1 (including common GEDCOM 7 structures) and
the documented [simple JSON format](docs/json-format.md), then choose a root,
generation depth, and Arabic, English, or bilingual names for a descendants
preview. Editing, saving, and exporting are not implemented yet.

![Family Tree Edit & Print screen mock-ups](docs/mockups/overview.png)

The product direction and open questions are in [SPEC.md](SPEC.md). Early
visual ideas are in [the mock-ups](docs/mockups/README.md).

## Project layout

- `src/main.ts` and `src/style.css`: browser entry point and setup screen.
- `src/import/`: local GEDCOM/JSON parsing and descendants selection.
- `public/fixtures/`: the fictional 146-person mixed-script sample.
- `docs/architecture.md`: planned boundaries for future application features.
- `docs/mockups/`: early product and chart-style mock-ups.
- `research/`: product research.

## Local development

Use Node.js 22.18 or newer and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Run the checks and build with:

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run preview
```

The production build is static and is written to `dist/`; it can be served by any static web host. Vite's development and preview servers are only local development tools, not application backends.

The app has no accounts, analytics, or server-side processing. Family data must stay on the user's computer. See [SPEC.md](SPEC.md) for the planned features and [the mockups](docs/mockups/README.md) for the intended screens.

## License

This project is released under the [MIT License](LICENSE).
