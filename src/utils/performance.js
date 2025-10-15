let measureCounter = 0
const thresholds = new Map()

function hasPerformanceAPI() {
  return typeof performance !== 'undefined' && typeof performance.mark === 'function' && typeof performance.measure === 'function'
}

export function setPerformanceThreshold(name, threshold) {
  thresholds.set(name, threshold)
}

export function markPoint(name) {
  if (!hasPerformanceAPI()) return
  performance.mark(name)
}

export function measurePerformance(name, fn) {
  if (!hasPerformanceAPI()) {
    return fn()
  }

  const id = `${name}-${measureCounter += 1}`
  const start = `${id}-start`
  performance.mark(start)

  const finalize = () => {
    const end = `${id}-end`
    performance.mark(end)
    performance.measure(id, start, end)
    const entries = performance.getEntriesByName(id)
    const entry = entries[entries.length - 1]
    if (entry && thresholds.has(name) && entry.duration > thresholds.get(name)) {
      console.warn(`[perf] ${name} took ${entry.duration.toFixed(2)}ms (threshold ${thresholds.get(name)}ms)`) // eslint-disable-line no-console
    }
    performance.clearMarks(start)
    performance.clearMarks(end)
  }

  try {
    const result = fn()
    if (result && typeof result.then === 'function') {
      return result.finally(() => {
        finalize()
      })
    }
    finalize()
    return result
  } catch (err) {
    finalize()
    throw err
  }
}
