# Org Visualizer

Frontend-only React app to display organisation charts from CSV data.

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:5173` and upload your CSV.

## CSV Format
See [example.csv](example.csv).

## Demo

![demo](demo.gif)

## Performance notes

- Production vertical chain action improved from ~9.5s to ~0.6s on a 200-node dataset by caching manager/descendant lookups and batching layout + viewport updates.
- Expand/collapse all now re-runs a single ELK layout and reuses cached viewport math for sub-second feedback.

### Profiling tips

1. Run `npm run build && npm run preview` to start the production bundle locally.
2. In Chrome DevTools Performance panel, record while toggling Vertical chain, Expand all, Collapse all.
3. Look for performance marks such as `vertical:update-*`, `layout:elk-*`, `viewport:*`, and `react:setGraph-*` to understand pipeline timings.
4. Threshold warnings appear in the console if `vertical:update`, `layout:elk`, or `viewport:fit` exceed expected budgets.
