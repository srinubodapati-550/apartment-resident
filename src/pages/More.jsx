function More({
  onNavigate,
  onLogout
}) {
  return (
    <div className="page">

      <h1>More</h1>

      <div className="more-menu">

        <button onClick={() => onNavigate('finance')}>
          <span className="more-menu-icon">💰</span>
          <span>Finance</span>
        </button>

        <button onClick={() => onNavigate('notices')}>
          <span className="more-menu-icon">📢</span>
          <span>Notices</span>
        </button>

        <button onClick={() => onNavigate('notifications')}>
          <span className="more-menu-icon">🔔</span>
          <span>Notifications</span>
        </button>

        <button onClick={() => onNavigate('profile')}>
          <span className="more-menu-icon">👤</span>
          <span>Profile</span>
        </button>

        <button
          className="logout-button"
          onClick={onLogout}
        >
          <span className="more-menu-icon">🚪</span>
          <span>Logout</span>
        </button>

      </div>

    </div>
  )
}

export default More