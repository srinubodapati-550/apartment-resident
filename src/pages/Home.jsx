import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const APARTMENT_ID =
  '6a50bb64-c6ea-480b-a4e3-e8677c894a99'

function Home({ user, onNavigate }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [flat, setFlat] = useState(null)
  const [latestBill, setLatestBill] = useState(null)

  const [complaintSummary, setComplaintSummary] =
    useState({
      total: 0,
      open: 0,
      inProgress: 0
    })

  const [notices, setNotices] = useState([])

  const [maintenanceBalance, setMaintenanceBalance] =
    useState(0)

  const [corpusBalance, setCorpusBalance] =
    useState(0)

  useEffect(() => {
    if (user?.id) {
      loadHomeData()
    }
  }, [user?.id])

  async function loadHomeData() {
    try {
      setLoading(true)
      setError('')

      /*
       * ==========================================
       * RESIDENT FLAT
       * ==========================================
       */

      const {
        data: memberData,
        error: memberError
      } = await supabase
        .from('flat_members')
        .select(`
          flat_id,
          flats (
            id,
            flat_number,
            floor_number,
            flat_type,
            area_sqft,
            status,
            blocks (
              id,
              name,
              apartment_id
            )
          )
        `)
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (memberError) {
        throw memberError
      }

      const residentFlat =
        memberData?.flats || null

      setFlat(residentFlat)

      /*
       * ==========================================
       * LATEST BILL
       * ==========================================
       */

      if (memberData?.flat_id) {
        const {
          data: billData,
          error: billError
        } = await supabase
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
          .limit(1)
          .maybeSingle()

        if (billError) {
          throw billError
        }

        setLatestBill(billData || null)
      } else {
        setLatestBill(null)
      }

      /*
       * ==========================================
       * COMPLAINT SUMMARY
       * ==========================================
       */

      const {
        data: complaintData,
        error: complaintError
      } = await supabase
        .from('complaints')
        .select(`
          id,
          status
        `)
        .eq('raised_by', user.id)

      if (complaintError) {
        throw complaintError
      }

      const complaints =
        complaintData || []

      const openCount =
        complaints.filter(
          complaint =>
            complaint.status === 'OPEN'
        ).length

      const inProgressCount =
        complaints.filter(
          complaint =>
            complaint.status === 'IN_PROGRESS'
        ).length

      setComplaintSummary({
        total: complaints.length,
        open: openCount,
        inProgress: inProgressCount
      })

      /*
       * ==========================================
       * NOTICES
       * ==========================================
       */

      const {
        data: noticeData,
        error: noticeError
      } = await supabase
        .from('notices')
        .select(`
          id,
          title,
          description,
          priority,
          published_at,
          expiry_date,
          status
        `)
        .eq(
          'apartment_id',
          APARTMENT_ID
        )
        .eq(
          'status',
          'PUBLISHED'
        )
        .order(
          'published_at',
          {
            ascending: false
          }
        )
        .limit(10)

      if (noticeError) {
        throw noticeError
      }

      /*
       * Remove expired notices.
       */

      const today = new Date()

      today.setHours(
        0,
        0,
        0,
        0
      )

      const activeNotices =
        (noticeData || []).filter(
          notice => {
            if (!notice.expiry_date) {
              return true
            }

            const expiryDate =
              new Date(
                `${notice.expiry_date}T00:00:00`
              )

            return expiryDate >= today
          }
        )

      setNotices(
        activeNotices.slice(0, 3)
      )

      /*
       * ==========================================
       * FUND BALANCES
       * ==========================================
       *
       * Same source used by Finance.jsx.
       */

      const {
        data: fundData,
        error: fundError
      } = await supabase
        .from('v_fund_balances')
        .select(`
          fund_id,
          apartment_id,
          fund_name,
          fund_type,
          current_balance
        `)
        .eq(
          'apartment_id',
          APARTMENT_ID
        )

      if (fundError) {
        throw fundError
      }

      const maintenanceFund =
        (fundData || []).find(
          fund =>
            fund.fund_type ===
            'MAINTENANCE'
        )

      const corpusFund =
        (fundData || []).find(
          fund =>
            fund.fund_type ===
            'CORPUS'
        )

      setMaintenanceBalance(
        Number(
          maintenanceFund?.current_balance || 0
        )
      )

      setCorpusBalance(
        Number(
          corpusFund?.current_balance || 0
        )
      )

    } catch (err) {
      console.error(
        'Unable to load Home data:',
        err
      )

      setError(
        err?.message ||
        'Unable to load home information.'
      )
    } finally {
      setLoading(false)
    }
  }

  /*
   * ==========================================
   * FORMATTERS
   * ==========================================
   */

  function formatAmount(amount) {
    return new Intl.NumberFormat(
      'en-IN',
      {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
      }
    ).format(
      Number(amount || 0)
    )
  }

  function formatMonth(dateString) {
    if (!dateString) {
      return '-'
    }

    const date =
      new Date(
        `${dateString}T00:00:00`
      )

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return '-'
    }

    return date.toLocaleDateString(
      'en-IN',
      {
        month: 'long',
        year: 'numeric'
      }
    )
  }

  function formatDate(dateString) {
    if (!dateString) {
      return '-'
    }

    const date =
      new Date(dateString)

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
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

  function getBillStatusClass(status) {
    return (
      `home-bill-status ${
        status?.toLowerCase() || ''
      }`
    )
  }

  function getPriorityClass(priority) {
    return (
      `home-priority ${
        priority?.toLowerCase() || 'normal'
      }`
    )
  }

  /*
   * ==========================================
   * LOADING
   * ==========================================
   */

  if (loading) {
    return (
      <div className="page home-page">
        <div className="home-loading">
          <div className="home-loading-icon">
            🏠
          </div>

          <div>
            Loading your home...
          </div>
        </div>
      </div>
    )
  }

  /*
   * ==========================================
   * ERROR
   * ==========================================
   */

  if (error) {
    return (
      <div className="page home-page">

        <div className="home-error">
          <div className="home-error-icon">
            ⚠️
          </div>

          <div>
            <strong>
              Unable to load home
            </strong>

            <p>
              {error}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="home-retry-button"
          onClick={loadHomeData}
        >
          Try Again
        </button>

      </div>
    )
  }

  return (
    <div className="page home-page">

      {/* ========================================
          WELCOME
      ========================================= */}

      <section className="home-welcome">

        <div>
          <h1>
            Hello, {user?.full_name || 'Resident'} 👋
          </h1>

          <p>
            Welcome to your apartment resident
            portal.
          </p>
        </div>

      </section>


      {/* ========================================
          QUICK SUMMARY
      ========================================= */}

      <section className="home-summary-grid">

        {/* MY FLAT */}

        <button
          type="button"
          className="home-summary-card"
          onClick={() =>
            onNavigate &&
            onNavigate('flat')
          }
        >

          <div className="home-card-icon">
            🏢
          </div>

          <div className="home-summary-title">
            My Flat
          </div>

          <div className="home-summary-value">
            {flat
              ? `Flat ${flat.flat_number}`
              : 'No flat assigned'}
          </div>

          {flat?.blocks?.name && (
            <div className="home-summary-subtitle">
              {flat.blocks.name}
            </div>
          )}

        </button>


        {/* LATEST BILL */}

        <button
          type="button"
          className="home-summary-card"
          onClick={() =>
            onNavigate &&
            onNavigate('bills')
          }
        >

          <div className="home-card-icon">
            💰
          </div>

          <div className="home-summary-title">
            Latest Bill
          </div>

          {latestBill ? (
            <>
              <div className="home-summary-value">
                {formatAmount(
                  latestBill.amount
                )}
              </div>

              <div className="home-summary-subtitle">
                {formatMonth(
                  latestBill.bill_month
                )}
              </div>

              {latestBill.status && (
                <span
                  className={getBillStatusClass(
                    latestBill.status
                  )}
                >
                  {latestBill.status}
                </span>
              )}
            </>
          ) : (
            <div className="home-summary-value muted">
              No bills available
            </div>
          )}

        </button>


        {/* COMPLAINTS */}

        <button
          type="button"
          className="home-summary-card"
          onClick={() =>
            onNavigate &&
            onNavigate('complaints')
          }
        >

          <div className="home-card-icon">
            🔧
          </div>

          <div className="home-summary-title">
            Complaints
          </div>

          <div className="home-summary-value">
            {complaintSummary.open +
              complaintSummary.inProgress}{' '}
            active
          </div>

          <div className="home-summary-subtitle">
            {complaintSummary.total}{' '}
            total complaint
            {complaintSummary.total !== 1
              ? 's'
              : ''}
          </div>

        </button>


        {/* NOTICES */}

        <button
          type="button"
          className="home-summary-card"
          onClick={() =>
            onNavigate &&
            onNavigate('notices')
          }
        >

          <div className="home-card-icon">
            📢
          </div>

          <div className="home-summary-title">
            Notices
          </div>

          <div className="home-summary-value">
            {notices.length}
          </div>

          <div className="home-summary-subtitle">
            Recent notice
            {notices.length !== 1
              ? 's'
              : ''}
          </div>

        </button>

      </section>


      {/* ========================================
          SOCIETY FUNDS
      ========================================= */}

      <section className="home-section">

        <div className="home-section-header">

          <div>
            <h2>
              Society Funds
            </h2>

            <p>
              Current society fund balances
            </p>
          </div>

          <button
            type="button"
            className="home-link-button"
            onClick={() =>
              onNavigate &&
              onNavigate('finance')
            }
          >
            View Finance →
          </button>

        </div>


        <div className="home-funds-grid">

          {/* MAINTENANCE */}

          <div className="home-fund-card">

            <div className="home-fund-icon">
              🔧
            </div>

            <div className="home-fund-label">
              Maintenance Fund
            </div>

            <strong>
              {formatAmount(
                maintenanceBalance
              )}
            </strong>

          </div>


          {/* CORPUS */}

          <div className="home-fund-card">

            <div className="home-fund-icon">
              🏦
            </div>

            <div className="home-fund-label">
              Corpus Fund
            </div>

            <strong>
              {formatAmount(
                corpusBalance
              )}
            </strong>

          </div>

        </div>

      </section>


      {/* ========================================
          LATEST NOTICES
      ========================================= */}

      <section className="home-section">

        <div className="home-section-header">

          <div>
            <h2>
              Latest Notices
            </h2>

            <p>
              Recent announcements from the
              society
            </p>
          </div>

          <button
            type="button"
            className="home-link-button"
            onClick={() =>
              onNavigate &&
              onNavigate('notices')
            }
          >
            View All →
          </button>

        </div>


        {notices.length === 0 ? (

          <div className="home-empty">
            <div className="home-empty-icon">
              📢
            </div>

            <div>
              No recent notices.
            </div>
          </div>

        ) : (

          <div className="home-notice-list">

            {notices.map(notice => (

              <div
                key={notice.id}
                className="home-notice-card"
              >

                <div className="home-notice-header">

                  <h3>
                    {notice.title}
                  </h3>

                  <span
                    className={getPriorityClass(
                      notice.priority
                    )}
                  >
                    {notice.priority}
                  </span>

                </div>


                {notice.description && (
                  <p className="home-notice-description">
                    {notice.description}
                  </p>
                )}


                <div className="home-notice-date">
                  Published{' '}
                  {formatDate(
                    notice.published_at
                  )}
                </div>

              </div>

            ))}

          </div>

        )}

      </section>


      {/* ========================================
          FLAT INFORMATION
      ========================================= */}

      {flat && (

        <section className="home-section">

          <div className="home-section-header">

            <div>
              <h2>
                My Flat
              </h2>

              <p>
                Your apartment details
              </p>
            </div>

            <button
              type="button"
              className="home-link-button"
              onClick={() =>
                onNavigate &&
                onNavigate('flat')
              }
            >
              View Details →
            </button>

          </div>


          <div className="home-flat-grid">

            <div className="home-flat-item">
              <span>
                Flat
              </span>

              <strong>
                {flat.flat_number}
              </strong>
            </div>


            <div className="home-flat-item">
              <span>
                Block
              </span>

              <strong>
                {flat.blocks?.name || '-'}
              </strong>
            </div>


            <div className="home-flat-item">
              <span>
                Floor
              </span>

              <strong>
                {flat.floor_number || '-'}
              </strong>
            </div>


            <div className="home-flat-item">
              <span>
                Area
              </span>

              <strong>
                {flat.area_sqft
                  ? `${flat.area_sqft} sq.ft`
                  : '-'}
              </strong>
            </div>

          </div>

        </section>

      )}

    </div>
  )
}

export default Home