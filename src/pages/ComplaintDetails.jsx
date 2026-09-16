import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function ComplaintDetails({ user, complaintId, onBack }) {
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (complaintId && user?.id) {
      fetchComplaint()
    }
  }, [complaintId, user?.id])

  async function fetchComplaint() {
    setLoading(true)
    setError('')

    try {
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
        .eq('id', complaintId)
        .eq('raised_by', user.id)
        .single()

      if (error) {
        throw error
      }

      setComplaint(data)
    } catch (err) {
      console.error('Error fetching complaint:', err)
      setError('Unable to load complaint details.')
    } finally {
      setLoading(false)
    }
  }

  function formatDate(date) {
    if (!date) return '-'

    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  function formatDateTime(date) {
    if (!date) return '-'

    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function getStatusClass(status) {
    switch (status) {
      case 'OPEN':
        return 'status-open'

      case 'IN_PROGRESS':
        return 'status-in-progress'

      case 'RESOLVED':
        return 'status-resolved'

      case 'CLOSED':
        return 'status-closed'

      case 'REJECTED':
        return 'status-rejected'

      default:
        return ''
    }
  }

  function getPriorityClass(priority) {
    switch (priority) {
      case 'LOW':
        return 'priority-low'

      case 'NORMAL':
        return 'priority-normal'

      case 'HIGH':
        return 'priority-high'

      case 'URGENT':
        return 'priority-urgent'

      default:
        return ''
    }
  }

  if (loading) {
    return (
      <div className="complaint-details-page">
        <div className="details-loading">
          Loading complaint...
        </div>
      </div>
    )
  }

  if (error || !complaint) {
    return (
      <div className="complaint-details-page">

        <button
          className="details-back-button"
          onClick={onBack}
        >
          ← Back to Complaints
        </button>

        <div className="details-error">
          {error || 'Complaint not found.'}
        </div>

      </div>
    )
  }

  return (
    <div className="complaint-details-page">

      {/* Header */}
      <div className="complaint-details-header">

        <button
          className="details-back-button"
          onClick={onBack}
        >
          ← Back to Complaints
        </button>

        <div className="complaint-details-title-row">

          <div>
            <h1>{complaint.title}</h1>

            <p className="complaint-number">
              {complaint.complaint_number || 'Complaint'}
            </p>
          </div>

          <div className="complaint-details-badges">

            <span
              className={`status-badge ${getStatusClass(
                complaint.status
              )}`}
            >
              {complaint.status.replace('_', ' ')}
            </span>

            <span
              className={`priority-badge ${getPriorityClass(
                complaint.priority
              )}`}
            >
              {complaint.priority}
            </span>

          </div>

        </div>
      </div>

      {/* Complaint Information */}
      <div className="complaint-details-card">

        <div className="complaint-info-grid">

          <div className="complaint-info-item">
            <span className="info-label">
              Category
            </span>

            <span className="info-value">
              {complaint.category}
            </span>
          </div>

          <div className="complaint-info-item">
            <span className="info-label">
              Priority
            </span>

            <span className="info-value">
              {complaint.priority}
            </span>
          </div>

          <div className="complaint-info-item">
            <span className="info-label">
              Raised On
            </span>

            <span className="info-value">
              {formatDate(complaint.created_at)}
            </span>
          </div>

          <div className="complaint-info-item">
            <span className="info-label">
              Last Updated
            </span>

            <span className="info-value">
              {formatDateTime(complaint.updated_at)}
            </span>
          </div>

        </div>

        {/* Description */}
        <div className="complaint-detail-section">

          <h3>Description</h3>

          <div className="complaint-description">
            {complaint.description ||
              'No description provided.'}
          </div>

        </div>

        {/* Resolution */}
        {(complaint.resolution_notes ||
          complaint.closed_at) && (

          <div className="complaint-detail-section resolution-section">

            <h3>Resolution</h3>

            {complaint.resolution_notes && (
              <div className="complaint-description">
                {complaint.resolution_notes}
              </div>
            )}

            {complaint.closed_at && (
              <div className="closed-date">
                Closed on{' '}
                {formatDateTime(complaint.closed_at)}
              </div>
            )}

          </div>
        )}

      </div>

      {/* Status Timeline */}
      <div className="complaint-details-card">

        <h3 className="timeline-title">
          Complaint Status
        </h3>

        <div className="complaint-timeline">

          {/* Raised */}
          <div
            className={`timeline-item ${
              [
                'OPEN',
                'IN_PROGRESS',
                'RESOLVED',
                'CLOSED'
              ].includes(complaint.status)
                ? 'completed'
                : ''
            }`}
          >

            <div className="timeline-dot" />

            <div>
              <strong>
                Complaint Raised
              </strong>

              <span>
                {formatDateTime(
                  complaint.created_at
                )}
              </span>
            </div>

          </div>

          {/* In Progress */}
          {[
            'IN_PROGRESS',
            'RESOLVED',
            'CLOSED'
          ].includes(complaint.status) && (

            <div className="timeline-item completed">

              <div className="timeline-dot" />

              <div>
                <strong>
                  In Progress
                </strong>

                <span>
                  Complaint is being handled
                </span>
              </div>

            </div>
          )}

          {/* Resolved */}
          {[
            'RESOLVED',
            'CLOSED'
          ].includes(complaint.status) && (

            <div className="timeline-item completed">

              <div className="timeline-dot" />

              <div>
                <strong>
                  Resolved
                </strong>

                <span>
                  Complaint has been resolved
                </span>
              </div>

            </div>
          )}

          {/* Closed */}
          {complaint.status === 'CLOSED' && (

            <div className="timeline-item completed">

              <div className="timeline-dot" />

              <div>
                <strong>
                  Closed
                </strong>

                <span>
                  {formatDateTime(
                    complaint.closed_at
                  )}
                </span>
              </div>

            </div>
          )}

          {/* Rejected */}
          {complaint.status === 'REJECTED' && (

            <div className="timeline-item rejected">

              <div className="timeline-dot" />

              <div>
                <strong>
                  Rejected
                </strong>

                <span>
                  Complaint was rejected
                </span>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  )
}

export default ComplaintDetails