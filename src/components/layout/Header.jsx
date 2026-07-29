import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Moon, Sun, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toggleTheme } from '@/store/uiSlice';
import { useGlobalSearchQuery } from '@/store/api/apiSlice';
import { useNavigate } from 'react-router-dom';

export default function Header({ title, description }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme } = useSelector((state) => state.ui);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const { data: searchResults } = useGlobalSearchQuery(searchQuery, {
    skip: searchQuery.length < 2,
  });

  return (
    <header className="sticky top-0 z-30 h-16 shrink-0 border-b border-border bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">{title}</h1>
          {description && (
            <p className="truncate text-xs text-muted-foreground sm:text-sm">{description}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search leads, users..."
              className="h-9 w-48 pl-9 lg:w-64"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
            />
            {showResults && searchQuery.length >= 2 && searchResults?.data && (
              <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-lg border bg-popover p-2 shadow-lg lg:w-96">
                {searchResults.data.leads?.length > 0 && (
                  <div className="mb-2">
                    <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Leads</p>
                    {searchResults.data.leads.map((lead) => (
                      <button
                        key={lead._id}
                        type="button"
                        className="flex w-full flex-col rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                        onClick={() => navigate(`/leads/${lead._id}`)}
                      >
                        <span className="font-medium">{lead.leadId} - {lead.name}</span>
                        <span className="text-xs text-muted-foreground">{lead.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.data.users?.length > 0 && (
                  <div>
                    <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Users</p>
                    {searchResults.data.users.map((u) => (
                      <button
                        key={u._id}
                        type="button"
                        className="flex w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                        onClick={() => navigate('/users')}
                      >
                        {u.name} - {u.email}
                      </button>
                    ))}
                  </div>
                )}
                {!searchResults.data.leads?.length && !searchResults.data.users?.length && (
                  <p className="px-2 py-4 text-center text-sm text-muted-foreground">No results found</p>
                )}
              </div>
            )}
          </div>

          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => dispatch(toggleTheme())}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
