import { unstable_batchedUpdates } from 'react-dom'

export function batchUpdates(fn) {
  if (typeof unstable_batchedUpdates === 'function') {
    unstable_batchedUpdates(fn)
  } else {
    fn()
  }
}
