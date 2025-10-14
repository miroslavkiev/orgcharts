import { useMemo, useReducer, useEffect, useState, useCallback } from 'react'
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

  const [collapsed, dispatchCollapsed] = useReducer((state, action) => {
    if (typeof action === 'function') {
      return action(state)
    }
    if (action && action.__replace) {
      return action.value || {}
    }
    return { ...state, ...action }
  }, {})

  const setCollapsed = updates => {
    dispatchCollapsed(updates)
  }

  const [graph, setGraph] = useState({ nodes: [], edges: [] })
  const [manualPositions, setManualPositions] = useState({})
  const [controls, setControls] = useState(null)
  const [lastClickedEmployeeId, setLastClickedEmployeeId] = useState(null)
  const [verticalMode, setVerticalMode] = useState(false)
  const [preVerticalState, setPreVerticalState] = useState(null)
  const [verticalAllowedIds, setVerticalAllowedIds] = useState(null)
  const [verticalFocusId, setVerticalFocusId] = useState(null)

  const selectEmployee = useCallback(id => {
    if (!id) return
    setLastClickedEmployeeId(id)
  }, [])

  const allowedIdsSet = useMemo(() => {
    if (!verticalAllowedIds) return null
    return new Set(verticalAllowedIds)
  }, [verticalAllowedIds])

  const toggleNode = id => {
    setCollapsed({ [id]: !collapsed[id] })
  }

  const getManagersPath = useCallback(id => {
    const path = []
    let currentId = id
    while (currentId) {
      path.push(currentId)
      const employee = map.get(currentId)
      if (!employee) break
      currentId = employee['Manager']?.trim()
    }
    return path
  }, [map])

  const getDescendants = useCallback(id => {
    const employee = map.get(id)
    if (!employee) return []
    const collected = []
    const stack = [employee]
    while (stack.length > 0) {
      const current = stack.pop()
      if (!current) continue
      collected.push(current.fullName)
      current.children?.forEach(child => {
        stack.push(child)
      })
    }
    return collected
  }, [map])

  const updateVerticalAllowed = useCallback(id => {
    if (!id) return
    const path = getManagersPath(id)
    const descendants = getDescendants(id)
    const allowed = new Set([...path, ...descendants])
    const updates = {}
    allowed.forEach(nodeId => {
      updates[nodeId] = false
    })
    if (allowed.size > 0) {
      setCollapsed(updates)
      setVerticalAllowedIds(Array.from(allowed))
      setVerticalFocusId(id)
    }
  }, [getDescendants, getManagersPath, setCollapsed])

  const enterVerticalMode = useCallback(id => {
    if (!id) return
    setPreVerticalState(prev => (prev === null ? { ...collapsed } : prev))
    setVerticalMode(true)
    updateVerticalAllowed(id)
  }, [collapsed, updateVerticalAllowed])

  const exitVerticalMode = useCallback(() => {
    if (!verticalMode) return
    if (preVerticalState) {
      dispatchCollapsed({ __replace: true, value: preVerticalState })
    }
    setVerticalAllowedIds(null)
    setVerticalMode(false)
    setPreVerticalState(null)
    setVerticalFocusId(null)
  }, [preVerticalState, verticalMode])

  useEffect(() => {
    if (verticalMode && lastClickedEmployeeId) {
      updateVerticalAllowed(lastClickedEmployeeId)
    }
  }, [lastClickedEmployeeId, updateVerticalAllowed, verticalMode])

  useEffect(() => {
    if (verticalMode && verticalFocusId) {
      if (!map.has(verticalFocusId)) {
        exitVerticalMode()
      } else {
        updateVerticalAllowed(verticalFocusId)
      }
    }
  }, [exitVerticalMode, map, updateVerticalAllowed, verticalFocusId, verticalMode])

  useEffect(() => {
    if (lastClickedEmployeeId && !map.has(lastClickedEmployeeId)) {
      setLastClickedEmployeeId(null)
    }
  }, [lastClickedEmployeeId, map])

  useEffect(() => {
    setLastClickedEmployeeId(null)
    setVerticalMode(false)
    setPreVerticalState(null)
    setVerticalAllowedIds(null)
    setVerticalFocusId(null)
  }, [rows])

  const { nodes, edges } = useMemo(() => {
    const n = []
    const e = []

    const traverse = (emp, parentId, fromOrphanRoot) => {
      const id = emp.fullName
      if (verticalMode && allowedIdsSet && !allowedIdsSet.has(id)) {
        return
      }
      const isCollapsed = verticalMode ? false : collapsed[id]
      n.push({
        id,
        type: 'employee',
        position: { x: 0, y: 0 },
        width: 220,
        height: getNodeHeight(emp),
        draggable: true,
        data: {
          emp,
          collapsed: isCollapsed,
          toggle: () => toggleNode(id),
          fromOrphanRoot,
          select: () => selectEmployee(id)
        }
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
  }, [roots, collapsed, verticalMode, allowedIdsSet, toggleNode, selectEmployee])

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

  const focusEmployee = useCallback(query => {
    if (!query) return false

    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return false

    const allNames = Array.from(map.keys())
    const exactMatch = allNames.find(name => name.toLowerCase() === normalizedQuery)
    const partialMatch = allNames.find(name => name.toLowerCase().includes(normalizedQuery))
    const targetName = exactMatch || partialMatch

    if (!targetName) return false

    const employee = map.get(targetName)
    if (!employee) return false

    const updates = {}
    let currentManager = employee['Manager']?.trim()
    while (currentManager) {
      updates[currentManager] = false
      const manager = map.get(currentManager)
      currentManager = manager?.['Manager']?.trim()
    }
    if (Object.keys(updates).length > 0) {
      setCollapsed(updates)
    }

    const focus = () => {
      const node = graph.nodes.find(n => n.id === targetName)
      if (!node || !controls) return false
      controls.fitView({ nodes: [node], padding: 0.4, duration: 800 })
      return true
    }

    if (!focus()) {
      setTimeout(() => {
        focus()
      }, 100)
    }

    return true
  }, [map, graph.nodes, controls])

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
    setControls,
    focusEmployee,
    lastClickedEmployeeId,
    selectEmployee,
    verticalMode,
    enterVerticalMode,
    exitVerticalMode,
    verticalFocusId
  }
}
