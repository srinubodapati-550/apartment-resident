import { useState } from 'react'
import { supabase } from './supabaseClient'

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(event) {
    event.preventDefault()

    setMessage('')
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })

      if (error) {
        throw error
      }

      if (!data.user) {
        throw new Error('Login failed.')
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, full_name, email, phone, role, status')
        .eq('id', data.user.id)
        .single()

      if (userError) {
        await supabase.auth.signOut()
        throw new Error('User profile not found.')
      }

      if (userData.role !== 'RESIDENT') {
        await supabase.auth.signOut()
        throw new Error('This application is for residents only.')
      }

      if (userData.status !== 'ACTIVE') {
        await supabase.auth.signOut()
        throw new Error('Your account is not active.')
      }

      onLogin(userData)

    } catch (error) {
      setMessage(error.message || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '400px' }}>
      <h1>Resident Login</h1>

      <form onSubmit={handleLogin}>

        <div style={{ marginBottom: '15px' }}>
          <label>Email</label>
          <br />

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            style={{ width: '100%', padding: '10px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Password</label>
          <br />

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            style={{ width: '100%', padding: '10px' }}
          />
        </div>

        {message && (
          <p style={{ color: 'red' }}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ padding: '10px 20px' }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

      </form>
    </div>
  )
}

export default Login