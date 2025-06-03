import { useMemo, useReducer, useEffect, useState } from 'react'
import ELK from 'elkjs/lib/elk.bundled.js'

const BASE_HEIGHT = 140
const LINE_HEIGHT = 22

function countExtraFields(employee) {
  return Object.entries(employee).filter(([key, val]) =>
    key !== 'Name Surname' &&
    key !== 'Job Title' &&
    key !== 'Manager' &&
    key !== 'children' &&
    typeof val === 'string' &&
    val.trim() !== '' &&
    val !== 'N/A'
  ).length
}

function getNodeHeight(employee) {
  return BASE_HEIGHT + countExtraFields(employee) * LINE_HEIGHT
}

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
  const [manualPositions, setManualPositions] = useState({})
  const [controls, setControls] = useState(null)

  const toggleNode = id => {
    setCollapsed({ [id]: !collapsed[id] })
  }

  const { nodes, edges } = useMemo(() => {
    const n = []
    const e = []

    const traverse = (emp, parentId, fromOrphanRoot) => {
      const id = emp.fullName
      const isCollapsed = collapsed[id]
      n.push({
        id,
        type: 'employee',
        position: { x: 0, y: 0 },
        width: 220,
        height: getNodeHeight(emp),
        draggable: true,
        data: { emp, collapsed: isCollapsed, toggle: () => toggleNode(id), fromOrphanRoot }
      })
      if (parentId) {
        e.push({ id: `${parentId}-${id}`, source: parentId, target: id })
      }
      if (!isCollapsed) {
        emp.children.forEach(c => traverse(c, id, fromOrphanRoot))
      }
    }

    roots.forEach(r => traverse(r, null, r.noManager))

    return { nodes: n, edges: e }
  }, [roots, collapsed])

  useEffect(() => {
    const elk = new ELK()
    const layout = async () => {
      const verticalSpacing = 100
      const horizontalSpacing = Math.max(window.innerWidth * 0.05, 60)
      const graphDef = {
        id: 'root',
        layoutOptions: {
          'elk.algorithm': 'layered',
          'elk.direction': 'DOWN',
          'spacing.nodeNode': '100',
          'elk.spacing.nodeNodeBetweenLayers': verticalSpacing,
          'elk.spacing.nodeNode': horizontalSpacing
        },
        children: nodes.map(n => ({
          id: n.id,
          width: 220,
          height: getNodeHeight(n.data.emp)
        })),
        edges: edges.map(e => ({ id: e.id, sources: [e.source], targets: [e.target] }))
      }
      try {
        const res = await elk.layout(graphDef)
        const positions = {}
        res.children?.forEach(c => { positions[c.id] = { x: c.x, y: c.y } })

        // Find max X among nodes that are not part of an orphan tree
        let maxX = 0
        res.children?.forEach(c => {
          const node = nodes.find(n => n.id === c.id)
          if (node && !node.data.fromOrphanRoot) {
            if (c.x > maxX) maxX = c.x
          }
        })
        const offset = horizontalSpacing * 5

        setGraph({
          nodes: nodes.map(n => {
            let pos = positions[n.id] || { x: 0, y: 0 }
            if (manualPositions[n.id]) {
              pos = manualPositions[n.id]
            } else if (n.data.fromOrphanRoot) {
              pos = { x: maxX + offset + pos.x, y: pos.y }
            }
            return { ...n, position: pos }
          }),
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

  const updatePosition = (id, pos) => {
    setManualPositions(p => ({ ...p, [id]: pos }))
    setGraph(g => ({
      nodes: g.nodes.map(n => n.id === id ? { ...n, position: pos } : n),
      edges: g.edges
    }))
  }

  return {
    map,
    roots,
    orphans,
    collapsed,
    nodes: graph.nodes,
    edges: graph.edges,
    toggleNode,
    expandAll,
    collapseAll,
    updatePosition,
    controls,
    setControls
  }
}
