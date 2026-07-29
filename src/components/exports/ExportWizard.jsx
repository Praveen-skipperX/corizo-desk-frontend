import { useState, useEffect } from 'react';
import { Download, Loader2, CheckSquare, Square } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import PasswordInput from '@/components/ui/password-input';
import api from '@/lib/api';

const PRESETS = [
  { key: 'emails', label: 'Emails Only', description: 'Email addresses for marketing' },
  { key: 'phones', label: 'Phone Numbers', description: 'Name + phone for outreach' },
  { key: 'contact', label: 'Contact Information', description: 'Name, email, and phone' },
  { key: 'full', label: 'Full Lead Data', description: 'All available fields' },
  { key: 'custom', label: 'Custom Export', description: 'Select fields manually' },
];

export default function ExportWizard({ open, onClose, filters = {} }) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState(null);
  const [preset, setPreset] = useState('contact');
  const [selectedFields, setSelectedFields] = useState([]);
  const [format, setFormat] = useState('csv');
  const [preview, setPreview] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      api.get('/exports/config').then((res) => {
        const data = res.data || res;
        setConfig(data);
        setSelectedFields(data?.presets?.find((p) => p.key === 'contact')?.fields || []);
      }).catch(() => setError('Failed to load export options'));
      setStep(1);
      setPreview(null);
      setError('');
      setPassword('');
    }
  }, [open]);

  const applyPreset = (key) => {
    setPreset(key);
    if (key === 'custom') return;
    const fields = config?.presets?.find((p) => p.key === key)?.fields || [];
    setSelectedFields(fields);
  };

  const toggleField = (key) => {
    setPreset('custom');
    setSelectedFields((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
  };

  const loadPreview = async () => {
    if (!selectedFields.length) {
      setError('Select at least one field');
      return;
    }
    setLoading('preview');
    setError('');
    try {
      const res = await api.get('/exports/leads/preview', {
        params: { fields: selectedFields.join(','), format, ...filters },
      });
      setPreview(res.data || res);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Preview failed');
    } finally {
      setLoading('');
    }
  };

  const executeExport = async () => {
    setLoading('export');
    setError('');
    try {
      const response = await api.post('/exports/leads', {
        fields: selectedFields,
        format,
        password: preview?.requiresVerification ? password : undefined,
        ...filters,
      }, { responseType: 'blob' });

      const ext = format === 'excel' ? 'xlsx' : format;
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `leads-export-${Date.now()}.${ext}`;
      link.click();
      window.URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const json = JSON.parse(text);
          setError(json.message || 'Export failed');
        } catch {
          setError('Export failed');
        }
      } else {
        setError(err.response?.data?.message || 'Export failed');
      }
    } finally {
      setLoading('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Leads</DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'Choose a preset, select fields, and pick an export format.'
              : 'Review your export summary before downloading.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-5">
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {step === 1 && (
            <>
              <section>
                <p className="mb-3 text-sm font-medium text-secondary">Quick Export Options</p>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => applyPreset(p.key)}
                      className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                        preset === p.key ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'hover:border-muted-foreground/30 hover:bg-muted/50'
                      }`}
                    >
                      <p className="font-medium">{p.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{p.description}</p>
                    </button>
                  ))}
                </div>
              </section>

              {(preset === 'custom' || preset !== 'full') && (
                <section>
                  <p className="mb-3 text-sm font-medium text-secondary">Select Fields</p>
                  <div className="grid max-h-44 gap-1 overflow-y-auto rounded-lg border bg-muted/20 p-2 sm:grid-cols-2">
                    {config?.fields?.map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => toggleField(f.key)}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-background"
                      >
                        {selectedFields.includes(f.key) ? (
                          <CheckSquare className="h-4 w-4 shrink-0 text-primary" />
                        ) : (
                          <Square className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className="truncate">{f.label}</span>
                        {f.sensitive && <span className="shrink-0 text-xs text-amber-600">*</span>}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <p className="mb-3 text-sm font-medium text-secondary">Export Format</p>
                <div className="flex flex-wrap gap-2">
                  {['csv', 'excel', 'pdf'].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFormat(f)}
                      className={`rounded-lg border px-4 py-2 text-sm capitalize transition-colors ${
                        format === f ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'hover:bg-muted/50'
                      }`}
                    >
                      {f === 'excel' ? 'Excel (.xlsx)' : f.toUpperCase()}
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          {step === 2 && preview && (
            <>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-2xl font-bold text-secondary">{preview.recordCount} records selected</p>
                <div className="mt-4">
                  <p className="text-sm font-medium text-secondary">Fields</p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {preview.fields?.map((f) => (
                      <li key={f.key} className="flex items-center gap-2">
                        <span className="h-1 w-1 shrink-0 rounded-full bg-primary" />
                        {f.label}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Format: <span className="font-medium uppercase text-secondary">{format}</span>
                </p>
              </div>

              {preview.requiresVerification && (
                <section>
                  <p className="mb-2 text-sm text-amber-700">
                    Sensitive data export requires password verification
                  </p>
                  <PasswordInput
                    placeholder="Confirm your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </section>
              )}
            </>
          )}
        </DialogBody>

        <DialogFooter className="sm:justify-end">
          <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            {step === 2 && (
              <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>
                Back
              </Button>
            )}
            {step === 1 ? (
              <Button onClick={loadPreview} disabled={loading === 'preview'}>
                {loading === 'preview' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Preview Export
              </Button>
            ) : (
              <Button
                onClick={executeExport}
                disabled={loading === 'export' || (preview?.requiresVerification && !password)}
              >
                {loading === 'export' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download Export
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
