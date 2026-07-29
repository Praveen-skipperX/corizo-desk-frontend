import { Shield } from 'lucide-react';

export default function LoginSecurityNotice() {
  return (
    <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
      <Shield className="h-3.5 w-3.5 shrink-0 text-primary/80" />
      Protected sign-in. Activity is monitored and logged.
    </p>
  );
}
