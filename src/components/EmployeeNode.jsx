import React, { useState } from 'react'
import { Handle } from 'react-flow-renderer'
import avatar from '../assets/avatar.svg'

export default function EmployeeNode({ data }) {
  const { emp } = data
  const [imgSrc, setImgSrc] = useState(emp['Photo URL'] || avatar)
  const [show, setShow] = useState(false)

  return (
    <div style={{ width: 140, height: 180, padding: 8, border: '1px solid #ccc', borderRadius: 4, background: '#fff' }}>
      <Handle type="target" position="top" />
      <div style={{ textAlign: 'center' }}>
        <img src={imgSrc} alt="" width={80} height={80} onError={() => setImgSrc(avatar)} />
        <div style={{ fontWeight: 'bold' }}>{emp['Name Surname']}</div>
        <div>{emp['Job Title']}</div>
        <button onClick={() => setShow(s => !s)} aria-label="details">{show ? '–' : '+'}</button>
      </div>
      {show && (
        <div style={{ fontSize: 12, marginTop: 4 }}>
          {Object.entries(emp).map(([k, v]) => (
            k !== 'Name Surname' && k !== 'Job Title' && k !== 'Manager' && (
              <div key={k}><strong>{k}:</strong> {v || 'N/A'}</div>
            )
          ))}
        </div>
      )}
      <Handle type="source" position="bottom" />
    </div>
  )
}
