import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function MyFlat({ user }) {
  const [flat, setFlat] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.id) {
      loadMyFlat()
    }
  }, [user?.id])

  async function loadMyFlat() {
    try {
      setLoading(true)
      setError('')

      /*
       * ==========================================
       * GET RESIDENT'S FLAT
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
            member_count,
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

      if (
        !memberData ||
        !memberData.flats
      ) {
        setFlat(null)
        setMembers([])
        return
      }

      setFlat(memberData.flats)

      /*
       * ==========================================
       * GET ALL APP USERS OF SAME FLAT
       *
       * NOTE:
       * This is only for residents who have
       * application accounts.
       *
       * It is NOT the household member count.
       * ==========================================
       */

      const {
        data: memberList,
        error: membersError
      } = await supabase
        .from('flat_members')
        .select(`
          user_id,
          users (
            id,
            full_name,
            email,
            phone,
            role,
            status
          )
        `)
        .eq(
          'flat_id',
          memberData.flat_id
        )

      if (membersError) {
        throw membersError
      }

      setMembers(memberList || [])

    } catch (error) {
      console.error(
        'My Flat error:',
        error
      )

      setError(
        error?.message ||
        'Unable to load flat details.'
      )
    } finally {
      setLoading(false)
    }
  }

  /*
   * ==========================================
   * LOADING
   * ==========================================
   */

  if (loading) {
    return (
      <div className="page my-flat-page">

        <div className="my-flat-loading">
          <div className="my-flat-loading-icon">
            🏢
          </div>

          <div>
            Loading your flat...
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
      <div className="page my-flat-page">

        <div className="my-flat-page-title">
          <h1>My Flat</h1>
          <p>
            Your apartment details
          </p>
        </div>

        <div className="my-flat-error">

          <div className="my-flat-error-icon">
            ⚠️
          </div>

          <div>
            <strong>
              Unable to load flat details
            </strong>

            <p>
              {error}
            </p>
          </div>

        </div>

        <button
          type="button"
          className="my-flat-retry-button"
          onClick={loadMyFlat}
        >
          Try Again
        </button>

      </div>
    )
  }

  /*
   * ==========================================
   * NO FLAT
   * ==========================================
   */

  if (!flat) {
    return (
      <div className="page my-flat-page">

        <div className="my-flat-page-title">
          <h1>My Flat</h1>

          <p>
            Your apartment details
          </p>
        </div>

        <div className="my-flat-empty">

          <div className="my-flat-empty-icon">
            🏢
          </div>

          <h2>
            No Flat Assigned
          </h2>

          <p>
            No flat has been assigned to
            your account yet.
          </p>

        </div>

      </div>
    )
  }

  /*
   * ==========================================
   * OTHER APP USERS
   * ==========================================
   */

  const otherMembers =
    members.filter(
      member =>
        member.user_id !== user.id
    )

  /*
   * ==========================================
   * TOTAL HOUSEHOLD MEMBERS
   *
   * IMPORTANT:
   * Use flats.member_count
   * NOT members.length
   * ==========================================
   */

  const memberCount =
    Number(flat.member_count || 0)

  /*
   * ==========================================
   * MAIN UI
   * ==========================================
   */

  return (
    <div className="page my-flat-page">

      {/* ========================================
          PAGE HEADER
      ========================================= */}

      <section className="my-flat-page-title">

        <div>
          <h1>
            My Flat
          </h1>

          <p>
            Your apartment details
          </p>
        </div>

      </section>


      {/* ========================================
          FLAT HERO
      ========================================= */}

      <section className="my-flat-hero">

        <div className="my-flat-hero-icon">
          🏢
        </div>

        <div className="my-flat-hero-content">

          <div className="my-flat-hero-label">
            {flat.blocks?.name || 'Apartment'}
          </div>

          <h2>
            Flat {flat.flat_number}
          </h2>

          <div className="my-flat-hero-meta">

            {flat.floor_number && (
              <span>
                Floor {flat.floor_number}
              </span>
            )}

            {flat.flat_type && (
              <span>
                {flat.flat_type}
              </span>
            )}

            {flat.area_sqft && (
              <span>
                {flat.area_sqft} sq.ft
              </span>
            )}

          </div>

        </div>

        <span
          className={
            `my-flat-status ${
              flat.status?.toLowerCase() || ''
            }`
          }
        >
          {flat.status || 'UNKNOWN'}
        </span>

      </section>


      {/* ========================================
          FLAT OVERVIEW
      ========================================= */}

      <section className="my-flat-section">

        <div className="my-flat-section-header">

          <div>
            <h2>
              Flat Overview
            </h2>

            <p>
              Basic information about your flat
            </p>
          </div>

        </div>


        <div className="my-flat-info-grid">

          <div className="my-flat-info-card">

            <span>
              Flat Number
            </span>

            <strong>
              {flat.flat_number || '—'}
            </strong>

          </div>


          <div className="my-flat-info-card">

            <span>
              Block
            </span>

            <strong>
              {flat.blocks?.name || '—'}
            </strong>

          </div>


          <div className="my-flat-info-card">

            <span>
              Floor
            </span>

            <strong>
              {flat.floor_number || '—'}
            </strong>

          </div>


          <div className="my-flat-info-card">

            <span>
              Flat Type
            </span>

            <strong>
              {flat.flat_type || '—'}
            </strong>

          </div>


          <div className="my-flat-info-card">

            <span>
              Area
            </span>

            <strong>
              {flat.area_sqft
                ? `${flat.area_sqft} sq.ft`
                : '—'}
            </strong>

          </div>


          <div className="my-flat-info-card">

            <span>
              Status
            </span>

            <strong
              className={
                `my-flat-info-status ${
                  flat.status?.toLowerCase() || ''
                }`
              }
            >
              {flat.status || '—'}
            </strong>

          </div>


          {/* NEW: MEMBER COUNT */}

          <div className="my-flat-info-card">

            <span>
              Household Members
            </span>

            <strong>
              {memberCount}
            </strong>

          </div>

        </div>

      </section>


      {/* ========================================
          CURRENT RESIDENT
      ========================================= */}

      <section className="my-flat-section">

        <div className="my-flat-section-header">

          <div>
            <h2>
              My Profile
            </h2>

            <p>
              Resident currently associated
              with this flat
            </p>
          </div>

        </div>


        <div className="my-flat-resident-card">

          <div className="my-flat-avatar">
            {user?.full_name
              ?.charAt(0)
              ?.toUpperCase() || 'R'}
          </div>

          <div className="my-flat-resident-info">

            <h3>
              {user.full_name}
            </h3>

            <div className="my-flat-resident-detail">
              ✉️ {user.email}
            </div>

            {user.phone && (
              <div className="my-flat-resident-detail">
                📱 {user.phone}
              </div>
            )}

          </div>

          <span className="my-flat-resident-badge">
            You
          </span>

        </div>

      </section>


      {/* ========================================
          OTHER APP USERS
      ========================================= */}

      {otherMembers.length > 0 && (

        <section className="my-flat-section">

          <div className="my-flat-section-header">

            <div>
              <h2>
                Family Members
              </h2>

              <p>
                Other residents with app accounts
              </p>
            </div>

            <span className="my-flat-member-count">
              {otherMembers.length}
            </span>

          </div>


          <div className="my-flat-members-list">

            {otherMembers.map(member => (

              <div
                key={member.user_id}
                className="my-flat-member-card"
              >

                <div className="my-flat-member-avatar">
                  {member.users?.full_name
                    ?.charAt(0)
                    ?.toUpperCase() || '?'}
                </div>

                <div className="my-flat-member-info">

                  <strong>
                    {member.users?.full_name ||
                      'Unknown'}
                  </strong>

                  {member.users?.phone && (
                    <span>
                      📱 {member.users.phone}
                    </span>
                  )}

                  {member.users?.email && (
                    <span>
                      ✉️ {member.users.email}
                    </span>
                  )}

                </div>

                {member.users?.status && (
                  <span
                    className={
                      `my-flat-member-status ${
                        member.users.status
                          .toLowerCase()
                      }`
                    }
                  >
                    {member.users.status}
                  </span>
                )}

              </div>

            ))}

          </div>

        </section>

      )}


      {/* ========================================
          MEMBER COUNT
      ========================================= */}

      <section className="my-flat-section my-flat-members-summary">

        <div className="my-flat-summary-icon">
          👨‍👩‍👧‍👦
        </div>

        <div>
          <strong>
            {memberCount}{' '}
            {memberCount === 1
              ? 'household member'
              : 'household members'}
          </strong>

          <p>
            Total members associated with this flat
          </p>
        </div>

      </section>

    </div>
  )
}

export default MyFlat