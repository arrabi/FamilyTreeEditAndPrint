# Family Tree Edit & Print

A browser app for creating and editing a print-ready family tree poster. The current version is a static app shell: it previews the setup and editor workspaces, but importing files, editing, saving, and exporting are not implemented yet.

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
