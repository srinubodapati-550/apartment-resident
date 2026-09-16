import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function Notifications({ user }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()

    const channel = supabase
      .channel(`resident-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        payload => {
          setNotifications(current => [
            payload.new,
            ...current
          ])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user.id])

  async function loadNotifications() {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id,
        title,
        message,
        notification_type,
        is_read,
        created_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Notifications error:', error)
    }

    setNotifications(data || [])
    setLoading(false)
  }

  async function markAsRead(id) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error(error)
      return
    }

    setNotifications(current =>
      current.map(notification =>
        notification.id === id
          ? { ...notification, is_read: true }
          : notification
      )
    )
  }

  async function markAllAsRead() {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) {
      console.error(error)
      return
    }

    setNotifications(current =>
      current.map(notification => ({
        ...notification,
        is_read: true
      }))
    )
  }

  if (loading) {
    return (
      <div className="page">
        <h1>Notifications</h1>
        <p>Loading...</p>
      </div>
    )
  }

  const unreadCount = notifications.filter(
    notification => !notification.is_read
  ).length

  return (
    <div className="page">

      <div className="page-title-row">
        <div>
          <h1>Notifications</h1>
          {unreadCount > 0 && (
            <small>
              {unreadCount} unread
            </small>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            className="text-button"
            onClick={markAllAsRead}
          >
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-card">
          <div className="empty-icon">🔔</div>
          <h3>No Notifications</h3>
          <p>You are all caught up.</p>
        </div>
      ) : (
        <div className="notification-list">

          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`notification-card ${
                notification.is_read
                  ? 'read'
                  : 'unread'
              }`}
              onClick={() =>
                !notification.is_read &&
                markAsRead(notification.id)
              }
            >

              <div className="notification-icon">
                {notification.notification_type === 'NOTICE'
                  ? '📢'
                  : notification.notification_type === 'COMPLAINT'
                  ? '🔧'
                  : notification.notification_type === 'PAYMENT'
                  ? '💰'
                  : '🔔'}
              </div>

              <div className="notification-content">

                <strong>
                  {notification.title}
                </strong>

                <p>
                  {notification.message}
                </p>

                <small>
                  {new Date(
                    notification.created_at
                  ).toLocaleString()}
                </small>

              </div>

              {!notification.is_read && (
                <div className="unread-dot" />
              )}

            </div>
          ))}

        </div>
      )}

    </div>
  )
}

export default Notifications