import { useTranslation } from "react-i18next"
import React, { useCallback, useEffect } from 'react'
import ReactFlow, { Controls, MiniMap } from 'reactflow'
import EmployeeNode from './EmployeeNode'

export default function OrgCanvas({ org }) {
  const { t } = useTranslation()
  const { nodes, edges } = org

  const handleDragStop = useCallback((_, node) => {
    org.updatePosition(node.id, node.position)
  }, [org])

  const nodeTypes = {
    employee: EmployeeNode
  }

  const onInit = useCallback(instance => {
    org.controls = instance
  }, [org])

  useEffect(() => {
    if (org.controls) {
      org.controls.fitView()
    }
  }, [org.controls, org.roots.length])

  return (
    <div style={{ width: '100%', height: '80vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onInit={onInit}
        onNodeDragStop={handleDragStop}
        fitView
      >
        <Controls />
        <MiniMap />
      </ReactFlow>
      {(() => {
        const missing = org.orphans.filter(o => !nodes.some(n => n.id === o.fullName))
        return missing.length > 0 ? (
          <div style={{ margin: 20, fontSize: 12, opacity: 0.7 }}>
            <h3>{t('unassigned')}</h3>
            {missing.map(o => (
              <div key={o.fullName}>{o.fullName}</div>
            ))}
          </div>
        ) : null
      })()}
    </div>
  )
}
