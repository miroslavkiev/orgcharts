/**
 * Feature Flags for Development Tools
 * These should be disabled in production builds
 */

// Enable performance tracking and diagnostic logging
// Set to false for production or use environment variable
export const ENABLE_PERFORMANCE_TRACKING = import.meta.env.DEV || 
  import.meta.env.VITE_ENABLE_PERF_TRACKING === 'true'

export const ENABLE_DIAGNOSTIC_LOGGING = import.meta.env.DEV || 
  import.meta.env.VITE_ENABLE_DIAGNOSTIC_LOGS === 'true'

// Helper to conditionally log
export const devLog = (...args) => {
  if (ENABLE_DIAGNOSTIC_LOGGING) {
    console.log(...args)
  }
}

export const devWarn = (...args) => {
  if (ENABLE_DIAGNOSTIC_LOGGING) {
    console.warn(...args)
  }
}

export const devError = (...args) => {
  if (ENABLE_DIAGNOSTIC_LOGGING) {
    console.error(...args)
  }
}

