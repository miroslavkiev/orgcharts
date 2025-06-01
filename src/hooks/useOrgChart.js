import { useMemo, useReducer, useEffect, useState } from 'react'
import ELK from 'elkjs/lib/elk.bundled.js'

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

  const [graph, setGraph] = useState({ nodes: [], edges: [] })

  const toggleNode = id => {
    setCollapsed({ [id]: !collapsed[id] })
  }

  const { nodes, edges } = useMemo(() => {
    const n = []
    const e = []

    const traverse = (emp, parentId) => {
      const id = emp.fullName
      const isCollapsed = collapsed[id]
      n.push({
        id,
        type: 'employee',
        position: { x: 0, y: 0 },
        data: { emp, collapsed: isCollapsed, toggle: () => toggleNode(id) }
      })
      if (parentId) {
        e.push({ id: `${parentId}-${id}`, source: parentId, target: id })
      }
      if (!isCollapsed) {
        emp.children.forEach(c => traverse(c, id))
      }
    }

    roots.forEach(r => traverse(r, null))

    return { nodes: n, edges: e }
  }, [roots, collapsed])

  useEffect(() => {
    const elk = new ELK()
    const layout = async () => {
      const graphDef = {
        id: 'root',
        layoutOptions: { 'elk.algorithm': 'layered' },
        children: nodes.map(n => ({ id: n.id, width: 180, height: 120 })),
        edges: edges.map(e => ({ id: e.id, sources: [e.source], targets: [e.target] }))
      }
      try {
        const res = await elk.layout(graphDef)
        const positions = {}
        res.children?.forEach(c => { positions[c.id] = { x: c.x, y: c.y } })
        setGraph({
          nodes: nodes.map(n => ({ ...n, position: positions[n.id] || { x: 0, y: 0 } })),
          edges
        })
      } catch (err) {
        setGraph({ nodes, edges })
      }
    }
    layout()
  }, [nodes, edges])

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

  return { map, roots, orphans, collapsed, nodes: graph.nodes, edges: graph.edges, toggleNode, expandAll, collapseAll }
}
