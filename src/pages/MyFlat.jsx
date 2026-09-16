import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function MyFlat({ user }) {
  const [flat, setFlat] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadMyFlat()
  }, [user.id])

  async function loadMyFlat() {
    try {
      setLoading(true)
      setError('')

      // Get resident's flat
      const { data: memberData, error: memberError } =
        await supabase
          .from('flat_members')
          .select(`
            flat_id,
            flats (
              id,
              flat_number,
              floor_number,
              flat_type,
              area_sqft,
              status,
              blocks (
                id,
                name,
                apartment_id
              )
            )
          `)
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle()

      if (memberError) {
        throw memberError
      }

      if (!memberData || !memberData.flats) {
        setFlat(null)
        setMembers([])
        return
      }

      setFlat(memberData.flats)

      // Get all members of the same flat
      const { data: memberList, error: membersError } =
        await supabase
          .from('flat_members')
          .select(`
            user_id,
            users (
              id,
              full_name,
              email,
              phone,
              role,
              status
            )
          `)
          .eq('flat_id', memberData.flat_id)

      if (membersError) {
        throw membersError
      }

      setMembers(memberList || [])

    } catch (error) {
      console.error('My Flat error:', error)
      setError(error.message || 'Unable to load flat details.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <h2>My Flat</h2>
        <p>Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <h2>My Flat</h2>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    )
  }

  if (!flat) {
    return (
      <div style={{ padding: '24px' }}>
        <h2>My Flat</h2>
        <p>No flat has been assigned to your account.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>

      <h1>My Flat</h1>

      {/* Resident */}
      <div
        style={{
          marginTop: '24px',
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '12px',
          maxWidth: '500px'
        }}
      >
        <h2>Resident</h2>

        <p>
          <strong>Name:</strong>{' '}
          {user.full_name}
        </p>

        <p>
          <strong>Email:</strong>{' '}
          {user.email}
        </p>

        {user.phone && (
          <p>
            <strong>Phone:</strong>{' '}
            {user.phone}
          </p>
        )}
      </div>

      {/* Flat */}
      <div
        style={{
          marginTop: '20px',
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '12px',
          maxWidth: '500px'
        }}
      >
        <h2>
          Flat {flat.flat_number}
        </h2>

        <p>
          <strong>Block:</strong>{' '}
          {flat.blocks?.name || '—'}
        </p>

        <p>
          <strong>Floor:</strong>{' '}
          {flat.floor_number}
        </p>

        <p>
          <strong>Flat Type:</strong>{' '}
          {flat.flat_type || '—'}
        </p>

        <p>
          <strong>Area:</strong>{' '}
          {flat.area_sqft
            ? `${flat.area_sqft} sq.ft`
            : '—'}
        </p>

        <p>
          <strong>Status:</strong>{' '}
          {flat.status}
        </p>
      </div>

      {/* Other members */}
      {members.length > 1 && (
        <div
          style={{
            marginTop: '20px',
            padding: '20px',
            border: '1px solid #ddd',
            borderRadius: '12px',
            maxWidth: '500px'
          }}
        >
          <h2>Family Members</h2>

          {members
            .filter(member => member.user_id !== user.id)
            .map(member => (
              <div
                key={member.user_id}
                style={{
                  padding: '10px 0',
                  borderBottom: '1px solid #eee'
                }}
              >
                <strong>
                  {member.users?.full_name || 'Unknown'}
                </strong>

                {member.users?.phone && (
                  <div>
                    {member.users.phone}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

    </div>
  )
}

export default MyFlat