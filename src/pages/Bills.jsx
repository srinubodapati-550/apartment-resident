import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function Bills({ user, onSelectBill }) {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadBills()
  }, [user.id])

  async function loadBills() {
    try {
      setLoading(true)
      setError('')

      // Find the flat assigned to the logged-in resident
      const { data: memberData, error: memberError } =
        await supabase
          .from('flat_members')
          .select('flat_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle()

      if (memberError) {
        throw memberError
      }

      if (!memberData?.flat_id) {
        setBills([])
        return
      }

      // Get bills for the resident's flat
      const { data, error: billsError } =
        await supabase
          .from('resident_bills')
          .select(`
            id,
            flat_id,
            fund_id,
            bill_type,
            bill_month,
            amount,
            due_date,
            status,
            created_at,
            updated_at,
            funds (
              id,
              name,
              fund_type
            )
          `)
          .eq('flat_id', memberData.flat_id)
          .order('bill_month', {
            ascending: false
          })

      if (billsError) {
        throw billsError
      }

      setBills(data || [])

    } catch (error) {
      console.error('Bills error:', error)
      setError(
        error.message || 'Unable to load bills.'
      )
    } finally {
      setLoading(false)
    }
  }

  function formatMonth(date) {
    if (!date) return '—'

    return new Date(date).toLocaleDateString(
      'en-IN',
      {
        month: 'long',
        year: 'numeric'
      }
    )
  }

  function formatDate(date) {
    if (!date) return '—'

    return new Date(date).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    )
  }

  function formatAmount(amount) {
    return new Intl.NumberFormat(
      'en-IN',
      {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
      }
    ).format(amount || 0)
  }

  function getStatusClass(status) {
    return `bill-status ${
      status?.toLowerCase() || ''
    }`
  }

  if (loading) {
    return (
      <div className="page">
        <h1>Bills</h1>
        <p>Loading bills...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <h1>Bills</h1>

        <div className="error-card">
          <p>{error}</p>
          <button onClick={loadBills}>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">

      <div className="page-title-row">
        <div>
          <h1>Bills & Payments</h1>

          <small>
            Your monthly maintenance bills
          </small>
        </div>
      </div>

      {bills.length === 0 ? (
        <div className="empty-card">

          <div className="empty-icon">
            💰
          </div>

          <h3>No Bills</h3>

          <p>
            You don't have any bills yet.
          </p>

        </div>
      ) : (
        <div className="bill-list">

          {bills.map(bill => (

            <div
             className="bill-card"
             key={bill.id}
             onClick={() => onSelectBill(bill.id)}
            >

              <div className="bill-card-header">

                <div>
                  <h2>
                    {formatMonth(
                      bill.bill_month
                    )}
                  </h2>

                  <p className="bill-type">
                    {bill.bill_type || 'Maintenance'}
                  </p>
                </div>

                <span
                  className={getStatusClass(
                    bill.status
                  )}
                >
                  {bill.status}
                </span>

              </div>

              <div className="bill-amount">
                {formatAmount(bill.amount)}
              </div>

              <div className="bill-details">

                <div>
                  <span>Due Date</span>

                  <strong>
                    {formatDate(
                      bill.due_date
                    )}
                  </strong>
                </div>

                <div>
                  <span>Fund</span>

                  <strong>
                    {bill.funds?.name ||
                      bill.funds?.fund_type ||
                      '—'}
                  </strong>
                </div>

              </div>

            </div>

          ))}

        </div>
      )}

    </div>
  )
}

export default Bills