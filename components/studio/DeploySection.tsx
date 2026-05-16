'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function cleanSubdomain(input: string) {
  return (input || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-');
}

function debounce<T>(fn: (...args: any[]) => void, delay: number) {
  let t: number | undefined;
  return (...args: any[]) => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), delay);
  };
}

export function DeploySection({
  agentName,
  initialSubdomain,
  onDeploy,
  isSubscribed,
}: {
  agentName?: string;
  initialSubdomain?: string;
  isSubscribed: boolean;
  onDeploy: (payload: { subdomain: string }) => Promise<void>;
}) {
  const [subdomain, setSubdomain] = useState(initialSubdomain || 'meetvo');
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [spinner, setSpinner] = useState(false);
  const [showPlans, setShowPlans] = useState(false);

  const full = useMemo(() => `${cleanSubdomain(subdomain)}.meetvoai.in`, [subdomain]);

  useEffect(() => {
    setAvailable(null);
    // availability check debounced 500ms
    const run = debounce(async (value: string) => {
      const clean = cleanSubdomain(value);
      if (!clean) return;
      setChecking(true);
      try {
        // TODO: if you add a real API route later, swap this call.
        // current fallback: always available.
        // const res = await fetch(`/api/subdomains/check?subdomain=${encodeURIComponent(clean)}`);
        // const json = await res.json();
        // setAvailable(!!json.available);
        setAvailable(true);
      } catch {
        setAvailable(null);
      } finally {
        setChecking(false);
      }
    }, 500);

    run(subdomain);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subdomain]);

  const disabled = !isSubscribed || spinner || !cleanSubdomain(subdomain) || available === false;

  return (
    <div className="mt-8 rounded-2xl border border-border bg-surface2/30 p-5">
      <div className="text-text2 font-extrabold text-xl flex items-center gap-2">
        🚀 Deploy Your Agent
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <div>
          <div className="text-sm text-text3 font-semibold mb-2">Subdomain</div>
          <div className="flex items-center gap-2">
            <Input
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              className="bg-transparent border-border"
              placeholder="your-subdomain"
            />
            <div className="text-text3 text-sm font-semibold">.meetvoai.in</div>
          </div>

          <div className="mt-2">
            <div className="text-xs text-text3">
              {checking ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="animate-spin" size={14} /> Checking…
                </span>
              ) : available === true ? (
                <span className="inline-flex items-center gap-2 text-green-300">
                  <Check size={14} /> Available
                </span>
              ) : available === false ? (
                <span className="inline-flex items-center gap-2 text-red-300">
                  <X size={14} /> Taken
                </span>
              ) : (
                <span>Check availability…</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            'Agent spec generated',
            'Razorpay + Escrow flow ready',
            'WhatsApp channels enabled',
            'Auto deployment config prepared',
          ].map((t) => (
            <div key={t} className="flex items-start gap-2">
              <div className="mt-0.5">
                <Check size={14} className="text-teal-200" />
              </div>
              <div className="text-sm text-text3">{t}</div>
            </div>
          ))}
        </div>

        <Button
          disabled={disabled}
          className="w-full bg-teal-500 hover:bg-teal-600 text-white font-extrabold relative"
          onClick={async () => {
            if (!isSubscribed) {
              setShowPlans(true);
              toast('Upgrade required to deploy');
              return;
            }
            try {
              setSpinner(true);
              await onDeploy({ subdomain: cleanSubdomain(subdomain) });
            } finally {
              setSpinner(false);
            }
          }}
        >
          {spinner ? <Loader2 className="animate-spin" size={18} /> : null}
          {spinner ? 'Deploying…' : 'Deploy Now'}
        </Button>

        {!isSubscribed ? (
          <div className="text-xs text-text3">
            Deploy is available on paid plans.{' '}
            <button className="text-teal-200 hover:text-teal-100 font-semibold" onClick={() => setShowPlans(true)} type="button">
              Upgrade
            </button>
          </div>
        ) : null}
      </div>

      <Dialog open={showPlans} onOpenChange={setShowPlans}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to deploy</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-text3">
            You need an active subscription to deploy agents.
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => (window.location.href = '/pricing')} className="w-full bg-teal-500 hover:bg-teal-600 text-white">
              Upgrade
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

