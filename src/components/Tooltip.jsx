import React, { cloneElement, useEffect, useId, useRef, useState } from 'react'

const DEFAULT_DELAY = 120

function mergeHandlers(original, next) {
  return event => {
    if (typeof original === 'function') {
      original(event)
    }
    next(event)
  }
}

export default function Tooltip({ label, children, delay = DEFAULT_DELAY, placement = 'above' }) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)
  const id = useId()

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const show = () => {
    clearTimer()
    timerRef.current = setTimeout(() => {
      setVisible(true)
    }, delay)
  }

  const hide = () => {
    clearTimer()
    setVisible(false)
  }

  useEffect(() => () => {
    clearTimer()
  }, [])

  const contentId = `${id}-tooltip`

  const child = React.Children.only(children)
  const enhancedChild = cloneElement(child, {
    'aria-describedby': visible ? contentId : undefined,
    title: label,
    onMouseEnter: mergeHandlers(child.props.onMouseEnter, show),
    onMouseLeave: mergeHandlers(child.props.onMouseLeave, hide),
    onFocus: mergeHandlers(child.props.onFocus, show),
    onBlur: mergeHandlers(child.props.onBlur, hide)
  })

  const verticalPosition = placement === 'below' ? 'calc(100% + 8px)' : 'auto'
  const verticalBottom = placement === 'above' ? 'calc(100% + 8px)' : 'auto'

  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      {enhancedChild}
      <span
        id={contentId}
        role="tooltip"
        style={{
          position: 'absolute',
          bottom: verticalBottom,
          top: verticalPosition,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(17, 24, 39, 0.9)',
          color: '#fff',
          padding: '4px 8px',
          borderRadius: 4,
          fontSize: 11,
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          opacity: visible ? 1 : 0,
          transition: 'opacity 80ms ease-in-out',
          zIndex: 20
        }}
        aria-hidden={!visible}
      >
        {label}
      </span>
    </span>
  )
}
