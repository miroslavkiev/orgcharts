/*
  Unregister any existing service workers to avoid stale caches on static hosting.
  This script is intended to be imported in production only.
*/
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    navigator.serviceWorker.getRegistrations?.().then(regs => {
      regs.forEach(r => r.unregister())
    })
  } catch (_) {
    // ignore
  }
}



