import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowsPointingOutIcon } from '@heroicons/react/24/outline'
import Tooltip from './Tooltip'
import perfTracker from '../utils/perfTracker'
import { devLog, ENABLE_PERFORMANCE_TRACKING } from '../utils/featureFlags'

export default function Toolbar({ org }) {
  const { t, i18n } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [verticalHint, setVerticalHint] = useState('')
  const iconButtonStyle = {
    padding: '6px 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }

  const employeeNames = useMemo(() => {
    if (!org?.map) return []
    return Array.from(org.map.keys()).sort((a, b) => a.localeCompare(b))
  }, [org.map])

  const handleSubmit = e => {
    e.preventDefault()
    if (!searchTerm.trim()) {
      setNotFound(false)
      return
    }
    const found = org.focusEmployee(searchTerm)
    setNotFound(!found)
  }

  const handleChange = e => {
    setSearchTerm(e.target.value)
    if (notFound) {
      setNotFound(false)
    }
  }

  const isVerticalDisabled = !org.lastClickedEmployeeId

  const handleVerticalToggle = async () => {
    if (isVerticalDisabled) {
      setVerticalHint(t('verticalChainHint'))
      return
    }
    setVerticalHint('')
    const wasVerticalMode = org.verticalMode
    const userStart = ENABLE_PERFORMANCE_TRACKING ? performance.now() : 0
    devLog('🔗 [User Action] Vertical chain button clicked')
    if (ENABLE_PERFORMANCE_TRACKING) {
      perfTracker.start('vertical-chain-complete')
    }
    
    if (org.verticalMode) {
      devLog('⬅️ Exiting vertical mode...')
      org.exitVerticalMode()
      await org.relayoutPreservingAnchor(org.lastClickedEmployeeId, 'all')
    } else {
      devLog('➡️ Entering vertical mode...')
      org.enterVerticalMode(org.lastClickedEmployeeId)
      await org.relayoutPreservingAnchor(org.lastClickedEmployeeId, 'vertical')
    }
    
    // Auto-fit the view after vertical chain completes
    // Wait a frame to ensure layout is complete
    await new Promise(resolve => requestAnimationFrame(resolve))
    org.fitView()
    
    if (ENABLE_PERFORMANCE_TRACKING) {
      devLog('⏳ Waiting for render...')
      // Wait for React to finish rendering and browser to paint
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const totalTime = performance.now() - userStart
            devLog(`✅ [User Perceived] Total time: ${totalTime.toFixed(2)}ms`)
            perfTracker.end('vertical-chain-complete', { 
              mode: wasVerticalMode ? 'exit' : 'enter',
              userPerceivedTime: Math.round(totalTime * 100) / 100
            })
            resolve()
          })
        })
      })
    }
  }

  const handleExpandAll = async () => {
    org.expandAll()
    await org.relayoutPreservingAnchor(org.lastClickedEmployeeId, 'all')
  }

  const handleCollapseAll = async () => {
    org.collapseAll()
    await org.relayoutPreservingAnchor(org.lastClickedEmployeeId, 'all')
  }

  const handleFitView = () => {
    org.fitView()
  }

  const handleZoomIn = () => {
    org.zoomIn()
  }

  const handleZoomOut = () => {
    org.zoomOut()
  }

  useEffect(() => {
    if (org.lastClickedEmployeeId) {
      setVerticalHint('')
    }
  }, [org.lastClickedEmployeeId])

  return (
    <div
      style={{
        position: 'fixed',
        top: 10,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        display: 'flex',
        gap: 10,
        flexWrap: 'nowrap',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '8px 16px',
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
      }}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          list="employee-search-list"
          value={searchTerm}
          onChange={handleChange}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #ccc', minWidth: 200 }}
        />
        <datalist id="employee-search-list">
          {employeeNames.map(name => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <Tooltip label={t('toolbar.search')}>
          <button type="submit" aria-label={t('toolbar.search')} style={{ padding: '6px 12px' }}>
            {t('search')}
          </button>
        </Tooltip>
      </form>
      {notFound && (
        <div style={{ color: '#b91c1c', fontSize: 12 }}>{t('searchNotFound')}</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
        <Tooltip label={t('toolbar.verticalChain')}>
          <button
            type="button"
            onClick={handleVerticalToggle}
            aria-label={t('toolbar.verticalChain')}
            aria-pressed={org.verticalMode}
            aria-disabled={isVerticalDisabled}
            style={{
              ...iconButtonStyle,
              opacity: isVerticalDisabled ? 0.5 : 1,
              cursor: isVerticalDisabled ? 'not-allowed' : 'pointer'
            }}
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
              <path d="M11 4a1 1 0 1 1 2 0v4h2.5a3.5 3.5 0 1 1 0 7H13v5a1 1 0 1 1-2 0v-5H8.5a3.5 3.5 0 1 1 0-7H11V4Z" />
            </svg>
          </button>
        </Tooltip>
        {verticalHint && (
          <div style={{ fontSize: 12, color: '#1f2937', maxWidth: 200 }}>{verticalHint}</div>
        )}
      </div>
      <Tooltip label={t('toolbar.expandAll')}>
        <button
          onClick={handleExpandAll}
          aria-label={t('toolbar.expandAll')}
          style={{ ...iconButtonStyle }}
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
            <path d="M4 10V4h6M20 14v6h-6M20 10V4h-6M4 14v6h6" />
            <path
              d="M10 4L4 10M20 14l-6 6M14 4l6 6M4 14l6 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </button>
      </Tooltip>
      <Tooltip label={t('toolbar.collapseAll')}>
        <button
          onClick={handleCollapseAll}
          aria-label={t('toolbar.collapseAll')}
          style={{ ...iconButtonStyle }}
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
            <path d="M10 20H4v-6M14 4h6v6M14 20h6v-6M10 4H4v6" />
            <path
              d="M4 6l6-2M20 18l-6 2M20 6l-6 2M4 18l6 2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </button>
      </Tooltip>
      <Tooltip label={t('toolbar.fitView')}>
        <button
          onClick={handleFitView}
          aria-label={t('toolbar.fitView')}
          style={{ ...iconButtonStyle }}
        >
          <ArrowsPointingOutIcon width={16} />
        </button>
      </Tooltip>
      <Tooltip label={t('toolbar.zoomIn')}>
        <button
          onClick={handleZoomIn}
          aria-label={t('toolbar.zoomIn')}
          style={{ ...iconButtonStyle }}
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </Tooltip>
      <Tooltip label={t('toolbar.zoomOut')}>
        <button
          onClick={handleZoomOut}
          aria-label={t('toolbar.zoomOut')}
          style={{ ...iconButtonStyle }}
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
            <path
              d="M5 12h14"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </Tooltip>
      {ENABLE_PERFORMANCE_TRACKING && (
        <>
          <Tooltip label="Show Performance Report" placement="below">
            <button
              onClick={() => {
                if (window.perfTracker) {
                  window.perfTracker.logReport()
                }
              }}
              aria-label="Show Performance Report"
              style={{ ...iconButtonStyle, fontSize: '16px' }}
            >
              📊
            </button>
          </Tooltip>
          <Tooltip label="Download Performance Report" placement="below">
            <button
              onClick={() => {
                if (window.perfTracker) {
                  window.perfTracker.downloadReport('perf-baseline.json')
                }
              }}
              aria-label="Download Performance Report"
              style={{ ...iconButtonStyle, fontSize: '16px' }}
            >
              💾
            </button>
          </Tooltip>
        </>
      )}
      <Tooltip label={t('toolbar.language')} placement="below">
        <select
          value={i18n.language}
          onChange={e => i18n.changeLanguage(e.target.value)}
          aria-label={t('toolbar.language')}
          style={{ padding: '6px 8px', borderRadius: 6 }}
        >
          <option value="en">EN</option>
          <option value="uk">UK</option>
        </select>
      </Tooltip>
    </div>
  )
}
