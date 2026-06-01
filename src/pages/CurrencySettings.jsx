import React, { useMemo, useState } from 'react'
import { FiDollarSign, FiRotateCcw, FiSave } from 'react-icons/fi'
import { useCurrency } from '../contexts/CurrencyContext'
import { useLocale } from '../contexts/LocaleContext'
import { useTranslation } from '../hooks/useTranslation'
import { BASE_CURRENCY_CODE } from '../config/currencies'
import { convertFromSyp, formatCurrency } from '../utils/currencyFormat'
import './CurrencySettings.css'

const PREVIEW_AMOUNTS = [1500, 15000, 150000, 1500000, 15000000]

const CurrencySettings = () => {
  const { t } = useTranslation()
  const { language } = useLocale()
  const {
    baseCurrencyCode,
    displayCode,
    exchangeRate,
    isBaseCurrency,
    presets,
    preset,
    setDisplayCurrency,
    setExchangeRate,
    resetCurrency,
  } = useCurrency()

  const [selectedCode, setSelectedCode] = useState(displayCode)
  const [rateInput, setRateInput] = useState(String(exchangeRate))
  const [saved, setSaved] = useState(false)

  const selectedPreset = useMemo(
    () => presets.find((p) => p.code === selectedCode) || presets[0],
    [presets, selectedCode]
  )

  const handleCurrencyChange = (code) => {
    setSelectedCode(code)
    const p = presets.find((c) => c.code === code)
    if (code === BASE_CURRENCY_CODE) {
      setRateInput('1')
    } else if (p) {
      setRateInput(String(p.defaultExchangeRate))
    }
  }

  const handleSave = () => {
    const rate = selectedCode === BASE_CURRENCY_CODE ? 1 : Number(rateInput)
    setDisplayCurrency(selectedCode, rate)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleReset = () => {
    resetCurrency()
    setSelectedCode(BASE_CURRENCY_CODE)
    setRateInput('1')
  }

  const previewRows = PREVIEW_AMOUNTS.map((syp) => {
    const draftRate =
      selectedCode === BASE_CURRENCY_CODE ? 1 : Number(rateInput) || exchangeRate
    const locale = language === 'ar' ? 'ar-SY' : 'en-US'
    return {
      syp,
      formatted: formatCurrency(syp, {
        displayCode: selectedCode,
        exchangeRate: draftRate,
        locale,
        language,
      }),
    }
  })

  const currencyName =
    language === 'ar' ? selectedPreset.nameAr : selectedPreset.nameEn

  return (
    <div className="currency-settings-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FiDollarSign /> {t('currencySettings.title')}
          </h1>
          <p className="page-subtitle">{t('currencySettings.subtitle')}</p>
        </div>
        {saved && (
          <span className="save-badge">
            <FiSave /> {t('currencySettings.saved')}
          </span>
        )}
      </div>

      <div className="currency-grid">
        <div className="currency-card card base-currency-card">
          <h2>{t('currencySettings.baseCurrency')}</h2>
          <p className="card-desc">{t('currencySettings.baseCurrencyDesc')}</p>
          <div className="currency-highlight">
            <span className="currency-code">{baseCurrencyCode}</span>
            <span className="currency-name">{t('currencySettings.sypName')}</span>
            <span className="currency-symbol">ل.س / SYP</span>
          </div>
          <p className="info-note">{t('currencySettings.baseNote')}</p>
        </div>

        <div className="currency-card card">
          <h2>{t('currencySettings.displayCurrency')}</h2>
          <p className="card-desc">{t('currencySettings.displayCurrencyDesc')}</p>

          <div className="form-group">
            <label>{t('currencySettings.selectCurrency')}</label>
            <select
              className="filter-select"
              value={selectedCode}
              onChange={(e) => handleCurrencyChange(e.target.value)}
            >
              {presets.map((c) => (
                <option key={c.code} value={c.code}>
                  {language === 'ar' ? c.nameAr : c.nameEn} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {!isBaseCurrency && selectedCode !== BASE_CURRENCY_CODE && (
            <div className="form-group">
              <label>
                {t('currencySettings.exchangeRateLabel', {
                  currency: selectedCode,
                })}
              </label>
              <div className="rate-input-row">
                <span className="rate-prefix">1 {selectedCode} =</span>
                <input
                  type="number"
                  className="filter-select"
                  min="0.0001"
                  step="any"
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                />
                <span className="rate-suffix">{baseCurrencyCode}</span>
              </div>
              <p className="field-hint">{t('currencySettings.exchangeRateHint')}</p>
            </div>
          )}

          <div className="currency-actions">
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              <FiSave /> {t('common.save')}
            </button>
            <button type="button" className="btn btn-outline" onClick={handleReset}>
              <FiRotateCcw /> {t('currencySettings.resetToSyp')}
            </button>
          </div>
        </div>

        <div className="currency-card card preview-card">
          <h2>{t('currencySettings.preview')}</h2>
          <p className="card-desc">
            {isBaseCurrency && selectedCode === BASE_CURRENCY_CODE
              ? t('currencySettings.previewBase')
              : t('currencySettings.previewConverted', {
                  currency: currencyName,
                  rate: rateInput,
                })}
          </p>

          <div className="current-display">
            <span className="label">{t('currencySettings.currentDisplay')}</span>
            <strong>
              {language === 'ar' ? preset.nameAr : preset.nameEn} ({displayCode})
              {!isBaseCurrency && ` — 1 ${displayCode} = ${exchangeRate} ${baseCurrencyCode}`}
            </strong>
          </div>

          <table className="preview-table">
            <thead>
              <tr>
                <th>{t('currencySettings.amountInSyp')}</th>
                <th>{t('currencySettings.displayAmount')}</th>
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row) => (
                <tr key={row.syp}>
                  <td>{row.syp.toLocaleString(language === 'ar' ? 'ar-SY' : 'en-US')} ل.س</td>
                  <td className="converted">{row.formatted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="currency-card card info-card">
          <h2>{t('currencySettings.howItWorks')}</h2>
          <ul className="info-list">
            <li>{t('currencySettings.step1')}</li>
            <li>{t('currencySettings.step2')}</li>
            <li>{t('currencySettings.step3')}</li>
            <li>{t('currencySettings.step4')}</li>
          </ul>
          <p className="info-note">{t('currencySettings.apiNote')}</p>
        </div>
      </div>
    </div>
  )
}

export default CurrencySettings
