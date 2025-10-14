import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowsPointingOutIcon } from '@heroicons/react/24/outline'

export default function Toolbar({ org }) {
  const { t, i18n } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [verticalHint, setVerticalHint] = useState('')

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
    if (org.verticalMode) {
      org.exitVerticalMode()
      await org.relayoutPreservingAnchor(org.lastClickedEmployeeId, 'all')
    } else {
      org.enterVerticalMode(org.lastClickedEmployeeId)
      await org.relayoutPreservingAnchor(org.lastClickedEmployeeId, 'vertical')
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
        <button type="submit" aria-label={t('search')} style={{ padding: '6px 12px' }}>
          {t('search')}
        </button>
      </form>
      {notFound && (
        <div style={{ color: '#b91c1c', fontSize: 12 }}>{t('searchNotFound')}</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
        <button
          type="button"
          onClick={handleVerticalToggle}
          aria-label={t('verticalChain')}
          title={t('verticalChain')}
          aria-pressed={org.verticalMode}
          aria-disabled={isVerticalDisabled}
          style={{
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isVerticalDisabled ? 0.5 : 1,
            cursor: isVerticalDisabled ? 'not-allowed' : 'pointer'
          }}
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
            <path d="M11 4a1 1 0 1 1 2 0v4h2.5a3.5 3.5 0 1 1 0 7H13v5a1 1 0 1 1-2 0v-5H8.5a3.5 3.5 0 1 1 0-7H11V4Z" />
          </svg>
        </button>
        {verticalHint && (
          <div style={{ fontSize: 12, color: '#1f2937', maxWidth: 200 }}>{verticalHint}</div>
        )}
      </div>
      <button
        onClick={handleExpandAll}
        aria-label={t('expandAll')}
        title={t('expandAll')}
        style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
      <button
        onClick={handleCollapseAll}
        aria-label={t('collapseAll')}
        title={t('collapseAll')}
        style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
      <button
        onClick={() => org.controls && org.controls.fitView()}
        aria-label={t('fitView')}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 12px' }}
      >
        <ArrowsPointingOutIcon width={16} />
      </button>
      <select
        value={i18n.language}
        onChange={e => i18n.changeLanguage(e.target.value)}
        aria-label={t('language')}
        style={{ padding: '6px 8px', borderRadius: 6 }}
      >
        <option value="en">EN</option>
        <option value="uk">UK</option>
      </select>
    </div>
  )
}
