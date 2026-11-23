# Application architecture

The application is a static browser app. Keep domain logic independent of the
screen where practical, and pass user files between features in memory rather
than sending them to a server.

As the application grows, organize `src/` around these responsibilities:

- `app/`: application startup and top-level screen composition.
- `import/`: GEDCOM and documented JSON parsing, plus root and generation
  selection.
- `model/`: shared family-tree and saved-project types.
- `layout/`: automatic tree positioning and page fitting; no browser UI.
- `editor/`: canvas interactions, selection, movement, and undo/redo.
- `themes/`: SVG decoration, chart-style definitions, and theme configuration.
- `export/`: PDF, SVG, and PNG output.

Keep modules small and testable without a browser when possible. Share types
through `model/` rather than making core data flow depend on editor or export
code. Add a feature's tests alongside its implementation when test
infrastructure is introduced. This is a starting map, not a requirement to
create empty modules before their behavior is designed.
