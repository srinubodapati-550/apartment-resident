import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import './Finance.css'

const APARTMENT_ID = '6a50bb64-c6ea-480b-a4e3-e8677c894a99'

const MONTHS = [
  { value: 0, label: 'January' },
  { value: 1, label: 'February' },
  { value: 2, label: 'March' },
  { value: 3, label: 'April' },
  { value: 4, label: 'May' },
  { value: 5, label: 'June' },
  { value: 6, label: 'July' },
  { value: 7, label: 'August' },
  { value: 8, label: 'September' },
  { value: 9, label: 'October' },
  { value: 10, label: 'November' },
  { value: 11, label: 'December' }
]

function Finance({ user }) {
  const today = new Date()

  const [selectedMonth, setSelectedMonth] = useState(today.getMonth())
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())

  const [expenses, setExpenses] = useState([])
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

      const [expensesResult, fundsResult] = await Promise.all([
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
          .order('expense_date', { ascending: false }),

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

      if (fundsResult.error) {
        throw fundsResult.error
      }

      setExpenses(expensesResult.data || [])
      setFundBalances(fundsResult.data || [])
    } catch (err) {
      console.error('Unable to load finance data:', err)
      setError(err.message || 'Unable to load finance information')
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
    if (!dateString) return '-'

    const date = new Date(dateString)

    if (Number.isNaN(date.getTime())) {
      return '-'
    }

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const maintenanceFundBalance = useMemo(() => {
    const fund = fundBalances.find(
      fund => fund.fund_type === 'MAINTENANCE'
    )

    return Number(fund?.current_balance || 0)
  }, [fundBalances])

  const corpusFundBalance = useMemo(() => {
    const fund = fundBalances.find(
      fund => fund.fund_type === 'CORPUS'
    )

    return Number(fund?.current_balance || 0)
  }, [fundBalances])

  const currentBalance = useMemo(() => {
    return maintenanceFundBalance + corpusFundBalance
  }, [maintenanceFundBalance, corpusFundBalance])

  /*
   * Expenses for selected month and year
   */
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      if (!expense.expense_date) return false

      const date = new Date(`${expense.expense_date}T00:00:00`)

      return (
        date.getMonth() === selectedMonth &&
        date.getFullYear() === selectedYear
      )
    })
  }, [expenses, selectedMonth, selectedYear])

  /*
   * Total expenses for selected month/year
   */
  const selectedMonthExpenses = useMemo(() => {
    return filteredExpenses.reduce(
      (total, expense) => total + Number(expense.amount || 0),
      0
    )
  }, [filteredExpenses])

  /*
   * Show only 5 most recent expenses
   */
  const recentExpenses = useMemo(() => {
    return filteredExpenses.slice(0, 5)
  }, [filteredExpenses])

  /*
   * Available years for the dropdown.
   * Always include the current year.
   */
  const years = useMemo(() => {
    const expenseYears = expenses
      .map(expense => {
        if (!expense.expense_date) return null

        const date = new Date(`${expense.expense_date}T00:00:00`)

        return Number.isNaN(date.getTime())
          ? null
          : date.getFullYear()
      })
      .filter(Boolean)

    const uniqueYears = [...new Set([
      today.getFullYear(),
      ...expenseYears
    ])]

    return uniqueYears.sort((a, b) => b - a)
  }, [expenses])

  return (
    <div className="finance-page">

      {/* =========================
          HEADER
      ========================== */}

      <div className="finance-header">
        <div>
          <h1>Finance</h1>
          <p>Apartment financial transparency</p>
        </div>
      </div>

      {error && (
        <div className="finance-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="finance-loading">
          Loading financial information...
        </div>
      ) : (
        <>
          {/* =========================
              FUND SUMMARY
          ========================== */}

          <div className="finance-summary">

            <div className="finance-summary-card">
              <span className="finance-summary-label">
                Maintenance Fund
              </span>

              <strong className="finance-summary-value">
                {formatAmount(maintenanceFundBalance)}
              </strong>

              <span className="finance-summary-note">
                Current available balance
              </span>
            </div>

            <div className="finance-summary-card">
              <span className="finance-summary-label">
                Corpus Fund
              </span>

              <strong className="finance-summary-value">
                {formatAmount(corpusFundBalance)}
              </strong>

              <span className="finance-summary-note">
                Current available balance
              </span>
            </div>

            <div className="finance-summary-card">
              <span className="finance-summary-label">
                Total Balance
              </span>

              <strong className="finance-summary-value">
                {formatAmount(currentBalance)}
              </strong>

              <span className="finance-summary-note">
                Maintenance + Corpus
              </span>
            </div>

            <div className="finance-summary-card">
              <span className="finance-summary-label">
                Selected Month
              </span>

              <strong className="finance-summary-value">
                {formatAmount(selectedMonthExpenses)}
              </strong>

              <span className="finance-summary-note">
                {MONTHS[selectedMonth].label} {selectedYear}
              </span>
            </div>

          </div>

          {/* =========================
              EXPENSE FILTER
          ========================== */}

          <div className="finance-filter-card">

            <div className="finance-filter-title">
              <div>
                <h2>Expenses</h2>
                <p>
                  View apartment expenses by month
                </p>
              </div>
            </div>

            <div className="finance-filter-controls">

              <div className="finance-filter-field">
                <label htmlFor="expense-month">
                  Month
                </label>

                <select
                  id="expense-month"
                  value={selectedMonth}
                  onChange={event =>
                    setSelectedMonth(Number(event.target.value))
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
                <label htmlFor="expense-year">
                  Year
                </label>

                <select
                  id="expense-year"
                  value={selectedYear}
                  onChange={event =>
                    setSelectedYear(Number(event.target.value))
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
              EXPENSE LIST
          ========================== */}

          <div className="finance-section">

            <div className="finance-section-header">
              <div>
                <h2>
                  Recent Expenses
                </h2>

                <p>
                  {MONTHS[selectedMonth].label} {selectedYear}
                </p>
              </div>

              <span className="finance-expense-count">
                {filteredExpenses.length} expense
                {filteredExpenses.length !== 1 ? 's' : ''}
              </span>
            </div>

            {recentExpenses.length === 0 ? (

              <div className="finance-empty">

                <div className="finance-empty-icon">
                  ₹
                </div>

                <h3>
                  No expenses recorded
                </h3>

                <p>
                  No expenses were recorded for{' '}
                  {MONTHS[selectedMonth].label} {selectedYear}.
                </p>

              </div>

            ) : (

              <>
                <div className="finance-expense-list">

                  {recentExpenses.map(expense => (

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
                            {expense.description || 'No description'}
                          </p>

                          <div className="finance-expense-meta">

                            <span>
                              {formatDate(expense.expense_date)}
                            </span>

                            <span>
                              {expense.funds?.name || 'Unknown Fund'}
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
                        {formatAmount(expense.amount)}
                      </div>

                    </div>

                  ))}

                </div>

                {filteredExpenses.length > 5 && (
                  <div className="finance-more-expenses">
                    Showing the 5 most recent expenses
                    out of {filteredExpenses.length}
                  </div>
                )}
              </>

            )}

          </div>

        </>
      )}

    </div>
  )
}

export default Finance