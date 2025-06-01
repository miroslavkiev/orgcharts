import React, { useState, useLayoutEffect } from 'react'
import { Handle, useReactFlow } from 'reactflow'
import { PlusIcon, MinusIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import avatar from '../assets/avatar.svg'

export default function EmployeeNode({ id, data }) {
  const { emp, collapsed, toggle, expanded, toggleExpand } = data
  const [imgSrc, setImgSrc] = useState(emp['Photo URL'] || avatar)
  const { updateNodeInternals } = useReactFlow()

  const isValid = value => value !== undefined && value !== null && value !== '' && value !== 'N/A'

  useLayoutEffect(() => {
    updateNodeInternals(id)
  }, [id, expanded, collapsed, updateNodeInternals])

  return (
    <div className={`employee-node${expanded ? ' expanded' : ''}`}>
      <Handle type="target" position="top" />
      <div style={{ textAlign: 'center', width: '100%', position: 'relative' }}>
        <button className="collapse-btn" onClick={toggle} aria-label="collapse" style={{ position: 'absolute', right: 0, top: 0 }}>
          {collapsed ? <PlusIcon width={18} /> : <MinusIcon width={18} />}
        </button>
        <img src={imgSrc} alt="" width={80} height={80} onError={() => setImgSrc(avatar)} />
        <h2>{emp['Name Surname']}</h2>
        <div className="title">{emp['Job Title']}</div>
        <button className="collapse-btn" onClick={toggleExpand} aria-label="details" style={{ marginTop: 4 }}>
          {expanded ? <ChevronUpIcon width={18} /> : <ChevronDownIcon width={18} />}
        </button>
      </div>
      {expanded && (
        <div className="details">
          {Object.entries(emp).map(([k, v]) => {
            if (k === 'Name Surname' || k === 'Job Title' || k === 'Manager' || k === 'children') return null
            let display = v
            if (Array.isArray(v) || (v && typeof v === 'object')) {
              display = JSON.stringify(v)
            }
            if (!isValid(display)) return null
            return <div key={k}><strong>{k}:</strong> {display}</div>
          })}
        </div>
      )}
      <Handle type="source" position="bottom" />
    </div>
  )
}
