import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function Complaints({ user, onSelectComplaint }) {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    category: 'MAINTENANCE',
    title: '',
    description: '',
    priority: 'NORMAL'
  })

  const categories = [
    'MAINTENANCE',
    'SECURITY',
    'CLEANING',
    'LIFT',
    'WATER',
    'ELECTRICAL',
    'PLUMBING',
    'PARKING',
    'COMMON AREA',
    'OTHER'
  ]

  const priorities = [
    'LOW',
    'NORMAL',
    'HIGH',
    'URGENT'
  ]

  useEffect(() => {
    fetchComplaints()
  }, [user])

  async function fetchComplaints() {
    try {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .from('complaints')
        .select(`
          id,
          complaint_number,
          category,
          title,
          description,
          priority,
          status,
          created_at,
          updated_at,
          closed_at,
          resolution_notes
        `)
        .eq('raised_by', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setComplaints(data || [])
    } catch (err) {
      console.error('Error fetching complaints:', err)
      setError(err.message || 'Unable to load complaints')
    } finally {
      setLoading(false)
    }
  }

  function handleInputChange(event) {
    const { name, value } = event.target

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!formData.title.trim()) {
      setError('Please enter a complaint title.')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      /*
       * Get the resident's flat and apartment.
       * flats -> blocks -> apartment
       */
      const { data: memberData, error: memberError } = await supabase
        .from('flat_members')
        .select(`
          flat_id,
          flats (
            id,
            block_id,
            blocks (
              id,
              apartment_id
            )
          )
        `)
        .eq('user_id', user.id)
        .limit(1)
        .single()

      if (memberError) {
        throw memberError
      }

      if (!memberData?.flat_id || !memberData?.flats?.blocks?.apartment_id) {
        throw new Error(
          'Your flat details could not be found. Please contact the administrator.'
        )
      }

      const flatId = memberData.flat_id
      const apartmentId = memberData.flats.blocks.apartment_id

      const { error: insertError } = await supabase
        .from('complaints')
        .insert({
          apartment_id: apartmentId,
          flat_id: flatId,
          raised_by: user.id,
          category: formData.category,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          priority: formData.priority,
          status: 'OPEN'
        })

      if (insertError) {
        throw insertError
      }

      setFormData({
        category: 'MAINTENANCE',
        title: '',
        description: '',
        priority: 'NORMAL'
      })

      setShowForm(false)

      await fetchComplaints()
    } catch (err) {
      console.error('Error submitting complaint:', err)
      setError(err.message || 'Unable to submit complaint')
    } finally {
      setSubmitting(false)
    }
  }

  function formatDate(dateString) {
    if (!dateString) {
      return '-'
    }

    const date = new Date(dateString)

    if (Number.isNaN(date.getTime())) {
      return '-'
    }

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  function formatDateTime(dateString) {
    if (!dateString) {
      return '-'
    }

    const date = new Date(dateString)

    if (Number.isNaN(date.getTime())) {
      return '-'
    }

    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function getStatusLabel(status) {
    switch (status) {
      case 'OPEN':
        return 'Open'

      case 'IN_PROGRESS':
        return 'In Progress'

      case 'RESOLVED':
        return 'Resolved'

      case 'CLOSED':
        return 'Closed'

      case 'REJECTED':
        return 'Rejected'

      default:
        return status || '-'
    }
  }

  function getPriorityLabel(priority) {
    switch (priority) {
      case 'LOW':
        return 'Low'

      case 'NORMAL':
        return 'Normal'

      case 'HIGH':
        return 'High'

      case 'URGENT':
        return 'Urgent'

      default:
        return priority || '-'
    }
  }

  function getStatusClass(status) {
    switch (status) {
      case 'OPEN':
        return 'complaint-status-open'

      case 'IN_PROGRESS':
        return 'complaint-status-progress'

      case 'RESOLVED':
        return 'complaint-status-resolved'

      case 'CLOSED':
        return 'complaint-status-closed'

      case 'REJECTED':
        return 'complaint-status-rejected'

      default:
        return ''
    }
  }

  function getPriorityClass(priority) {
    switch (priority) {
      case 'LOW':
        return 'complaint-priority-low'

      case 'NORMAL':
        return 'complaint-priority-normal'

      case 'HIGH':
        return 'complaint-priority-high'

      case 'URGENT':
        return 'complaint-priority-urgent'

      default:
        return ''
    }
  }

  function handleComplaintClick(complaintId) {
    if (onSelectComplaint) {
      onSelectComplaint(complaintId)
    }
  }

  function handleComplaintKeyDown(event, complaintId) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleComplaintClick(complaintId)
    }
  }

  const totalComplaints = complaints.length

const openComplaints = complaints.filter(
  complaint => complaint.status === 'OPEN'
).length

const inProgressComplaints = complaints.filter(
  complaint => complaint.status === 'IN_PROGRESS'
).length

const resolvedComplaints = complaints.filter(
  complaint =>
    complaint.status === 'RESOLVED' ||
    complaint.status === 'CLOSED'
).length

  return (
    <div className="complaints-page">

      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <h1>Complaints</h1>
          <p>Raise and track your apartment complaints</p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => {
            setError('')
            setShowForm(prev => !prev)
          }}
        >
          {showForm ? 'Cancel' : '+ Raise Complaint'}
        </button>
      </div>

{/* COMPLAINT SUMMARY */}
<div className="complaints-summary">
  <div className="summary-item">
    <span className="summary-count">
      {totalComplaints}
    </span>
    <span className="summary-label">
      Complaints
    </span>
  </div>

  <div className="summary-divider" />

  <div className="summary-item">
    <span className="summary-count">
      {openComplaints}
    </span>
    <span className="summary-label">
      Open
    </span>
  </div>

  <div className="summary-divider" />

  <div className="summary-item">
    <span className="summary-count">
      {inProgressComplaints}
    </span>
    <span className="summary-label">
      In Progress
    </span>
  </div>

  <div className="summary-divider" />

  <div className="summary-item">
    <span className="summary-count">
      {resolvedComplaints}
    </span>
    <span className="summary-label">
      Resolved
    </span>
  </div>
</div>

      {/* ERROR */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* RAISE COMPLAINT FORM */}
      {showForm && (
        <div className="complaint-form-card">

          <div className="form-card-header">
            <div>
              <h2>Raise a Complaint</h2>
              <p>Please provide the details of your complaint.</p>
            </div>

            <button
              type="button"
              className="close-button"
              onClick={() => {
                setShowForm(false)
                setError('')
              }}
              aria-label="Close complaint form"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>

            {/* CATEGORY */}
            <div className="form-group">
              <label htmlFor="category">
                Category
              </label>

              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                disabled={submitting}
              >
                {categories.map(category => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* TITLE */}
            <div className="form-group">
              <label htmlFor="title">
                Complaint Title
              </label>

              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Example: Lift not working"
                maxLength={200}
                disabled={submitting}
                required
              />
            </div>

            {/* DESCRIPTION */}
            <div className="form-group">
              <label htmlFor="description">
                Description
              </label>

              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the issue in detail..."
                rows={5}
                disabled={submitting}
              />
            </div>

            {/* PRIORITY */}
            <div className="form-group">
              <label htmlFor="priority">
                Priority
              </label>

              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                disabled={submitting}
              >
                {priorities.map(priority => (
                  <option
                    key={priority}
                    value={priority}
                  >
                    {getPriorityLabel(priority)}
                  </option>
                ))}
              </select>
            </div>

            {/* FORM ACTIONS */}
            <div className="form-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setShowForm(false)
                  setError('')
                }}
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Complaint'}
              </button>

            </div>
          </form>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="loading-state">
          Loading complaints...
        </div>
      )}

      {/* COMPLAINT LIST */}
      {!loading && complaints.length > 0 && (
        <div className="complaints-list">

          {complaints.map(complaint => (
            <div
              key={complaint.id}
              className="complaint-card"
              role="button"
              tabIndex={0}
              onClick={() => handleComplaintClick(complaint.id)}
              onKeyDown={event =>
                handleComplaintKeyDown(event, complaint.id)
              }
            >

              {/* CARD TOP */}
              <div className="complaint-card-top">

                <div>
                  <div className="complaint-number">
                    {complaint.complaint_number || 'Complaint'}
                  </div>

                  <h3>
                    {complaint.title}
                  </h3>
                </div>

                <span
                  className={`complaint-status ${getStatusClass(
                    complaint.status
                  )}`}
                >
                  {getStatusLabel(complaint.status)}
                </span>

              </div>

              {/* META */}
              <div className="complaint-meta">

                <span>
                  {complaint.category}
                </span>

                <span>
                  Raised {formatDate(complaint.created_at)}
                </span>

                <span
                  className={`complaint-priority ${getPriorityClass(
                    complaint.priority
                  )}`}
                >
                  {getPriorityLabel(complaint.priority)}
                </span>

              </div>

              {/* DESCRIPTION */}
              {complaint.description && (
                <div className="complaint-description">
                  {complaint.description}
                </div>
              )}

              {/* RESOLUTION */}
              {complaint.resolution_notes && (
                <div className="resolution-box">
                  <strong>Resolution:</strong>
                  <div>
                    {complaint.resolution_notes}
                  </div>
                </div>
              )}

              {/* FOOTER */}
              <div className="complaint-card-footer">
                <span className="complaint-updated">
                  Last updated {formatDate(complaint.updated_at)}
                </span>

                <span className="view-details">
                  View Details →
                </span>
              </div>

            </div>
          ))}

        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && complaints.length === 0 && !showForm && (
        <div className="empty-state">

          <div className="empty-state-icon">
            📋
          </div>

          <h2>No complaints yet</h2>

          <p>
            You haven't raised any complaints.
            Create one if you need help with something
            in the apartment.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={() => {
              setError('')
              setShowForm(true)
            }}
          >
            + Raise Complaint
          </button>

        </div>
      )}

    </div>
  )
}

export default Complaints