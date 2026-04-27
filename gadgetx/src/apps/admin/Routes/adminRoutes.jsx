import AdminDashboard from '@/apps/admin/pages/Dashboard'
import AdminUsers from '@/apps/admin/pages/Users'
import AddUser from '@/apps/admin/pages/Users/components/AddUser'
import EditUser from '@/apps/admin/pages/Users/components/EditUser'
import TenantList from '@/apps/admin/pages/TenantList'
import CustomPageBuilder from '@/apps/admin/pages/CustomPageBuilder'

const adminRoutes = [
  { path: '/admin/dashboard', element: <AdminDashboard /> },
  { path: '/admin/tenant', element: <TenantList /> },
  { path: '/admin/custom-pages', element: <CustomPageBuilder /> },
]

export default adminRoutes
