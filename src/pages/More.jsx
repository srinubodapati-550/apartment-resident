import './More.css'

function More({
  onNavigate,
  onLogout
}) {
  const menuItems = [
    {
      id: 'finance',
      icon: '💰',
      title: 'Finance',
      description: 'View funds, expenses and incoming amounts',
      color: 'finance'
    },
    {
      id: 'notices',
      icon: '📢',
      title: 'Notices',
      description: 'Read apartment announcements',
      color: 'notices'
    },
    {
      id: 'notifications',
      icon: '🔔',
      title: 'Notifications',
      description: 'Check your latest updates',
      color: 'notifications'
    },
    {
      id: 'profile',
      icon: '👤',
      title: 'My Profile',
      description: 'View your personal information',
      color: 'profile'
    }
  ]

  return (
    <div className="page more-page">

      <div className="more-page-header">
        <div>
          <h1>More</h1>
          <p>Manage your apartment account and services.</p>
        </div>

        <div className="more-header-icon">
          ⚙️
        </div>
      </div>

      <div className="more-section-heading">
        <h2>Quick Access</h2>
        <span>4 services</span>
      </div>

      <div className="more-menu">

        {menuItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className="more-menu-card"
            onClick={() => onNavigate(item.id)}
          >
            <span className={`more-menu-icon ${item.color}`}>
              {item.icon}
            </span>

            <span className="more-menu-content">
              <span className="more-menu-title">
                {item.title}
              </span>

              <span className="more-menu-description">
                {item.description}
              </span>
            </span>

            <span className="more-menu-arrow">
              ›
            </span>
          </button>
        ))}

      </div>

      <div className="more-account-section">
        <h2>Account</h2>

        <button
          type="button"
          className="more-menu-card more-logout-card"
          onClick={onLogout}
        >
          <span className="more-menu-icon logout-icon">
            🚪
          </span>

          <span className="more-menu-content">
            <span className="more-menu-title">
              Logout
            </span>

            <span className="more-menu-description">
              Sign out of your resident account
            </span>
          </span>

          <span className="more-menu-arrow">
            ›
          </span>
        </button>
      </div>

      <div className="more-footer">
        <span>🏠</span>
        <p>Apartment Resident Portal</p>
        <small>Manage your home, your way.</small>
      </div>

    </div>
  )
}

export default More