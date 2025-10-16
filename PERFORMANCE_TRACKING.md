# Performance Tracking Guide

## Overview

The app includes a lightweight performance tracker to measure and compare performance between different implementations (e.g., main thread vs Web Workers).

## Features

- ⚡ Tracks initial page load metrics
- 🔗 Tracks "Vertical Chain" operation duration
- 📐 Tracks ELK layout algorithm execution time
- 📊 Generates statistical summaries (min, max, mean, median, p95, p99)
- 💾 Export baseline data as JSON for comparison
- 🖥️ Captures environment metadata (CPU, memory, browser)

## How to Use

### 1. Run the Production Build

```bash
npm run build
node scripts/server.js
```

Open: `http://localhost:4173/orgchart/`

### 2. Load Your CSV Data

Upload your organization chart CSV file.

### 3. Execute Vertical Chain Function

1. Click on any employee card
2. Click the **"Vertical chain"** button in the toolbar
3. The performance tracker will automatically measure the execution time

### 4. View Performance Report

Click the **📊 (chart icon)** button in the toolbar to view the performance report in the console.

The report includes:
- **Environment**: User agent, CPU cores, memory
- **Initial Load**: DNS, TCP, DOM parsing times
- **Vertical Chain**: Min, max, mean, median, 95th and 99th percentile times
- **Layout Operations**: ELK layout algorithm statistics

### 5. Download Baseline Data

Click the **💾 (save icon)** button to download the performance data as JSON:
- File name: `perf-baseline.json`
- Use this as baseline for comparing with future optimizations

### 6. Alternative: Console Access

You can also access the tracker directly in the console:

```javascript
// View report
window.perfTracker.logReport()

// Get raw data
window.perfTracker.getReport()

// Download report
window.perfTracker.downloadReport('my-baseline.json')

// Export as JSON string
window.perfTracker.exportJSON()

// Reset all metrics
window.perfTracker.reset()
```

## Understanding the Metrics

### Vertical Chain Complete
**What it measures:** The total time from clicking "Vertical chain" button to completion, including:
- Computing allowed nodes (managers + descendants)
- Updating collapsed state
- Re-running ELK layout
- Updating viewport

**Expected baseline:** ~600ms - ~1000ms for 200 nodes (on Apple Silicon)

### Layout ELK
**What it measures:** Pure ELK layout algorithm execution time
- Graph layout computation
- Node positioning
- Edge routing

**Expected baseline:** ~400ms - ~600ms for 200 nodes

### Vertical Update
**What it measures:** Time to compute vertical chain allowed nodes
- Manager path traversal
- Descendant collection
- State updates

**Expected baseline:** ~20ms - ~50ms for typical chains

## Comparison Workflow

### Step 1: Establish Baseline (Current - Main Thread)

1. Run production build
2. Load your CSV
3. Execute vertical chain 5-10 times
4. Click 📊 to view report
5. Click 💾 to download `perf-baseline.json`

### Step 2: Implement Web Workers

After implementing Web Workers:

1. Rebuild: `npm run build`
2. Run: `node scripts/server.js`
3. Load same CSV
4. Execute vertical chain 5-10 times
5. Click 📊 to view report
6. Click 💾 to download `perf-webworkers.json`

### Step 3: Compare Results

Compare the two JSON files:
```javascript
const baseline = require('./perf-baseline.json')
const webworkers = require('./perf-webworkers.json')

console.log('Baseline Mean:', baseline.verticalChain.summary.mean)
console.log('WebWorkers Mean:', webworkers.verticalChain.summary.mean)
console.log('Improvement:', ((baseline.verticalChain.summary.mean - webworkers.verticalChain.summary.mean) / baseline.verticalChain.summary.mean * 100).toFixed(1) + '%')
```

## Key Metrics to Compare

1. **verticalChain.summary.mean** - Average execution time
2. **verticalChain.summary.median** - Median execution time (less affected by outliers)
3. **verticalChain.summary.p95** - 95th percentile (represents typical "slow" case)
4. **layout.summary.mean** - ELK layout performance

## Tips

- **Multiple runs**: Execute vertical chain 5-10 times to get stable statistics
- **Same dataset**: Use the same CSV file for fair comparison
- **Same browser**: Test in the same browser and version
- **Close DevTools**: Performance can be 3-10x slower with DevTools open
- **Disable extensions**: React DevTools can add 2-5x overhead

## Troubleshooting

### Performance report shows no data
- Make sure you've clicked "Vertical chain" at least once
- Check console for any errors

### Inconsistent results
- Close browser DevTools (adds overhead)
- Disable browser extensions (especially React DevTools)
- Check CPU throttling in DevTools Performance tab
- Ensure browser isn't in battery saver mode

### Very slow performance (>5 seconds)
Check:
1. DevTools open? Close it
2. CPU throttling enabled? Disable it (DevTools → Performance → ⚙️)
3. React DevTools extension active? Disable or use incognito
4. Different browser? Try Chrome for most accurate results

## Environment Differences

The tracker automatically captures:
- **hardwareConcurrency**: Number of CPU cores
- **deviceMemory**: Available memory (GB)
- **userAgent**: Browser and OS information

This helps explain performance differences between environments (local vs deployed).

