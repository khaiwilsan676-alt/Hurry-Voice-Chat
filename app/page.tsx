'use client'

import { useState, useEffect } from 'react'
import HomePage from '@/components/HomePage'
import LoginPage from '@/components/LoginPage'
import { auth } from '@/src/lib/firebase'
import { signOut, onAuthStateChanged } from 'firebase/auth'

export default function Page() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  const handleLoginSuccess = (credentials?: any) => {
    setIsLoggedIn(true)
  }

  async function handleLogout() {
    const uid = localStorage.getItem("userUID")

    try {
      // Clear Firebase Session
      await signOut(auth)
    } catch (error) {
      console.log("Firebase logout error:", error)
    }

    // Clear Local Storage
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userPhone')
    localStorage.removeItem("userName")
    localStorage.removeItem("userUID")
    localStorage.removeItem("userPhoto")
    localStorage.removeItem("accountNumber")

    if (uid) {
      localStorage.removeItem(`user_data_${uid}`)
      localStorage.removeItem(`session_${uid}`)
      localStorage.removeItem(`forceLogout_${uid}`)

      const loggedInSessions = JSON.parse(localStorage.getItem('loggedInSessions') || '{}')
      delete loggedInSessions[uid]
      localStorage.setItem('loggedInSessions', JSON.stringify(loggedInSessions))
    }

    setIsLoggedIn(false)
    setLoading(false)
  }

  useEffect(() => {
    const checkUserStatus = async (user: any, fallbackUid?: string) => {
      const uid = user ? user.uid : fallbackUid;
      const accountId = localStorage.getItem('accountNumber');
      if (uid || accountId) {
        try {
          const { Device } = await import('@capacitor/device');
          const deviceIdInfo = await Device.getId();
          const deviceId = deviceIdInfo.identifier;
          const { apiUrl } = await import('@/src/lib/api');
          const res = await fetch(apiUrl('/api/check-ban'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accountId: accountId || 'N/A', deviceId })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.banned) {
              localStorage.setItem('recentBanMessage', JSON.stringify(data.banData));
              handleLogout();
              return;
            }
          }
        } catch (e) {
          console.error("Ban check failed:", e);
        }
      }
      setIsLoggedIn(true);
      setLoading(false);
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        checkUserStatus(user);
      } else {
        // Fallback to LocalStorage Check
        const userUID = localStorage.getItem('userUID')
        const userEmail = localStorage.getItem('userEmail')
        const userPhone = localStorage.getItem('userPhone')

        if (userUID || userEmail || userPhone) {
          checkUserStatus(null, userUID);
        } else {
          setIsLoggedIn(false)
          setLoading(false)
        }
      }
    });

    return () => unsubscribe();
  }, [])

  useEffect(() => {
    // Poll for forceLogout from owner panel
    const intervalId = setInterval(() => {
      const uid = localStorage.getItem("userUID")
      if (uid) {
        const forceLogout = localStorage.getItem(`forceLogout_${uid}`)
        if (forceLogout) {
          // Detected a force logout
          handleLogout()
        }
      }
    }, 1000)

    return () => clearInterval(intervalId)
  }, [])


  // Background Theme Style (Top 30vh Blue fading into 70vh White)
  const themeStyle = {
    background: 'linear-gradient(to bottom, #3b82f6 0vh, #3b82f6 30vh, #ffffff 50vh, #ffffff 100vh)',
    minHeight: '100vh',
    width: '100%'
  }

  if (loading) {
    return (
      <div
        className="flex flex-col items-center"
        style={{ ...themeStyle, paddingTop: '18vh' }}
      >
        <img
          src="/logo.png"
          alt="Hurry Logo"
          className="w-24 h-24 rounded-2xl object-cover shadow-lg"
        />
        <div style={{ gap: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '0.5rem' }}>
          <h1 className="text-3xl font-bold text-white tracking-wide">Hurry</h1>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div style={themeStyle}>
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </div>
    )
  }

  return (
    <div style={themeStyle}>
      <HomePage onLogout={handleLogout} />
    </div>
  )
}

