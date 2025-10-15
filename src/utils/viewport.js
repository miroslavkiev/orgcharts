import { measurePerformance } from './performance'

export function waitForLayoutFrame() {
  if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
    return Promise.resolve()
  }
  return new Promise(resolve => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        resolve()
      })
    })
  })
}

export function measureViewportUpdate(name, fn) {
  return measurePerformance(`viewport:${name}`, fn)
}
