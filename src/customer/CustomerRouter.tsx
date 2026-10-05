import { useCustomer } from './CustomerContext';
import CustomerLayout from './components/CustomerLayout';
import AccountOverview from './components/AccountOverview';
import CompanyProfilePage from './components/CompanyProfilePage';
import MyProjects from '@/project/components/MyProjects';
import QuotationsPage from './components/QuotationsPage';
import ContractsPage from './components/ContractsPage';
import CustomerDeliveriesPage from './components/CustomerDeliveriesPage';
import CustomerRenewalsPage from './components/CustomerRenewalsPage';
import SettingsPage from './components/SettingsPage';
import NotificationsPage from './components/NotificationsPage';
import MyRentalRequests from '@/rental/components/MyRentalRequests';

export default function CustomerRouter() {
  const { view } = useCustomer();

  return (
    <CustomerLayout>
      {view === 'overview' && <AccountOverview />}
      {view === 'company' && <CompanyProfilePage />}
      {view === 'rental-requests' && <MyRentalRequests />}
      {view === 'project-requests' && <MyProjects />}
      {view === 'quotations' && <QuotationsPage />}
      {view === 'contracts' && <ContractsPage />}
      {view === 'deliveries' && <CustomerDeliveriesPage />}
      {view === 'renewals' && <CustomerRenewalsPage />}
      {view === 'notifications' && <NotificationsPage />}
      {view === 'settings' && <SettingsPage />}
    </CustomerLayout>
  );
}
