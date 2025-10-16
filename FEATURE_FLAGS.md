# Feature Flags

This application includes feature flags to control development and debugging tools in production builds.

## Available Feature Flags

### Performance Tracking & Diagnostic Logging

**Default:** Disabled in production, enabled in development

These flags control:
- Performance tracking (perfTracker)
- Diagnostic console logging
- Performance report buttons (📊 and 💾)

## How to Enable in Production

### Option 1: Environment Variable (Build Time)

Set the environment variable before building:

```bash
# Enable performance tracking
VITE_ENABLE_PERF_TRACKING=true npm run build

# Enable diagnostic logging
VITE_ENABLE_DIAGNOSTIC_LOGS=true npm run build

# Enable both
VITE_ENABLE_PERF_TRACKING=true VITE_ENABLE_DIAGNOSTIC_LOGS=true npm run build
```

### Option 2: .env File

Create a `.env.production` file in the project root:

```bash
VITE_ENABLE_PERF_TRACKING=true
VITE_ENABLE_DIAGNOSTIC_LOGS=true
```

Then build normally:

```bash
npm run build
```

## What Gets Disabled in Production?

When flags are disabled (default production behavior):

1. **No Performance Tracking**
   - `perfTracker.start()` does nothing
   - `perfTracker.end()` does nothing
   - `perfTracker.trackPageLoad()` does nothing
   - Performance report buttons are hidden from UI

2. **No Diagnostic Logging**
   - `devLog()` calls are silent
   - `devWarn()` calls are silent
   - `devError()` calls are silent
   - Console messages like "🔄 [Graph Prepared]" are suppressed

3. **Benefits**
   - Cleaner production console
   - Slightly smaller bundle (tree-shaking)
   - No performance measurement overhead
   - Better privacy (no telemetry)

## Development Mode

In development mode (`npm run dev`), all flags are **automatically enabled** regardless of environment variables.

## Implementation Details

- Feature flags are defined in `src/utils/featureFlags.js`
- Flags use Vite's `import.meta.env` for build-time configuration
- Dead code elimination (tree-shaking) removes disabled features from production bundles

## Examples

### Enable for Production Debugging

If you need to debug performance issues on production:

```bash
# Build with performance tracking enabled
VITE_ENABLE_PERF_TRACKING=true npm run build

# Deploy and test
# The 📊 and 💾 buttons will appear in the toolbar
# Console will show diagnostic messages
```

### Test Production Bundle Locally

```bash
# Build without flags (production default)
npm run build

# Serve and verify no console output
npm run preview
```

## Related Files

- `src/utils/featureFlags.js` - Feature flag definitions
- `src/utils/perfTracker.js` - Performance tracking (wrapped with flags)
- `src/hooks/useOrgChart.js` - Uses `devLog()` instead of `console.log()`
- `src/components/Toolbar.jsx` - Performance buttons conditionally rendered
- `src/main.jsx` - Initial load tracking (wrapped with flags)

