'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Copy, Download, ExternalLink, Mic, MicOff, Rocket, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WorkflowDiagram } from '@/components/studio/WorkflowDiagram';
import { toast } from 'sonner';
import type { StudioBuild } from '@/types';

const EXAMPLES = [
  'Real estate lead generation bot',
  'Restaurant WhatsApp order bot',
  'Clinic appointment reminder',
  'E-commerce customer support',
  'School fee reminder system',
  'Insurance lead qualifier',
  'Gym membership renewal bot',
];

const CATEGORIES = [
  'WhatsApp Automation',
  'Lead Generation',
  'Appointment Booking',
  'Customer Support',
  'E-commerce',
  'Healthcare',
  'Real Estate',
  'Education',
  'Other',
];

const PLACEHOLDER = `Build a lead generation bot for
real estate agents in Mumbai...`;

type PricingModel = 'monthly' | 'one_time' | 'custom';

export default function BuilderStudioPage() {
  const router = useRouter();
  const { user, builderProfile } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [refinementText, setRefinementText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [mode, setMode] = useState<'website' | 'automation' | 'combination' | null>(null);
  const [generatedHTML, setGeneratedHTML] = useState('');
  const [workflow, setWorkflow] = useState<any | null>(null);
  const [config, setConfig] = useState<any>(null);
  const [buildId, setBuildId] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [deployUrl, setDeployUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'workflow'>('preview');
  const [history, setHistory] = useState<StudioBuild[]>([]);
  const [deploying, setDeploying] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishedAgentId, setPublishedAgentId] = useState<string | null>(null);
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [category, setCategory] = useState('WhatsApp Automation');
  const [price, setPrice] = useState('');
  const [pricingModel, setPricingModel] = useState<PricingModel>('monthly');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const publishSectionRef = useRef<HTMLDivElement | null>(null);

  const subscriptionPlan = builderProfile?.subscription_plan || 'free';
  const buildUsage = builderProfile?.studio_builds_used ?? history.length;
  const freePublishLocked = subscriptionPlan === 'free';
  const canGenerate = Boolean(prompt.trim() && user);
  const showResult = Boolean(mode && (generatedHTML || workflow));

  const planBadge = useMemo(() => {
    switch (subscriptionPlan) {
      case 'starter':
        return { label: 'Starter', className: 'bg-[#DBEAFE] text-[#1D4ED8]' };
      case 'growth':
        return { label: 'Growth ⚡', className: 'bg-[#C6F6D5] text-[#0F766E]' };
      case 'business':
        return { label: 'Business 👑', className: 'bg-[#E9D5FF] text-[#6D28D9]' };
      default:
        return { label: 'Free Plan', className: 'bg-[#E2E8F0] text-[#475569]' };
    }
  }, [subscriptionPlan]);

  const aiSummary = useMemo(() => {
    if (config?.summary) return config.summary;
    if (workflow?.summary) return workflow.summary;
    if (mode === 'automation') return 'AI generated a ready-to-use workflow for your agent.';
    if (mode === 'website') return 'AI generated a website preview for your agent.';
    return 'AI is interpreting your agent idea.';
  }, [config, workflow, mode]);

  useEffect(() => {
    if (!user) return;
    if (!builderProfile) {
      router.push('/dashboard');
      return;
    }
    loadHistory();
    fetch('/api/studio/warmup', { method: 'POST' }).catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, builderProfile]);

  async function loadHistory() {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('studio_builds')
      .select('*')
      .eq('builder_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setHistory((data || []) as StudioBuild[]);
  }

  async function generate(isRefinement = false) {
    if (!user) {
      toast.error('Please sign in to generate an agent.');
      return;
    }
    if (!prompt.trim()) {
      toast.error('Enter a prompt to generate your agent.');
      return;
    }

    setGenerating(true);
    if (!isRefinement) {
      setOriginalPrompt(prompt);
      setGeneratedHTML('');
      setWorkflow(null);
      setConfig(null);
      setBuildId('');
      setDeployUrl('');
      setPublishedAgentId(null);
    }

    try {
      const response = await fetch('/api/studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, userType: 'builder' }),
      });
      const result = await response.json();
      if (!result.success) {
        toast.error(result.error || 'Generation failed.');
        return;
      }
      setMode(result.mode || 'website');
      setConfig(result.config || {});
      setGeneratedHTML(result.html || '');
      setWorkflow(result.workflow || null);
      setBuildId(result.build_id || '');
      setAgentName(result.config?.business_name || prompt.slice(0, 40));
      setAgentDescription(result.config?.confirmation_message || 'AI generated agent description');
      setSubdomain(result.config?.deployment?.suggested_subdomain || '');
      if (result.mode === 'automation') setActiveTab('workflow');
      toast.success('Agent generated successfully.');
      await loadHistory();
    } catch (error) {
      console.error(error);
      toast.error('Generation failed.');
    } finally {
      setGenerating(false);
    }
  }

  async function refine() {
    if (!refinementText.trim()) return;
    setPrompt(`${originalPrompt}\n\nRefine: ${refinementText}`);
    setRefinementText('');
    await generate(true);
  }

  async function deployAgent() {
    if (!buildId) {
      toast.error('Generate an agent before deploying.');
      return;
    }
    if (!subdomain.trim()) {
      toast.error('Enter a subdomain first.');
      return;
    }

    setDeploying(true);
    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subdomain,
          studio_build_id: buildId,
          agent_type: mode || 'website',
          config_json: config,
          name: agentName || 'AI Studio Agent',
        }),
      });
      const result = await response.json();
      if (!result.success) {
        toast.error(result.error || 'Deploy failed.');
        return;
      }
      setDeployUrl(`https://${result.url}`);
      toast.success('Deploy scheduled successfully.');
    } catch (error) {
      console.error(error);
      toast.error('Deploy failed.');
    } finally {
      setDeploying(false);
    }
  }

  async function publishAgent() {
    if (freePublishLocked) {
      router.push('/pricing');
      return;
    }
    if (!buildId) {
      toast.error('Generate an agent before publishing.');
      return;
    }
    if (!agentName.trim()) {
      toast.error('Add an agent name.');
      return;
    }

    setPublishLoading(true);
    try {
      const response = await fetch('/api/agents/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agentName,
          description: agentDescription,
          category,
          price: Number(price) || 0,
          pricing_model: pricingModel,
          studio_build_id: buildId,
          config_json: config,
          html: generatedHTML,
        }),
      });
      const result = await response.json();
      if (!result.success) {
        toast.error(result.error || 'Publish failed.');
        return;
      }
      setPublishedAgentId(result.agentId || null);
      toast.success('Published! View listing →');
    } catch (error) {
      console.error(error);
      toast.error('Publish failed.');
    } finally {
      setPublishLoading(false);
    }
  }

  const handleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input not supported in this browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setPrompt((prev) => `${prev} ${transcript}`);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const copyCode = async () => {
    if (!generatedHTML) return;
    await navigator.clipboard.writeText(generatedHTML);
    toast.success('HTML copied to clipboard.');
  };

  const downloadHTML = () => {
    if (!generatedHTML) return;
    const blob = new Blob([generatedHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'meetvoai-agent.html';
    link.click();
    URL.revokeObjectURL(url);
  };

  const openFullScreen = () => {
    if (!generatedHTML) return;
    const blob = new Blob([generatedHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    URL.revokeObjectURL(url);
  };

  const scrollToPublish = () => {
    publishSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const earningsText = useMemo(() => {
    const amount = Number(price) || 0;
    if (!amount) return null;
    const gross = amount * 10;
    const earned = Math.round(gross * 0.95);
    return {
      gross,
      earned,
    };
  }, [price]);

  const planLabel = planBadge.label;
  const planClass = planBadge.className;

  const restoreBuild = (build: StudioBuild) => {
    const config = build.config_json as any;
    setMode(config?.mode || 'website');
    setConfig(build.config_json);
    setGeneratedHTML(config?.generated_html || config?.html || '');
    setWorkflow(config?.workflow || null);
    setBuildId(build.id);
    setSubdomain(config?.deployment?.suggested_subdomain || '');
    setPrompt(build.prompt || '');
    setOriginalPrompt(build.prompt || '');
    setAgentName(config?.business_name || build.prompt?.slice(0, 40) || 'AI Agent');
    setAgentDescription(config?.confirmation_message || 'Generated agent description');
    setActiveTab(config?.mode === 'automation' ? 'workflow' : 'preview');
    toast.success('Build restored from history.');
  };

  return (
    <main className="min-h-screen bg-[#0A0F1E] text-white">
      <div className="mx-auto max-w-[1600px] px-4 py-8">
        <section className="rounded-[32px] border border-[#1F2937] bg-[#0A0F1E] p-8 shadow-sm shadow-[#00000030]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[#8A9BB5] text-sm uppercase tracking-[0.24em]">AI Builder Studio</p>
              <h1 className="mt-3 text-3xl font-bold text-white">AI Builder Studio</h1>
              <p className="mt-2 max-w-2xl text-sm text-[#8A9BB5]">Build faster with AI. Publish and earn.</p>
            </div>
            <div className="flex flex-col items-start gap-3 rounded-3xl border border-[#1F2937] bg-[#09111F] p-4 text-sm sm:items-end">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${planClass}`}>{planLabel}</span>
              <span className="text-[#8A9BB5]">{buildUsage}/10 builds used this month</span>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.9fr_1fr]">
          <div className="space-y-6">
            <Card className="rounded-[28px] border border-[#1F2937] bg-[#09111F] p-6">
              <div className="mb-6">
                <div className="text-sm font-semibold text-white">What agent do you want to build?</div>
                <p className="mt-2 text-sm text-[#8A9BB5]">AI generates the full flow. You customize and publish.</p>
              </div>
              <Textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={PLACEHOLDER}
                className="min-h-[180px] bg-[#0A0F1E] border-[#16223B] text-white"
              />
              <div className="mt-4 flex flex-wrap gap-3">
                {EXAMPLES.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setPrompt(example)}
                    className="rounded-full border border-[#1E2A44] bg-[#07101E] px-4 py-2 text-sm text-[#8A9BB5] transition hover:border-teal-500/40 hover:text-white"
                  >
                    {example}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  onClick={() => generate()}
                  className="rounded-full bg-[#00C9A7] px-6 py-3 text-sm font-semibold text-[#0A0F1E] shadow-lg shadow-[#00C9A7]/20 hover:bg-[#00b191]"
                >
                  {generating ? 'Generating…' : '⚡ Generate Agent'}
                </Button>
                <button
                  type="button"
                  onClick={handleVoice}
                  className="inline-flex items-center gap-2 rounded-full border border-[#1F2937] bg-[#09111F] px-5 py-3 text-sm text-[#8A9BB5] transition hover:border-teal-500/40 hover:text-white"
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                  {isListening ? 'Listening...' : 'Voice'}
                </button>
              </div>
            </Card>

            <Card className="rounded-[28px] border border-[#1F2937] bg-[#09111F] p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Your message</div>
                  <p className="text-sm text-[#8A9BB5]">What the AI is building for you</p>
                </div>
                <Badge className="bg-[#0F172A] text-[#8A9BB5]">Builder</Badge>
              </div>
              <div className="rounded-3xl border border-[#16223B] bg-[#07101E] p-5 text-sm text-[#D8E3F7]">
                {prompt || 'Your prompt will appear here once you start generating.'}
              </div>
            </Card>

            <Card className="rounded-[28px] border border-[#1F2937] bg-[#09111F] p-6">
              <div className="mb-4 text-sm font-semibold text-white">AI understanding</div>
              <p className="text-sm leading-7 text-[#B8C2D2]">{aiSummary}</p>
            </Card>

            <Card className="rounded-[28px] border border-[#1F2937] bg-[#09111F] p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Agent Details</div>
                  <p className="text-sm text-[#8A9BB5]">Edit the name, description, category and pricing.</p>
                </div>
              </div>
              <div className="space-y-4 bg-[#0A0F1E] rounded-3xl border border-[#16223B] p-4">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[#8A9BB5]">Name</p>
                  <Input
                    value={agentName}
                    onChange={(event) => setAgentName(event.target.value)}
                    placeholder="Agent name"
                    className="bg-[#0A0F1E] border-[#16223B] text-white"
                  />
                </div>
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[#8A9BB5]">Description</p>
                  <Textarea
                    value={agentDescription}
                    onChange={(event) => setAgentDescription(event.target.value)}
                    rows={3}
                    className="bg-[#0A0F1E] border-[#16223B] text-white"
                  />
                </div>
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[#8A9BB5]">Category</p>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="w-full rounded-2xl border border-[#16223B] bg-[#0A0F1E] px-4 py-3 text-sm text-white outline-none"
                  >
                    {CATEGORIES.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[#8A9BB5]">Your Price (₹)</p>
                    <Input
                      type="number"
                      value={price}
                      onChange={(event) => setPrice(event.target.value)}
                      placeholder="5000"
                      className="bg-[#0A0F1E] border-[#16223B] text-white"
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[#8A9BB5]">Pricing model</p>
                    <div className="flex flex-wrap gap-2">
                      {(['monthly', 'one_time', 'custom'] as PricingModel[]).map((option) => (
                        <button
                          type="button"
                          key={option}
                          onClick={() => setPricingModel(option)}
                          className={`rounded-full px-4 py-2 text-sm ${pricingModel === option ? 'bg-[#00C9A7] text-[#0A0F1E]' : 'border border-[#16223B] bg-[#0A0F1E] text-[#8A9BB5]'}`}
                        >
                          {option === 'monthly' ? 'Monthly' : option === 'one_time' ? 'One-time' : 'Custom'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              <Button onClick={publishAgent} className={`w-full rounded-3xl px-5 py-4 text-sm font-semibold ${freePublishLocked ? 'bg-[#1F293B] text-[#8A9BB5]' : 'bg-[#7C5CBF] text-white hover:bg-[#6B4FA8]'}`}>
                {freePublishLocked ? 'Subscribe to publish →' : '🚀 Publish to Marketplace'}
              </Button>
              {freePublishLocked ? (
                <p className="text-sm text-[#8A9BB5]">Publishing is locked on the free plan. Subscribe to unlock marketplace publishing.</p>
              ) : null}
              <Button onClick={deployAgent} className="w-full rounded-3xl border border-[#00C9A7] bg-transparent px-5 py-4 text-sm text-[#00C9A7] hover:bg-[#0B1F25]">
                🌐 Deploy for Preview
              </Button>
              <p className="text-sm text-[#8A9BB5]">Deploy to test before publishing</p>
            </div>

            <Card className="rounded-[28px] border border-[#1F2937] bg-[#09111F] p-6">
              <div className="text-sm font-semibold text-white">💰 Earnings potential</div>
              {earningsText ? (
                <div className="mt-3 space-y-2 text-sm text-[#B8C2D2]">
                  <p>At ₹{Number(price) || 0}/month × 10 clients = ₹{earningsText.gross}</p>
                  <p>MeetvoAI keeps 5%</p>
                  <p>Your earnings: ₹{earningsText.earned}/month</p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-[#8A9BB5]">Set a price to see earnings estimate.</p>
              )}
            </Card>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[32px] border border-[#1F2937] bg-[#09111F] p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">Result preview</div>
                  <p className="text-sm text-[#8A9BB5]">Use the preview, copy code, or inspect workflow.</p>
                </div>
                <Button onClick={scrollToPublish} className="rounded-full bg-[#0A0F1E] px-4 py-2 text-sm text-[#8A9BB5] border border-[#1F2937]">
                  <span className="flex items-center gap-2"><span>📢</span> Publish</span>
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-sm text-[#8A9BB5]">
                <button type="button" onClick={copyCode} className="rounded-full border border-[#1F2937] bg-[#0A0F1E] px-4 py-2 hover:border-teal-500/60">📋 Copy Code</button>
                <button type="button" onClick={downloadHTML} className="rounded-full border border-[#1F2937] bg-[#0A0F1E] px-4 py-2 hover:border-teal-500/60">⬇️ Download</button>
                <button type="button" onClick={openFullScreen} className="rounded-full border border-[#1F2937] bg-[#0A0F1E] px-4 py-2 hover:border-teal-500/60">🔍 Full Screen</button>
              </div>

              <div className="mt-6 rounded-[24px] border border-[#16223B] bg-[#07111F] p-4">
                {showResult ? (
                  <div className="space-y-4">
                    {activeTab === 'preview' && (
                      <div className="h-[420px] overflow-hidden rounded-[24px] border border-[#1F2937] bg-black">
                        <iframe title="Studio preview" srcDoc={generatedHTML} className="h-full w-full" />
                      </div>
                    )}
                    {activeTab === 'code' && (
                      <pre className="max-h-[420px] overflow-auto rounded-[24px] border border-[#1F2937] bg-[#070C18] p-4 text-xs leading-6 text-[#C8D1E0]">
                        {generatedHTML || 'No HTML generated yet.'}
                      </pre>
                    )}
                    {activeTab === 'workflow' && workflow && (
                      <div className="rounded-[24px] border border-[#1F2937] bg-[#07111F] p-4">
                        <WorkflowDiagram automation={workflow} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex min-h-[420px] items-center justify-center rounded-[24px] border border-dashed border-[#1F2937] bg-[#07111F] p-8 text-center text-[#8A9BB5]">
                    Generate an agent to see the preview and workflow.
                  </div>
                )}
              </div>
            </div>

            <div ref={publishSectionRef} className="rounded-[32px] border border-[#1F2937] bg-[#09111F] p-6">
              <div className="text-sm font-semibold text-white">Publish section</div>
              <p className="mt-2 text-sm text-[#8A9BB5]">Complete your agent details and publish to the marketplace.</p>
            </div>

            <div className="rounded-[32px] border border-[#1F2937] bg-[#09111F] p-6">
              <div className="text-sm font-semibold text-white">Build History</div>
              <p className="text-sm text-[#8A9BB5]">Your recent Studio builds</p>
              <div className="mt-4 space-y-3">
                {history.length ? (
                  history.map((build) => (
                    <button
                      key={build.id}
                      type="button"
                      onClick={() => restoreBuild(build)}
                      className="w-full rounded-3xl border border-[#16223B] bg-[#07101E] p-4 text-left text-sm text-[#E2E8F0] hover:border-teal-500/60"
                    >
                      <div className="font-semibold">{build.prompt?.slice(0, 55) || 'Untitled build'}</div>
                      <div className="mt-1 text-xs text-[#8A9BB5]">{new Date(build.created_at || '').toLocaleString()}</div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-3xl border border-[#16223B] bg-[#07101E] p-4 text-sm text-[#8A9BB5]">No builds yet. Generate one to save it here.</div>
                )}
              </div>
            </div>
          </aside>
        </section>

        {deployUrl ? (
          <div className="mt-6 rounded-[28px] border border-[#68D391] bg-[#68D39120] p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold text-white">✅ Your preview site is live for testing.</p>
                <a href={deployUrl} target="_blank" rel="noreferrer" className="text-teal-300 hover:text-teal-100">
                  {deployUrl}
                </a>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => window.open(deployUrl, '_blank')} className="rounded-full bg-[#0A0F1E] border border-[#68D391] px-4 py-3 text-sm text-white">🌐 Open Agent</Button>
                <Button onClick={() => router.push('/dashboard')} className="rounded-full bg-[#0A0F1E] border border-[#68D391] px-4 py-3 text-sm text-white">📊 View Dashboard</Button>
                <Button onClick={async () => { await navigator.clipboard.writeText(deployUrl); toast.success('Link copied.'); }} className="rounded-full bg-[#0A0F1E] border border-[#68D391] px-4 py-3 text-sm text-white">🔗 Share Link</Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
