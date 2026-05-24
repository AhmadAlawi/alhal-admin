import { describe, expect, it } from 'vitest'
import {
  buildJoinOn,
  collectAvailableJoins,
  defaultAlias,
  getJoinsToRemoveWith,
} from './reportBuilderUtils'

describe('reportBuilderUtils joins', () => {
  it('builds chained join ON for products → government_prices', () => {
    const rel = {
      targetTable: 'government_prices',
      joinType: 'left',
      fromColumn: 'products.ProductId',
      toColumn: 'government_prices.ProductId',
      label: 'Government price',
    }
    const gpAlias = defaultAlias('government_prices')
    const on = buildJoinOn(rel, gpAlias, 'products', 'p', [
      { targetTableId: 'products', alias: 'p', type: 'left', on: { from: 'st.ProductId', to: 'p.ProductId' } },
    ])
    expect(on).toEqual({
      from: 'p.ProductId',
      to: 'gp.ProductId',
    })
  })

  it('collects joins from primary and joined table schemas', () => {
    const primaryDetail = {
      table: { id: 'sales_transactions', name: 'Sales' },
      relationships: [
        { targetTable: 'products', fromColumn: 'sales_transactions.ProductId', toColumn: 'products.ProductId', label: 'Product' },
      ],
    }
    const joinedSchemas = {
      products: {
        table: { id: 'products', name: 'Products' },
        relationships: [
          { targetTable: 'government_prices', fromColumn: 'products.ProductId', toColumn: 'government_prices.ProductId', label: 'Government price' },
        ],
      },
    }
    const joins = [{ targetTableId: 'products', alias: 'p' }]
    const available = collectAvailableJoins(primaryDetail, joinedSchemas, 'sales_transactions', joins)
    expect(available.map((a) => a.rel.targetTable)).toEqual(['government_prices'])
    expect(available[0].sourceTableId).toBe('products')
  })

  it('cascades join removal when parent is removed', () => {
    const joins = [
      { targetTableId: 'products', alias: 'p', on: { from: 'st.ProductId', to: 'p.ProductId' } },
      { targetTableId: 'government_prices', alias: 'gp', on: { from: 'p.ProductId', to: 'gp.ProductId' } },
    ]
    const remove = getJoinsToRemoveWith('products', joins)
    expect([...remove]).toEqual(['products', 'government_prices'])
  })
})
