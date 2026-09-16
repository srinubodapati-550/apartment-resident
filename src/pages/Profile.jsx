function Profile({ user }) {
  return (
    <div className="page">

      <h1>Profile</h1>

      <div className="profile-card">

        <div className="profile-avatar">
          {user.full_name?.charAt(0)?.toUpperCase()}
        </div>

        <h2>{user.full_name}</h2>

        <div className="profile-info">

          <div>
            <span>Email</span>
            <strong>{user.email}</strong>
          </div>

          <div>
            <span>Phone</span>
            <strong>{user.phone || 'Not available'}</strong>
          </div>

          <div>
            <span>Role</span>
            <strong>{user.role}</strong>
          </div>

          <div>
            <span>Status</span>
            <strong>{user.status}</strong>
          </div>

        </div>

      </div>

    </div>
  )
}


export default Profile