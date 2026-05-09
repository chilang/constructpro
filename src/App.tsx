import { useState, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CustomersPage from './pages/Customers';
import InvoicesPage from './pages/Invoices';
import ExpensesPage from './pages/Expenses';
import MileagePage from './pages/Mileage';
import SettingsPage from './pages/Settings';

function App() {
  const [currentPath, setCurrentPath] = useState('/');
  const [navState, setNavState] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const navigate = useCallback((path: string, state?: any) => {
    setCurrentPath(path);
    setNavState(state || null);
    setRefreshKey(k => k + 1);
  }, []);

  function renderPage() {
    switch (currentPath) {
      case '/':
        return <Dashboard onNavigate={navigate} />;
      case '/customers':
        return <CustomersPage onNavigate={navigate} />;
      case '/invoices':
        return <InvoicesPage key={refreshKey} navState={navState} />;
      case '/expenses':
        return <ExpensesPage key={refreshKey} navState={navState} />;
      case '/mileage':
        return <MileagePage key={refreshKey} navState={navState} />;
      case '/settings':
        return <SettingsPage />;
      default:
        return <Dashboard onNavigate={navigate} />;
    }
  }

  return (
    <Layout currentPath={currentPath} onNavigate={navigate}>
      {renderPage()}
    </Layout>
  );
}

export default App;
