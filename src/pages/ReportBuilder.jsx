import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  FiArrowLeft,
  FiArrowRight,
  FiBarChart2,
  FiCheck,
  FiDatabase,
  FiDownload,
  FiEye,
  FiFilter,
  FiGrid,
  FiLayers,
  FiLink2,
  FiLoader,
  FiPlay,
  FiSave,
  FiSliders,
} from 'react-icons/fi'
import Chart from '../components/Chart/Chart'
import Table from '../components/Table/Table'
import reportBuilderService from '../services/reportBuilderService'
import { useTranslation } from '../hooks/useTranslation'
import { useLocale } from '../contexts/LocaleContext'
import {
  OPERATORS_BY_TYPE,
  attachVisualization,
  buildChartPropsFromResults,
  buildDefaultSelect,
  buildCurrentGovPriceFilter,
  buildJoinOn,
  CHART_TYPES,
  collectAvailableJoins,
  collectColumnGroups,
  computeGroupBy,
  defaultAlias,
  emptyQuery,
  emptyVisualization,
  extractVisualization,
  formatValidationItem,
  getColumnMeta,
  getDefaultVisualization,
  getGovernmentPricesJoin,
  getJoinsToRemoveWith,
  hasCurrentGovPriceFilter,
  resolveColumnId,
  resultsToTableColumns,
  stripQueryDefinition,
  suggestChartAxes,
} from '../utils/reportBuilderUtils'
import './ReportBuilder.css'

const STEP_KEYS = [
  'stepDataSource',
  'stepJoins',
  'stepColumns',
  'stepFilters',
  'stepGroupAggregate',
  'stepSortLimit',
  'stepChart',
  'stepPreview',
  'stepSaveExport',
]

const STEP_ICONS = [
  FiDatabase,
  FiLink2,
  FiGrid,
  FiFilter,
  FiLayers,
  FiSliders,
  FiBarChart2,
  FiEye,
  FiSave,
]

function FilterValueInput({ filter, colMeta, loadLookup, onChange, t }) {
  const [options, setOptions] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (colMeta?.lookupKey) {
      setLoadingOptions(true)
      loadLookup(colMeta.lookupKey)
        .then((items) => { if (!cancelled) setOptions(items) })
        .catch(() => { if (!cancelled) setOptions([]) })
        .finally(() => { if (!cancelled) setLoadingOptions(false) })
    } else if (colMeta?.enumValues) {
      setOptions(colMeta.enumValues.map((v) => ({ value: v, label: v })))
    } else {
      setOptions([])
    }
    return () => { cancelled = true }
  }, [colMeta, loadLookup])

  if (filter.operator === 'lastNDays') {
    return (
      <input
        type="number"
        min={1}
        max={365}
        value={filter.value ?? ''}
        onChange={(e) => onChange(Number(e.target.value) || '')}
        placeholder={t('reportBuilder.lastNDaysPlaceholder')}
      />
    )
  }

  if (colMeta?.type === 'boolean') {
    return (
      <select value={String(filter.value ?? '')} onChange={(e) => onChange(e.target.value === 'true')}>
        <option value="">—</option>
        <option value="true">{t('common.yes')}</option>
        <option value="false">{t('common.no')}</option>
      </select>
    )
  }

  if ((colMeta?.lookupKey || colMeta?.enumValues) && filter.operator === 'in') {
    return (
      <select
        multiple
        value={Array.isArray(filter.value) ? filter.value.map(String) : []}
        onChange={(e) => onChange(Array.from(e.target.selectedOptions).map((o) => o.value))}
        disabled={loadingOptions}
      >
        {options.map((o) => (
          <option key={o.value} value={String(o.value)}>{o.label}</option>
        ))}
      </select>
    )
  }

  if (colMeta?.lookupKey || colMeta?.enumValues) {
    return (
      <select
        value={filter.value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={loadingOptions}
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.value} value={String(o.value)}>{o.label}</option>
        ))}
      </select>
    )
  }

  if (filter.operator === 'between') {
    const arr = Array.isArray(filter.value) ? filter.value : ['', '']
    const inputType = ['date', 'datetime'].includes(colMeta?.type) ? 'date' : 'text'
    return (
      <>
        <input type={inputType} value={arr[0] || ''} onChange={(e) => onChange([e.target.value, arr[1]])} />
        <input type={inputType} value={arr[1] || ''} onChange={(e) => onChange([arr[0], e.target.value])} />
      </>
    )
  }

  const inputType = ['number', 'decimal'].includes(colMeta?.type) ? 'number' : 'text'
  return (
    <input
      type={inputType}
      value={filter.value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={t('reportBuilder.filterValuePlaceholder')}
    />
  )
}

function FilterStep({
  columnGroups,
  filters,
  onChange,
  loadLookup,
  primaryDetail,
  joinedSchemas,
  primaryAlias,
  joins,
  t,
  language,
}) {
  const allFilterable = columnGroups.flatMap((g) =>
    g.columns.filter((c) => c.filterable).map((c) => ({ ...c, groupLabel: g.label }))
  )

  const addFilter = () => onChange([...filters, { columnId: '', operator: 'eq', value: '' }])
  const updateFilter = (idx, patch) => onChange(filters.map((f, i) => (i === idx ? { ...f, ...patch } : f)))
  const removeFilter = (idx) => onChange(filters.filter((_, i) => i !== idx))

  const gpJoin = getGovernmentPricesJoin(joins)
  const showGovPriceHint = Boolean(gpJoin)
  const hasCurrentPriceFilter = gpJoin && hasCurrentGovPriceFilter(filters, gpJoin.alias)

  const addCurrentGovPriceFilter = () => {
    if (!gpJoin || hasCurrentPriceFilter) return
    onChange([...filters, buildCurrentGovPriceFilter(gpJoin.alias)])
  }

  return (
    <div className="builder-panel">
      <h3>{t('reportBuilder.filtersTitle')}</h3>
      <p className="builder-hint">{t('reportBuilder.filtersHint')}</p>

      {showGovPriceHint && (
        <div className="builder-tip">
          <p>{t('reportBuilder.govPriceFilterHint')}</p>
          {!hasCurrentPriceFilter && (
            <button type="button" className="rb-btn rb-btn-soft rb-btn-sm" onClick={addCurrentGovPriceFilter}>
              {t('reportBuilder.addCurrentGovPriceFilter')}
            </button>
          )}
          {hasCurrentPriceFilter && (
            <span className="tip-applied">{t('reportBuilder.currentGovPriceFilterApplied')}</span>
          )}
        </div>
      )}

      {filters.length === 0 && !showGovPriceHint && <p className="builder-empty">{t('reportBuilder.noFilters')}</p>}
      {filters.map((f, idx) => {
        const colMeta = getColumnMeta(f.columnId, primaryDetail, joinedSchemas, primaryAlias, joins)
        const ops = OPERATORS_BY_TYPE[colMeta?.type] || ['eq']
        return (
          <div key={idx} className="filter-row">
            <select
              value={f.columnId}
              onChange={(e) => updateFilter(idx, { columnId: e.target.value, operator: 'eq', value: '' })}
            >
              <option value="">{t('reportBuilder.selectColumn')}</option>
              {allFilterable.map((c) => (
                <option key={c.resolvedId} value={c.resolvedId}>
                  {c.groupLabel} — {language === 'ar' ? c.labelAr : c.label}
                </option>
              ))}
            </select>
            <select value={f.operator} onChange={(e) => updateFilter(idx, { operator: e.target.value, value: '' })}>
              {ops.map((op) => (
                <option key={op} value={op}>{t(`reportBuilder.operators.${op}`) || op}</option>
              ))}
            </select>
            {!['isNull', 'isNotNull'].includes(f.operator) && (
              <FilterValueInput
                filter={f}
                colMeta={colMeta}
                loadLookup={loadLookup}
                onChange={(value) => updateFilter(idx, { value })}
                t={t}
              />
            )}
            <button type="button" className="icon-btn" onClick={() => removeFilter(idx)} aria-label={t('common.delete')}>×</button>
          </div>
        )
      })}
      <button type="button" className="rb-btn rb-btn-soft" onClick={addFilter}>{t('reportBuilder.addFilter')}</button>
    </div>
  )
}

function AggregateStep({ select, primaryDetail, joinedSchemas, primaryAlias, joins, onChange, t, language }) {
  const updateSelect = (idx, patch) => {
    const next = select.map((s, i) => (i === idx ? { ...s, ...patch } : s))
    onChange(next, computeGroupBy(next))
  }

  return (
    <div className="builder-panel">
      <h3>{t('reportBuilder.groupAggregateTitle')}</h3>
      <p className="builder-hint">{t('reportBuilder.groupAggregateHint')}</p>
      {select.length === 0 && <p className="builder-empty">{t('reportBuilder.selectColumnsFirst')}</p>}
      {select.map((s, idx) => {
        const colName = s.columnId.split('.').pop()
        const colMeta = getColumnMeta(s.columnId, primaryDetail, joinedSchemas, primaryAlias, joins)
        const label = language === 'ar' ? colMeta?.labelAr : colMeta?.label
        return (
          <div key={s.columnId} className="aggregate-row">
            <span className="aggregate-label">{s.alias || label || colName}</span>
            {colMeta?.timeGroupable && (
              <select value={s.timeGroup || ''} onChange={(e) => updateSelect(idx, { timeGroup: e.target.value || undefined })}>
                <option value="">{t('reportBuilder.noTimeGroup')}</option>
                {['day', 'week', 'month', 'quarter', 'year'].map((tg) => (
                  <option key={tg} value={tg}>{t(`reportBuilder.timeGroups.${tg}`)}</option>
                ))}
              </select>
            )}
            {colMeta?.aggregatable && (
              <select value={s.aggregate || ''} onChange={(e) => updateSelect(idx, { aggregate: e.target.value || undefined })}>
                <option value="">{t('reportBuilder.noAggregate')}</option>
                {(colMeta.allowedAggregates || []).map((a) => (
                  <option key={a} value={a}>{a.toUpperCase()}</option>
                ))}
              </select>
            )}
          </div>
        )
      })}
    </div>
  )
}

function ChartStep({ visualization, onChange, select, primaryDetail, joinedSchemas, primaryAlias, joins, t, language }) {
  const { xCandidates, yCandidates } = useMemo(
    () => suggestChartAxes(select, primaryDetail, joinedSchemas, primaryAlias, joins),
    [select, primaryDetail, joinedSchemas, primaryAlias, joins]
  )

  const canChart = xCandidates.length > 0 && yCandidates.length > 0

  const applyDefaults = () => getDefaultVisualization(
    select,
    primaryDetail,
    joinedSchemas,
    primaryAlias,
    joins
  )

  const handleToggle = (enabled) => {
    if (enabled && (!visualization.xAxis || !visualization.yAxis)) {
      onChange(applyDefaults())
      return
    }
    onChange({ ...visualization, enabled })
  }

  return (
    <div className="builder-panel">
      <h3>{t('reportBuilder.chartTitle')}</h3>
      <p className="builder-hint">{t('reportBuilder.chartHint')}</p>

      {!canChart && (
        <p className="builder-empty">{t('reportBuilder.chartNotAvailable')}</p>
      )}

      {canChart && (
        <>
          <label className="chart-toggle">
            <input
              type="checkbox"
              checked={visualization.enabled}
              onChange={(e) => handleToggle(e.target.checked)}
            />
            <span>{t('reportBuilder.enableChart')}</span>
          </label>

          {visualization.enabled && (
            <div className="chart-config-grid">
              <label>
                {t('reportBuilder.chartType')}
                <div className="chart-type-grid">
                  {CHART_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`chart-type-btn ${visualization.chartType === type ? 'selected' : ''}`}
                      onClick={() => onChange({ ...visualization, chartType: type })}
                    >
                      {t(`reportBuilder.chartTypes.${type}`)}
                    </button>
                  ))}
                </div>
              </label>

              <label>
                {t('reportBuilder.xAxis')}
                <select
                  value={visualization.xAxis}
                  onChange={(e) => onChange({ ...visualization, xAxis: e.target.value })}
                >
                  <option value="">—</option>
                  {xCandidates.map((c) => (
                    <option key={c.alias} value={c.alias}>
                      {language === 'ar' ? c.labelAr || c.label : c.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                {t('reportBuilder.yAxis')}
                <select
                  value={visualization.yAxis}
                  onChange={(e) => onChange({ ...visualization, yAxis: e.target.value })}
                >
                  <option value="">—</option>
                  {yCandidates.map((c) => (
                    <option key={c.alias} value={c.alias}>
                      {language === 'ar' ? c.labelAr || c.label : c.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const ReportBuilder = () => {
  const { t } = useTranslation()
  const { language } = useLocale()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const lookupCacheRef = useRef({})

  const [step, setStep] = useState(0)
  const [tables, setTables] = useState([])
  const [tableDetail, setTableDetail] = useState(null)
  const [joinedSchemas, setJoinedSchemas] = useState({})
  const [query, setQuery] = useState(emptyQuery())
  const [visualization, setVisualization] = useState(emptyVisualization())
  const [reportName, setReportName] = useState('')
  const [savedReportId, setSavedReportId] = useState(null)
  const [results, setResults] = useState(null)
  const [validation, setValidation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingSchema, setLoadingSchema] = useState(false)
  const [error, setError] = useState(null)

  const primaryTableId = query.sources[0]?.tableId
  const primaryAlias = query.sources[0]?.alias

  useEffect(() => {
    reportBuilderService.getSchema()
      .then((res) => setTables(res?.data?.tables || []))
      .catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    if (!editId) return
    setLoading(true)
    reportBuilderService.getSaved(editId)
      .then((res) => {
        const item = res?.data
        if (!item?.definition) return
        setSavedReportId(item.id)
        setReportName(item.name || '')
        setVisualization(extractVisualization(item.definition))
        setQuery(stripQueryDefinition(item.definition))
        setResults(null)
        setValidation(null)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [editId])

  useEffect(() => {
    if (!primaryTableId) {
      setTableDetail(null)
      return
    }
    setLoadingSchema(true)
    reportBuilderService.getTableSchema(primaryTableId)
      .then((res) => setTableDetail(res?.data || null))
      .catch((e) => setError(e.message))
      .finally(() => setLoadingSchema(false))
  }, [primaryTableId])

  useEffect(() => {
    const joinIds = query.joins.map((j) => j.targetTableId)
    if (!joinIds.length) {
      setJoinedSchemas({})
      return
    }
    Promise.all(
      joinIds.map((id) =>
        reportBuilderService.getTableSchema(id)
          .then((res) => [id, res?.data])
          .catch(() => [id, null])
      )
    ).then((entries) => {
      const map = {}
      entries.forEach(([id, data]) => { if (data) map[id] = data })
      setJoinedSchemas(map)
    })
  }, [query.joins])

  const loadLookup = useCallback(async (lookupKey) => {
    if (!lookupKey) return []
    if (lookupCacheRef.current[lookupKey]) return lookupCacheRef.current[lookupKey]
    const res = await reportBuilderService.getLookup(lookupKey, { page: 1, pageSize: 200 })
    const items = res?.data?.items || []
    lookupCacheRef.current[lookupKey] = items
    return items
  }, [])

  const columnGroups = useMemo(
    () => collectColumnGroups(tableDetail, joinedSchemas, primaryTableId, primaryAlias, query.joins, language),
    [tableDetail, joinedSchemas, primaryTableId, primaryAlias, query.joins, language]
  )

  const availableJoins = useMemo(
    () => collectAvailableJoins(tableDetail, joinedSchemas, primaryTableId, query.joins),
    [tableDetail, joinedSchemas, primaryTableId, query.joins]
  )

  const showGovPriceJoinHint = useMemo(
    () => availableJoins.some((j) => j.rel.targetTable === 'government_prices')
      || query.joins.some((j) => j.targetTableId === 'government_prices'),
    [availableJoins, query.joins]
  )

  const buildPayload = useCallback(() => stripQueryDefinition(query), [query])

  const buildSaveDefinition = useCallback(
    () => attachVisualization(query, visualization),
    [query, visualization]
  )

  const selectPrimaryTable = (tableId) => {
    const alias = defaultAlias(tableId)
    setSavedReportId(null)
    setReportName('')
    setVisualization(emptyVisualization())
    setResults(null)
    setValidation(null)
    setError(null)
    setQuery({ ...emptyQuery(), sources: [{ tableId, alias }] })
    reportBuilderService.getTableSchema(tableId).then((res) => {
      const detail = res?.data
      if (!detail) return
      const defaultSelect = buildDefaultSelect(detail, tableId, alias)
      if (defaultSelect.length) {
        setQuery((q) => ({ ...q, select: defaultSelect, groupBy: computeGroupBy(defaultSelect) }))
      }
    }).catch(() => {})
  }

  const toggleJoin = (joinOption) => {
    const { rel } = joinOption
    const targetId = rel.targetTable
    const exists = query.joins.some((j) => j.targetTableId === targetId)
    if (exists) {
      setQuery((q) => {
        const removeIds = getJoinsToRemoveWith(targetId, q.joins)
        const remaining = q.joins.filter((j) => !removeIds.has(j.targetTableId))
        const removedPrefixes = q.joins
          .filter((j) => removeIds.has(j.targetTableId))
          .map((j) => `${j.alias}.`)

        return {
          ...q,
          joins: remaining,
          select: q.select.filter((s) => !removedPrefixes.some((p) => s.columnId.startsWith(p))),
          filters: q.filters.filter((f) => !removedPrefixes.some((p) => f.columnId.startsWith(p))),
        }
      })
      return
    }
    const alias = defaultAlias(targetId)
    setQuery((q) => ({
      ...q,
      joins: [...q.joins, {
        targetTableId: targetId,
        alias,
        type: rel.joinType || 'left',
        on: buildJoinOn(rel, alias, primaryTableId, primaryAlias, q.joins),
      }],
    }))
  }

  const toggleColumn = (col) => {
    const resolvedId = col.resolvedId || resolveColumnId(col, primaryTableId, primaryAlias, query.joins)
    const exists = query.select.some((s) => s.columnId === resolvedId)
    if (exists) {
      setQuery((q) => {
        const select = q.select.filter((s) => s.columnId !== resolvedId)
        return { ...q, select, groupBy: computeGroupBy(select) }
      })
    } else {
      setQuery((q) => {
        const select = [...q.select, { columnId: resolvedId, alias: col.name }]
        const next = { ...q, select, groupBy: computeGroupBy(select) }
        return next
      })
      setVisualization((prev) => {
        if (prev.enabled && prev.xAxis && prev.yAxis) return prev
        return getDefaultVisualization(
          [...query.select, { columnId: resolvedId, alias: col.name }],
          tableDetail,
          joinedSchemas,
          primaryAlias,
          query.joins
        )
      })
    }
  }

  const updateColumnAlias = (columnId, alias) => {
    setQuery((q) => {
      const select = q.select.map((s) => (
        s.columnId === columnId
          ? { ...s, alias: alias.trim() || s.columnId.split('.').pop() }
          : s
      ))
      return { ...q, select, groupBy: computeGroupBy(select) }
    })
  }

  const runValidate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await reportBuilderService.validate(buildPayload())
      setValidation(res?.data || null)
    } catch (e) {
      setError(e.message)
      setValidation(null)
    } finally {
      setLoading(false)
    }
  }

  const runPreview = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await reportBuilderService.preview(buildPayload())
      setResults(res?.data || null)
    } catch (e) {
      setError(e.message)
      setResults(null)
    } finally {
      setLoading(false)
    }
  }

  const runExecute = async (page = query.pagination.page) => {
    setLoading(true)
    setError(null)
    const payload = { ...buildPayload(), pagination: { ...query.pagination, page } }
    try {
      const res = await reportBuilderService.execute(payload)
      setResults(res?.data || null)
      setQuery((q) => ({ ...q, pagination: { ...q.pagination, page } }))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!reportName.trim()) {
      setError(t('reportBuilder.nameRequired'))
      return
    }
    setLoading(true)
    setError(null)
    try {
      if (savedReportId) {
        await reportBuilderService.updateSaved(savedReportId, reportName.trim(), buildSaveDefinition())
      } else {
        const res = await reportBuilderService.save(reportName.trim(), buildSaveDefinition())
        setSavedReportId(res?.data?.id ?? null)
      }
      navigate('/reports/saved')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setLoading(true)
    setError(null)
    try {
      await reportBuilderService.exportCsv(buildPayload())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const tableColumns = useMemo(() => resultsToTableColumns(results?.columns), [results])
  const chartProps = useMemo(
    () => buildChartPropsFromResults(results, visualization),
    [results, visualization]
  )

  const renderStep = () => {
    if (loadingSchema && step <= 2) {
      return (
        <div className="builder-panel builder-loading">
          <FiLoader className="spin" /> {t('common.loading')}
        </div>
      )
    }

    switch (step) {
      case 0:
        return (
          <div className="builder-panel">
            <h3>{t('reportBuilder.dataSourceTitle')}</h3>
            <p className="builder-hint">{t('reportBuilder.dataSourceHint')}</p>
            <div className="table-grid">
              {tables.map((tbl) => (
                <button
                  key={tbl.id}
                  type="button"
                  className={`table-card ${primaryTableId === tbl.id ? 'selected' : ''}`}
                  onClick={() => selectPrimaryTable(tbl.id)}
                >
                  <strong>{language === 'ar' ? tbl.nameAr : tbl.name}</strong>
                  <span className="table-category">{tbl.category}</span>
                  <small>{tbl.description}</small>
                </button>
              ))}
            </div>
            {tables.length === 0 && !error && <p className="builder-empty">{t('common.loading')}</p>}
          </div>
        )
      case 1:
        return (
          <div className="builder-panel">
            <h3>{t('reportBuilder.joinsTitle')}</h3>
            <p className="builder-hint">{t('reportBuilder.joinsHint')}</p>

            {showGovPriceJoinHint && (
              <div className="builder-tip">
                <p>{t('reportBuilder.govPriceJoinHint')}</p>
              </div>
            )}

            {query.joins.length > 0 && (
              <div className="active-joins">
                <h4>{t('reportBuilder.activeJoins')}</h4>
                {query.joins.map((j) => {
                  const schema = joinedSchemas[j.targetTableId]
                  const label = language === 'ar' ? schema?.table?.nameAr : schema?.table?.name
                  return (
                    <label key={j.targetTableId} className="join-row active">
                      <input
                        type="checkbox"
                        checked
                        onChange={() => toggleJoin({ rel: { targetTable: j.targetTableId } })}
                      />
                      <span>{label || j.targetTableId} ({j.type})</span>
                    </label>
                  )
                })}
              </div>
            )}

            {availableJoins.length === 0 && query.joins.length === 0 && (
              <p className="builder-empty">{t('reportBuilder.noJoins')}</p>
            )}

            {availableJoins.length > 0 && (
              <>
                <h4>{t('reportBuilder.availableJoins')}</h4>
                {availableJoins.map((opt) => {
                  const sourceLabel = language === 'ar' ? opt.sourceNameAr : opt.sourceName
                  const joinKey = `${opt.sourceTableId}-${opt.rel.targetTable}`
                  return (
                    <label key={joinKey} className="join-row">
                      <input type="checkbox" checked={false} onChange={() => toggleJoin(opt)} />
                      <span>
                        {opt.rel.label} → {opt.rel.targetTable} ({opt.rel.joinType || 'left'})
                        {opt.sourceTableId !== primaryTableId && (
                          <small className="join-via">
                            {' '}— {t('reportBuilder.viaTable', { table: sourceLabel })}
                          </small>
                        )}
                      </span>
                    </label>
                  )
                })}
              </>
            )}

            {query.joins.length >= 3 && (
              <p className="builder-warn">{t('reportBuilder.maxJoinsWarning')}</p>
            )}
          </div>
        )
      case 2:
        return (
          <div className="builder-panel">
            <h3>{t('reportBuilder.columnsTitle')}</h3>
            <p className="builder-hint">{t('reportBuilder.columnsHint')}</p>
            {columnGroups.map((group) => (
              <div key={group.key} className="column-group">
                <h4>{group.label}</h4>
                <div className="column-grid">
                  {group.columns.map((col) => {
                    const checked = query.select.some((s) => s.columnId === col.resolvedId)
                    const selected = query.select.find((s) => s.columnId === col.resolvedId)
                    return (
                      <div key={col.resolvedId} className={`column-item ${checked ? 'selected' : ''}`}>
                        <label className="column-check">
                          <input type="checkbox" checked={checked} onChange={() => toggleColumn(col)} />
                          <span>{language === 'ar' ? col.labelAr : col.label}</span>
                          <small>{col.type}</small>
                        </label>
                        {checked && (
                          <input
                            className="alias-input"
                            value={selected?.alias || ''}
                            onChange={(e) => updateColumnAlias(col.resolvedId, e.target.value)}
                            placeholder={t('reportBuilder.columnAlias')}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            {query.select.length > 0 && (
              <p className="builder-meta">{t('reportBuilder.selectedCount', { count: query.select.length })}</p>
            )}
          </div>
        )
      case 3:
        return (
          <FilterStep
            columnGroups={columnGroups}
            filters={query.filters}
            onChange={(filters) => setQuery((q) => ({ ...q, filters }))}
            loadLookup={loadLookup}
            primaryDetail={tableDetail}
            joinedSchemas={joinedSchemas}
            primaryAlias={primaryAlias}
            joins={query.joins}
            t={t}
            language={language}
          />
        )
      case 4:
        return (
          <AggregateStep
            select={query.select}
            primaryDetail={tableDetail}
            joinedSchemas={joinedSchemas}
            primaryAlias={primaryAlias}
            joins={query.joins}
            onChange={(select, groupBy) => setQuery((q) => ({ ...q, select, groupBy }))}
            t={t}
            language={language}
          />
        )
      case 5:
        return (
          <div className="builder-panel">
            <h3>{t('reportBuilder.sortLimitTitle')}</h3>
            <div className="sort-grid">
              <label>
                {t('reportBuilder.pageSize')}
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={query.pagination.pageSize}
                  onChange={(e) => setQuery((q) => ({
                    ...q,
                    pagination: {
                      ...q.pagination,
                      pageSize: Math.min(500, Math.max(1, Number(e.target.value) || 50)),
                    },
                  }))}
                />
              </label>
              <label>
                {t('reportBuilder.sortColumn')}
                <select
                  value={query.orderBy[0]?.columnId || ''}
                  onChange={(e) => setQuery((q) => ({
                    ...q,
                    orderBy: e.target.value
                      ? [{ columnId: e.target.value, direction: q.orderBy[0]?.direction || 'desc' }]
                      : [],
                  }))}
                >
                  <option value="">—</option>
                  {query.select.map((s) => {
                    const alias = s.alias || s.columnId.split('.').pop()
                    return <option key={s.columnId} value={alias}>{alias}</option>
                  })}
                </select>
              </label>
              <label>
                {t('reportBuilder.sortDirection')}
                <select
                  value={query.orderBy[0]?.direction || 'desc'}
                  onChange={(e) => setQuery((q) => ({
                    ...q,
                    orderBy: q.orderBy.length ? [{ ...q.orderBy[0], direction: e.target.value }] : [],
                  }))}
                >
                  <option value="desc">{t('common.desc')}</option>
                  <option value="asc">{t('common.asc')}</option>
                </select>
              </label>
            </div>
          </div>
        )
      case 6:
        return (
          <ChartStep
            visualization={visualization}
            onChange={setVisualization}
            select={query.select}
            primaryDetail={tableDetail}
            joinedSchemas={joinedSchemas}
            primaryAlias={primaryAlias}
            joins={query.joins}
            t={t}
            language={language}
          />
        )
      case 7:
        return (
          <div className="builder-panel">
            <h3>{t('reportBuilder.previewTitle')}</h3>
            <div className="preview-actions">
              <button type="button" className="rb-btn rb-btn-soft" onClick={runValidate} disabled={loading || !query.select.length}>
                {loading ? <FiLoader className="spin" /> : null}
                {t('reportBuilder.validate')}
              </button>
              <button type="button" className="rb-btn rb-btn-primary" onClick={runPreview} disabled={loading || !query.select.length}>
                <FiPlay /> {t('reportBuilder.runPreview')}
              </button>
              <button type="button" className="rb-btn rb-btn-soft" onClick={() => runExecute(1)} disabled={loading || !query.select.length}>
                {t('reportBuilder.runFull')}
              </button>
            </div>
            {validation && (
              <div className={`validation-box ${validation.isValid ? 'ok' : 'err'}`}>
                <strong>{validation.isValid ? t('reportBuilder.queryValid') : t('reportBuilder.queryInvalid')}</strong>
                {(validation.errors || []).map((e, i) => (
                  <div key={i}>{formatValidationItem(e)}</div>
                ))}
                {(validation.warnings || []).map((w, i) => (
                  <div key={`w-${i}`} className="warn">{formatValidationItem(w)}</div>
                ))}
                {validation.estimatedRowCount != null && (
                  <p className="builder-meta">
                    {t('reportBuilder.estimatedRows', { count: validation.estimatedRowCount })}
                  </p>
                )}
              </div>
            )}
            {results && (
              <>
                {chartProps && (
                  <div className="preview-chart">
                    <Chart {...chartProps} height={280} allowTypeChange={false} />
                  </div>
                )}
                <Table columns={tableColumns} data={results.rows || []} />
                <div className="preview-footer">
                  <p className="preview-meta">
                    {t('reportBuilder.showingRows', {
                      shown: results.rows?.length || 0,
                      total: results.pagination?.totalCount ?? results.rows?.length ?? 0,
                    })}
                  </p>
                  {results.pagination?.totalPages > 1 && (
                    <div className="pagination-row">
                      <button
                        type="button"
                        className="rb-btn rb-btn-soft"
                        disabled={loading || results.pagination.page <= 1}
                        onClick={() => runExecute(results.pagination.page - 1)}
                      >
                        {t('common.previous')}
                      </button>
                      <span>
                        {t('common.page')} {results.pagination.page} {t('common.of')} {results.pagination.totalPages}
                      </span>
                      <button
                        type="button"
                        className="rb-btn rb-btn-soft"
                        disabled={loading || results.pagination.page >= results.pagination.totalPages}
                        onClick={() => runExecute(results.pagination.page + 1)}
                      >
                        {t('common.next')}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )
      case 8:
        return (
          <div className="builder-panel">
            <h3>{t('reportBuilder.saveExportTitle')}</h3>
            <label className="field-label">
              {t('reportBuilder.reportName')}
              <input
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder={t('reportBuilder.reportNamePlaceholder')}
              />
            </label>
            <div className="preview-actions">
              <button type="button" className="rb-btn rb-btn-primary" onClick={handleSave} disabled={loading || !query.select.length}>
                <FiSave /> {savedReportId ? t('reportBuilder.updateSaved') : t('reportBuilder.saveDefinition')}
              </button>
              <button type="button" className="rb-btn rb-btn-soft" onClick={handleExport} disabled={loading || !query.select.length}>
                <FiDownload /> {t('reportBuilder.exportCsv')}
              </button>
            </div>
            <p className="builder-hint">
              {t('reportBuilder.afterSaveHint')}{' '}
              <Link to="/reports/saved">{t('savedReports.title')}</Link>
            </p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="report-builder-page">
      <header className="rb-header">
        <div className="rb-header-main">
          <Link to="/reports" className="back-link">
            <FiArrowLeft /> {t('nav.govReports')}
          </Link>
          <h1 className="page-title">{t('reportBuilder.title')}</h1>
          <p className="page-subtitle">{t('reportBuilder.subtitle')}</p>
        </div>
        <Link to="/reports/saved" className="rb-btn rb-btn-outline">
          {t('savedReports.title')}
        </Link>
      </header>

      <div className="wizard-progress">
        <div
          className="wizard-progress-fill"
          style={{ width: `${Math.round((step / (STEP_KEYS.length - 1)) * 100)}%` }}
        />
      </div>

      <nav className="builder-steps" aria-label="Report builder steps">
        {STEP_KEYS.map((key, i) => {
          const Icon = STEP_ICONS[i]
          const state = i === step ? 'active' : i < step ? 'done' : 'pending'
          return (
            <button
              key={key}
              type="button"
              className={`builder-step ${state}`}
              onClick={() => setStep(i)}
              disabled={i > 0 && !primaryTableId}
            >
              <span className="step-badge">
                {i < step ? <FiCheck size={14} /> : i + 1}
              </span>
              <span className="step-icon"><Icon size={16} /></span>
              <span className="step-label">{t(`reportBuilder.${key}`)}</span>
            </button>
          )
        })}
      </nav>

      <div className="wizard-shell">
        <div className="wizard-step-banner">
          <span className="step-counter">
            {t('reportBuilder.stepOf', { current: step + 1, total: STEP_KEYS.length })}
          </span>
          <h2>{t(`reportBuilder.${STEP_KEYS[step]}`)}</h2>
        </div>

        {error && <div className="builder-error">{error}</div>}

        <div className="wizard-content">{renderStep()}</div>

        <footer className="wizard-footer">
          <button
            type="button"
            className="rb-btn rb-btn-ghost"
            disabled={step === 0}
            onClick={() => setStep((s) => s - 1)}
          >
            <FiArrowLeft /> {t('common.previous')}
          </button>
          <span className="footer-progress">{step + 1} / {STEP_KEYS.length}</span>
          <button
            type="button"
            className="rb-btn rb-btn-primary"
            disabled={step >= STEP_KEYS.length - 1 || (step === 0 && !primaryTableId)}
            onClick={() => setStep((s) => Math.min(s + 1, STEP_KEYS.length - 1))}
          >
            {t('common.next')} <FiArrowRight />
          </button>
        </footer>
      </div>
    </div>
  )
}

export default ReportBuilder
