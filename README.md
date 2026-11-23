# Family Tree Edit & Print

A browser app for creating and editing a print-ready family tree poster. The current version previews the setup and editor workspaces with a fictional sample. The export workspace can create exact-size vector PDF and SVG files, or a PNG at a selected DPI; importing files, editing, and saving are not implemented yet.

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

The app has no accounts, analytics, or server-side processing. Family data must stay on the user's computer. See [SPEC.md](SPEC.md) for the planned features and [the mockups](docs/mockups/README.md) for the intended screens.

## Manual export checklist

Use the fictional Haddad sample in the editor for every export check:

- Choose PDF, SVG, and PNG and verify each file downloads without leaving the browser.
- Confirm the A3 landscape trim is 420 × 297 mm; with bleed, each file is 426 × 303 mm.
- Inspect PDF properties for embedded Noto fonts and selectable Arabic/Latin text.
- Inspect SVG for live text, the embedded Arabic-capable font, and correct mixed-script direction.
- Open the 300 dpi PNG at print size and confirm its dimensions are 5031 × 3579 pixels.
- Toggle bleed/crop marks and verify that the exact output dimensions and marks change together.
- Confirm the hidden fictional person is absent from every format.

## License

This project is released under the [MIT License](LICENSE).
