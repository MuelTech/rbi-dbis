# Transaction Section Design

## Overview

Replace the mock data in TransactionSection with real transaction data from the Order table. Display document issuance transactions with filtering by time period (Day/Week/Month/Custom).

## Current State

- TransactionSection.tsx uses hardcoded MOCK_DATA
- No API integration for transaction data
- CSV/PDF export buttons are non-functional

## Design Decisions

### Table Headers

| Header | Width | Source | Format |
|--------|-------|--------|--------|
| OR Number | 15% | Order.orNumber | 2026-418-00001 |
| Date Issued | 15% | Order.orderDate | DD/MM/YYYY |
| Personnel | 12% | User.userInfo | First Last |
| Resident | 18% | Resident | First Last |
| Type | 20% | DocumentType.documentName | Full name |
| Fee | 10% | Order.amount | ₱XXX |
| Action | 10% | - | View button |

### Time Period Filters

| Filter | Query | Description |
|--------|-------|-------------|
| Day | `?period=day` | Today's transactions |
| Week | `?period=week` | Last 7 days |
| Month | `?period=month` | Last 30 days |
| Custom | `?from=DATE&to=DATE` | Custom date range |

### Summary Cards

| Card | Source | Description |
|------|--------|-------------|
| Accumulated Fee | SUM(amount) | Total fees collected |
| Total Transactions | COUNT(*) | Number of transactions |

## API Endpoint

### GET /api/dashboard/transactions

Query Parameters:
- `period`: day | week | month (optional)
- `from`: ISO date string (optional, for custom range)
- `to`: ISO date string (optional, for custom range)
- `page`: number (default: 1)
- `pageSize`: number (default: 20)

Response:
```json
{
  "data": [
    {
      "id": "cuid",
      "orNumber": "2026-418-00001",
      "orderDate": "2026-06-29T00:00:00.000Z",
      "amount": 500,
      "personnel": "Admin User",
      "resident": "Juan Dela Cruz",
      "documentType": "Business Permit"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  },
  "summary": {
    "accumulatedFee": 50000,
    "totalTransactions": 100
  }
}
```

## Files to Modify

### Backend
1. `packages/server/src/controllers/dashboardController.ts` — Add getTransactions function
2. `packages/server/src/routes/dashboard.ts` — Add /transactions route

### Frontend
1. `packages/desktop/src/services/dashboard.ts` — Add getTransactions service
2. `packages/desktop/src/components/layout/TransactionSection.tsx` — Replace mock data with API calls

## Data Flow

1. User selects time period (Day/Week/Month/Custom)
2. Frontend calls GET /api/dashboard/transactions with period params
3. Backend queries Order table with date filters
4. Backend returns transactions with summary
5. Frontend displays data in table with pagination

## Testing

1. Create documents for different dates
2. Verify Day filter shows only today's transactions
3. Verify Week filter shows last 7 days
4. Verify Month filter shows last 30 days
5. Verify Custom filter works with date range
6. Verify summary cards show correct totals
7. Verify pagination works correctly
