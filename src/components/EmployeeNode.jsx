import React, { useState } from 'react'
import { Handle } from 'reactflow'
import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline'
import avatar from '../assets/avatar.svg'

export default function EmployeeNode({ data }) {
  const { emp, collapsed, toggle, select, isSelected } = data
  const [imgSrc, setImgSrc] = useState(emp['Photo URL'] || avatar)
  const [show, setShow] = useState(false)

  const isValid = value => value !== undefined && value !== null && value !== '' && value !== 'N/A'
  const socialLink = emp['Social Link']
  const hasSocialLink = isValid(socialLink)

  return (
    <div
      className={`employee-node${show ? ' expanded' : ''}`}
      onClick={() => {
        if (select) {
          select()
        }
      }}
      style={{
        border: isSelected ? '3px solid #2563eb' : undefined,
        boxShadow: isSelected ? '0 0 0 2px #dbeafe' : undefined
      }}
    >
      <Handle type="target" position="top" />
      <div style={{ textAlign: 'center', width: '100%', position: 'relative' }}>
        <button
          className="collapse-btn"
          onPointerDown={e => e.stopPropagation()}
          onClick={e => {
            e.stopPropagation()
            if (select) {
              select()
            }
            toggle()
          }}
          aria-label="collapse"
          style={{ position: 'absolute', right: 0, top: 0 }}
        >
          {collapsed ? <PlusIcon width={18} /> : <MinusIcon width={18} />}
        </button>
        <img src={imgSrc} alt="" width={80} height={80} onError={() => setImgSrc(avatar)} />
        <div style={{ fontWeight: 'bold' }}>{emp['Name Surname']}</div>
        <div>{emp['Job Title']}</div>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => {
            e.stopPropagation()
            if (select) {
              select()
            }
            setShow(s => !s)
          }}
          aria-label="details"
        >
          {show ? '–' : '+'}
        </button>
      </div>
      {show && (
        <div className="details">
          {Object.entries(emp).map(([k, v]) => {
            if (
              k === 'Name Surname' ||
              k === 'Job Title' ||
              k === 'Manager' ||
              k === 'children' ||
              k === 'Photo URL' ||
              k === 'fullName' ||
              k === 'Social Link'
            )
              return null
            let display = v
            if (Array.isArray(v) || (v && typeof v === 'object')) {
              display = JSON.stringify(v)
            }
            if (!isValid(display)) return null
            if (k === 'Email') {
              return (
                <React.Fragment key={k}>
                  <div><strong>{k}:</strong> {display}</div>
                  {hasSocialLink && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginTop: 4
                      }}
                    >
                      <svg
                        aria-hidden="true"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M10.59 13.41a1 1 0 0 0 1.41 1.41l4.24-4.24a3 3 0 1 0-4.24-4.24l-1.06 1.06a1 1 0 0 0 1.41 1.41l1.06-1.06a1 1 0 1 1 1.41 1.41l-4.24 4.24ZM13.41 10.59a1 1 0 0 0-1.41-1.41L7.76 13a3 3 0 1 0 4.24 4.24l1.06-1.06a1 1 0 1 0-1.41-1.41l-1.06 1.06a1 1 0 1 1-1.41-1.41l4.24-4.24Z" />
                      </svg>
                      <a
                        href={socialLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open social profile for ${emp['Name Surname']}`}
                        style={{ color: 'inherit', textDecoration: 'underline' }}
                      >
                        LinkedIn
                      </a>
                    </div>
                  )}
                </React.Fragment>
              )
            }
            return <div key={k}><strong>{k}:</strong> {display}</div>
          })}
        </div>
      )}
      <Handle type="source" position="bottom" />
    </div>
  )
}
