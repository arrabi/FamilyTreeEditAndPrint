# Simple family-tree JSON format

The importer reads UTF-8 JSON with a `people` array and a `families` array. IDs
are local identifiers; every parent or child reference must match a person ID.
Duplicate IDs and missing references are reported as errors.

```json
{
  "format": "family-tree-edit-and-print",
  "version": 1,
  "people": [
    {
      "id": "p1",
      "names": {
        "arabic": "يوسف حداد",
        "english": "Yusuf Haddad"
      }
    },
    {
      "id": "p2",
      "names": {
        "english": "Layla Haddad"
      }
    }
  ],
  "families": [
    {
      "id": "f1",
      "parents": ["p1"],
      "children": ["p2"]
    }
  ]
}
```

Each person must have at least one non-empty `names.arabic` or `names.english`
value. `parents` and `children` may be empty arrays. Unknown top-level fields
are allowed so exporters can add metadata. Family relationship direction is
the direction used for descendants charts.

The bundled `public/fixtures/haddad-family.json` is fictional test data with
146 people across five generations. It contains both Arabic and English names.
