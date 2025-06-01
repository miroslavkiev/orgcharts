import React, { useEffect, useState } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { ChevronDownIcon, ChevronUpIcon, MinusIcon, PlusIcon } from '@heroicons/react/20/solid';
import defaultAvatar from '../assets/avatar.svg';
import isValid from '../utils/isValid'; // якщо ще немає — напиши util, що перевіряє значення

export default function EmployeeNode({ id, data }) {
  const { updateNodeInternals } = useReactFlow();
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [imgSrc, setImgSrc] = useState(data['Photo URL'] || defaultAvatar);

  const emp = data;

  const toggle = () => setCollapsed((prev) => !prev);
  const toggleExpand = () => setExpanded((prev) => !prev);

  useEffect(() => {
    updateNodeInternals?.(id); // перевірка на існування
  }, [collapsed, expanded, id, updateNodeInternals]);

  return (
    <div className={`employee-node ${collapsed ? 'collapsed' : ''} ${expanded ? 'expanded' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div style={{ textAlign: 'center', width: '100%', position: 'relative' }}>
        <button className="collapse-btn" onClick={toggle} aria-label="collapse">
          {collapsed ? <PlusIcon width={18} /> : <MinusIcon width={18} />}
        </button>
        <img
          src={imgSrc}
          alt=""
          width={80}
          height={80}
          onError={() => setImgSrc(defaultAvatar)}
        />
        <h2>{emp['Name Surname']}</h2>
        <div className="title">{emp['Job Title']}</div>
        <button className="collapse-btn" onClick={toggleExpand} aria-label="details">
          {expanded ? <ChevronUpIcon width={18} /> : <ChevronDownIcon width={18} />}
        </button>
      </div>

      {expanded && (
        <div className="details">
          {Object.entries(emp).map(([k, v]) => {
            if (
              ['Name Surname', 'Job Title', 'Manager', 'children', 'fullName'].includes(k)
            ) {
              return null;
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
