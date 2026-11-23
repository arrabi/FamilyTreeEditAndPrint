# Family Tree Edit & Print

A browser app for creating and editing a print-ready family tree poster. The
current version is a static app shell with local, versioned project saving and
reopening. GEDCOM import, canvas editing, and exporting are not implemented yet.

![Family Tree Edit & Print screen mock-ups](docs/mockups/overview.png)

The product direction and open questions are in [SPEC.md](SPEC.md). Early
visual ideas are in [the mock-ups](docs/mockups/README.md).

## Project layout

- `src/main.ts` and `src/style.css`: browser entry point and starter screen.
- `src/project.ts`: versioned editable-project serialization and validation.
- `docs/project-format.md`: the local project file format.
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

Open a saved `.ftep.json` file from setup, then use **Save project** in the
editor to download the complete editable state. The app has no accounts,
analytics, autosave, or server-side processing. Family data stays on the user's
computer. See [the project format](docs/project-format.md), [SPEC.md](SPEC.md),
and [the mockups](docs/mockups/README.md).

## License

This project is released under the [MIT License](LICENSE).
