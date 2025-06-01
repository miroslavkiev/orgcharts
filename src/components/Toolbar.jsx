import React from 'react'
import { useTranslation } from 'react-i18next'
import { PlusIcon, MinusIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline'

export default function Toolbar({ org }) {
  const { t, i18n } = useTranslation()

  return (
    <div style={{ position: 'fixed', top: 10, right: 10, zIndex: 10 }}>
      <button onClick={org.expandAll} aria-label={t('expandAll')}>{t('expandAll')}</button>
      <button onClick={org.collapseAll} aria-label={t('collapseAll')}>{t('collapseAll')}</button>
      <button onClick={() => org.controls.zoomIn()} aria-label={t('zoomIn')}><PlusIcon width={16} /></button>
      <button onClick={() => org.controls.zoomOut()} aria-label={t('zoomOut')}><MinusIcon width={16} /></button>
      <button onClick={() => org.controls.fitView()} aria-label={t('fitView')}><ArrowsPointingOutIcon width={16} /></button>
      <select
        value={i18n.language}
        onChange={e => i18n.changeLanguage(e.target.value)}
        aria-label={t('language')}
      >
        <option value="en">EN</option>
        <option value="uk">UK</option>
      </select>
    </div>
  )
}
