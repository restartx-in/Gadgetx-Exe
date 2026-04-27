import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login from '@/apps/user/pages/Login'
import UserLayout from '@/layouts/UserLayout'
import AdminLayout from '@/layouts/AdminLayout'

export default function AppLayout() {
  const location = useLocation()

  const isLoggedIn = !!localStorage.getItem('access_token')
  let user = null

  if (isLoggedIn) {
    try {
      const userString = localStorage.getItem('user')
      if (userString) {
        user = JSON.parse(userString)
      }
    } catch (error) {
      console.error('Failed to parse user data from localStorage:', error)
      return <Navigate to="/login" replace />
    }
  }

  if (location.pathname === '/login') {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    )
  }

  if (!isLoggedIn || !user) {
    return <Navigate to="/login" replace />
  }

  if (user.role === 'super_admin') {
    if (!location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin/dashboard" replace />
    }
    return <AdminLayout />
  }

  if (isLoggedIn) {
    if (location.pathname.startsWith('/admin')) {
      return <Navigate to="/dashboard" replace />
    }
    return <UserLayout />
  }

  return <Navigate to="/login" replace />
}
