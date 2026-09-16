function More({
  onNavigate,
  onLogout
}) {
  return (
    <div className="page">

      <h1>More</h1>

      <div className="more-menu">

        <button onClick={() => onNavigate('finance')}>
          💰
        <span>Finance</span>
        </button>

        <button onClick={() => onNavigate('notices')}>
          📢
          <span>Notices</span>
        </button>

        <button onClick={() => onNavigate('notifications')}>
          🔔
          <span>Notifications</span>
        </button>

        <button onClick={() => onNavigate('profile')}>
          👤
          <span>Profile</span>
        </button>

        <button
          className="logout-button"
          onClick={onLogout}
        >
          🚪
          <span>Logout</span>
        </button>

      </div>

    </div>
  )
}

export default More