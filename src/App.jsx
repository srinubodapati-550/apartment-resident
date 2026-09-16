import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

import Login from './Login'
import Home from './pages/Home'
import MyFlat from './pages/MyFlat'
import Bills from './pages/Bills'
import Complaints from './pages/Complaints'
import More from './pages/More'
import Notices from './pages/Notices'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import BillDetails from './pages/BillDetails'
import ComplaintDetails from './pages/ComplaintDetails'
import Finance from './pages/Finance'

import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const [activePage, setActivePage] = useState('home')

  const [selectedBillId, setSelectedBillId] = useState(null)

  const [selectedComplaintId, setSelectedComplaintId] =
    useState(null)

  useEffect(() => {
    loadSession()
  }, [])

  async function loadSession() {
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (!session?.user) {
        setLoading(false)
        return
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select(
          'id, full_name, email, phone, role, status'
        )
        .eq('id', session.user.id)
        .single()

      if (error) {
        await supabase.auth.signOut()
        setLoading(false)
        return
      }

      if (
        userData.role !== 'RESIDENT' ||
        userData.status !== 'ACTIVE'
      ) {
        await supabase.auth.signOut()
        setLoading(false)
        return
      }

      setUser(userData)
    } catch (error) {
      console.error('Session error:', error)
    }

    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()

    setUser(null)

    setActivePage('home')

    setSelectedBillId(null)

    setSelectedComplaintId(null)
  }

  function goToPage(page) {
    setActivePage(page)

    /*
     * Clear detail pages when navigating
     * to another main section.
     */
    if (page !== 'bills') {
      setSelectedBillId(null)
    }

    if (page !== 'complaints') {
      setSelectedComplaintId(null)
    }
  }

  function renderPage() {
    switch (activePage) {

      /* =========================
         HOME
         ========================= */

      case 'home':
        return (
          <Home
            user={user}
          />
        )

      /* =========================
         MY FLAT
         ========================= */

      case 'flat':
        return (
          <MyFlat
            user={user}
          />
        )

      /* =========================
         BILLS
         ========================= */

      case 'bills':

        if (selectedBillId) {
          return (
            <BillDetails
              billId={selectedBillId}
              user={user}
              onBack={() => {
                setSelectedBillId(null)
              }}
            />
          )
        }

        return (
          <Bills
            user={user}
            onSelectBill={setSelectedBillId}
          />
        )

      /* =========================
         COMPLAINTS
         ========================= */

      case 'complaints':

        if (selectedComplaintId) {
          return (
            <ComplaintDetails
              complaintId={selectedComplaintId}
              user={user}
              onBack={() => {
                setSelectedComplaintId(null)
              }}
            />
          )
        }

        return (
          <Complaints
            user={user}
            onSelectComplaint={
              setSelectedComplaintId
            }
          />
        )

        case 'finance':
  return <Finance user={user} />

      /* =========================
         MORE
         ========================= */

      case 'more':
        return (
          <More
            onNavigate={goToPage}
            onLogout={handleLogout}
          />
        )

      /* =========================
         NOTICES
         ========================= */

      case 'notices':
        return (
          <Notices
            user={user}
          />
        )

      /* =========================
         NOTIFICATIONS
         ========================= */

      case 'notifications':
        return (
          <Notifications
            user={user}
          />
        )

      /* =========================
         PROFILE
         ========================= */

      case 'profile':
        return (
          <Profile
            user={user}
          />
        )

      default:
        return (
          <Home
            user={user}
          />
        )
    }
  }

  /* =========================
     LOADING
     ========================= */

  if (loading) {
    return (
      <div className="loading-screen">
        <h2>Loading...</h2>
      </div>
    )
  }

  /* =========================
     LOGIN
     ========================= */

  if (!user) {
    return (
      <Login
        onLogin={setUser}
      />
    )
  }

  /* =========================
     APP
     ========================= */

  return (
    <div className="app">

      {/* =========================
          HEADER
          ========================= */}

      <header className="app-header">

        <div>

          <div className="app-title">
            Apartment Resident
          </div>

          <div className="app-user">
            Hi, {user.full_name}
          </div>

        </div>

      </header>

      {/* =========================
          PAGE CONTENT
          ========================= */}

      <main className="app-content">
        {renderPage()}
      </main>

      {/* =========================
          BOTTOM NAVIGATION
          ========================= */}

      <nav className="bottom-nav">

        {/* HOME */}

        <button
          className={
            activePage === 'home'
              ? 'active'
              : ''
          }
          onClick={() => {
            goToPage('home')
          }}
        >
          <span>🏠</span>
          <small>Home</small>
        </button>

        {/* MY FLAT */}

        <button
          className={
            activePage === 'flat'
              ? 'active'
              : ''
          }
          onClick={() => {
            goToPage('flat')
          }}
        >
          <span>🏢</span>
          <small>My Flat</small>
        </button>

        {/* BILLS */}

        <button
          className={
            activePage === 'bills'
              ? 'active'
              : ''
          }
          onClick={() => {
            setSelectedComplaintId(null)
            setSelectedBillId(null)
            setActivePage('bills')
          }}
        >
          <span>💰</span>
          <small>Bills&Payments</small>
        </button>

        {/* COMPLAINTS */}

        <button
          className={
            activePage === 'complaints'
              ? 'active'
              : ''
          }
          onClick={() => {
            setSelectedBillId(null)
            setSelectedComplaintId(null)
            setActivePage('complaints')
          }}
        >
          <span>🔧</span>
          <small>Complaints</small>
        </button>


        {/* MORE */}

        <button
          className={
            activePage === 'more'
              ? 'active'
              : ''
          }
          onClick={() => {
            goToPage('more')
          }}
        >
          <span>☰</span>
          <small>More</small>
        </button>

      </nav>

    </div>
  )
}

export default App