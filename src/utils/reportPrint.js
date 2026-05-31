import authService from '../services/authService'
import { getPrintBranding } from '../config/printBranding'

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function tableHtml(columns, rows) {
  if (!columns?.length || !rows?.length) return ''
  const head = columns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')
  const body = rows
    .map(
      (row) =>
        `<tr>${columns.map((c) => `<td>${escapeHtml(row[c.accessor])}</td>`).join('')}</tr>`
    )
    .join('')
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
}

function resolveUserName(language) {
  const user = authService.getUser?.()
  if (!user) return language === 'ar' ? 'مستخدم النظام' : 'System user'
  return (
    user.fullName ||
    user.name ||
    user.displayName ||
    user.userName ||
    user.email ||
    (language === 'ar' ? 'مستخدم النظام' : 'System user')
  )
}

function buildPrintStyles(isRtl) {
  return `
    @page { margin: 18mm 14mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      color: #0b1c30;
      margin: 0;
      padding: 0;
      direction: ${isRtl ? 'rtl' : 'ltr'};
    }
    .print-page {
      max-width: 900px;
      margin: 0 auto;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .print-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding-bottom: 16px;
      border-bottom: 3px solid #15803d;
      margin-bottom: 20px;
    }
    .print-logo {
      width: 64px;
      height: 64px;
      object-fit: contain;
      flex-shrink: 0;
    }
    .print-brand h1 {
      margin: 0;
      font-size: 22px;
      color: #15803d;
    }
    .print-brand p {
      margin: 4px 0 0;
      font-size: 12px;
      color: #6f7a6e;
    }
    .print-meta {
      margin-bottom: 20px;
    }
    .print-meta h2 {
      margin: 0 0 6px;
      font-size: 18px;
      color: #0b1c30;
    }
    .print-meta .date {
      font-size: 13px;
      color: #6f7a6e;
    }
    .chart {
      margin: 16px 0 20px;
      text-align: center;
      page-break-inside: avoid;
    }
    .chart img {
      max-width: 100%;
      height: auto;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-top: 8px;
    }
    th, td {
      border: 1px solid #d1d5db;
      padding: 8px 10px;
      text-align: ${isRtl ? 'right' : 'left'};
    }
    th {
      background: #f0fdf4;
      color: #15803d;
      font-weight: 600;
    }
    tr:nth-child(even) td { background: #fafafa; }
    .print-footer {
      margin-top: auto;
      padding-top: 28px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 24px;
      page-break-inside: avoid;
    }
    .print-user {
      font-size: 13px;
      color: #374151;
    }
    .print-user strong {
      display: block;
      font-size: 14px;
      color: #0b1c30;
      margin-bottom: 4px;
    }
    .print-stamp {
      width: 150px;
      height: 150px;
      border: 3px double #15803d;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 12px;
      color: #15803d;
      transform: rotate(-8deg);
      flex-shrink: 0;
    }
    .print-stamp-org {
      font-size: 9px;
      font-weight: 700;
      line-height: 1.3;
      margin-bottom: 6px;
    }
    .print-stamp-text {
      font-size: 10px;
      line-height: 1.35;
      font-weight: 600;
    }
    .print-stamp-date {
      font-size: 8px;
      margin-top: 6px;
      opacity: 0.85;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `
}

export function captureChartFromContainer(containerEl) {
  const canvas = containerEl?.querySelector('canvas')
  if (!canvas) return null
  try {
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

export function printReport({
  title,
  columns,
  rows,
  chartImageUrl,
  generatedAt,
  language = 'ar',
}) {
  const win = window.open('', '_blank', 'width=900,height=760')
  if (!win) return false

  const isRtl = language === 'ar'
  const branding = getPrintBranding(language)
  const userName = resolveUserName(language)
  const today = generatedAt || new Date().toLocaleDateString(isRtl ? 'ar-SY' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const logoSrc = branding.logoUrl.startsWith('http')
    ? branding.logoUrl
    : `${window.location.origin}${branding.logoUrl}`

  const chartBlock = chartImageUrl
    ? `<div class="chart"><img src="${chartImageUrl}" alt="chart" /></div>`
    : ''

  const labels = {
    printedBy: isRtl ? 'أعدّ التقرير' : 'Prepared by',
    reportDate: isRtl ? 'تاريخ التقرير' : 'Report date',
  }

  const html = `<!DOCTYPE html>
<html lang="${isRtl ? 'ar' : 'en'}" dir="${isRtl ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>${buildPrintStyles(isRtl)}</style>
</head>
<body>
  <div class="print-page">
    <header class="print-header">
      <img class="print-logo" src="${escapeHtml(logoSrc)}" alt="${escapeHtml(branding.platformName)}" />
      <div class="print-brand">
        <h1>${escapeHtml(branding.platformName)}</h1>
        <p>${escapeHtml(branding.platformSubtitle)}</p>
      </div>
    </header>

    <section class="print-meta">
      <h2>${escapeHtml(title)}</h2>
      <div class="date">${escapeHtml(labels.reportDate)}: ${escapeHtml(today)}</div>
    </section>

    ${chartBlock}
    ${tableHtml(columns, rows)}

    <footer class="print-footer">
      <div class="print-user">
        <strong>${escapeHtml(labels.printedBy)}</strong>
        ${escapeHtml(userName)}
      </div>
      <div class="print-stamp" aria-label="stamp">
        <div class="print-stamp-org">${escapeHtml(branding.stampOrg)}</div>
        <div class="print-stamp-text">${escapeHtml(branding.stampText)}</div>
        <div class="print-stamp-date">${escapeHtml(today)}</div>
      </div>
    </footer>
  </div>
  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
</body>
</html>`

  win.document.write(html)
  win.document.close()
  return true
}
