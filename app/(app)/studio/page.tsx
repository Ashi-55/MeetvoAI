'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Clock, Folder, Home, Mic, Settings, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { WorkflowDiagram } from '@/components/studio/WorkflowDiagram';
import type { StudioBuild } from '@/types';

const EXAMPLES = [
  'Restaurant WhatsApp bot',
  'Hotel booking website',
  'Clinic appointment system',
  'Lead capture for real estate',
  'Salon reminder bot',
  'E-commerce support agent',
];

const START_FROM_OPTIONS = [
  { label: 'Template', icon: '📋', value: 'Create a template for a restaurant ordering chatbot.' },
  { label: 'Voice', icon: '🎙️', value: 'Start with a voice prompt.' },
  { label: 'Example', icon: '⚡', value: 'Hotel booking website' },
];

const NAV_ITEMS = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'My Builds', icon: Folder, href: '/dashboard/studio' },
  { label: 'Starred', icon: Star, href: '/dashboard' },
  { label: 'Recent', icon: Clock, href: '/dashboard/studio' },
];

export default function StudioPage() {
  const router = useRouter();
  const { user, builderProfile } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [refinementText, setRefinementText] = useState('');
  const [stage, setStage] = useState<'input' | 'result'>('input');
  const [generating, setGenerating] = useState(false);
  const [mode, setMode] = useState<'website' | 'automation' | 'combination' | null>(null);
  const [generatedHTML, setGeneratedHTML] = useState('');
  const [workflow, setWorkflow] = useState<any | null>(null);
  const [config, setConfig] = useState<any>(null);
  const [buildId, setBuildId] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [deployUrl, setDeployUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [history, setHistory] = useState<StudioBuild[]>([]);
  const [deploying, setDeploying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'captured'>('idle');
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const canGenerate = Boolean(prompt.trim());
  const buildTitle = config?.business_name || originalPrompt.slice(0, 40) || 'New Studio Build';

  useEffect(() => {
    if (!user) return;
    if (builderProfile) {
      router.push('/dashboard/builder/studio');
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
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(12);
    setHistory((data || []) as StudioBuild[]);
  }

  async function generate(isRefinement = false) {
    if (!user) {
      toast.error('Please sign in to generate your build.');
      return;
    }
    if (!prompt.trim()) {
      toast.error('Add a prompt to continue.');
      return;
    }

    if (!isRefinement) {
      setOriginalPrompt(prompt);
      setGeneratedHTML('');
      setWorkflow(null);
      setConfig(null);
      setBuildId('');
      setSubdomain('');
      setDeployUrl('');
      setActiveTab('preview');
    }

    setStage('result');
    setGenerating(true);

    try {
      const response = await fetch('/api/studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, userType: 'business' }),
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
      if (result.config?.deployment?.suggested_subdomain) {
        setSubdomain(result.config.deployment.suggested_subdomain);
      }
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
      toast.error('Generate your build before deploying.');
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
          name: config?.business_name || 'AI Studio Agent',
        }),
      });
      const result = await response.json();
      if (!result.success) {
        toast.error(result.error || 'Deploy failed.');
        return;
      }
      setDeployUrl(`https://${result.url}`);
      setShowDeployModal(false);
      toast.success(`Live at ${result.url} ✓`);
    } catch (error) {
      console.error(error);
      toast.error('Deploy failed.');
    } finally {
      setDeploying(false);
    }
  }

  const copyBuildCode = async () => {
    if (!generatedHTML) return;
    await navigator.clipboard.writeText(generatedHTML);
    toast.success('Code copied to clipboard.');
  };

  const copyDeployUrl = async () => {
    if (!deployUrl) return;
    await navigator.clipboard.writeText(deployUrl);
    toast.success('URL copied to clipboard.');
  };

  const restoreBuild = (build: StudioBuild) => {
    const cfg = (build.config_json as any) || {};
    setMode(cfg.mode || 'website');
    setConfig(cfg);
    setGeneratedHTML(cfg.generated_html || cfg.html || '');
    setWorkflow(cfg.workflow || null);
    setBuildId(build.id);
    setSubdomain(cfg.deployment?.suggested_subdomain || '');
    setPrompt(build.prompt || '');
    setOriginalPrompt(build.prompt || '');
    setActiveTab('preview');
    setStage('result');
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => null);
      audioContextRef.current = null;
    }
    if (silenceTimerRef.current) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsRecording(false);
  };

  const startVoiceRecording = async () => {
    if (isRecording) {
      stopVoiceRecording();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'voice.webm');

        try {
          const response = await fetch('/api/voice', {
            method: 'POST',
            body: formData,
          });
          const result = await response.json();
          if (result.text) {
            setPrompt(result.text);
            setVoiceStatus('captured');
            setTimeout(() => setVoiceStatus('idle'), 2500);
            toast.success('Voice captured ✓');
          } else {
            toast.error(result.error || 'Voice transcription failed.');
            setVoiceStatus('idle');
          }
        } catch (error) {
          console.error(error);
          toast.error('Voice capture failed.');
          setVoiceStatus('idle');
        }
      };

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.85;
      source.connect(analyser);
      const sampleArray = new Uint8Array(analyser.frequencyBinCount);

      const checkSilence = () => {
        analyser.getByteFrequencyData(sampleArray);
        const level = sampleArray.reduce((sum, value) => sum + value, 0) / sampleArray.length;
        setVoiceLevel(level);
        if (level < 12) {
          if (silenceTimerRef.current === null) {
            silenceTimerRef.current = window.setTimeout(() => {
              stopVoiceRecording();
            }, 2000);
          }
        } else if (silenceTimerRef.current !== null) {
          window.clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        if (recorder.state === 'recording') {
          rafRef.current = requestAnimationFrame(checkSilence);
        }
      };

      setVoiceStatus('listening');
      setIsRecording(true);
      recorder.start();
      rafRef.current = requestAnimationFrame(checkSilence);
    } catch (error) {
      console.error(error);
      toast.error('Microphone access is required.');
      setIsRecording(false);
      setVoiceStatus('idle');
    }
  };

  useEffect(() => {
    return () => {
      stopVoiceRecording();
    };
  }, []);

  const historyItems = useMemo(
    () =>
      history.map((build) => {
        const cfg = (build.config_json as any) || {};
        const isAutomation = cfg.mode === 'automation';
        const label = build.prompt ? build.prompt.slice(0, 35) : 'Untitled build';
        const timeAgo = build.created_at
          ? new Date(build.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
          : '--';
        return {
          id: build.id,
          title: label,
          timeAgo,
          icon: isAutomation ? '🤖' : '🌐',
          build,
        };
      }),
    [history]
  );

  return (
    <main className="min-h-screen bg-white text-[#0f172a]">
      <div className="fixed left-0 top-0 bottom-0 w-[260px] border-r border-[#f1f5f9] bg-white px-5 py-6">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-[0.3em] text-[#64748b]">MeetvoAI Studio</div>
          <div className="mt-3 text-2xl font-semibold">Studio</div>
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-[#475569] transition hover:bg-[#f8fafc] hover:text-[#0f172a]"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-10 border-t border-[#f1f5f9] pt-6 text-sm font-semibold text-[#475569]">Recent builds</div>
        <div className="mt-4 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
          {historyItems.length ? (
            historyItems.map((item) => (
              <button
                key={item.id}
                onClick={() => restoreBuild(item.build)}
                className="flex w-full items-start gap-3 rounded-2xl border border-[#f1f5f9] bg-white px-3 py-3 text-left transition hover:border-[#6366f1]"
              >
                <div className="mt-0.5 text-lg">{item.icon}</div>
                <div>
                  <div className="text-sm font-medium text-[#0f172a]">{item.title}</div>
                  <div className="mt-1 text-xs text-[#94a3b8]">{item.timeAgo}</div>
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-2xl border border-[#f1f5f9] bg-[#f8fafc] p-4 text-sm text-[#64748b]">
              No recent builds yet. Generate one to see it here.
            </div>
          )}
        </div>

        <div className="mt-auto pt-6 border-t border-[#f1f5f9]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef2ff] text-xl">M</div>
            <div>
              <div className="text-sm font-semibold text-[#0f172a]">{user?.email || 'Guest'}</div>
              <Link href="/settings" className="mt-1 inline-flex items-center gap-2 text-xs text-[#64748b] hover:text-[#0f172a]">
                <Settings className="h-3.5 w-3.5" />
                Settings
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="ml-[260px] min-h-screen px-8 py-10">
        {stage === 'input' && (
          <div className="mx-auto flex min-h-[calc(100vh-120px)] max-w-3xl flex-col items-center justify-center gap-8">
            <div className="text-center">
              <h1 className="text-[48px] font-extrabold leading-[1.05] tracking-[-1px] text-[#0f172a]">What will you build today?</h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-[#64748b]">Describe in any language. AI builds the flow instantly.</p>
            </div>

            <div className="w-full max-w-[720px] rounded-[16px] border border-[#e2e8f0] bg-white px-5 pb-5 pt-4 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Describe what you want to build..."
                rows={4}
                className={`w-full resize-none border-0 bg-white text-[16px] leading-7 text-[#0f172a] outline-none placeholder:text-[#94a3b8] font-sans ${isRecording ? 'ring-2 ring-red-400' : ''}`}
                style={{ minHeight: 80, maxHeight: 200 }}
              />

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPrompt('Create a restaurant WhatsApp bot that accepts orders, sends confirmations, and updates inventory.')}
                    className="inline-flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#475569] transition hover:border-[#6366f1] hover:text-[#6366f1]"
                  >
                    <span className="text-sm">+</span>
                  </button>
                  <span className="rounded-full border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#475569]">Standard</span>
                  <button
                    type="button"
                    onClick={startVoiceRecording}
                    className={`inline-flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-white px-3 py-2 text-sm transition ${isRecording ? 'border-red-400 text-red-600' : 'text-[#475569] hover:border-[#6366f1] hover:text-[#6366f1]'}`}
                  >
                    <Mic className="h-4 w-4" />
                    Voice
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => generate()}
                  disabled={!canGenerate}
                  className={`rounded-[8px] px-5 py-2 text-sm font-semibold text-white transition ${canGenerate ? 'bg-[#6366f1] hover:bg-[#4f46e5]' : 'bg-[#6366f1] opacity-50 cursor-not-allowed'}`}
                >
                  Generate →
                </button>
              </div>

              {voiceStatus !== 'idle' && (
                <div className="mt-4 flex items-center justify-between rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[#92400e]">
                  <div>
                    {voiceStatus === 'listening' ? (
                      <div className="font-medium">Listening... speak now</div>
                    ) : (
                      <div className="font-medium">Voice captured ✓</div>
                    )}
                    <div className="mt-1 text-[#7c7c7c]">
                      {voiceStatus === 'listening'
                        ? 'Recording audio and detecting silence.'
                        : 'Transcription has been added to the prompt.'}
                    </div>
                  </div>
                  <div className="flex h-2 w-20 items-end gap-1">
                    {[...Array(5)].map((_, index) => (
                      <span
                        key={index}
                        className={`block h-2 w-2 rounded-full ${voiceLevel / 5 > index ? 'bg-red-500' : 'bg-red-200'}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 text-sm text-[#64748b]">
              <span>or start from</span>
              {START_FROM_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setPrompt(option.value)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-white px-4 py-2 text-[#475569] transition hover:border-[#6366f1] hover:text-[#6366f1]"
                >
                  <span>{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>

            <div className="mx-auto flex w-full max-w-[720px] flex-wrap justify-center gap-3">
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setPrompt(example)}
                  className="rounded-[8px] border border-[#e2e8f0] bg-white px-4 py-2 text-[13px] text-[#475569] transition hover:border-[#6366f1] hover:text-[#6366f1]"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {stage === 'result' && (
          <div className="flex min-h-[calc(100vh-120px)] gap-6 pb-6">
            <section className="w-[35%] min-w-[320px] rounded-[24px] border border-[#e2e8f0] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
              <button
                type="button"
                onClick={() => setStage('input')}
                className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#475569] hover:text-[#0f172a]"
              >
                <ArrowLeft className="h-4 w-4" /> Back to prompt
              </button>
              <div className="mb-4 text-xs uppercase tracking-[0.24em] text-[#64748b]">{buildTitle}</div>
              <div className="space-y-4">
                <div className="rounded-[28px] bg-[#f8fafc] p-4 text-sm text-[#475569] shadow-sm">
                  <div className="mb-3 rounded-[20px] bg-white p-4 text-sm text-[#0f172a] shadow-sm">{originalPrompt}</div>
                  <div className="rounded-[20px] border border-[#e2e8f0] bg-white p-4">
                    <div className="text-xs uppercase tracking-[0.24em] text-[#64748b]">AI response</div>
                    <div className="mt-3 text-sm text-[#475569]">Here is what I built:</div>
                    <div className="mt-4 space-y-2">
                      <div className="rounded-2xl bg-[#f8fafc] px-4 py-3 text-sm text-[#0f172a]">Type: {mode === 'automation' ? 'Automation' : 'Website'}</div>
                      <div className="rounded-2xl bg-[#f8fafc] px-4 py-3 text-sm text-[#0f172a]">Name: {config?.business_name || 'Generated Agent'}</div>
                      <div className="rounded-2xl bg-[#f8fafc] px-4 py-3 text-sm text-[#0f172a]">Features: {config?.features || 'Automated workflow and deployment'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[20px] border border-[#e2e8f0] bg-white p-4">
                <div className="mb-3 text-sm font-semibold text-[#0f172a]">Describe a change...</div>
                <div className="flex gap-3">
                  <input
                    value={refinementText}
                    onChange={(event) => setRefinementText(event.target.value)}
                    placeholder="Describe a change..."
                    className="flex-1 rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm text-[#0f172a] outline-none"
                  />
                  <button
                    type="button"
                    onClick={refine}
                    disabled={!refinementText.trim()}
                    className="rounded-[12px] bg-[#6366f1] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#4f46e5] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </div>
            </section>

            <section className="flex-1 rounded-[24px] bg-[#f8fafc] p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0f172a] shadow-sm">
                  <button onClick={() => setActiveTab('preview')} className={activeTab === 'preview' ? 'text-[#6366f1]' : 'text-[#64748b]'}>
                    Preview
                  </button>
                  <button onClick={() => setActiveTab('code')} className={activeTab === 'code' ? 'text-[#6366f1]' : 'text-[#64748b]'}>
                    Code
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  {deployUrl ? (
                    <button
                      type="button"
                      onClick={copyDeployUrl}
                      className="rounded-[10px] border border-[#e2e8f0] bg-white px-4 py-2 text-sm text-[#475569] hover:bg-[#eef2ff]"
                    >
                      Copy URL
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setShowDeployModal(true)}
                    className="rounded-[10px] bg-[#6366f1] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4f46e5]"
                  >
                    Deploy →
                  </button>
                </div>
              </div>

              <div className="grid h-[calc(100vh-260px)] gap-6">
                {generating ? (
                  <div className="rounded-[24px] bg-white p-8 shadow-sm">
                    <div className="mb-4 text-sm font-semibold text-[#0f172a]">Generating your build...</div>
                    <div className="space-y-4">
                      <div className="h-4 w-[60%] animate-pulse rounded-full bg-[#e2e8f0]" />
                      <div className="h-4 w-[40%] animate-pulse rounded-full bg-[#e2e8f0]" />
                      <div className="h-48 animate-pulse rounded-[20px] bg-[#e2e8f0]" />
                    </div>
                  </div>
                ) : activeTab === 'preview' ? (
                  mode === 'automation' ? (
                    <div className="rounded-[24px] bg-white p-6 shadow-sm">
                      <div className="mb-4 text-sm font-semibold text-[#0f172a]">Workflow</div>
                      <div className="h-full rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
                        {workflow ? (
                          <WorkflowDiagram automation={workflow} />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-[#64748b]">No workflow available.</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full rounded-[24px] border border-[#e2e8f0] bg-white shadow-sm">
                      <iframe
                        title="Studio preview"
                        srcDoc={generatedHTML || '<div style="padding:24px;color:#475569;font-family:sans-serif;">Preview will appear here.</div>'}
                        className="h-full w-full rounded-[24px] border-0"
                      />
                    </div>
                  )
                ) : (
                  <div className="h-full rounded-[24px] bg-[#0f172a] p-4 text-sm text-[#f8fafc] shadow-sm overflow-auto">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="text-base font-semibold">Code</div>
                      <button
                        onClick={copyBuildCode}
                        className="rounded-[10px] bg-[#6366f1] px-3 py-2 text-xs font-semibold text-white hover:bg-[#4f46e5]"
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap text-xs leading-6">{generatedHTML || '<!-- No HTML generated yet -->'}</pre>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      {showDeployModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-[0_25px_80px_rgba(15,23,42,0.18)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-sm uppercase tracking-[0.3em] text-[#64748b]">Deploy your agent</div>
                <div className="mt-2 text-lg font-semibold text-[#0f172a]">Live in minutes</div>
              </div>
              <button type="button" onClick={() => setShowDeployModal(false)} className="text-sm text-[#64748b] hover:text-[#0f172a]">
                Close
              </button>
            </div>
            <div className="rounded-[18px] border border-[#e2e8f0] bg-[#f8fafc] p-4 text-sm text-[#475569]">
              <div className="font-semibold text-[#0f172a]">What you get</div>
              <ul className="mt-3 space-y-2 text-[#64748b]">
                <li>✓ Live URL instantly</li>
                <li>✓ Runs 24/7</li>
                <li>✓ Free SSL</li>
              </ul>
            </div>
            <div className="mt-5 space-y-3">
              <label className="block text-sm font-medium text-[#475569]">Subdomain</label>
              <div className="flex items-center gap-2">
                <input
                  value={subdomain}
                  onChange={(event) => setSubdomain(event.target.value)}
                  placeholder="your-agent-name"
                  className="flex-1 rounded-[12px] border border-[#e2e8f0] bg-white px-4 py-3 text-sm text-[#0f172a] outline-none"
                />
                <span className="text-sm text-[#64748b]">.meetvoai.in</span>
              </div>
            </div>
            <button
              type="button"
              onClick={deployAgent}
              disabled={!subdomain.trim()}
              className="mt-6 w-full rounded-[12px] bg-[#6366f1] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#4f46e5] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deploying ? 'Deploying…' : 'Deploy Now'}
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
