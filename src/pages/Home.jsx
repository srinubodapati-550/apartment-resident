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

      const { data: memberData, error: memberError } =
        await supabase
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
       *
       * Use the resident's apartment ID.
       * Published notices only.
       */

      let noticeQuery =
        supabase
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

      const {
        data: noticeData,
        error: noticeError
      } = await noticeQuery

      if (noticeError) {
        throw noticeError
      }

      /*
       * Remove notices whose expiry date
       * has already passed.
       */

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const activeNotices =
        (noticeData || []).filter(notice => {
          if (!notice.expiry_date) {
            return true
          }

          const expiryDate =
            new Date(
              `${notice.expiry_date}T00:00:00`
            )

          return expiryDate >= today
        })

      setNotices(
        activeNotices.slice(0, 3)
      )

      /*
       * ==========================================
       * FUND BALANCES
       * ==========================================
       *
       * IMPORTANT:
       * This is the SAME source and field
       * used by Finance.jsx.
       *
       * v_fund_balances
       * current_balance
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
          maintenanceFund?.current_balance ||
          0
        )
      )

      setCorpusBalance(
        Number(
          corpusFund?.current_balance ||
          0
        )
      )

    } catch (err) {
      console.error(
        'Unable to load Home data:',
        err
      )

      setError(
        err.message ||
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
    ).format(Number(amount || 0))
  }

  function formatMonth(dateString) {
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
        month: 'long',
        year: 'numeric'
      }
    )
  }

  function formatDate(dateString) {
    if (!dateString) {
      return '-'
    }

    const date = new Date(
      dateString
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

  function getBillStatusClass(status) {
    return (
      `home-bill-status ` +
      `${status?.toLowerCase() || ''}`
    )
  }

  function getPriorityStyle(priority) {
    switch (priority) {
      case 'URGENT':
        return {
          background: '#fee2e2',
          color: '#b91c1c'
        }

      case 'HIGH':
        return {
          background: '#ffedd5',
          color: '#c2410c'
        }

      case 'LOW':
        return {
          background: '#f1f5f9',
          color: '#475569'
        }

      case 'NORMAL':
      default:
        return {
          background: '#e0f2fe',
          color: '#0369a1'
        }
    }
  }

  /*
   * ==========================================
   * LOADING
   * ==========================================
   */

  if (loading) {
    return (
      <div className="page">
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: '#64748b'
          }}
        >
          Loading your home...
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
      <div className="page">

        <div
          style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '20px'
          }}
        >
          {error}
        </div>

        <button
          type="button"
          onClick={loadHomeData}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            background: '#2563eb',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>

      </div>
    )
  }

  return (
    <div className="page">

      {/* ========================================
          WELCOME
      ========================================= */}

      <div
        style={{
          marginBottom: '20px'
        }}
      >
        <h1
          style={{
            marginBottom: '6px'
          }}
        >
          Hello, {user.full_name} 👋
        </h1>

        <p
          style={{
            margin: 0,
            color: '#64748b'
          }}
        >
          Welcome to your apartment resident
          portal.
        </p>
      </div>


      {/* ========================================
          QUICK SUMMARY CARDS
      ========================================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          marginBottom: '20px'
        }}
      >

        {/* MY FLAT */}

        <button
          type="button"
          onClick={() =>
            onNavigate &&
            onNavigate('flat')
          }
          style={{
            textAlign: 'left',
            border: '1px solid #e2e8f0',
            background: '#fff',
            borderRadius: '12px',
            padding: '18px',
            cursor: 'pointer'
          }}
        >

          <div
            style={{
              fontSize: '26px',
              marginBottom: '8px'
            }}
          >
            🏢
          </div>

          <div
            style={{
              fontWeight: 600,
              fontSize: '16px'
            }}
          >
            My Flat
          </div>

          <div
            style={{
              marginTop: '5px',
              color: '#64748b',
              fontSize: '14px'
            }}
          >
            {flat
              ? `Flat ${flat.flat_number}`
              : 'No flat assigned'}
          </div>

        </button>


        {/* LATEST BILL */}

        <button
          type="button"
          onClick={() =>
            onNavigate &&
            onNavigate('bills')
          }
          style={{
            textAlign: 'left',
            border: '1px solid #e2e8f0',
            background: '#fff',
            borderRadius: '12px',
            padding: '18px',
            cursor: 'pointer'
          }}
        >

          <div
            style={{
              fontSize: '26px',
              marginBottom: '8px'
            }}
          >
            💰
          </div>

          <div
            style={{
              fontWeight: 600,
              fontSize: '16px'
            }}
          >
            Latest Bill
          </div>

          {latestBill ? (

            <div
              style={{
                marginTop: '5px'
              }}
            >

              <div
                style={{
                  color: '#64748b',
                  fontSize: '13px'
                }}
              >
                {formatMonth(
                  latestBill.bill_month
                )}
              </div>

              <div
                style={{
                  fontWeight: 600,
                  marginTop: '3px'
                }}
              >
                {formatAmount(
                  latestBill.amount
                )}
              </div>

            </div>

          ) : (

            <div
              style={{
                marginTop: '5px',
                color: '#64748b',
                fontSize: '14px'
              }}
            >
              No bills available
            </div>

          )}

        </button>


        {/* COMPLAINTS */}

        <button
          type="button"
          onClick={() =>
            onNavigate &&
            onNavigate('complaints')
          }
          style={{
            textAlign: 'left',
            border: '1px solid #e2e8f0',
            background: '#fff',
            borderRadius: '12px',
            padding: '18px',
            cursor: 'pointer'
          }}
        >

          <div
            style={{
              fontSize: '26px',
              marginBottom: '8px'
            }}
          >
            🔧
          </div>

          <div
            style={{
              fontWeight: 600,
              fontSize: '16px'
            }}
          >
            Complaints
          </div>

          <div
            style={{
              marginTop: '5px',
              color: '#64748b',
              fontSize: '14px'
            }}
          >
            {complaintSummary.open +
              complaintSummary.inProgress}{' '}
            active
          </div>

        </button>


        {/* NOTICES */}

        <button
          type="button"
          onClick={() =>
            onNavigate &&
            onNavigate('notices')
          }
          style={{
            textAlign: 'left',
            border: '1px solid #e2e8f0',
            background: '#fff',
            borderRadius: '12px',
            padding: '18px',
            cursor: 'pointer'
          }}
        >

          <div
            style={{
              fontSize: '26px',
              marginBottom: '8px'
            }}
          >
            📢
          </div>

          <div
            style={{
              fontWeight: 600,
              fontSize: '16px'
            }}
          >
            Notices
          </div>

          <div
            style={{
              marginTop: '5px',
              color: '#64748b',
              fontSize: '14px'
            }}
          >
            {notices.length} recent notice
            {notices.length !== 1
              ? 's'
              : ''}
          </div>

        </button>

      </div>


      {/* ========================================
          SOCIETY FUNDS
      ========================================= */}

      <section
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px'
        }}
      >

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}
        >

          <div>

            <h2
              style={{
                margin: 0,
                fontSize: '20px'
              }}
            >
              Society Funds
            </h2>

            <p
              style={{
                margin: '5px 0 0',
                color: '#64748b',
                fontSize: '13px'
              }}
            >
              Current society fund balances
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              onNavigate &&
              onNavigate('finance')
            }
            style={{
              border: 'none',
              background: 'transparent',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            View Finance →
          </button>

        </div>


        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(2, minmax(0, 1fr))',
            gap: '12px'
          }}
        >

          {/* MAINTENANCE */}

          <div
            style={{
              background: '#f8fafc',
              borderRadius: '10px',
              padding: '16px',
              textAlign: 'center'
            }}
          >

            <div
              style={{
                fontSize: '12px',
                color: '#64748b',
                marginBottom: '6px'
              }}
            >
              Maintenance Fund
            </div>

            <strong
              style={{
                fontSize: '17px'
              }}
            >
              {formatAmount(
                maintenanceBalance
              )}
            </strong>

          </div>


          {/* CORPUS */}

          <div
            style={{
              background: '#f8fafc',
              borderRadius: '10px',
              padding: '16px',
              textAlign: 'center'
            }}
          >

            <div
              style={{
                fontSize: '12px',
                color: '#64748b',
                marginBottom: '6px'
              }}
            >
              Corpus Fund
            </div>

            <strong
              style={{
                fontSize: '17px'
              }}
            >
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

      <section
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '18px',
          marginBottom: '20px'
        }}
      >

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px'
          }}
        >

          <div>

            <h2
              style={{
                margin: 0,
                fontSize: '20px'
              }}
            >
              Latest Notices
            </h2>

            <p
              style={{
                margin: '5px 0 0',
                color: '#64748b',
                fontSize: '13px'
              }}
            >
              Recent announcements from the
              society
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              onNavigate &&
              onNavigate('notices')
            }
            style={{
              border: 'none',
              background: 'transparent',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            View All →
          </button>

        </div>


        {notices.length === 0 ? (

          <div
            style={{
              padding: '24px 10px',
              textAlign: 'center',
              color: '#64748b'
            }}
          >
            No recent notices.
          </div>

        ) : (

          <div
            style={{
              display: 'grid',
              gap: '10px'
            }}
          >

            {notices.map(notice => (

              <div
                key={notice.id}
                style={{
                  border:
                    '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px'
                }}
              >

                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}
                >

                  <h3
                    style={{
                      margin: 0,
                      fontSize: '15px'
                    }}
                  >
                    {notice.title}
                  </h3>

                  <span
                    style={{
                      ...getPriorityStyle(
                        notice.priority
                      ),
                      borderRadius: '999px',
                      padding:
                        '3px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      whiteSpace:
                        'nowrap'
                    }}
                  >
                    {notice.priority}
                  </span>

                </div>


                {notice.description && (

                  <p
                    style={{
                      margin:
                        '7px 0',
                      color: '#475569',
                      fontSize: '13px',
                      lineHeight: 1.5
                    }}
                  >
                    {notice.description}
                  </p>

                )}


                <div
                  style={{
                    color: '#94a3b8',
                    fontSize: '12px'
                  }}
                >
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

        <section
          style={{
            background: '#fff',
            border:
              '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '18px',
            marginBottom: '20px'
          }}
        >

          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',
              marginBottom: '14px'
            }}
          >

            <div>

              <h2
                style={{
                  margin: 0,
                  fontSize: '20px'
                }}
              >
                My Flat
              </h2>

              <p
                style={{
                  margin:
                    '5px 0 0',
                  color: '#64748b',
                  fontSize: '13px'
                }}
              >
                Your apartment details
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                onNavigate &&
                onNavigate('flat')
              }
              style={{
                border: 'none',
                background:
                  'transparent',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              View Details →
            </button>

          </div>


          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '10px'
            }}
          >

            <div
              style={{
                background:
                  '#f8fafc',
                padding: '12px',
                borderRadius: '8px'
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: '#64748b'
                }}
              >
                Flat
              </div>

              <strong>
                {flat.flat_number}
              </strong>
            </div>


            <div
              style={{
                background:
                  '#f8fafc',
                padding: '12px',
                borderRadius: '8px'
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: '#64748b'
                }}
              >
                Block
              </div>

              <strong>
                {flat.blocks?.name ||
                  '-'}
              </strong>
            </div>


            <div
              style={{
                background:
                  '#f8fafc',
                padding: '12px',
                borderRadius: '8px'
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: '#64748b'
                }}
              >
                Floor
              </div>

              <strong>
                {flat.floor_number ||
                  '-'}
              </strong>
            </div>


            <div
              style={{
                background:
                  '#f8fafc',
                padding: '12px',
                borderRadius: '8px'
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: '#64748b'
                }}
              >
                Area
              </div>

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