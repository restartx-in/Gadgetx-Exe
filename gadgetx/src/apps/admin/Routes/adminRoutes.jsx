import AdminDashboard from '@/apps/admin/pages/Dashboard'
import AdminUsers from '@/apps/admin/pages/Users'
import AddUser from '@/apps/admin/pages/Users/components/AddUser'
import EditUser from '@/apps/admin/pages/Users/components/EditUser'
import TenantList from '@/apps/admin/pages/TenantList'
const adminRoutes = [
  { path: '/admin/dashboard', element: <AdminDashboard /> },
  { path: '/admin/tenant', element: <TenantList /> },
]

export default adminRoutes
