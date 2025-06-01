import { useMemo, useReducer } from 'react'

function buildForest(rows) {
  const map = new Map()
  const roots = []
  const orphans = []

  rows.forEach(r => {
    const fullName = r['Name Surname']?.trim()
    if (!fullName) return
    map.set(fullName, { ...r, fullName, children: [] })
  })

  map.forEach(emp => {
    const mgrName = emp['Manager']?.trim()
    if (mgrName) {
      const mgr = map.get(mgrName)
      if (mgr) {
        mgr.children.push(emp)
      } else {
        emp.noManager = true
        orphans.push(emp)
        roots.push(emp)
      }
    } else {
      roots.push(emp)
    }
  })

  return { map, roots, orphans }
}

export default function useOrgChart(rows) {
  const { map, roots, orphans } = useMemo(() => buildForest(rows), [rows])

  const [collapsed, setCollapsed] = useReducer((s, a) => ({ ...s, ...a }), {})

  const toggleNode = id => {
    setCollapsed({ [id]: !collapsed[id] })
  }

  const expandAll = () => {
    const updates = {}
    map.forEach((_, k) => { updates[k] = false })
    setCollapsed(updates)
  }

  const collapseAll = () => {
    const updates = {}
    map.forEach((_, k) => { updates[k] = true })
    setCollapsed(updates)
  }

  return { map, roots, orphans, collapsed, toggleNode, expandAll, collapseAll }
}
