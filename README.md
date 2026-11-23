# Family Tree Edit & Print

A browser app for creating and editing a print-ready family tree poster. The current version is a static app shell: it previews the setup and editor workspaces, but importing files, editing, saving, and exporting are not implemented yet.

![Family Tree Edit & Print screen mock-ups](docs/mockups/overview.png)

The product direction and open questions are in [SPEC.md](SPEC.md). Early
visual ideas are in [the mock-ups](docs/mockups/README.md).

## Project layout

- `src/main.ts` and `src/style.css`: browser entry point and starter screen.
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

## Manual editor checklist

- Click **Preview editor workspace**, scroll to zoom, then drag empty canvas or hold Space and drag to pan.
- Select and drag one person in Person mode; Shift-click several people and move them together.
- Switch to Couple mode and verify a partner follows. Switch to Branch mode and verify all descendants follow.
- Drag near another person's centre line and confirm the pink snap/alignment guides appear.
- Nudge with arrow keys, use Shift for a larger step, and verify connectors re-route after every move.
- Use toolbar undo/redo and Ctrl/Cmd+Z / Ctrl/Cmd+Shift+Z; verify each edit is restored.
- Confirm the fictional Arabic and English names remain correctly shaped in the canvas.

The app has no accounts, analytics, or server-side processing. Family data must stay on the user's computer. See [SPEC.md](SPEC.md) for the planned features and [the mockups](docs/mockups/README.md) for the intended screens.

## License

This project is released under the [MIT License](LICENSE).
