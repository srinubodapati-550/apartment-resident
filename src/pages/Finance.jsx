import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import './Finance.css'

const APARTMENT_ID =
  '6a50bb64-c6ea-480b-a4e3-e8677c894a99'

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
]

function Finance({ user, onSelectIncoming }) {
  const currentDate = new Date()

  const [selectedMonth, setSelectedMonth] =
    useState(currentDate.getMonth() + 1)

  const [selectedYear, setSelectedYear] =
    useState(currentDate.getFullYear())

  const [expenses, setExpenses] = useState([])
  const [incoming, setIncoming] = useState([])
  const [fundBalances, setFundBalances] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      loadFinanceData()
    }
  }, [user])

  async function loadFinanceData() {
    try {
      setLoading(true)
      setError('')

      const [
        expensesResult,
        incomingResult,
        balancesResult
      ] = await Promise.all([
        supabase
          .from('expenses')
          .select(`
            id,
            apartment_id,
            fund_id,
            expense_date,
            category,
            description,
            amount,
            payment_method,
            reference_number,
            receipt_url,
            created_at,
            updated_at,
            funds (
              id,
              name,
              fund_type
            )
          `)
          .eq('apartment_id', APARTMENT_ID)
          .order('expense_date', {
            ascending: false
          }),

        supabase
          .from('financial_transactions')
          .select(`
            id,
            apartment_id,
            fund_id,
            transaction_date,
            transaction_type,
            category,
            description,
            amount,
            resident_payment_id,
            created_at,
            funds (
              id,
              name,
              fund_type
            )
          `)
          .eq('apartment_id', APARTMENT_ID)
          .eq('transaction_type', 'CREDIT')
          .order('transaction_date', {
            ascending: false
          }),

        supabase
          .from('v_fund_balances')
          .select(`
            fund_id,
            apartment_id,
            fund_name,
            fund_type,
            current_balance
          `)
          .eq('apartment_id', APARTMENT_ID)
      ])

      if (expensesResult.error) {
        throw expensesResult.error
      }

      if (incomingResult.error) {
        throw incomingResult.error
      }

      if (balancesResult.error) {
        throw balancesResult.error
      }

      setExpenses(expensesResult.data || [])
      setIncoming(incomingResult.data || [])
      setFundBalances(balancesResult.data || [])
    } catch (err) {
      console.error(
        'Unable to load finance data:',
        err
      )

      setError(
        err.message ||
        'Unable to load financial information'
      )
    } finally {
      setLoading(false)
    }
  }

  function formatAmount(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(Number(amount || 0))
  }

  function formatDate(dateString) {
    if (!dateString) {
      return '-'
    }

    const date = new Date(
      `${dateString}T00:00:00`
    )

    if (Number.isNaN(date.getTime())) {
      return '-'
    }

    return date.toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    )
  }

  function getDateMonth(dateString) {
    if (!dateString) {
      return null
    }

    const date = new Date(
      `${dateString}T00:00:00`
    )

    if (Number.isNaN(date.getTime())) {
      return null
    }

    return date.getMonth() + 1
  }

  function getDateYear(dateString) {
    if (!dateString) {
      return null
    }

    const date = new Date(
      `${dateString}T00:00:00`
    )

    if (Number.isNaN(date.getTime())) {
      return null
    }

    return date.getFullYear()
  }

  /*
   * =========================
   * FUND BALANCES
   * =========================
   */

  const maintenanceFund = useMemo(() => {
    return (
      fundBalances.find(
        fund =>
          fund.fund_type === 'MAINTENANCE'
      ) || null
    )
  }, [fundBalances])

  const corpusFund = useMemo(() => {
    return (
      fundBalances.find(
        fund =>
          fund.fund_type === 'CORPUS'
      ) || null
    )
  }, [fundBalances])

  const maintenanceBalance = Number(
    maintenanceFund?.current_balance || 0
  )

  const corpusBalance = Number(
    corpusFund?.current_balance || 0
  )

  const totalBalance =
    maintenanceBalance + corpusBalance

  /*
   * =========================
   * FILTERED INCOMING
   * =========================
   */

  const filteredIncoming = useMemo(() => {
    return incoming.filter(transaction => {
      const month = getDateMonth(
        transaction.transaction_date
      )

      const year = getDateYear(
        transaction.transaction_date
      )

      return (
        month === selectedMonth &&
        year === selectedYear
      )
    })
  }, [
    incoming,
    selectedMonth,
    selectedYear
  ])

  /*
   * =========================
   * FILTERED EXPENSES
   * =========================
   */

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const month = getDateMonth(
        expense.expense_date
      )

      const year = getDateYear(
        expense.expense_date
      )

      return (
        month === selectedMonth &&
        year === selectedYear
      )
    })
  }, [
    expenses,
    selectedMonth,
    selectedYear
  ])

  /*
   * =========================
   * MONTH TOTALS
   * =========================
   */

  const selectedMonthIncoming =
    useMemo(() => {
      return filteredIncoming.reduce(
        (total, transaction) =>
          total +
          Number(transaction.amount || 0),
        0
      )
    }, [filteredIncoming])

  const selectedMonthExpenses =
    useMemo(() => {
      return filteredExpenses.reduce(
        (total, expense) =>
          total +
          Number(expense.amount || 0),
        0
      )
    }, [filteredExpenses])

  /*
   * =========================
   * RECENT RECORDS
   * =========================
   */

  const recentIncoming =
    filteredIncoming.slice(0, 5)

  const recentExpenses =
    filteredExpenses.slice(0, 5)

  /*
   * =========================
   * AVAILABLE YEARS
   * =========================
   */

  const years = useMemo(() => {
    const yearSet = new Set()

    yearSet.add(currentDate.getFullYear())

    incoming.forEach(transaction => {
      const year = getDateYear(
        transaction.transaction_date
      )

      if (year) {
        yearSet.add(year)
      }
    })

    expenses.forEach(expense => {
      const year = getDateYear(
        expense.expense_date
      )

      if (year) {
        yearSet.add(year)
      }
    })

    return Array.from(yearSet).sort(
      (a, b) => b - a
    )
  }, [incoming, expenses])

  /*
   * =========================
   * LOADING
   * =========================
   */

  if (loading) {
    return (
      <div className="finance-page">
        <div className="finance-loading">
          Loading financial information...
        </div>
      </div>
    )
  }

  /*
   * =========================
   * ERROR
   * =========================
   */

  if (error) {
    return (
      <div className="finance-page">
        <div className="finance-error">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="finance-page">

      {/* =========================
          HEADER
      ========================== */}

      <div className="finance-header">
        <div>
          <h1>Finance</h1>

          <p>
            Apartment financial transparency
          </p>
        </div>
      </div>

      {/* =========================
          FUND BALANCES
      ========================== */}

      <div className="finance-summary">

        <div className="finance-summary-card">
          <span className="finance-summary-label">
            Maintenance Fund
          </span>

          <strong className="finance-summary-value">
            {formatAmount(
              maintenanceBalance
            )}
          </strong>

          <span className="finance-summary-note">
            Current balance
          </span>
        </div>

        <div className="finance-summary-card">
          <span className="finance-summary-label">
            Corpus Fund
          </span>

          <strong className="finance-summary-value">
            {formatAmount(
              corpusBalance
            )}
          </strong>

          <span className="finance-summary-note">
            Current balance
          </span>
        </div>

        <div className="finance-summary-card">
          <span className="finance-summary-label">
            Total Balance
          </span>

          <strong className="finance-summary-value">
            {formatAmount(
              totalBalance
            )}
          </strong>

          <span className="finance-summary-note">
            All funds
          </span>
        </div>

      </div>

      {/* =========================
          MONTH / YEAR FILTER
      ========================== */}

      <div className="finance-filter-card">

        <div className="finance-filter-title">
          <div>
            <h2>Financial Activity</h2>

            <p>
              View incoming payments and expenses
              for a specific month.
            </p>
          </div>
        </div>

        <div className="finance-filter-controls">

          <div className="finance-filter-field">

            <label htmlFor="finance-month">
              Month
            </label>

            <select
              id="finance-month"
              value={selectedMonth}
              onChange={event =>
                setSelectedMonth(
                  Number(event.target.value)
                )
              }
            >
              {MONTHS.map(month => (
                <option
                  key={month.value}
                  value={month.value}
                >
                  {month.label}
                </option>
              ))}
            </select>

          </div>

          <div className="finance-filter-field">

            <label htmlFor="finance-year">
              Year
            </label>

            <select
              id="finance-year"
              value={selectedYear}
              onChange={event =>
                setSelectedYear(
                  Number(event.target.value)
                )
              }
            >
              {years.map(year => (
                <option
                  key={year}
                  value={year}
                >
                  {year}
                </option>
              ))}
            </select>

          </div>

        </div>

      </div>

      {/* =========================
          INCOMING
      ========================== */}

      <section className="finance-section">

        <div className="finance-section-header">

          <div>
            <h2>Incoming</h2>

            <p>
              Money received by the apartment
            </p>
          </div>

          <strong className="finance-section-total">
            {formatAmount(
              selectedMonthIncoming
            )}
          </strong>

        </div>

        {recentIncoming.length === 0 ? (

          <div className="finance-empty">
            <div className="finance-empty-icon">
              ↓
            </div>

            <h3>
              No incoming transactions
            </h3>

            <p>
              There are no incoming transactions
              for the selected month.
            </p>
          </div>

        ) : (

          <div className="finance-expense-list">

            {recentIncoming.map(
              transaction => (

                <button
                  type="button"
                  className="finance-expense-card finance-income-card"
                  key={transaction.id}
                  onClick={() => {
                    if (onSelectIncoming) {
                      onSelectIncoming(
                        transaction.id
                      )
                    }
                  }}
                >

                  <div className="finance-expense-main">

                    <div className="finance-income-icon">
                      +
                    </div>

                    <div className="finance-expense-info">

                      <h3>
                        {transaction.category}
                      </h3>

                      <p className="finance-expense-description">
                        {transaction.description ||
                          'No description'}
                      </p>

                      <div className="finance-expense-meta">

                        <span>
                          {formatDate(
                            transaction.transaction_date
                          )}
                        </span>

                        <span>
                          {transaction.funds?.name ||
                            'Unknown Fund'}
                        </span>

                      </div>

                    </div>

                  </div>

                  <div className="finance-income-amount">
                    +
                    {formatAmount(
                      transaction.amount
                    )}
                  </div>

                </button>

              )
            )}

          </div>

        )}

        {filteredIncoming.length > 5 && (
          <div className="finance-more-expenses">
            Showing the latest 5 incoming
            transactions.
          </div>
        )}

      </section>

      {/* =========================
          EXPENSES
      ========================== */}

      <section className="finance-section">

        <div className="finance-section-header">

          <div>
            <h2>Expenses</h2>

            <p>
              Money spent by the apartment
            </p>
          </div>

          <strong className="finance-section-total">
            {formatAmount(
              selectedMonthExpenses
            )}
          </strong>

        </div>

        {recentExpenses.length === 0 ? (

          <div className="finance-empty">

            <div className="finance-empty-icon">
              ₹
            </div>

            <h3>
              No expenses
            </h3>

            <p>
              There are no expenses for the
              selected month.
            </p>

          </div>

        ) : (

          <div className="finance-expense-list">

            {recentExpenses.map(
              expense => (

                <div
                  className="finance-expense-card"
                  key={expense.id}
                >

                  <div className="finance-expense-main">

                    <div className="finance-expense-icon">
                      ₹
                    </div>

                    <div className="finance-expense-info">

                      <h3>
                        {expense.category}
                      </h3>

                      <p className="finance-expense-description">
                        {expense.description ||
                          'No description'}
                      </p>

                      <div className="finance-expense-meta">

                        <span>
                          {formatDate(
                            expense.expense_date
                          )}
                        </span>

                        <span>
                          {expense.funds?.name ||
                            'Unknown Fund'}
                        </span>

                        {expense.payment_method && (
                          <span>
                            {expense.payment_method}
                          </span>
                        )}

                      </div>

                    </div>

                  </div>

                  <div className="finance-expense-amount">
                    -
                    {formatAmount(
                      expense.amount
                    )}
                  </div>

                </div>

              )
            )}

          </div>

        )}

        {filteredExpenses.length > 5 && (
          <div className="finance-more-expenses">
            Showing the latest 5 expenses.
          </div>
        )}

      </section>

    </div>
  )
}

export default Finance