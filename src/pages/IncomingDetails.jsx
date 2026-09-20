import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import './Finance.css'

function IncomingDetails({
  user,
  transactionId,
  onBack
}) {
  const [transaction, setTransaction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user && transactionId) {
      loadTransaction()
    }
  }, [user, transactionId])

  async function loadTransaction() {
    try {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
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
        .eq('id', transactionId)
        .single()

      if (error) {
        throw error
      }

      setTransaction(data)

    } catch (err) {
      console.error(
        'Unable to load incoming transaction:',
        err
      )

      setError(
        err.message ||
        'Unable to load transaction details'
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
        month: 'long',
        year: 'numeric'
      }
    )
  }

  function formatDateTime(dateString) {
    if (!dateString) {
      return '-'
    }

    const date = new Date(dateString)

    if (Number.isNaN(date.getTime())) {
      return '-'
    }

    return date.toLocaleString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    )
  }

  if (loading) {
    return (
      <div className="finance-page">

        <div className="finance-details-loading">
          Loading transaction details...
        </div>

      </div>
    )
  }

  if (error) {
    return (
      <div className="finance-page">

        <button
          type="button"
          className="finance-back-button"
          onClick={onBack}
        >
          ← Back to Finance
        </button>

        <div className="finance-error">
          {error}
        </div>

      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="finance-page">

        <button
          type="button"
          className="finance-back-button"
          onClick={onBack}
        >
          ← Back to Finance
        </button>

        <div className="finance-empty">
          <h3>
            Transaction not found
          </h3>
        </div>

      </div>
    )
  }

  return (
    <div className="finance-page">

      {/* =========================
          BACK
      ========================== */}

      <button
        type="button"
        className="finance-back-button"
        onClick={onBack}
      >
        ← Back to Finance
      </button>

      {/* =========================
          HEADER
      ========================== */}

      <div className="finance-details-header">

        <div>
          <span className="finance-details-kicker">
            Incoming Transaction
          </span>

          <h1>
            {transaction.category}
          </h1>

          <p>
            {transaction.description ||
              'Financial transaction'}
          </p>
        </div>

        <div className="finance-details-amount">
          +{formatAmount(transaction.amount)}
        </div>

      </div>

      {/* =========================
          DETAILS CARD
      ========================== */}

      <div className="finance-details-card">

        <div className="finance-detail-row">

          <span className="finance-detail-label">
            Transaction Type
          </span>

          <span className="finance-detail-value">
            {transaction.transaction_type}
          </span>

        </div>

        <div className="finance-detail-row">

          <span className="finance-detail-label">
            Date
          </span>

          <span className="finance-detail-value">
            {formatDate(
              transaction.transaction_date
            )}
          </span>

        </div>

        <div className="finance-detail-row">

          <span className="finance-detail-label">
            Fund
          </span>

          <span className="finance-detail-value">
            {transaction.funds?.name || '-'}
          </span>

        </div>

        <div className="finance-detail-row">

          <span className="finance-detail-label">
            Fund Type
          </span>

          <span className="finance-detail-value">
            {transaction.funds?.fund_type || '-'}
          </span>

        </div>

        <div className="finance-detail-row">

          <span className="finance-detail-label">
            Category
          </span>

          <span className="finance-detail-value">
            {transaction.category || '-'}
          </span>

        </div>

        <div className="finance-detail-row">

          <span className="finance-detail-label">
            Amount
          </span>

          <span className="finance-detail-value finance-detail-amount">
            {formatAmount(transaction.amount)}
          </span>

        </div>

        {transaction.resident_payment_id && (
          <div className="finance-detail-row">

            <span className="finance-detail-label">
              Payment Reference
            </span>

            <span className="finance-detail-value">
              {transaction.resident_payment_id}
            </span>

          </div>
        )}

        <div className="finance-detail-row">

          <span className="finance-detail-label">
            Recorded On
          </span>

          <span className="finance-detail-value">
            {formatDateTime(
              transaction.created_at
            )}
          </span>

        </div>

      </div>

      {/* =========================
          DESCRIPTION
      ========================== */}

      {transaction.description && (
        <div className="finance-details-card">

          <h2>
            Description
          </h2>

          <p className="finance-details-description">
            {transaction.description}
          </p>

        </div>
      )}

    </div>
  )
}

export default IncomingDetails