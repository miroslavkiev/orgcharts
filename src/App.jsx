import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import UploadZone from './components/UploadZone'
import Toolbar from './components/Toolbar'
import OrgCanvas from './components/OrgCanvas'
import useOrgChart from './hooks/useOrgChart'

export default function App() {
  const [rows, setRows] = useState([])
  const { t } = useTranslation()
  const org = useOrgChart(rows)

  return (
    <div>
      <UploadZone onData={setRows} />
      {rows.length > 0 && (
        <>
          <Toolbar org={org} />
          <OrgCanvas org={org} />
        </>
      )}
    </div>
  )
}
