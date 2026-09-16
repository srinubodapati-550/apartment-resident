import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function BillDetails({ billId, user, onBack }) {
  const [bill, setBill] = useState(null)
  const [payments, setPayments] = useState([])

  const [loading, setLoading] = useState(true)
  const [paymentsLoading, setPaymentsLoading] = useState(true)

  const [error, setError] = useState('')

  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [paymentMessage, setPaymentMessage] = useState('')

  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'UPI',
    transaction_reference: ''
  })

  useEffect(() => {
    loadBill()
    loadPayments()
  }, [billId])

  async function loadBill() {
    try {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
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
            fund_type,
            description
          ),
          flats (
            flat_number,
            floor_number,
            flat_type,
            area_sqft,
            blocks (
              name
            )
          )
        `)
        .eq('id', billId)
        .single()

      if (error) {
        throw error
      }

      setBill(data)

    } catch (error) {
      console.error('Bill details error:', error)

      setError(
        error.message || 'Unable to load bill details.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function loadPayments() {
    try {
      setPaymentsLoading(true)

      const { data, error } = await supabase
        .from('resident_payments')
        .select(`
          id,
          amount,
          payment_date,
          payment_method,
          transaction_reference,
          status,
          rejection_reason,
          reviewed_at,
          created_at
        `)
        .eq('bill_id', billId)
        .order('created_at', {
          ascending: false
        })

      if (error) {
        throw error
      }

      setPayments(data || [])

    } catch (error) {
      console.error('Payment history error:', error)
    } finally {
      setPaymentsLoading(false)
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

  function getPaymentStatusClass(status) {
    switch (status) {
      case 'APPROVED':
        return 'payment-status-approved'

      case 'REJECTED':
        return 'payment-status-rejected'

      case 'SUBMITTED':
        return 'payment-status-submitted'

      default:
        return ''
    }
  }

  /*
   * Only APPROVED payments reduce the bill balance.
   */
  const approvedAmount = payments
    .filter(
      payment => payment.status === 'APPROVED'
    )
    .reduce(
      (total, payment) =>
        total + Number(payment.amount || 0),
      0
    )

  /*
   * SUBMITTED payments are still waiting for Admin approval.
   */
  const pendingAmount = payments
    .filter(
      payment => payment.status === 'SUBMITTED'
    )
    .reduce(
      (total, payment) =>
        total + Number(payment.amount || 0),
      0
    )

  /*
   * Remaining balance is calculated only from
   * approved payments.
   */
  const remainingAmount = Math.max(
    Number(bill?.amount || 0) - approvedAmount,
    0
  )

  const hasPendingPayment = payments.some(
    payment => payment.status === 'SUBMITTED'
  )

  async function submitPayment(event) {
    event.preventDefault()

    try {
      setSubmitting(true)
      setPaymentMessage('')

      if (!user?.id) {
        setPaymentMessage(
          'Your session could not be identified. Please logout and login again.'
        )
        return
      }

      if (!bill) {
        setPaymentMessage(
          'Bill information is not available.'
        )
        return
      }

      if (remainingAmount <= 0) {
        setPaymentMessage(
          'There is no remaining amount to pay for this bill.'
        )
        return
      }

      const amount = Number(paymentData.amount)

      if (!amount || amount <= 0) {
        setPaymentMessage(
          'Please enter a valid payment amount.'
        )
        return
      }

      if (amount > remainingAmount) {
        setPaymentMessage(
          `Payment amount cannot be greater than the remaining amount of ${formatAmount(remainingAmount)}.`
        )
        return
      }

      if (!paymentData.payment_date) {
        setPaymentMessage(
          'Please select the payment date.'
        )
        return
      }

      const { error } = await supabase
        .from('resident_payments')
        .insert({
          bill_id: bill.id,
          submitted_by: user.id,
          amount,
          payment_date: paymentData.payment_date,
          payment_method: paymentData.payment_method,
          transaction_reference:
            paymentData.transaction_reference || null,
          payment_proof_url: null,
          status: 'SUBMITTED'
        })

      if (error) {
        throw error
      }

      /*
       * Refresh payment history so the new
       * SUBMITTED payment appears immediately.
       */
      await loadPayments()

      setPaymentMessage(
        'Payment submitted successfully. It is now awaiting admin approval.'
      )

      setShowPaymentForm(false)

      setPaymentData({
        amount: remainingAmount,
        payment_date:
          new Date().toISOString().split('T')[0],
        payment_method: 'UPI',
        transaction_reference: ''
      })

    } catch (error) {
      console.error(
        'Payment submission error:',
        error
      )

      setPaymentMessage(
        error.message ||
        'Unable to submit payment.'
      )

    } finally {
      setSubmitting(false)
    }
  }

  function openPaymentForm() {
    setPaymentMessage('')

    setPaymentData(prev => ({
      ...prev,
      amount: remainingAmount
    }))

    setShowPaymentForm(true)
  }

  if (loading) {
    return (
      <div className="page">
        <p>Loading bill details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">

        <button
          className="back-button"
          onClick={onBack}
        >
          ← Back to Bills
        </button>

        <h1>Bill Details</h1>

        <div className="error-card">

          <p>{error}</p>

          <button onClick={loadBill}>
            Try Again
          </button>

        </div>

      </div>
    )
  }

  if (!bill) {
    return (
      <div className="page">

        <button
          className="back-button"
          onClick={onBack}
        >
          ← Back to Bills
        </button>

        <h1>Bill Details</h1>

        <div className="empty-card">

          <div className="empty-icon">
            💰
          </div>

          <h3>Bill Not Found</h3>

          <p>
            The requested bill could not be found.
          </p>

        </div>

      </div>
    )
  }

  return (
    <div className="page">

      {/* Back */}
      <button
        className="back-button"
        onClick={onBack}
      >
        ← Back to Bills
      </button>

      {/* Header */}
      <div className="bill-detail-header">

        <div>

          <h1>Bill Details</h1>

          <p>
            {formatMonth(bill.bill_month)}
          </p>

        </div>

        <span
          className={`bill-status ${
            bill.status?.toLowerCase() || ''
          }`}
        >
          {bill.status}
        </span>

      </div>

      {/* Amount */}
      <div className="bill-detail-amount-card">

        <span>
          Bill Amount
        </span>

        <strong>
          {formatAmount(bill.amount)}
        </strong>

      </div>

      {/* Bill Information */}
      <div className="bill-detail-card">

        <h2>
          Bill Information
        </h2>

        <div className="detail-row">

          <span>
            Bill Type
          </span>

          <strong>
            {bill.bill_type || 'Maintenance'}
          </strong>

        </div>

        <div className="detail-row">

          <span>
            Bill Month
          </span>

          <strong>
            {formatMonth(bill.bill_month)}
          </strong>

        </div>

        <div className="detail-row">

          <span>
            Due Date
          </span>

          <strong>
            {formatDate(bill.due_date)}
          </strong>

        </div>

        <div className="detail-row">

          <span>
            Status
          </span>

          <strong>
            {bill.status}
          </strong>

        </div>

        <div className="detail-row">

          <span>
            Created
          </span>

          <strong>
            {formatDate(bill.created_at)}
          </strong>

        </div>

      </div>

      {/* Payment Summary */}
      <div className="bill-detail-card">

        <h2>
          Payment Summary
        </h2>

        <div className="detail-row">

          <span>
            Bill Amount
          </span>

          <strong>
            {formatAmount(bill.amount)}
          </strong>

        </div>

        <div className="detail-row">

          <span>
            Approved Paid
          </span>

          <strong>
            {formatAmount(approvedAmount)}
          </strong>

        </div>

        <div className="detail-row">

          <span>
            Pending Payment
          </span>

          <strong>
            {formatAmount(pendingAmount)}
          </strong>

        </div>

        <div className="detail-row">

          <span>
            Remaining
          </span>

          <strong>
            {formatAmount(remainingAmount)}
          </strong>

        </div>

      </div>

      {/* Fund */}
      <div className="bill-detail-card">

        <h2>
          Fund
        </h2>

        <div className="detail-row">

          <span>
            Fund Name
          </span>

          <strong>
            {bill.funds?.name || '—'}
          </strong>

        </div>

        <div className="detail-row">

          <span>
            Fund Type
          </span>

          <strong>
            {bill.funds?.fund_type || '—'}
          </strong>

        </div>

        {bill.funds?.description && (
          <div className="fund-description">
            {bill.funds.description}
          </div>
        )}

      </div>

      {/* Flat */}
      <div className="bill-detail-card">

        <h2>
          Flat
        </h2>

        <div className="detail-row">

          <span>
            Flat Number
          </span>

          <strong>
            {bill.flats?.flat_number || '—'}
          </strong>

        </div>

        <div className="detail-row">

          <span>
            Block
          </span>

          <strong>
            {bill.flats?.blocks?.name || '—'}
          </strong>

        </div>

        <div className="detail-row">

          <span>
            Floor
          </span>

          <strong>
            {bill.flats?.floor_number || '—'}
          </strong>

        </div>

        <div className="detail-row">

          <span>
            Area
          </span>

          <strong>
            {bill.flats?.area_sqft
              ? `${bill.flats.area_sqft} sq.ft`
              : '—'}
          </strong>

        </div>

      </div>

      {/* Payment History */}
      <div className="bill-detail-card">

        <h2>
          Payment History
        </h2>

        {paymentsLoading ? (

          <p>
            Loading payment history...
          </p>

        ) : payments.length === 0 ? (

          <div className="payment-history-empty">

            <div>
              💳
            </div>

            <p>
              No payments have been submitted
              for this bill.
            </p>

          </div>

        ) : (

          <div className="payment-history-list">

            {payments.map(payment => (

              <div
                className="payment-history-item"
                key={payment.id}
              >

                <div className="payment-history-header">

                  <strong>
                    {formatAmount(payment.amount)}
                  </strong>

                  <span
                    className={`payment-status ${getPaymentStatusClass(
                      payment.status
                    )}`}
                  >
                    {payment.status}
                  </span>

                </div>

                <div className="payment-history-row">

                  <span>
                    Payment Date
                  </span>

                  <strong>
                    {formatDate(
                      payment.payment_date
                    )}
                  </strong>

                </div>

                <div className="payment-history-row">

                  <span>
                    Method
                  </span>

                  <strong>
                    {payment.payment_method || '—'}
                  </strong>

                </div>

                {payment.transaction_reference && (
                  <div className="payment-history-row">

                    <span>
                      Transaction Reference
                    </span>

                    <strong>
                      {payment.transaction_reference}
                    </strong>

                  </div>
                )}

                {payment.reviewed_at && (
                  <div className="payment-history-row">

                    <span>
                      Reviewed
                    </span>

                    <strong>
                      {formatDate(
                        payment.reviewed_at
                      )}
                    </strong>

                  </div>
                )}

                {payment.status === 'REJECTED' &&
                  payment.rejection_reason && (
                    <div className="payment-rejection">

                      <strong>
                        Rejection Reason
                      </strong>

                      <p>
                        {payment.rejection_reason}
                      </p>

                    </div>
                  )}

              </div>

            ))}

          </div>

        )}

      </div>

      {/* Payment Action */}
      {bill.status !== 'PAID' &&
        bill.status !== 'CANCELLED' &&
        remainingAmount > 0 && (

          <div className="payment-action-card">

            <h3>
              Payment
            </h3>

            {hasPendingPayment && (
              <div className="pending-payment-message">

                ⏳ You already have a payment
                awaiting admin approval.

              </div>
            )}

            <p>
              Submit your payment details for
              the remaining balance.
            </p>

            <button
              className="primary-button"
              onClick={openPaymentForm}
            >
              Submit Payment
            </button>

          </div>
        )}

      {/* Payment Form */}
      {showPaymentForm && (

        <div className="payment-form-card">

          <h2>
            Submit Payment
          </h2>

          <form onSubmit={submitPayment}>

            <div className="form-group">

              <label>
                Amount
              </label>

              <input
                type="number"
                min="1"
                max={remainingAmount}
                step="0.01"
                value={paymentData.amount}
                onChange={(e) =>
                  setPaymentData({
                    ...paymentData,
                    amount: e.target.value
                  })
                }
                required
              />

              <small>
                Remaining amount: {
                  formatAmount(remainingAmount)
                }
              </small>

            </div>

            <div className="form-group">

              <label>
                Payment Date
              </label>

              <input
                type="date"
                value={paymentData.payment_date}
                onChange={(e) =>
                  setPaymentData({
                    ...paymentData,
                    payment_date: e.target.value
                  })
                }
                required
              />

            </div>

            <div className="form-group">

              <label>
                Payment Method
              </label>

              <select
                value={paymentData.payment_method}
                onChange={(e) =>
                  setPaymentData({
                    ...paymentData,
                    payment_method: e.target.value
                  })
                }
              >

                <option value="UPI">
                  UPI
                </option>

                <option value="BANK_TRANSFER">
                  Bank Transfer
                </option>

                <option value="CASH">
                  Cash
                </option>

                <option value="CHEQUE">
                  Cheque
                </option>

                <option value="OTHER">
                  Other
                </option>

              </select>

            </div>

            <div className="form-group">

              <label>
                Transaction Reference
              </label>

              <input
                type="text"
                placeholder="UPI / Bank transaction ID"
                value={
                  paymentData.transaction_reference
                }
                onChange={(e) =>
                  setPaymentData({
                    ...paymentData,
                    transaction_reference:
                      e.target.value
                  })
                }
              />

            </div>

            {paymentMessage && (
              <div className="payment-message">
                {paymentMessage}
              </div>
            )}

            <div className="payment-form-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setShowPaymentForm(false)
                  setPaymentMessage('')
                }}
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={submitting}
              >
                {submitting
                  ? 'Submitting...'
                  : 'Submit Payment'}
              </button>

            </div>

          </form>

        </div>

      )}

      {/* Success / General Message */}
      {!showPaymentForm &&
        paymentMessage && (
          <div className="payment-message">
            {paymentMessage}
          </div>
        )}

    </div>
  )
}

export default BillDetails