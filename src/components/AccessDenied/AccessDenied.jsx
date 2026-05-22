import React from 'react'
import { FiLock } from 'react-icons/fi'
import { useTranslation } from '../../hooks/useTranslation'
import './AccessDenied.css'

const AccessDenied = () => {
  const { t } = useTranslation()

  return (
    <div className="access-denied">
      <FiLock className="access-denied-icon" />
      <h2>{t('access.deniedTitle')}</h2>
      <p>{t('access.deniedMessage')}</p>
    </div>
  )
}

export default AccessDenied
