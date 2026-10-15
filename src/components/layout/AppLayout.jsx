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
    <div className="min-h-screen bg-background">
      <Sidebar />
      {sidebarOpen && <button type="button" aria-label="Close navigation" className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => dispatch(setSidebarOpen(false))} />}
      <main
        className={cn(
          'min-h-screen min-w-0 ml-[68px] transition-all duration-300',
          sidebarOpen ? 'md:ml-64' : 'md:ml-[68px]'
        )}
      >
        <PageErrorBoundary key={pathname}><Suspense fallback={<LoadingState message="Loading page..." fullPage />}><Outlet /></Suspense></PageErrorBoundary>
      </main>
      <SyncProgressDock />
    </div>
  );
}
