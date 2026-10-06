import { useAdmin } from './AdminContext';
import { useEmployee } from './EmployeeContext';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import AdminAccessDenied from './components/AdminAccessDenied';
import EquipmentList from './components/EquipmentList';
import CategoryManager from './components/CategoryManager';
import BrandManager from './components/BrandManager';
import AdminRentalRequests from '@/rental/components/AdminRentalRequests';
import AdminQuotations from '@/quotation/components/AdminQuotations';
import AdminContracts from './components/AdminContracts';
import AdminPurchaseOrders from './components/AdminPurchaseOrders';
import AdminProjectRequests from '@/project/components/AdminProjectRequests';
import AdminServiceRequests from './components/AdminServiceRequests';
import EmployeesPage from './components/EmployeesPage';
import RolesPermissionsPage from './components/RolesPermissionsPage';
import AuditLogPage from './components/AuditLogPage';
import EquipmentUnitsPage from './components/EquipmentUnitsPage';
import EquipmentSourcesPage from './components/EquipmentSourcesPage';
import AllocationsPage from './components/AllocationsPage';
import UnitAvailabilityPage from './components/UnitAvailabilityPage';
import DeliveriesPage from './components/DeliveriesPage';
import AdminNotificationsPage from './components/AdminNotificationsPage';
import NotificationSettingsPage from './components/NotificationSettingsPage';
import RenewalsPage from './components/RenewalsPage';
import AdminRentalOperations from './components/AdminRentalOperations';
import RequestsCenter from './components/RequestsCenter';
import SiteContentManager from './components/SiteContentManager';

export default function AdminRouter() {
  const { view, loading: adminLoading } = useAdmin();
  const { session, authLoading, staffCheckedFor, currentEmployee, can } = useEmployee();

  const checkingStaff = !!session && staffCheckedFor !== session.user.id;

  if (authLoading || checkingStaff) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yellow-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <AdminLogin />;
  }

  // Signed in, but not an active staff member: never show the dashboard.
  if (!currentEmployee || currentEmployee.status !== 'active') {
    return <AdminAccessDenied />;
  }

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yellow-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AdminLayout>
      {view === 'dashboard' && <AdminDashboard />}
      {view === 'requests-center' && (can('rental_requests', 'view') || can('projects', 'view')) && <RequestsCenter />}
      {view === 'equipment' && can('equipment', 'view') && <EquipmentList />}
      {view === 'categories' && can('categories', 'view') && <CategoryManager />}
      {view === 'brands' && can('brands', 'view') && <BrandManager />}
      {view === 'rental-requests' && can('rental_requests', 'view') && <AdminRentalRequests />}
      {view === 'quotations' && can('quotations', 'view') && <AdminQuotations />}
      {view === 'purchase-orders' && (can('contracts', 'view') || can('quotations', 'view')) && <AdminPurchaseOrders />}
      {view === 'contracts' && can('contracts', 'view') && <AdminContracts />}
      {view === 'rental-operations' && can('rental_requests', 'view') && <AdminRentalOperations />}
      {view === 'projects' && can('projects', 'view') && <AdminProjectRequests />}
      {view === 'service-requests' && can('projects', 'view') && <AdminServiceRequests />}
      {view === 'employees' && can('employees', 'view') && <EmployeesPage />}
      {view === 'roles-permissions' && can('employees', 'manage') && <RolesPermissionsPage />}
      {view === 'audit-log' && can('employees', 'view') && <AuditLogPage />}
      {view === 'equipment-units' && can('equipment', 'view') && <EquipmentUnitsPage />}
      {view === 'equipment-sources' && can('equipment', 'view') && <EquipmentSourcesPage />}
      {view === 'allocations' && can('rental_requests', 'view') && <AllocationsPage />}
      {view === 'unit-availability' && can('equipment', 'view') && <UnitAvailabilityPage />}
      {view === 'deliveries' && can('rental_requests', 'view') && <DeliveriesPage />}
      {view === 'admin-notifications' && <AdminNotificationsPage />}
      {view === 'notification-settings' && <NotificationSettingsPage />}
      {view === 'renewals' && can('contracts', 'view') && <RenewalsPage />}
      {view === 'site-content' && (can('categories', 'view') || can('categories', 'manage')) && <SiteContentManager />}
    </AdminLayout>
  );
}
