import { Outlet, useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import PageErrorBoundary from '@/components/ui/page-error-boundary';
import LoadingState from '@/components/ui/loading-state';
import { useSelector, useDispatch } from 'react-redux';
import { setSidebarOpen } from '@/store/uiSlice';
import Sidebar from './Sidebar';
import SyncProgressDock from '@/components/google-sheets/SyncProgressDock';
import { cn } from '@/lib/utils';

export default function AppLayout() {
  const { sidebarOpen } = useSelector((state) => state.ui);
  const dispatch = useDispatch();
  const { pathname } = useLocation();

  return (
    <div className="workspace-shell min-h-screen bg-background">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:p-3">Skip to content</a>
      <Sidebar />
      {sidebarOpen && <button type="button" aria-label="Close navigation" className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => dispatch(setSidebarOpen(false))} />}
      <main
        id="main-content"
        tabIndex={-1}
        className={cn(
          'min-h-screen min-w-0 transition-[margin] duration-200',
          sidebarOpen ? 'md:ml-64' : 'md:ml-20'
        )}
      >
        <PageErrorBoundary key={pathname}><Suspense fallback={<LoadingState message="Loading page..." fullPage />}><Outlet /></Suspense></PageErrorBoundary>
      </main>
      <SyncProgressDock />
    </div>
  );
}
