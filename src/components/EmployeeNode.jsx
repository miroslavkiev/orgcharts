import React, { useState } from 'react'
import { Handle } from 'reactflow'
import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline'
import avatar from '../assets/avatar.svg'

export default function EmployeeNode({ data }) {
  const { emp, collapsed, toggle } = data
  const [imgSrc, setImgSrc] = useState(emp['Photo URL'] || avatar)
  const [show, setShow] = useState(false)

  return (
    <div className="employee-node">
      <Handle type="target" position="top" />
      <div style={{ textAlign: 'center', width: '100%', position: 'relative' }}>
        <button className="collapse-btn" onClick={toggle} aria-label="collapse" style={{ position: 'absolute', right: 0, top: 0 }}>
          {collapsed ? <PlusIcon width={18} /> : <MinusIcon width={18} />}
        </button>
        <img src={imgSrc} alt="" width={80} height={80} onError={() => setImgSrc(avatar)} />
        <div style={{ fontWeight: 'bold' }}>{emp['Name Surname']}</div>
        <div>{emp['Job Title']}</div>
        <button onClick={() => setShow(s => !s)} aria-label="details">{show ? '–' : '+'}</button>
      </div>
      {show && (
        <div className="details">
          {Object.entries(emp).map(([k, v]) => {
            if (k === 'Name Surname' || k === 'Job Title' || k === 'Manager' || k === 'children') return null
            let display = v
            if (Array.isArray(v) || (v && typeof v === 'object')) {
              display = JSON.stringify(v)
            }
            return <div key={k}><strong>{k}:</strong> {display || 'N/A'}</div>
          })}
        </div>
      )}
      <Handle type="source" position="bottom" />
    </div>
  )
}
