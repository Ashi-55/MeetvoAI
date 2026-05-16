import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

type UserType = 'business' | 'builder' | 'unknown';

type WorkflowPayload = {
  nodes: Array<{ id: string; type: string; name: string; platform: string; description: string; icon: string }>;
  connections: Array<{ from: string; to: string }>;
  integrations: string[];
  summary: string;
};

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

function detectMode(prompt: string): 'website' | 'automation' | 'combination' {
  const lower = prompt.toLowerCase();
  const websiteWords = [
    'website', 'site', 'web', 'landing', 'page', 'portfolio', 'online presence', 'webpage',
    'hotel site', 'restaurant site', 'clinic site', 'salon website', 'shop website', 'business website'
  ];
  const automationWords = [
    'bot', 'whatsapp', 'automate', 'automation', 'agent', 'workflow', 'lead', 'booking', 'support',
    'chatbot', 'reminder', 'notify', 'order', 'crm', 'follow up', 'reply', 'message', 'telegram'
  ];

  const wantsWebsite = websiteWords.some((word) => lower.includes(word));
  const wantsAutomation = automationWords.some((word) => lower.includes(word));

  if (wantsWebsite && wantsAutomation) return 'combination';
  if (wantsWebsite) return 'website';
  return 'automation';
}

function detectBusinessType(prompt: string) {
  const lower = prompt.toLowerCase();
  if (lower.includes('hotel') || lower.includes('resort')) return { type: 'hotel', color: '#1a365d', emoji: '🏨' };
  if (lower.includes('restaurant') || lower.includes('food') || lower.includes('cafe')) return { type: 'restaurant', color: '#c53030', emoji: '🍽️' };
  if (lower.includes('clinic') || lower.includes('doctor') || lower.includes('hospital')) return { type: 'clinic', color: '#2b6cb0', emoji: '🏥' };
  if (lower.includes('salon') || lower.includes('beauty') || lower.includes('spa')) return { type: 'salon', color: '#702459', emoji: '💅' };
  if (lower.includes('real estate') || lower.includes('property')) return { type: 'realestate', color: '#276749', emoji: '🏠' };
  if (lower.includes('gym') || lower.includes('fitness')) return { type: 'gym', color: '#c05621', emoji: '💪' };
  if (lower.includes('school') || lower.includes('coaching') || lower.includes('education')) return { type: 'education', color: '#2c5282', emoji: '📚' };
  if (lower.includes('ecommerce') || lower.includes('shop') || lower.includes('store')) return { type: 'ecommerce', color: '#553c9a', emoji: '🛒' };
  return { type: 'business', color: '#553c9a', emoji: '🏢' };
}

async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_KEY) return '';

  try {
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!response.ok) return '';
    const data = await response.json();
    const candidate = Array.isArray(data?.candidates) ? data.candidates[0] : undefined;
    if (!candidate) return '';

    if (Array.isArray(candidate?.content)) {
      return candidate.content.map((chunk: any) => chunk?.text || '').join(' ').trim();
    }

    if (Array.isArray(candidate?.content?.parts)) {
      return candidate.content.parts.map((part: any) => part?.text || '').join(' ').trim();
    }

    return String(candidate?.content || '').trim();
  } catch {
    return '';
  }
}

async function generateWebsiteHTML(
  userPrompt: string,
  businessType: { type: string; color: string; emoji: string }
): Promise<string> {
  const geminiPrompt = `You are an expert web designer and developer.
Create a COMPLETE, BEAUTIFUL, PRODUCTION-READY HTML website.

User request: "${userPrompt}"
Business type: ${businessType.type}
Primary color: ${businessType.color}

STRICT RULES:
1. Return ONLY raw HTML code
2. No markdown, no backticks, no explanation
3. Single HTML file with all CSS inside <style> tag
4. Must include: navigation, hero section, services/features section, testimonials, contact form, footer
5. Must have WhatsApp floating button (bottom right, green #25d366)
6. Professional design with gradients and shadows
7. Mobile responsive with media queries
8. Smooth hover effects on cards and buttons
9. Use the primary color ${businessType.color} throughout
10. Make it look like a REAL professional Indian business website
11. Include realistic Indian content (₹ prices, Indian phone numbers, Indian cities)
12. All sections must have relevant content for ${businessType.type} business
13. Navigation must be sticky
14. Hero must be full viewport height with gradient background
15. Add subtle animations with CSS keyframes
16. Footer must say "Built with MeetvoAI"

Generate the complete HTML now:`;

  const html = await callGemini(geminiPrompt);
  const cleaned = html.replace(/```html/gi, '').replace(/```/g, '').trim();
  if (cleaned.includes('<html') || cleaned.includes('<!DOCTYPE')) return cleaned;
  return generateFallbackHTML(userPrompt, businessType);
}

function generateFallbackHTML(
  prompt: string,
  business: { type: string; color: string; emoji: string }
): string {
  const name = prompt.split(' ').slice(0, 3).join(' ') || 'Business';
  const color = business.color;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${name}</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Segoe UI',sans-serif; color:#1a1a1a; }
nav { background:${color}; padding:16px 48px; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:100; }
.logo { color:white; font-size:22px; font-weight:800; }
.nav-links { display:flex; gap:24px; }
.nav-links a { color:rgba(255,255,255,0.85); text-decoration:none; font-size:14px; }
.nav-btn { background:white; color:${color}; padding:8px 20px; border-radius:6px; font-weight:600; border:none; cursor:pointer; }
.hero { background:linear-gradient(135deg,${color}ee,${color}88); padding:120px 48px; text-align:center; color:white; min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; }
.hero h1 { font-size:60px; font-weight:800; margin-bottom:20px; line-height:1.1; }
.hero p { font-size:20px; opacity:0.9; max-width:560px; margin:0 auto 40px; }
.hero-btns { display:flex; gap:16px; justify-content:center; }
.btn-white { background:white; color:${color}; padding:16px 36px; border-radius:8px; font-size:16px; font-weight:700; border:none; cursor:pointer; }
.btn-outline { background:transparent; border:2px solid white; color:white; padding:16px 36px; border-radius:8px; font-size:16px; cursor:pointer; }
.section { padding:80px 48px; }
.section-title { text-align:center; font-size:36px; font-weight:800; margin-bottom:12px; }
.section-sub { text-align:center; color:#666; margin-bottom:48px; }
.grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; max-width:1000px; margin:0 auto; }
.card { background:white; border:1px solid #e8e8e8; border-radius:16px; padding:32px 24px; text-align:center; transition:all 0.3s; }
.card:hover { border-color:${color}; box-shadow:0 8px 30px ${color}20; transform:translateY(-4px); }
.card-icon { font-size:40px; margin-bottom:16px; }
.card h3 { font-size:20px; font-weight:700; margin-bottom:8px; }
.card p { color:#666; font-size:14px; line-height:1.6; }
.price { color:${color}; font-weight:700; font-size:15px; margin-top:12px; }
.cta { background:linear-gradient(135deg,${color},${color}cc); padding:80px 48px; text-align:center; color:white; }
.cta h2 { font-size:40px; font-weight:800; margin-bottom:16px; }
.cta p { font-size:18px; opacity:0.9; margin-bottom:32px; }
.contact { padding:80px 48px; background:#f8f9fa; }
.contact-grid { display:grid; grid-template-columns:1fr 1fr; gap:48px; max-width:900px; margin:0 auto; }
input, textarea { width:100%; padding:12px 16px; border:1px solid #e8e8e8; border-radius:8px; font-size:15px; margin-bottom:16px; outline:none; font-family:inherit; }
input:focus, textarea:focus { border-color:${color}; }
textarea { height:110px; resize:none; }
.submit-btn { width:100%; background:${color}; color:white; padding:14px; border-radius:8px; font-size:16px; font-weight:600; border:none; cursor:pointer; }
.whatsapp { position:fixed; bottom:24px; right:24px; background:#25d366; color:white; width:60px; height:60px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:28px; box-shadow:0 4px 20px #25d36650; cursor:pointer; z-index:1000; }
footer { background:#1a1a1a; color:white; padding:32px 48px; text-align:center; font-size:14px; }
@media(max-width:768px) { .hero h1 { font-size:36px; } .grid-3 { grid-template-columns:1fr; } .contact-grid { grid-template-columns:1fr; } nav { padding:16px 24px; } .nav-links { display:none; } }
</style>
</head>
<body>
<nav>
  <div class="logo">${business.emoji} ${name}</div>
  <div class="nav-links">
    <a href="#">Home</a><a href="#">Services</a><a href="#">About</a><a href="#">Contact</a>
  </div>
  <button class="nav-btn">Book Now</button>
</nav>
<section class="hero">
  <h1>${name}</h1>
  <p>Professional ${business.type} services you can trust. Serving customers across India.</p>
  <div class="hero-btns">
    <button class="btn-white">Get Started</button>
    <button class="btn-outline">Learn More</button>
  </div>
</section>
<section class="section" style="background:white">
  <h2 class="section-title">Our Services</h2>
  <p class="section-sub">Everything you need in one place</p>
  <div class="grid-3">
    <div class="card"><div class="card-icon">⚡</div><h3>Fast Service</h3><p>Quick delivery with guaranteed quality.</p><p class="price">From ₹999</p></div>
    <div class="card"><div class="card-icon">🔒</div><h3>100% Trusted</h3><p>500+ happy customers with 5-star ratings.</p><p class="price">Satisfaction guaranteed</p></div>
    <div class="card"><div class="card-icon">🎯</div><h3>Expert Team</h3><p>Skilled professionals dedicated to you.</p><p class="price">Free consultation</p></div>
  </div>
</section>
<section class="cta">
  <h2>Ready to Get Started?</h2>
  <p>Join hundreds of satisfied customers today.</p>
  <button class="btn-white">Contact Us Now</button>
</section>
<section class="contact">
  <h2 class="section-title">Get In Touch</h2>
  <div class="contact-grid">
    <div>
      <h3 style="font-size:24px;font-weight:700;margin-bottom:20px">${name}</h3>
      <p style="color:#666;line-height:2">📍 Mumbai, Maharashtra<br>📞 +91 98765 43210<br>✉️ hello@business.com<br>⏰ Open 9am - 9pm daily</p>
    </div>
    <div>
      <input type="text" placeholder="Your Name" />
      <input type="tel" placeholder="WhatsApp Number" />
      <textarea placeholder="How can we help you?"></textarea>
      <button class="submit-btn">Send Message</button>
    </div>
  </div>
</section>
<footer>© 2026 ${name} · All rights reserved · Built with MeetvoAI</footer>
<div class="whatsapp">💬</div>
</body>
</html>`;
}

async function generateWorkflowNodes(userPrompt: string): Promise<WorkflowPayload> {
  const geminiPrompt = `You are an automation workflow expert.
The user wants to automate their business.
User request: "${userPrompt}"

Return ONLY valid JSON. No markdown. No explanation. No backticks.

{
  "nodes": [
    {
      "id": "1",
      "type": "trigger",
      "name": "Node display name",
      "platform": "whatsapp",
      "description": "What this step does in simple words",
      "icon": "💬"
    },
    {
      "id": "2",
      "type": "ai_process",
      "name": "AI Understanding",
      "platform": "meetvoai",
      "description": "AI reads and understands the message",
      "icon": "🤖"
    },
    {
      "id": "3",
      "type": "action",
      "name": "Action name",
      "platform": "google_sheets",
      "description": "What action is taken",
      "icon": "📊"
    },
    {
      "id": "4",
      "type": "action",
      "name": "Another action",
      "platform": "telegram",
      "description": "Next action taken",
      "icon": "📱"
    },
    {
      "id": "5",
      "type": "output",
      "name": "Final output",
      "platform": "whatsapp",
      "description": "What the customer receives",
      "icon": "✅"
    }
  ],
  "connections": [
    {"from": "1", "to": "2"},
    {"from": "2", "to": "3"},
    {"from": "3", "to": "4"},
    {"from": "4", "to": "5"}
  ],
  "integrations": ["whatsapp", "google_sheets", "telegram"],
  "summary": "One sentence explaining what this automation does"
}

Node types allowed: trigger, ai_process, action, output
Platforms allowed: whatsapp, telegram, google_sheets, email, instagram, razorpay, calendly, notion

Make nodes specific and relevant to: "${userPrompt}"
Generate 4 to 6 nodes total. Return only JSON:`;

  const text = await callGemini(geminiPrompt);
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }

  return {
    nodes: [
      { id: '1', type: 'trigger', name: 'WhatsApp Message', platform: 'whatsapp', description: 'Customer sends a message', icon: '💬' },
      { id: '2', type: 'ai_process', name: 'AI Understanding', platform: 'meetvoai', description: 'AI reads and understands intent', icon: '🤖' },
      { id: '3', type: 'action', name: 'Smart Reply', platform: 'whatsapp', description: 'Instant intelligent reply sent', icon: '💬' },
      { id: '4', type: 'action', name: 'Save to Sheets', platform: 'google_sheets', description: 'Customer details saved automatically', icon: '📊' },
      { id: '5', type: 'output', name: 'Notify Owner', platform: 'telegram', description: 'Owner gets instant alert', icon: '📱' },
    ],
    connections: [
      { from: '1', to: '2' },
      { from: '2', to: '3' },
      { from: '3', to: '4' },
      { from: '4', to: '5' },
    ],
    integrations: ['whatsapp', 'google_sheets', 'telegram'],
    summary: 'Automated WhatsApp response system with lead capture',
  };
}

export async function POST(req: Request) {
  try {
    const { prompt, userType = 'business' } = (await req.json()) as { prompt: string; userType?: UserType };
    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
    }

    const mode = detectMode(prompt);
    const businessType = detectBusinessType(prompt);

    let html = '';
    let workflow: WorkflowPayload | null = null;

    if (mode === 'website' || mode === 'combination') {
      html = await generateWebsiteHTML(prompt, businessType);
    }

    if (mode === 'automation' || mode === 'combination') {
      workflow = await generateWorkflowNodes(prompt);
    }

    const words = prompt.replace(/[^a-zA-Z0-9\s]/g, '').split(' ').filter(Boolean);
    const businessName = words.slice(0, 3).join(' ') || 'MeetvoAI Business';
    const subdomain = words.slice(0, 3).join('-').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');

    const config = {
      mode,
      business_name: businessName,
      business_type: businessType.type,
      tagline: `Professional ${businessType.type} services`,
      language_detected: /[\u0900-\u097F]/.test(prompt) ? 'hindi' : 'english',
      website: {
        needed: mode === 'website' || mode === 'combination',
        pages: ['Home', 'Services', 'About', 'Contact'],
        features: ['Contact Form', 'WhatsApp Button', 'Mobile Responsive'],
        primary_color: businessType.color,
        style: 'professional',
      },
      automation: {
        needed: mode === 'automation' || mode === 'combination',
        trigger: 'whatsapp_message',
        integrations: workflow?.integrations || [],
        nodes: workflow?.nodes || [],
        connections: workflow?.connections || [],
        summary: workflow?.summary || '',
      },
      deployment: {
        suggested_subdomain: subdomain,
        estimated_time: '15 minutes',
      },
      confirmation_message: `Your ${mode} has been generated successfully!`,
    };

    const serverSupabase = createClient();
    const { data: authData } = await serverSupabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const service = createServiceClient();
      const { data, error } = await service.from('studio_builds').insert({
        prompt,
        builder_id: userId,
        user_type: userType,
        agent_type: mode,
        config_json: { ...config, generated_html: html, workflow },
        status: 'draft',
      }).select('id').single();

      if (error) {
        console.error('Studio save failed', error.message);
      }

      return NextResponse.json({ success: true, config, html, workflow, build_id: data?.id, mode });
    } catch (saveError) {
      console.error('Studio save exception', saveError);
      return NextResponse.json({ success: true, config, html, workflow, mode });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Generation failed' }, { status: 500 });
  }
}

