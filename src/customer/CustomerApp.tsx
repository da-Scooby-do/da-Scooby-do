import { useCustomer } from './CustomerContext';
import AuthPages from './components/AuthPages';
import CustomerRouter from './CustomerRouter';

export default function CustomerApp() {
  const { isAuthenticated, authLoading } = useCustomer();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yellow-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPages />;
  }

  return <CustomerRouter />;
}
