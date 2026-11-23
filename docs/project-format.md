# Editable project format

Family Tree Edit & Print saves editable work as a `.ftep.json` file. Opening and
saving happen entirely in the browser; the app does not upload the file and does
not use browser autosave.

## Version 1

A version 1 file is UTF-8 JSON with this top-level shape:

```json
{
  "format": "family-tree-poster-project",
  "version": 1,
  "tree": {
    "people": [{ "id": "amina", "displayName": "أمينة" }],
    "relationships": []
  },
  "positions": {
    "amina": { "x": 120.5, "y": 80 }
  },
  "hiddenItemIds": [],
  "displayOverrides": {
    "amina": { "displayName": "Amina" }
  },
  "page": {
    "paper": "A3",
    "widthMm": 420,
    "heightMm": 297,
    "orientation": "landscape",
    "marginsMm": { "top": 12, "right": 12, "bottom": 12, "left": 12 },
    "bleedMm": 0
  },
  "style": {
    "chart": "box",
    "theme": "classic-gold"
  },
  "posterContent": []
}
```

The required editable state is:

- `tree`: source people and relationships. Fields added by an importer are kept.
- `positions`: page-space positions keyed by stable item ID. Coordinates are
  numbers measured in millimetres.
- `hiddenItemIds`: hidden people, relationships, or poster items. Hidden items
  remain in the project data.
- `displayOverrides`: per-item display changes, kept separate from source data.
- `page`: paper dimensions, orientation, margins, and bleed.
- `style`: chart style and decorative theme configuration.
- `posterContent`: user-added items, including text and embedded image data.
  Every item has a stable `id`, `type`, position, width, and height.

All additional JSON properties in these objects are retained on round-trip.
Image content should be embedded in the file as a data value rather than loaded
from a network location.

## Validation and versions

The format identifier and version are required. The app rejects malformed JSON,
missing state, invalid required values, wrong format identifiers, and versions
it does not support. An invalid file never replaces the project already open in
memory.

Versioning is explicit so a future reader can migrate older structures before
loading them. Version 1 files must be opened with the version 1 schema; unknown
versions are reported instead of being partially imported.
