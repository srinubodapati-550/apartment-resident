function Home({ user }) {
  return (
    <div className="page">

      <h1>Home</h1>

      <div
        style={{
          background: '#ffffff',
          padding: '20px',
          borderRadius: '12px',
          marginTop: '20px',
          border: '1px solid #e5e5e5'
        }}
      >
        <h2>Hello, {user.full_name} 👋</h2>

        <p>
          Welcome to your apartment resident portal.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginTop: '20px'
        }}
      >

        <div
          style={{
            background: '#ffffff',
            padding: '18px',
            borderRadius: '12px',
            border: '1px solid #e5e5e5'
          }}
        >
          <div style={{ fontSize: '25px' }}>🏢</div>
          <strong>My Flat</strong>
          <p style={{ fontSize: '13px', color: '#666' }}>
            View your flat details
          </p>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '18px',
            borderRadius: '12px',
            border: '1px solid #e5e5e5'
          }}
        >
          <div style={{ fontSize: '25px' }}>💰</div>
          <strong>Bills&Payments</strong>
          <p style={{ fontSize: '13px', color: '#666' }}>
            View your maintenance bills
          </p>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '18px',
            borderRadius: '12px',
            border: '1px solid #e5e5e5'
          }}
        >
          <div style={{ fontSize: '25px' }}>🔧</div>
          <strong>Complaints</strong>
          <p style={{ fontSize: '13px', color: '#666' }}>
            Raise and track complaints
          </p>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '18px',
            borderRadius: '12px',
            border: '1px solid #e5e5e5'
          }}
        >
          <div style={{ fontSize: '25px' }}>📢</div>
          <strong>Notices</strong>
          <p style={{ fontSize: '13px', color: '#666' }}>
            View apartment notices
          </p>
        </div>

      </div>

    </div>
  )
}

export default Home