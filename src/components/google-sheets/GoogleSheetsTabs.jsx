import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const TABS = [
  { label: 'Connected Sheets', path: '/google-sheets' },
  { label: 'Sync History', path: '/google-sheets/history' },
  { label: 'Settings', path: '/google-sheets/settings' },
];

export default function GoogleSheetsTabs({ className }) {
  return (
    <div className={cn('flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1', className)}>
      {TABS.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          end={tab.path === '/google-sheets'}
          className={({ isActive }) =>
            cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
