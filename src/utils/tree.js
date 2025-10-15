import { measurePerformance } from './performance'

function normalizeValue(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function registerChild(childrenById, parentId, childId) {
  const existing = childrenById.get(parentId)
  if (existing) {
    existing.push(childId)
  } else {
    childrenById.set(parentId, [childId])
  }
}

export function buildForest(rows) {
  return measurePerformance('data:buildForest', () => {
    const map = new Map()
    const roots = []
    const orphans = []
    const parentById = new Map()
    const childrenById = new Map()

    rows.forEach(r => {
      const fullName = normalizeValue(r['Name Surname'])
      if (!fullName) return
      map.set(fullName, { ...r, fullName, children: [] })
    })

    map.forEach(emp => {
      const mgrName = normalizeValue(emp['Manager'])
      if (mgrName && map.has(mgrName)) {
        const manager = map.get(mgrName)
        manager.children.push(emp)
        registerChild(childrenById, mgrName, emp.fullName)
        parentById.set(emp.fullName, mgrName)
      } else {
        if (mgrName && !map.has(mgrName)) {
          emp.noManager = true
          orphans.push(emp)
        }
        roots.push(emp)
        parentById.set(emp.fullName, null)
      }
      if (!childrenById.has(emp.fullName)) {
        childrenById.set(emp.fullName, [])
      }
    })

    const signature = Symbol('forest')

    return { map, roots, orphans, parentById, childrenById, signature }
  })
}

export function computeManagersPath(id, parentById) {
  return measurePerformance('vertical:managersPath', () => {
    const path = []
    const visited = new Set()
    let currentId = id
    while (currentId && !visited.has(currentId)) {
      path.push(currentId)
      visited.add(currentId)
      currentId = parentById.get(currentId) ?? null
    }
    if (currentId && visited.has(currentId)) {
      console.warn('[org] Detected potential management cycle at', currentId)
    }
    return path
  })
}

export function collectDescendants(id, childrenById) {
  return measurePerformance('vertical:descendants', () => {
    if (!childrenById.has(id)) return []
    const collected = []
    const queue = [id]
    while (queue.length > 0) {
      const current = queue.shift()
      if (!current) continue
      collected.push(current)
      const children = childrenById.get(current)
      if (children && children.length > 0) {
        for (let i = 0; i < children.length; i += 1) {
          queue.push(children[i])
        }
      }
    }
    return collected
  })
}
