import { useCallback, useMemo } from 'react'
import { useReactFlow } from 'reactflow'

type ViewportHelpers = {
  fitVisibleNodes: (padding?: number, duration?: number) => Promise<void>
  centerOnNodeIfVisible: (nodeId: string, duration?: number) => Promise<void>
  afterLayoutTick: () => Promise<void>
}

export function useViewportHelpers(): ViewportHelpers {
  const rf = useReactFlow()

  const fitVisibleNodes = useCallback(
    async (padding = 0.2, duration = 300) => {
      const nodes = rf
        .getNodes()
        .filter(n => !n.hidden && !(n.data && (n.data as any).hidden))

      if (!nodes.length) return

      await rf.fitView({
        includeHiddenNodes: false,
        nodes: nodes.map(n => ({ id: n.id })),
        padding,
        duration
      })
    },
    [rf]
  )

  const centerOnNodeIfVisible = useCallback(
    async (nodeId: string, duration = 300) => {
      const node = rf.getNode(nodeId)
      if (!node || node.hidden || (node.data && (node.data as any).hidden)) return

      const x = (node.positionAbsolute?.x ?? node.position.x) + (node.width ?? 0) / 2
      const y = (node.positionAbsolute?.y ?? node.position.y) + (node.height ?? 0) / 2

      const { zoom } = rf.getViewport()
      await rf.setCenter(x, y, { zoom, duration })
    },
    [rf]
  )

  const afterLayoutTick = useCallback(
    () =>
      new Promise<void>(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      ),
    []
  )

  return useMemo(
    () => ({ fitVisibleNodes, centerOnNodeIfVisible, afterLayoutTick }),
    [fitVisibleNodes, centerOnNodeIfVisible, afterLayoutTick]
  )
}
