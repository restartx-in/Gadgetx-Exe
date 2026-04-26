import { NavLink } from 'react-router-dom'
import './style.scss'
import { useSettings } from '@/context/AdminSettingsContext'
import { defaultSidebarLabels } from '@/constants/adminSidebarLabels'
import AdminSidebarLink from './components/AdminSidebarLink'

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch (e) {
    return e
  }
}

const Sidebar = ({ open, onClose }) => {
  let username = 'User'
  const token = localStorage.getItem('access_token')
  if (token) {
    const payload = parseJwt(token)
    if (payload && payload.username) {
      username = payload.username
    }
  }

  const settingsContext = useSettings()
  const loading = settingsContext?.loading || false
  const companyName = 'AccountX'
  const sidebarLabels = defaultSidebarLabels

  const mainNavLinks = [
    { to: '/admin/dashboard', label: sidebarLabels.Dashboard },
    { to: '/admin/tenant', label: 'Tenant' },
  ]

  const secondaryNavLinks = [
    { to: '/admin/reports', label: sidebarLabels.reports },
    { to: '/admin/settings', label: sidebarLabels.settings },
  ]

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 900
  const showSidebar = open === undefined ? true : open

  if (loading) {
    return (
      <aside
        className={`admin_sidebar${isMobile ? ' sidebar-mobile' : ''}${
          showSidebar ? ' open' : ''
        }`}>
        <div className="admin_sidebar__header">
          <h1 className="admin_sidebar__header-title">Loading...</h1>
        </div>
      </aside>
    )
  }

  return (
    <>
      {isMobile && showSidebar && (
        <div className="admin_sidebar-backdrop box-shadow" onClick={onClose} />
      )}
      <aside
        className={`admin_sidebar${
          isMobile ? ' sidebar-mobile box-shadow' : ''
        }${showSidebar ? ' open' : ''}`}
        style={
          isMobile && !showSidebar ? { transform: 'translateX(-100%)' } : {}
        }>
        <div className="admin_sidebar__header">
          <h1
            className="admin_sidebar__header-title fs24"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {companyName}
          </h1>
          {isMobile && (
            <button
              className="admin_sidebar-close-btn fs26"
              onClick={onClose}
              aria-label="Close sidebar">
              ×
            </button>
          )}
        </div>
        <nav className="admin_sidebar__nav">
          <ul className="admin_sidebar__nav-list">
            {mainNavLinks.map((link) => (
              <AdminSidebarLink key={link.to} {...link} />
            ))}
          </ul>
          <ul className="admin_sidebar__nav-list">
            {secondaryNavLinks.map((link) => (
              <AdminSidebarLink key={link.to} {...link} />
            ))}
          </ul>
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
