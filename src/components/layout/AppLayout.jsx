import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import SyncProgressDock from '@/components/google-sheets/SyncProgressDock';
import { cn } from '@/lib/utils';

export default function AppLayout() {
  const { sidebarOpen } = useSelector((state) => state.ui);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main
        className={cn(
          'min-h-screen transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-[68px]'
        )}
      >
        <Outlet />
      </main>
      <SyncProgressDock />
    </div>
  );
}
