import React from 'react'
import { useTranslation } from '../hooks/useTranslation'

const GovPlaceholder = ({ titleKey }) => {
  const { t } = useTranslation()
  return (
    <div className="rbac-empty" style={{ minHeight: 280 }}>
      <h2>{t(titleKey)}</h2>
      <p>{t('gov.placeholderMessage')}</p>
    </div>
  )
}

export default GovPlaceholder
