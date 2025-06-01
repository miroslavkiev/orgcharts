import React from 'react'
import { useTranslation } from 'react-i18next'
import Papa from 'papaparse'
import toast from 'react-hot-toast'

export default function UploadZone({ onData }) {
  const { t } = useTranslation()

  const handleFile = e => {
    const file = e.target.files[0]
    if (!file) return
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: res => {
        onData(res.data)
      },
      error: err => {
        console.error(err)
        toast.error('CSV error')
      }
    })
  }

  return (
    <div style={{ padding: 20 }}>
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={handleFile}
        aria-label={t('upload')}
      />
    </div>
  )
}
