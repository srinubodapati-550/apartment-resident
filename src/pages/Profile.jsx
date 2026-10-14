import './Profile.css'

function Profile({ user }) {
  const fullName = user?.full_name || 'Resident'
  const initial = fullName.charAt(0).toUpperCase()

  const formatValue = (value) => {
    if (!value) return 'Not available'

    return value
      .toString()
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }

  return (
    <div className="page profile-page">

      <div className="profile-page-header">
        <div>
          <h1>My Profile</h1>
          <p>Manage and view your resident account details.</p>
        </div>
      </div>

      <div className="profile-layout">

        {/* Profile Overview */}
        <section className="profile-card">

          <div className="profile-cover">
            <div className="profile-avatar">
              {initial}
            </div>
          </div>

          <div className="profile-overview">
            <h2>{fullName}</h2>

            <p className="profile-email">
              {user?.email || 'Email not available'}
            </p>

            <div className="profile-badges">
              <span className="profile-role-badge">
                {formatValue(user?.role || 'Resident')}
              </span>

              <span
                className={`profile-status-badge ${
                  user?.status?.toUpperCase() === 'ACTIVE'
                    ? 'is-active'
                    : 'is-inactive'
                }`}
              >
                <span className="profile-status-dot"></span>
                {formatValue(user?.status || 'Unknown')}
              </span>
            </div>
          </div>

          <div className="profile-card-footer">
            <span className="profile-footer-icon">✓</span>
            <span>Resident account information</span>
          </div>

        </section>

        {/* Personal Information */}
        <section className="profile-details-card">

          <div className="profile-section-heading">
            <div className="profile-section-icon">👤</div>

            <div>
              <h2>Personal Information</h2>
              <p>Your registered account details</p>
            </div>
          </div>

          <div className="profile-info">

            <div className="profile-info-item">
              <span className="profile-info-icon">♙</span>
              <div>
                <span className="profile-label">Full Name</span>
                <strong>{fullName}</strong>
              </div>
            </div>

            <div className="profile-info-item">
              <span className="profile-info-icon">✉</span>
              <div>
                <span className="profile-label">Email Address</span>
                <strong>{user?.email || 'Not available'}</strong>
              </div>
            </div>

            <div className="profile-info-item">
              <span className="profile-info-icon">☎</span>
              <div>
                <span className="profile-label">Phone Number</span>
                <strong>{user?.phone || 'Not available'}</strong>
              </div>
            </div>

            <div className="profile-info-item">
              <span className="profile-info-icon">🛡</span>
              <div>
                <span className="profile-label">Account Role</span>
                <strong>{formatValue(user?.role || 'Resident')}</strong>
              </div>
            </div>

          </div>

        </section>

      </div>

    </div>
  )
}

export default Profile