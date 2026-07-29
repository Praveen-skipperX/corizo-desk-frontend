import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { PairedDetailRows, CardActionFooter } from '@/components/ui/detail-grid';
import { Lock, Unlock, Shield } from 'lucide-react';
import api from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

export default function SecurityPage() {
  const [lockedAccounts, setLockedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLocked = async () => {
    try {
      const res = await api.get('/users/locked');
      setLockedAccounts(res.data || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLocked(); }, []);

  const handleUnlock = async (userId) => {
    try {
      await api.post(`/users/${userId}/unlock`);
      fetchLocked();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex min-h-full flex-col">
      <Header title="Security" description="Manage account lockouts and security settings" />

      <div className="flex-1 space-y-4 p-4 sm:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="h-5 w-5" />
              Locked Accounts
              <InfoTooltip content="Accounts are automatically locked after 3 failed login attempts. Only Super Admin can unlock accounts." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-6 text-center text-muted-foreground">Loading...</p>
            ) : lockedAccounts.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-muted-foreground">
                <Shield className="mb-3 h-10 w-10" />
                <p className="text-sm">No locked accounts</p>
              </div>
            ) : (
              <div className="space-y-2">
                {lockedAccounts.map((user) => (
                  <div key={user._id} className="rounded-lg border p-3">
                    <PairedDetailRows
                      rows={[
                        { left: { label: 'Name', value: user.name }, right: { label: 'Locked At', value: formatDateTime(user.lockedAt) } },
                        { left: { label: 'Email', value: user.email }, right: { label: 'Reason', value: user.lockedReason || '—' } },
                      ]}
                    />
                    <CardActionFooter>
                      <span className="text-xs text-destructive">Account locked</span>
                      <Button size="sm" className="h-7" onClick={() => handleUnlock(user._id)}>
                        <Unlock className="mr-1.5 h-3.5 w-3.5" /> Unlock
                      </Button>
                    </CardActionFooter>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
