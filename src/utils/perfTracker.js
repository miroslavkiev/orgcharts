/**
 * Lightweight Performance Tracker
 * Tracks key metrics during app lifecycle and vertical chain execution
 */

class PerfTracker {
  constructor() {
    this.metrics = {
      initialLoad: {},
      verticalChain: [],
      layoutOperations: [],
      metadata: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 'unknown',
        deviceMemory: typeof navigator !== 'undefined' ? navigator.deviceMemory : 'unknown',
        timestamp: new Date().toISOString()
      }
    }
    this.marks = new Map()
  }

  // Mark start of an operation
  start(operation) {
    if (typeof performance === 'undefined') return
    const markName = `${operation}-start`
    performance.mark(markName)
    this.marks.set(operation, markName)
  }

  // Mark end of operation and record duration
  end(operation, metadata = {}) {
    if (typeof performance === 'undefined') return
    
    const startMark = this.marks.get(operation)
    if (!startMark) {
      console.warn(`[PerfTracker] No start mark for operation: ${operation}`)
      return
    }

    const endMark = `${operation}-end`
    performance.mark(endMark)
    
    try {
      const measureName = `${operation}-measure`
      performance.measure(measureName, startMark, endMark)
      const measure = performance.getEntriesByName(measureName)[0]
      
      const record = {
        operation,
        duration: Math.round(measure.duration * 100) / 100, // Round to 2 decimals
        timestamp: Date.now(),
        ...metadata
      }

      // Store in appropriate category
      if (operation.startsWith('initial-')) {
        this.metrics.initialLoad[operation] = record
      } else if (operation.includes('vertical')) {
        this.metrics.verticalChain.push(record)
      } else if (operation.includes('layout') || operation.includes('elk')) {
        this.metrics.layoutOperations.push(record)
      }

      // Cleanup
      performance.clearMarks(startMark)
      performance.clearMarks(endMark)
      performance.clearMeasures(measureName)
      this.marks.delete(operation)

      return record
    } catch (err) {
      console.warn('[PerfTracker] Measure failed:', err)
    }
  }

  // Track initial page load metrics
  trackPageLoad() {
    if (typeof performance === 'undefined' || !performance.timing) return

    const timing = performance.timing
    const navigation = performance.getEntriesByType('navigation')[0]

    this.metrics.initialLoad = {
      ...this.metrics.initialLoad,
      'initial-dns': timing.domainLookupEnd - timing.domainLookupStart,
      'initial-tcp': timing.connectEnd - timing.connectStart,
      'initial-request': timing.responseStart - timing.requestStart,
      'initial-response': timing.responseEnd - timing.responseStart,
      'initial-domParsing': timing.domInteractive - timing.domLoading,
      'initial-domComplete': timing.domComplete - timing.domLoading,
      'initial-loadComplete': timing.loadEventEnd - timing.navigationStart,
      'initial-domContentLoaded': timing.domContentLoadedEventEnd - timing.navigationStart
    }

    if (navigation) {
      this.metrics.initialLoad['initial-transferSize'] = navigation.transferSize || 0
      this.metrics.initialLoad['initial-domainLookupTime'] = navigation.domainLookupEnd - navigation.domainLookupStart
    }
  }

  // Get summary statistics for an operation type
  getSummary(operationType = 'verticalChain') {
    const operations = this.metrics[operationType]
    if (!Array.isArray(operations) || operations.length === 0) {
      return null
    }

    const durations = operations.map(op => op.duration)
    durations.sort((a, b) => a - b)

    return {
      count: durations.length,
      min: durations[0],
      max: durations[durations.length - 1],
      mean: durations.reduce((a, b) => a + b, 0) / durations.length,
      median: durations[Math.floor(durations.length / 2)],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)]
    }
  }

  // Generate human-readable report
  getReport() {
    const verticalSummary = this.getSummary('verticalChain')
    const layoutSummary = this.getSummary('layoutOperations')

    const report = {
      metadata: this.metrics.metadata,
      initialLoad: this.metrics.initialLoad,
      verticalChain: {
        summary: verticalSummary,
        operations: this.metrics.verticalChain
      },
      layout: {
        summary: layoutSummary,
        operations: this.metrics.layoutOperations
      }
    }

    return report
  }

  // Export as JSON for baseline comparison
  exportJSON() {
    return JSON.stringify(this.getReport(), null, 2)
  }

  // Log report to console
  logReport() {
    const report = this.getReport()
    
    console.group('📊 Performance Report')
    
    console.group('🖥️ Environment')
    console.log('User Agent:', report.metadata.userAgent)
    console.log('CPU Cores:', report.metadata.hardwareConcurrency)
    console.log('Memory:', report.metadata.deviceMemory, 'GB')
    console.log('Timestamp:', report.metadata.timestamp)
    console.groupEnd()

    console.group('⚡ Initial Load')
    Object.entries(report.initialLoad).forEach(([key, value]) => {
      if (typeof value === 'object' && value.duration !== undefined) {
        console.log(`${key}: ${value.duration}ms`)
      } else if (typeof value === 'number') {
        console.log(`${key}: ${value}ms`)
      }
    })
    console.groupEnd()

    if (report.verticalChain.summary) {
      console.group('🔗 Vertical Chain Performance')
      const vs = report.verticalChain.summary
      console.log(`Executions: ${vs.count}`)
      console.log(`Min: ${vs.min.toFixed(2)}ms`)
      console.log(`Max: ${vs.max.toFixed(2)}ms`)
      console.log(`Mean: ${vs.mean.toFixed(2)}ms`)
      console.log(`Median: ${vs.median.toFixed(2)}ms`)
      console.log(`95th percentile: ${vs.p95.toFixed(2)}ms`)
      console.groupEnd()
    }

    if (report.layout.summary) {
      console.group('📐 Layout Operations')
      const ls = report.layout.summary
      console.log(`Operations: ${ls.count}`)
      console.log(`Min: ${ls.min.toFixed(2)}ms`)
      console.log(`Max: ${ls.max.toFixed(2)}ms`)
      console.log(`Mean: ${ls.mean.toFixed(2)}ms`)
      console.log(`Median: ${ls.median.toFixed(2)}ms`)
      console.groupEnd()
    }

    console.groupEnd()

    // Also log as JSON for easy copy-paste
    console.log('📋 Copy baseline data:', this.exportJSON())
  }

  // Download report as JSON file
  downloadReport(filename = 'perf-baseline.json') {
    const json = this.exportJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  // Reset all metrics
  reset() {
    this.metrics = {
      initialLoad: {},
      verticalChain: [],
      layoutOperations: [],
      metadata: {
        ...this.metrics.metadata,
        resetAt: new Date().toISOString()
      }
    }
    this.marks.clear()
  }
}

// Create singleton instance
const perfTracker = new PerfTracker()

// Make it globally accessible for debugging
if (typeof window !== 'undefined') {
  window.perfTracker = perfTracker
}

export default perfTracker

