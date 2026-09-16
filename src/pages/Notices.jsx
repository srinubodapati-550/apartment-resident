import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function Notices({ user }) {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadNotices()
  }, [user.id])

  async function loadNotices() {
    try {
      setLoading(true)
      setError('')

      const { data: memberData, error: memberError } =
        await supabase
          .from('flat_members')
          .select(`
            flats (
              blocks (
                apartment_id
              )
            )
          `)
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle()

      if (memberError) throw memberError

      const apartmentId =
        memberData?.flats?.blocks?.apartment_id

      if (!apartmentId) {
        setNotices([])
        return
      }

      const { data, error } = await supabase
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
        .eq('apartment_id', apartmentId)
        .eq('status', 'PUBLISHED')
        .order('published_at', { ascending: false })

      if (error) throw error

      setNotices(data || [])

    } catch (error) {
      console.error('Notices error:', error)
      setError(error.message || 'Unable to load notices.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page">
        <h1>Notices</h1>
        <p>Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <h1>Notices</h1>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    )
  }

  return (
    <div className="page">
      <h1>Notices</h1>

      {notices.length === 0 ? (
        <div className="empty-card">
          <div className="empty-icon">📢</div>
          <h3>No Notices</h3>
          <p>There are no published notices at the moment.</p>
        </div>
      ) : (
        <div className="notice-list">
          {notices.map(notice => (
            <div className="notice-card" key={notice.id}>

              <div className="notice-header">
                <h3>{notice.title}</h3>

                <span className={`priority ${notice.priority?.toLowerCase()}`}>
                  {notice.priority}
                </span>
              </div>

              <p>{notice.description}</p>

              {notice.published_at && (
                <small>
                  Published:{' '}
                  {new Date(
                    notice.published_at
                  ).toLocaleDateString()}
                </small>
              )}

            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Notices