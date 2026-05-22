import React from 'react'
import { formatCellValue } from '../../utils/apiNormalize'
import './Table.css'

const Table = ({ columns, data }) => {
  const rows = Array.isArray(data) ? data : []

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column, colIndex) => {
                const raw = row[column.accessor]
                const content = column.render
                  ? column.render(raw, row)
                  : formatCellValue(raw)
                return <td key={colIndex}>{content}</td>
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Table

