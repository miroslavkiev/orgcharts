import { useTranslation } from "react-i18next"
import React, { useCallback } from 'react'
<<<<<<< HEAD
import ReactFlow, { Controls, MiniMap } from 'reactflow'
=======
import ReactFlow, { Controls, MiniMap } from 'react-flow-renderer'
>>>>>>> b678978 (fixed package.json gitignore)
import EmployeeNode from './EmployeeNode'

export default function OrgCanvas({ org }) {
  const { t } = useTranslation()
  const nodes = []
  const edges = []

  const traverse = (emp, parentId) => {
    const id = emp.fullName
    nodes.push({ id, type: 'employee', position: { x: 0, y: 0 }, data: { emp } })
    if (parentId) {
      edges.push({ id: `${parentId}-${id}`, source: parentId, target: id })
    }
    emp.children.forEach(c => traverse(c, id))
  }

  org.roots.forEach(r => traverse(r, null))

  const nodeTypes = {
    employee: EmployeeNode
  }

  const onInit = useCallback(instance => {
    org.controls = instance
  }, [org])

  return (
    <div style={{ width: '100%', height: '80vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onInit={onInit}
        fitView
      >
        <Controls />
        <MiniMap />
      </ReactFlow>
      {org.orphans.length > 0 && (
        <div style={{ margin: 20 }}>
          <h3>{t('unassigned')}</h3>
          {org.orphans.map(o => (
            <div key={o.fullName}>{o.fullName}</div>
          ))}
        </div>
      )}
    </div>
  )
}
