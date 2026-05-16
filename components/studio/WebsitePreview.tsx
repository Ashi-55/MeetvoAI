'use client';

import { useMemo } from 'react';
import { Copy, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type WebsiteConfig = {
  business_name: string;
  tagline?: string;
  primary_color: string;
  pages: string[];
  features: string[];
};

function generateWebsiteHTML(cfg: WebsiteConfig) {
  const title = cfg.business_name || 'MeetvoAI';
  const primary = cfg.primary_color || '#5B21FF';
  const pages = (cfg.pages || ['Home', 'About']).slice(0, 5);
  const features = (cfg.features || ['WhatsApp CTA', 'Lead capture', 'Automation']).slice(0, 3);

  const navLinks = pages
    .map((p) => {
      const id = p.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return `<a href="#${id}" style="text-decoration:none;color:rgba(255,255,255,.9);font-weight:700">${p}</a>`;
    })
    .join(' ');

  const featureCards = features
    .map(
      (f, i) => `
        <div class="card">
          <div class="icon">${i === 0 ? '🤖' : i === 1 ? '💬' : '⚙️'}</div>
          <div style="font-weight:900">${f}</div>
          <div style="color:rgba(255,255,255,.7);font-size:13px;margin-top:6px">Built for India: WhatsApp-first, payments secured by escrow.</div>
        </div>
      `
    )
    .join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    :root{--primary:${primary};}
    *{box-sizing:border-box}
    body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;background:#0A0F1E;color:#fff}
    .container{max-width:1100px;margin:0 auto;padding:0 20px}
    .nav{position:sticky;top:0;background:rgba(10,15,30,.85);backdrop-filter:blur(10px);border-bottom:1px solid rgba(255,255,255,.08)}
    .nav-inner{display:flex;align-items:center;justify-content:space-between;padding:14px 0;gap:12px}
    .logo{display:flex;align-items:center;gap:10px;font-weight:1000;letter-spacing:-.02em}
    .logo-badge{width:34px;height:34px;border-radius:12px;background:rgba(91,33,255,.18);border:1px solid rgba(91,33,255,.35);display:flex;align-items:center;justify-content:center}
    .nav-links{display:flex;gap:18px;flex-wrap:wrap}
    .hero{padding:46px 0 26px}
    .hero-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:24px;align-items:start}
    @media(max-width:860px){.hero-grid{grid-template-columns:1fr}}
    .headline{font-size:46px;line-height:1.03;font-weight:1000;letter-spacing:-.04em;margin:0}
    .tagline{color:rgba(255,255,255,.78);margin-top:14px;font-size:16px;line-height:1.6}
    .btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:12px 16px;border-radius:14px;border:1px solid rgba(255,255,255,.14);font-weight:900;background:rgba(255,255,255,.04);color:#fff;text-decoration:none}
    .btn-primary{background:var(--primary);border-color:rgba(0,0,0,0)}
    .btn:hover{transform:translateY(-1px)}
    .section{padding:22px 0}
    .section-title{font-weight:1000;font-size:20px;margin-bottom:14px}
    .cards{display:grid;grid-template-columns:repeat(3, minmax(0,1fr));gap:14px}
    @media(max-width:900px){.cards{grid-template-columns:1fr}}
    .card{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);border-radius:18px;padding:18px}
    .icon{width:42px;height:42px;border-radius:16px;background:rgba(91,33,255,.18);border:1px solid rgba(91,33,255,.35);display:flex;align-items:center;justify-content:center;margin-bottom:10px}
    .form{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    @media(max-width:700px){.form{grid-template-columns:1fr}}
    .input{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:12px;color:#fff;outline:none}
    textarea.input{grid-column:1 / -1;min-height:110px;resize:vertical}
    .footer{padding:26px 0;border-top:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.7)}
    .whats{position:fixed;right:18px;bottom:18px;background:#0ea5e9;border-radius:999px;width:56px;height:56px;display:flex;align-items:center;justify-content:center;box-shadow:0 12px 30px rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.15)}
    .muted{color:rgba(255,255,255,.72)}
  </style>
</head>
<body>
  <div class="nav">
    <div class="container nav-inner">
      <div class="logo"><div class="logo-badge">🤖</div><div>${title}</div></div>
      <div class="nav-links">${navLinks}</div>
      <a class="btn" href="#contact">Contact</a>
    </div>
  </div>

  <div class="container hero">
    <div class="hero-grid">
      <div>
        <h1 class="headline">${title}</h1>
        <div class="tagline">${cfg.tagline || 'Generate WhatsApp-ready AI agents and deploy instantly.'}</div>
        <div style="margin-top:18px;display:flex;gap:12px;flex-wrap:wrap">
          <a class="btn btn-primary" href="#contact">Get a quote</a>
          <a class="btn" href="#features">See features</a>
        </div>
      </div>
      <div style="border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);border-radius:18px;padding:18px">
        <div style="font-weight:1000">What you get</div>
        <ul style="margin:12px 0 0;padding-left:18px;color:rgba(255,255,255,.75)">
          <li>WhatsApp-first automation</li>
          <li>Escrow-protected payments</li>
          <li>Deploy-ready agent spec</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="container section" id="features">
    <div class="section-title">Services</div>
    <div class="cards">${featureCards}</div>
  </div>

  <div class="container section" id="contact">
    <div class="section-title">Contact form</div>
    <form class="form" onsubmit="event.preventDefault();alert('Thanks!');">
      <input class="input" placeholder="Name" />
      <input class="input" placeholder="Phone" />
      <input class="input" placeholder="Business / Team" />
      <input class="input" placeholder="City" />
      <textarea class="input" placeholder="Tell us what you want to automate..."></textarea>
      <div style="grid-column:1 / -1;display:flex;gap:12px;align-items:center;justify-content:flex-end">
        <div class="muted" style="font-size:13px">We reply on WhatsApp</div>
        <button class="btn btn-primary" type="submit">Send request</button>
      </div>
    </form>
  </div>

  <div class="container footer">
    <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap">
      <div>${title} © ${new Date().getFullYear()}</div>
      <div>Made for India · WhatsApp-native · Escrow protected</div>
    </div>
  </div>

  <a class="whats" href="#contact" title="WhatsApp">
    <div style="font-size:24px">💬</div>
  </a>
</body>
</html>`;
}

export function WebsitePreview({ config }: { config: {
  business_name: string;
  tagline?: string;
  primary_color: string;
  pages: string[];
  features: string[];
} }) {
  const html = useMemo(() => generateWebsiteHTML(config), [config]);

  return (
    <div className="w-full">
      <Tabs defaultValue="preview">
        <TabsList>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="html">HTML Code</TabsTrigger>
        </TabsList>
        <TabsContent value="preview">
          <iframe title="website-preview" srcDoc={html} style={{ width: '100%', height: 500, border: 'none' }} />
        </TabsContent>
        <TabsContent value="html">
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              className="border-teal-500/40 text-teal-200"
              onClick={async () => {
                await navigator.clipboard.writeText(html);
                // keep it simple; studio page can toast if desired
+                // eslint-disable-next-line no-alert
+                alert('HTML copied');
              }}
            >
              <Copy size={16} /> Copy Code
            </Button>
            <Button
              variant="outline"
              className="border-border text-text3"
              onClick={() => {
                const blob = new Blob([html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'index.html';
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download size={16} /> Download HTML
            </Button>
          </div>
          <pre className="mt-4 whitespace-pre-wrap break-words text-xs bg-[#0B1225] border border-border rounded-xl p-3 max-h-[360px] overflow-auto text-text3">{html}</pre>
        </TabsContent>
      </Tabs>
    </div>
  );
}

