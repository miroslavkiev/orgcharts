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
      if (mgr) mgr.children.push(emp)
      else orphans.push(emp)
    } else {
      roots.push(emp)
    }
  })

  return { map, roots, orphans }
}

export default function useOrgChart(rows) {
  const [{ map, roots, orphans }, dispatch] = useMemo(() => buildForest(rows), [rows])

  const [ui, setUi] = useReducer((s, a) => ({ ...s, ...a }), {})

  const expandAll = () => {
    const updates = {}
    map.forEach((_, k) => { updates[k] = true })
    setUi(updates)
  }

  const collapseAll = () => {
    const updates = {}
    map.forEach((_, k) => { updates[k] = false })
    setUi(updates)
  }

  return { map, roots, orphans, ui, setUi, expandAll, collapseAll }
}
