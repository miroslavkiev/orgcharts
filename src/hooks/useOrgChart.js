import { useMemo, useReducer, useEffect, useState, useCallback, useRef } from 'react'
import ELK from 'elkjs/lib/elk.bundled.js'
import { buildForest, computeManagersPath, collectDescendants } from '../utils/tree'
import { batchUpdates } from '../utils/batch'
import { measurePerformance, markPoint, setPerformanceThreshold } from '../utils/performance'
import { measureViewportUpdate, waitForLayoutFrame } from '../utils/viewport'
import perfTracker from '../utils/perfTracker'
import { devLog, ENABLE_PERFORMANCE_TRACKING } from '../utils/featureFlags'

const BASE_HEIGHT = 140
const LINE_HEIGHT = 22

setPerformanceThreshold('vertical:update', 200)
setPerformanceThreshold('layout:elk', 500)
setPerformanceThreshold('viewport:fit', 200)

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

export default function useOrgChart(rows) {
  const { map, roots, orphans, parentById, childrenById, signature } = useMemo(
    () => buildForest(rows),
    [rows]
  )

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
  const [layoutTrigger, setLayoutTrigger] = useState(0)
  const layoutScopeRef = useRef('all')
  const layoutPromiseRef = useRef(null)
  const graphRef = useRef({ nodes: [], edges: [] })
  const manualPositionsRef = useRef({})
  const elkRef = useRef(null)
  const verticalCacheRef = useRef({ id: null, signature: null, allowedArray: null, collapsedUpdates: null })

  useEffect(() => {
    graphRef.current = graph
  }, [graph])

  useEffect(() => {
    manualPositionsRef.current = manualPositions
  }, [manualPositions])

  useEffect(() => {
    verticalCacheRef.current = { id: null, signature, allowedArray: null, collapsedUpdates: null }
  }, [signature])

  const selectEmployee = useCallback(id => {
    if (!id) return
    measurePerformance('selection:change', () => {
      // Toggle selection: if clicking the same employee, deselect it
      setLastClickedEmployeeId(prev => prev === id ? null : id)
    })
  }, [])

  const allowedIdsSet = useMemo(() => {
    if (!verticalAllowedIds) return null
    return new Set(verticalAllowedIds)
  }, [verticalAllowedIds])

  const toggleNode = useCallback(id => {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const getManagersPath = useCallback(id => {
    if (!id) return []
    return computeManagersPath(id, parentById)
  }, [parentById])

  const getDescendants = useCallback(id => {
    if (!id) return []
    return collectDescendants(id, childrenById)
  }, [childrenById])

  const updateVerticalAllowed = useCallback(id => {
    if (!id) return
    let nodeCount = 0
    measurePerformance('vertical:update', () => {
      const cache = verticalCacheRef.current
      const forestSignature = signature
      let allowedArray = cache.allowedArray
      let collapsedUpdates = cache.collapsedUpdates

      if (cache.id !== id || cache.signature !== forestSignature) {
        const path = getManagersPath(id)
        const descendants = getDescendants(id)
        const allowedSet = new Set([...path, ...descendants])
        const updates = {}
        allowedSet.forEach(nodeId => {
          updates[nodeId] = false
        })
        allowedArray = Array.from(allowedSet)
        collapsedUpdates = updates
        verticalCacheRef.current = {
          id,
          signature: forestSignature,
          allowedArray,
          collapsedUpdates
        }
      } else {
        markPoint('vertical:update:cache-hit')
      }

      if (!allowedArray || allowedArray.length === 0) {
        nodeCount = 0
        return
      }

      nodeCount = allowedArray.length
      measurePerformance('vertical:applyVisibility', () => {
        batchUpdates(() => {
          if (collapsedUpdates && Object.keys(collapsedUpdates).length > 0) {
            setCollapsed(collapsedUpdates)
          }
          setVerticalAllowedIds(prev => {
            // Only update if different to prevent unnecessary re-renders
            if (prev && prev.length === allowedArray.length && 
                prev.every((id, i) => id === allowedArray[i])) {
              return prev
            }
            return allowedArray
          })
          setVerticalFocusId(id)
        })
      })
    })
  }, [getDescendants, getManagersPath, setCollapsed, signature])

  const enterVerticalMode = useCallback(id => {
    if (!id) return
    measurePerformance('vertical:enter', () => {
      batchUpdates(() => {
        setPreVerticalState(prev => (prev === null ? { ...collapsed } : prev))
        setVerticalMode(true)
      })
    })
    updateVerticalAllowed(id)
  }, [collapsed, updateVerticalAllowed])

  const exitVerticalMode = useCallback(() => {
    if (!verticalMode) return
    measurePerformance('vertical:exit', () => {
      batchUpdates(() => {
        if (preVerticalState) {
          dispatchCollapsed({ __replace: true, value: preVerticalState })
        }
        setVerticalAllowedIds(null)
        setVerticalMode(false)
        setPreVerticalState(null)
        setVerticalFocusId(null)
      })
    })
  }, [preVerticalState, verticalMode])

  useEffect(() => {
    if (verticalMode && lastClickedEmployeeId) {
      updateVerticalAllowed(lastClickedEmployeeId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastClickedEmployeeId, verticalMode])

  useEffect(() => {
    if (verticalMode && verticalFocusId) {
      if (!map.has(verticalFocusId)) {
        exitVerticalMode()
      } else {
        updateVerticalAllowed(verticalFocusId)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verticalFocusId, verticalMode])

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

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => measurePerformance('layout:prepare', () => {
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
            select: () => selectEmployee(id),
            isSelected: id === lastClickedEmployeeId
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

          markPoint('layout:edgeRouting:start')
          markPoint('layout:edgeRouting:end')

          devLog(`🔄 [Graph Prepared] ${n.length} nodes, ${e.length} edges (verticalMode: ${verticalMode}, allowedIds: ${allowedIdsSet?.size || 'all'})`)
          return { nodes: n, edges: e }
    }),
    [roots, collapsed, verticalMode, allowedIdsSet, lastClickedEmployeeId]
  )

  useEffect(() => {
    const ensureElk = () => {
      if (!elkRef.current) {
        elkRef.current = new ELK()
      }
      return elkRef.current
    }

    const layout = async () => {
      const elk = ensureElk()
      const scope = layoutScopeRef.current
      const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200
      const verticalSpacing = scope === 'vertical' ? 80 : 140
      const horizontalSpacing = scope === 'vertical'
        ? Math.max(windowWidth * 0.025, 40)
        : Math.max(windowWidth * 0.05, 80)
      const graphDef = {
        id: 'root',
        layoutOptions: {
          'elk.algorithm': 'layered',
          'elk.direction': 'DOWN',
          'elk.layered.spacing.nodeNodeBetweenLayers': verticalSpacing,
          'elk.spacing.nodeNodeBetweenLayers': verticalSpacing,
          'elk.spacing.nodeNode': horizontalSpacing,
          'elk.layered.nodePlacement.strategy': scope === 'vertical' ? 'NETWORK_SIMPLEX' : 'BRANDES_KOEPF'
        },
        children: layoutNodes.map(n => ({
          id: n.id,
          width: 220,
          height: getNodeHeight(n.data.emp)
        })),
        edges: layoutEdges.map(e => ({ id: e.id, sources: [e.source], targets: [e.target] }))
      }
      const resolvePendingLayout = () => {
        const resolver = layoutPromiseRef.current?.resolve
        layoutPromiseRef.current = null
        if (resolver) resolver()
      }

      try {
        const layoutNodeMap = new Map(layoutNodes.map(n => [n.id, n]))
        const nodeCount = layoutNodes.length
        const edgeCount = layoutEdges.length
        
        if (nodeCount > 0) {
          devLog(`📐 [Layout] Starting ELK: ${nodeCount} nodes, ${edgeCount} edges, scope: ${scope}`)
        }
        
        if (ENABLE_PERFORMANCE_TRACKING) {
          perfTracker.start('layout-elk')
        }
        const res = await measurePerformance('layout:elk', () => elk.layout(graphDef))
        if (ENABLE_PERFORMANCE_TRACKING) {
          perfTracker.end('layout-elk', { 
            nodeCount,
            edgeCount,
            scope: scope
          })
        }
        
        if (nodeCount > 0) {
          devLog(`✅ [Layout] ELK completed for ${nodeCount} nodes`)
        }
        const positions = {}
        res.children?.forEach(c => { positions[c.id] = { x: c.x, y: c.y } })

        let maxX = 0
        res.children?.forEach(c => {
          const node = layoutNodeMap.get(c.id)
          if (node && !node.data.fromOrphanRoot) {
            if (c.x > maxX) maxX = c.x
          }
        })
        const offset = horizontalSpacing * 5

        measurePerformance('layout:edgeRouting', () => layoutEdges.length)

        const nextGraph = measurePerformance('layout:applyPositions', () => ({
          nodes: layoutNodes.map(n => {
            let pos = positions[n.id] || { x: 0, y: 0 }
            const manualPos = manualPositionsRef.current[n.id]
            if (manualPos) {
              pos = manualPos
            } else if (n.data.fromOrphanRoot) {
              pos = { x: maxX + offset + pos.x, y: pos.y }
            }
            return { ...n, position: pos }
          }),
          edges: layoutEdges
        }))
        if (!cancelled) {
          measurePerformance('react:setGraph', () => {
            graphRef.current = nextGraph
            setGraph(nextGraph)
          })
        }
        resolvePendingLayout()
      } catch (err) {
        const fallback = { nodes: layoutNodes, edges: layoutEdges }
        if (!cancelled) {
          measurePerformance('react:setGraph', () => {
            graphRef.current = fallback
            setGraph(fallback)
          })
        }
        resolvePendingLayout()
      }
    }

    let cancelled = false

    layout().catch(() => {
      if (!cancelled) {
        const resolver = layoutPromiseRef.current?.resolve
        layoutPromiseRef.current = null
        if (resolver) resolver()
      }
    })

    return () => {
      cancelled = true
      const resolver = layoutPromiseRef.current?.resolve
      layoutPromiseRef.current = null
      if (resolver) resolver()
    }
  }, [layoutNodes, layoutEdges, layoutTrigger])

  const scheduleLayout = useCallback(scope => {
    const requestedScope = scope || 'all'
    layoutScopeRef.current = requestedScope
    return new Promise(resolve => {
      layoutPromiseRef.current = { resolve }
      setLayoutTrigger(t => t + 1)
    })
  }, [])

  const recomputeLayout = useCallback(scope => {
    const requestedScope = scope || 'all'
    if (requestedScope === 'vertical' || requestedScope === 'all') {
      manualPositionsRef.current = {}
      setManualPositions({})
    }
    return scheduleLayout(requestedScope)
  }, [scheduleLayout])

  const expandAll = () => {
    measurePerformance('visibility:expandAll', () => {
      const updates = {}
      map.forEach((_, k) => { updates[k] = false })
      setCollapsed(updates)
    })
  }

  const collapseAll = () => {
    measurePerformance('visibility:collapseAll', () => {
      const updates = {}
      map.forEach((_, k) => { updates[k] = true })
      setCollapsed(updates)
    })
  }

  const updatePosition = (id, pos) => {
    setManualPositions(p => {
      const next = { ...p, [id]: pos }
      manualPositionsRef.current = next
      return next
    })
    setGraph(g => {
      const nextGraph = {
        nodes: g.nodes.map(n => (n.id === id ? { ...n, position: pos } : n)),
        edges: g.edges
      }
      graphRef.current = nextGraph
      return nextGraph
    })
  }

  const getViewport = useCallback(() => {
    if (!controls) return null
    const { x, y, zoom } = controls.getViewport()
    return { x, y, k: zoom }
  }, [controls])

  const setViewport = useCallback(
    view => {
      if (!controls || !view) return
      const { x, y, k } = view
      measureViewportUpdate('set', () => {
        controls.setViewport({ x, y, zoom: k }, { duration: 0 })
      })
    },
    [controls]
  )

  const getNodeWorldPosition = useCallback(id => {
    if (!id) return null
    const node = graphRef.current.nodes.find(n => n.id === id)
    if (!node) return null
    const width = node.width ?? 220
    const height = node.height ?? (node.data?.emp ? getNodeHeight(node.data.emp) : 0)
    return { x: node.position.x + width / 2, y: node.position.y + height / 2 }
  }, [])

  const getNodeScreenPosition = useCallback(id => {
    const viewport = getViewport()
    const world = getNodeWorldPosition(id)
    if (!viewport || !world) return null
    return {
      x: world.x * viewport.k + viewport.x,
      y: world.y * viewport.k + viewport.y
    }
  }, [getViewport, getNodeWorldPosition])

  const toWorld = useCallback(point => {
    if (!controls || !point) return point
    return controls.project(point)
  }, [controls])

  const fitView = useCallback(
    options => {
      if (!controls) return
      measureViewportUpdate('fit', () => {
        controls.fitView(options)
      })
    },
    [controls]
  )

  const zoomIn = useCallback(() => {
    if (!controls) return
    measureViewportUpdate('zoomIn', () => {
      controls.zoomIn?.()
    })
  }, [controls])

  const zoomOut = useCallback(() => {
    if (!controls) return
    measureViewportUpdate('zoomOut', () => {
      controls.zoomOut?.()
    })
  }, [controls])

  const toScreen = useCallback(point => {
    const viewport = getViewport()
    if (!viewport || !point) return point
    return {
      x: point.x * viewport.k + viewport.x,
      y: point.y * viewport.k + viewport.y
    }
  }, [getViewport])

  const relayoutPreservingAnchor = useCallback(
    async (anchorId, scope) => {
      const hadAnchor = Boolean(anchorId)
      const prevViewport = getViewport()
      const prevScreen = hadAnchor ? getNodeScreenPosition(anchorId) : null

      await recomputeLayout(scope)
      await waitForLayoutFrame()

      if (hadAnchor && prevScreen) {
        const anchorWorld = getNodeWorldPosition(anchorId)
        if (anchorWorld && prevViewport) {
          const k = prevViewport.k
          const newPan = {
            x: prevScreen.x - anchorWorld.x * k,
            y: prevScreen.y - anchorWorld.y * k,
            k
          }
          setViewport(newPan)
        }
      } else if (prevViewport) {
        setViewport(prevViewport)
      }
    },
    [getViewport, getNodeScreenPosition, recomputeLayout, getNodeWorldPosition, setViewport]
  )

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
      measurePerformance('selection:applyVisibility', () => {
        setCollapsed(updates)
      })
    }

    const focus = () => {
      const node = graph.nodes.find(n => n.id === targetName)
      if (!node || !controls) return false
      fitView({ nodes: [node], padding: 0.4, duration: 800 })
      return true
    }

    if (!focus()) {
      setTimeout(() => {
        focus()
      }, 100)
    }

    return true
  }, [map, graph.nodes, controls, fitView])

  useEffect(() => {
    markPoint('react:commit:graph')
  }, [graph.nodes, graph.edges])

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
    verticalFocusId,
    recomputeLayout,
    relayoutPreservingAnchor,
    getViewport,
    setViewport,
    getNodeScreenPosition,
    getNodeWorldPosition,
    fitView,
    zoomIn,
    zoomOut,
    toWorld,
    toScreen
  }
}
