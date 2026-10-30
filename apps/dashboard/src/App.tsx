import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppRouter } from './router/AppRouter';
import { RbacProvider } from './context/RbacContext';
import { TenantProvider } from './context/TenantContext';

function App() {
  return (
    <ErrorBoundary>
      <RbacProvider>
        <TenantProvider>
          <AppRouter />
        </TenantProvider>
      </RbacProvider>
    </ErrorBoundary>
  );
}

export default App;
