
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function Notices({ user }) {
  const [notices, setNotices] = useState([])
  const [apartmentId, setApartmentId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('NORMAL')
  const [expiryDate, setExpiryDate] = useState('')

  useEffect(() => {
    if (user?.id) {
      loadNotices()
    } else {
      setLoading(false)
      setError('Please log in to view notices.')
    }
  }, [user?.id])

  async function loadNotices() {
    try {
      setLoading(true)
      setError('')

      // Get the authenticated user to match Supabase RLS policies.
      const {
        data: authData,
        error: authError
      } = await supabase.auth.getUser()

      if (authError) throw authError

      const residentId = authData?.user?.id

      if (!residentId) {
        throw new Error('Your session has expired. Please log in again.')
      }

      // Find the resident's active apartment membership.
      const {
        data: memberData,
        error: memberError
      } = await supabase
        .from('flat_members')
        .select(`
          flat_id,
          flats (
            blocks (
              apartment_id
            )
          )
        `)
        .eq('user_id', residentId)
        .eq('status', 'ACTIVE')
        .limit(1)
        .maybeSingle()

      if (memberError) throw memberError

      const currentApartmentId =
        memberData?.flats?.blocks?.apartment_id

      if (!currentApartmentId) {
        setApartmentId(null)
        setNotices([])
        setError('No active apartment membership was found for your account.')
        return
      }

      setApartmentId(currentApartmentId)

      // Fetch published notices for this apartment.
      const {
        data,
        error: noticesError
      } = await supabase
        .from('notices')
        .select(`
          id,
          title,
          description,
          priority,
          published_at,
          expiry_date,
          status,
          published_by
        `)
        .eq('apartment_id', currentApartmentId)
        .eq('status', 'PUBLISHED')
        .order('published_at', { ascending: false })

      if (noticesError) throw noticesError

      // Hide notices whose expiry date has passed.
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const activeNotices = (data || []).filter(notice => {
        if (!notice.expiry_date) return true

        const expiry = new Date(`${notice.expiry_date}T00:00:00`)
        return expiry >= today
      })

      setNotices(activeNotices)
    } catch (err) {
      console.error('Notices error:', err)
      setError(err.message || 'Unable to load notices.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddNotice(event) {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (!title.trim() || !description.trim()) {
      setError('Please enter both a title and a description.')
      return
    }

    if (!apartmentId) {
      setError('Your apartment could not be identified.')
      return
    }

    if (expiryDate) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (new Date(`${expiryDate}T00:00:00`) < today) {
        setError('Expiry date cannot be in the past.')
        return
      }
    }

    try {
      setSaving(true)

      const {
        data: authData,
        error: authError
      } = await supabase.auth.getUser()

      if (authError) throw authError

      const residentId = authData?.user?.id

      if (!residentId) {
        throw new Error('Please log in again before publishing.')
      }

      // Publish immediately; do not create a draft.
      const {
        error: insertError
      } = await supabase
        .from('notices')
        .insert({
          apartment_id: apartmentId,
          title: title.trim(),
          description: description.trim(),
          priority,
          published_by: residentId,
          published_at: new Date().toISOString(),
          expiry_date: expiryDate || null,
          status: 'PUBLISHED'
        })

      if (insertError) throw insertError

      setTitle('')
      setDescription('')
      setPriority('NORMAL')
      setExpiryDate('')
      setShowForm(false)
      setSuccess('Notice published successfully!')

      // Refresh the notice list after publishing.
      await loadNotices()
    } catch (err) {
      console.error('Publish notice error:', err)
      setError(
        err.message ||
        'Unable to publish the notice. Please check your permissions.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="page">
        <h1>Notices</h1>
        <p>Loading notices...</p>
      </div>
    )
  }

  return (
    <div className="page">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px'
        }}
      >
        <h1 style={{ margin: 0 }}>Notices</h1>

        <button
          type="button"
          onClick={() => {
            setShowForm(!showForm)
            setError('')
            setSuccess('')
          }}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderRadius: '8px',
            background: '#2563eb',
            color: '#ffffff',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          {showForm ? '✕ Cancel' : '+ Add Notice'}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: '12px',
            marginBottom: '16px',
            borderRadius: '8px',
            background: '#fee2e2',
            color: '#991b1b'
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          style={{
            padding: '12px',
            marginBottom: '16px',
            borderRadius: '8px',
            background: '#dcfce7',
            color: '#166534'
          }}
        >
          {success}
        </div>
      )}

      {showForm && (
        <div
          className="notice-form-card"
          style={{
            padding: '20px',
            marginBottom: '24px',
            borderRadius: '12px',
            background: 'var(--card-bg, #ffffff)',
            border: '1px solid var(--border-color, #e5e7eb)'
          }}
        >
          <h2 style={{ marginTop: 0 }}>Publish a Notice</h2>

          <p>
            Your notice will be published immediately and will be available
            to residents of your apartment.
          </p>

          <form
            onSubmit={handleAddNotice}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div>
              <label
                htmlFor="notice-title"
                style={{ display: 'block', marginBottom: '6px' }}
              >
                Notice Title *
              </label>

              <input
                id="notice-title"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Water supply maintenance"
                maxLength={200}
                required
                style={{
                  boxSizing: 'border-box',
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1'
                }}
              />
            </div>

            <div>
              <label
                htmlFor="notice-description"
                style={{ display: 'block', marginBottom: '6px' }}
              >
                Description *
              </label>

              <textarea
                id="notice-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Enter the notice details..."
                rows={5}
                required
                style={{
                  boxSizing: 'border-box',
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  resize: 'vertical'
                }}
              />
            </div>

            <div>
              <label
                htmlFor="notice-priority"
                style={{ display: 'block', marginBottom: '6px' }}
              >
                Priority
              </label>

              <select
                id="notice-priority"
                value={priority}
                onChange={e => setPriority(e.target.value)}
                style={{
                  boxSizing: 'border-box',
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1'
                }}
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="notice-expiry"
                style={{ display: 'block', marginBottom: '6px' }}
              >
                Expiry Date (Optional)
              </label>

              <input
                id="notice-expiry"
                type="date"
                value={expiryDate}
                min={new Date().toLocaleDateString('en-CA')}
                onChange={e => setExpiryDate(e.target.value)}
                style={{
                  boxSizing: 'border-box',
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '12px 16px',
                border: 'none',
                borderRadius: '8px',
                background: saving ? '#94a3b8' : '#16a34a',
                color: '#ffffff',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? 'Publishing...' : '📢 Publish Notice'}
            </button>
          </form>
        </div>
      )}

      <h2>Published Notices</h2>

      {notices.length === 0 ? (
        <div className="empty-card">
          <div className="empty-icon">📢</div>
          <h3>No Notices</h3>
          <p>There are no active published notices at the moment.</p>
        </div>
      ) : (
        <div className="notice-list">
          {notices.map(notice => (
            <div className="notice-card" key={notice.id}>
              <div className="notice-header">
                <h3>{notice.title}</h3>

                <span
                  className={`priority ${
                    notice.priority?.toLowerCase()
                  }`}
                >
                  {notice.priority}
                </span>
              </div>

              <p>{notice.description}</p>

              {notice.published_at && (
                <small>
                  Published:{' '}
                  {new Date(notice.published_at).toLocaleString()}
                </small>
              )}

              {notice.expiry_date && (
                <div style={{ marginTop: '6px' }}>
                  <small>
                    Expires:{' '}
                    {new Date(
                      `${notice.expiry_date}T00:00:00`
                    ).toLocaleDateString()}
                  </small>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Notices
