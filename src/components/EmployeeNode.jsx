import React, { useEffect, memo } from 'react'
import { Handle, Position, useReactFlow } from 'reactflow'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MinusIcon,
  PlusIcon
} from '@heroicons/react/20/solid'
import defaultAvatar from '../assets/avatar.svg'
import isValid from '../utils/isValid'

function EmployeeNode({ id, data }) {
  const { updateNodeInternals } = useReactFlow()
  const { emp, collapsed, toggle, expanded, toggleExpand, photoURL } = data

  // Update dimensions in ReactFlow when extra info is toggled
  useEffect(() => {
    updateNodeInternals?.(id)
  }, [expanded])

  return (
    <div className={`employee-node ${collapsed ? 'collapsed' : ''} ${expanded ? 'expanded' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="header" style={{ textAlign: 'center', width: '100%', position: 'relative' }}>
        <button
          className="collapse-btn"
          onClick={e => {
            e.stopPropagation()
            toggle()
          }}
          aria-label="collapse"
        >
          {collapsed ? <PlusIcon width={18} /> : <MinusIcon width={18} />}
        </button>
        <img
          src={photoURL || defaultAvatar}
          alt="avatar"
          width={80}
          height={80}
          onError={e => (e.currentTarget.src = defaultAvatar)}
        />
        <h2>{emp.fullName || emp['Name Surname']}</h2>
        <div className="title">{emp.title || emp['Job Title']}</div>
        <button
          className="collapse-btn"
          onClick={e => {
            e.stopPropagation()
            toggleExpand()
          }}
          aria-label="details"
        >
          {expanded ? <ChevronUpIcon width={18} /> : <ChevronDownIcon width={18} />}
        </button>
      </div>

      {expanded && (
        <div className="details">
          {Object.entries(emp).map(([k, v]) => {
            if (
              [
                'Name Surname',
                'Job Title',
                'title',
                'Manager',
                'children',
                'fullName',
                'Photo URL',
                'photo',
                'photoUrl'
              ].includes(k)
            ) {
              return null
            }

            let display = v;
            if (Array.isArray(v) || (v && typeof v === 'object')) {
              display = JSON.stringify(v);
            }

            if (!isValid(display)) return null;

            return (
              <div key={k}>
                <strong>{k}:</strong> {display}
              </div>
            );
          })}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default memo(EmployeeNode)
