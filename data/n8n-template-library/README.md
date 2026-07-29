# n8n template library mirror

Run the resumable downloader from the `ModelFlow_nextJS` directory:

```bash
npm run import:n8n-library
```

By default it downloads public free listings only. It writes native workflow
JSON to `workflows/<template-id>.json` and keeps catalog/source attribution in:

- `catalog-all.json`
- `catalog-selected.json`
- `manifest.json`
- `summary.json`

Existing valid workflow files are skipped, so interrupted downloads can be
resumed by running the same command again.

For a small test:

```bash
npm run import:n8n-library -- --limit 20
```

Paid catalog listings are excluded unless `--include-paid` is passed explicitly.
