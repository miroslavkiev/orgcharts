import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowsPointingOutIcon } from '@heroicons/react/24/outline'

export default function Toolbar({ org }) {
  const { t, i18n } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [notFound, setNotFound] = useState(false)

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
        flexWrap: 'wrap',
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
      <button onClick={org.expandAll} aria-label={t('expandAll')} style={{ padding: '6px 12px' }}>
        {t('expandAll')}
      </button>
      <button onClick={org.collapseAll} aria-label={t('collapseAll')} style={{ padding: '6px 12px' }}>
        {t('collapseAll')}
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
