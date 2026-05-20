'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Clock, Copy, Folder, Home, Mic, Plus, Send, Settings, Star, X } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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

const STARTERS = [
  { label: 'Template', icon: '📋', prompt: 'Create a template for a restaurant WhatsApp bot with order tracking.' },
  { label: 'Voice', icon: '🎙️', prompt: '' },
  { label: 'Example', icon: '⚡', prompt: 'Hotel booking website' },
];

const INDIAN_LANGUAGES = [
  { code: 'en-IN', label: 'English India' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'ta-IN', label: 'Tamil' },
  { code: 'te-IN', label: 'Telugu' },
  { code: 'kn-IN', label: 'Kannada' },
  { code: 'ml-IN', label: 'Malayalam' },
  { code: 'mr-IN', label: 'Marathi' },
  { code: 'bn-IN', label: 'Bengali' },
  { code: 'gu-IN', label: 'Gujarati' },
  { code: 'pa-IN', label: 'Punjabi' },
  { code: 'ur-IN', label: 'Urdu' },
];

type BuildMode = 'website' | 'automation' | 'combination';
type Stage = 'input' | 'result';
type VoiceStatus = 'idle' | 'listening' | 'captured' | 'error';

function cleanSubdomain(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 32);
}

function suggestedSubdomain(value: string) {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join('');
  return cleanSubdomain(cleaned || 'meetvoagent');
}

function timeAgo(date?: string) {
  if (!date) return 'recently';
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function buildCode(mode: BuildMode | null, html: string, workflow: any) {
  if (html) return html;
  if (workflow) return JSON.stringify(workflow, null, 2);
  return mode === 'automation' ? '{\n  "workflow": "Generating..."\n}' : '<!-- Generating... -->';
}

export default function StudioPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const speechTranscriptRef = useRef('');

  const [stage, setStage] = useState<Stage>('input');
  const [prompt, setPrompt] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [refinement, setRefinement] = useState('');
  const [language, setLanguage] = useState('en-IN');
  const [generating, setGenerating] = useState(false);
  const [mode, setMode] = useState<BuildMode | null>(null);
  const [generatedHTML, setGeneratedHTML] = useState('');
  const [workflow, setWorkflow] = useState<any | null>(null);
  const [config, setConfig] = useState<any | null>(null);
  const [buildId, setBuildId] = useState('');
  const [history, setHistory] = useState<StudioBuild[]>([]);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [subdomain, setSubdomain] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [deployUrl, setDeployUrl] = useState('');
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('idle');
  const [voiceLevel, setVoiceLevel] = useState(0);

  const canGenerate = Boolean(prompt.trim()) && !generating;
  const userEmail = user?.email || 'Guest';
  const userInitial = userEmail.charAt(0).toUpperCase();
  const buildTitle = config?.business_name || originalPrompt.slice(0, 35) || 'Untitled build';
  const isAutomation = mode === 'automation' && !generatedHTML;
  const code = buildCode(mode, generatedHTML, workflow);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('studio_builds')
      .select('*')
      .eq('builder_id', user.id)
      .order('created_at', { ascending: false })
      .limit(12);
    setHistory((data || []) as StudioBuild[]);
  }, [user]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    const queryPrompt = searchParams.get('prompt')?.trim();
    if (queryPrompt) setPrompt(queryPrompt);
  }, [searchParams]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [prompt]);

  const generate = useCallback(async (nextPrompt?: string, isRefinement = false) => {
    const promptToSend = (nextPrompt ?? prompt).trim();
    if (!user) {
      toast.error('Please sign in to generate.');
      return;
    }
    if (!promptToSend) {
      toast.error('Add a prompt to continue.');
      return;
    }

    if (!isRefinement) {
      setOriginalPrompt(promptToSend);
      setGeneratedHTML('');
      setWorkflow(null);
      setConfig(null);
      setBuildId('');
      setDeployUrl('');
      setSubdomain(suggestedSubdomain(promptToSend));
    }

    setStage('result');
    setActiveTab('preview');
    setGenerating(true);

    try {
      const response = await fetch('/api/studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptToSend, language }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Generation failed.');

      const nextMode = (result.mode || result.config?.mode || 'website') as BuildMode;
      setMode(nextMode);
      setConfig(result.config || { mode: nextMode, business_name: suggestedSubdomain(promptToSend) });
      setGeneratedHTML(result.html || '');
      setWorkflow(result.workflow || null);
      setBuildId(result.build_id || '');
      setSubdomain(suggestedSubdomain(result.config?.business_name || promptToSend));
      await loadHistory();
    } catch (error) {
      console.error(error);
      toast.error((error as Error)?.message || 'Generation failed.');
    } finally {
      setGenerating(false);
    }
  }, [language, loadHistory, prompt, user]);

  async function refine() {
    if (!refinement.trim()) return;
    const nextPrompt = `${originalPrompt}\n\nChange request: ${refinement.trim()}`;
    setPrompt(nextPrompt);
    setRefinement('');
    await generate(nextPrompt, true);
  }

  function restoreBuild(build: StudioBuild) {
    const cfg = (build.config_json as any) || {};
    const restoredMode = (cfg.mode || cfg.agent_type || 'website') as BuildMode;
    setPrompt(build.prompt || '');
    setOriginalPrompt(build.prompt || '');
    setMode(restoredMode);
    setConfig(cfg);
    setGeneratedHTML(cfg.generated_html || cfg.html || '');
    setWorkflow(cfg.workflow || null);
    setBuildId(build.id);
    setDeployUrl('');
    setSubdomain(suggestedSubdomain(cfg.business_name || build.prompt || 'meetvoagent'));
    setActiveTab('preview');
    setStage('result');
  }

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    toast.success('Code copied.');
  }

  async function copyDeployUrl() {
    if (!deployUrl) return;
    await navigator.clipboard.writeText(deployUrl);
    toast.success('URL copied.');
  }

  async function deployAgent() {
    if (!buildId) {
      toast.error('Generate your build before deploying.');
      return;
    }
    const clean = cleanSubdomain(subdomain);
    if (!clean) {
      toast.error('Enter a subdomain.');
      return;
    }

    setDeploying(true);
    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subdomain: clean,
          studio_build_id: buildId,
          agent_type: mode || 'website',
          config_json: { ...(config || {}), generated_html: generatedHTML, workflow },
          name: config?.business_name || buildTitle || 'MeetvoAI Agent',
        }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Deploy failed.');
      setDeployUrl(`https://${result.url}`);
      setShowDeployModal(false);
      toast.success(`Live at ${result.url} ✓`);
    } catch (error) {
      console.error(error);
      toast.error((error as Error)?.message || 'Deploy failed.');
    } finally {
      setDeploying(false);
    }
  }

  const stopVoiceRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    audioContextRef.current?.close().catch(() => null);
    audioContextRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
    rafRef.current = null;
    silenceTimerRef.current = null;
  }, []);

  async function startVoiceRecording() {
    if (voiceStatus === 'listening') {
      stopVoiceRecording();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];
      speechTranscriptRef.current = '';

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'voice.webm');
        formData.append('lang', language);
        const liveTranscript = speechTranscriptRef.current.trim();

        try {
          const response = await fetch('/api/voice', { method: 'POST', body: formData });
          const result = await response.json();
          const serverTranscript = (result.text || '').trim();
          if (!serverTranscript && !liveTranscript) throw new Error(result.error || 'Voice transcription failed.');
          if (serverTranscript) {
            setPrompt((current) => {
              const currentText = current.trim();
              if (currentText.toLowerCase().includes(serverTranscript.toLowerCase())) return currentText;
              return [currentText, serverTranscript].filter(Boolean).join(' ');
            });
          }
          setVoiceStatus('captured');
          toast.success('Voice captured ✓');
          window.setTimeout(() => setVoiceStatus('idle'), 2200);
        } catch (error) {
          console.error(error);
          if (liveTranscript) {
            setVoiceStatus('captured');
            toast.success('Voice captured ✓');
            window.setTimeout(() => setVoiceStatus('idle'), 2200);
          } else {
            setVoiceStatus('error');
            toast.error((error as Error)?.message || 'Voice capture failed.');
          }
        }
      };

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const detectSilence = () => {
        analyser.getByteFrequencyData(data);
        const level = data.reduce((sum, item) => sum + item, 0) / data.length;
        setVoiceLevel(level);
        if (level < 8) {
          if (!silenceTimerRef.current) {
            silenceTimerRef.current = window.setTimeout(() => stopVoiceRecording(), 2000);
          }
        } else if (silenceTimerRef.current) {
          window.clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        if (recorder.state === 'recording') rafRef.current = requestAnimationFrame(detectSilence);
      };

      setVoiceStatus('listening');
      recorder.start();
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        const basePrompt = prompt.trim();
        recognition.lang = language;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let index = 0; index < event.results.length; index += 1) {
            transcript += `${event.results[index][0]?.transcript || ''} `;
          }
          const cleanTranscript = transcript.trim();
          speechTranscriptRef.current = cleanTranscript;
          const nextPrompt = [basePrompt, cleanTranscript].filter(Boolean).join(' ').trim();
          if (nextPrompt) setPrompt(nextPrompt);
        };
        recognition.onerror = (event: any) => {
          console.warn('Browser speech recognition failed, using recorded audio fallback.', event);
        };
        recognition.onend = () => {
          recognitionRef.current = null;
        };
        recognitionRef.current = recognition;
        try {
          recognition.start();
        } catch {
          recognitionRef.current = null;
        }
      }
      rafRef.current = requestAnimationFrame(detectSilence);
    } catch (error) {
      console.error(error);
      setVoiceStatus('error');
      toast.error('Microphone access is required.');
    }
  }

  useEffect(() => {
    return () => stopVoiceRecording();
  }, [stopVoiceRecording]);

  const historyItems = useMemo(() => history.map((build) => {
    const cfg = (build.config_json as any) || {};
    const automation = cfg.mode === 'automation' || Boolean(cfg.workflow);
    return {
      build,
      icon: automation ? '🤖' : '🌐',
      title: (build.prompt || build.name || 'Untitled build').slice(0, 35),
      time: timeAgo(build.created_at),
    };
  }), [history]);

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-[#08080F] text-white">
      <aside className="fixed left-0 top-14 z-30 hidden h-[calc(100vh-3.5rem)] w-[260px] flex-col border-r border-[#1E1B3A] bg-[#0D0B1A] lg:flex">
        <div className="px-5 py-5">
          <div className="text-sm font-extrabold tracking-[-0.02em] text-white">MeetvoAI Studio</div>
        </div>

        <nav className="space-y-1 px-3">
          <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#9490B5] hover:bg-[#1E1B3A] hover:text-white">
            <Home className="h-4 w-4" /> Home
          </Link>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#9490B5] hover:bg-[#1E1B3A] hover:text-white">
            <Folder className="h-4 w-4" /> My Builds
          </button>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#9490B5] hover:bg-[#1E1B3A] hover:text-white">
            <Star className="h-4 w-4" /> Starred
          </button>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#9490B5] hover:bg-[#1E1B3A] hover:text-white">
            <Clock className="h-4 w-4" /> Recent
          </button>
        </nav>

        <div className="mt-7 px-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">Recent builds</div>
        <div className="mt-3 flex-1 space-y-1 overflow-y-auto px-3">
          {historyItems.length ? historyItems.map((item) => (
            <button
              key={item.build.id}
              type="button"
              onClick={() => restoreBuild(item.build)}
              className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-[#1E1B3A]"
            >
              <span className="mt-0.5 text-base">{item.icon}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-white">{item.title}</span>
                <span className="mt-0.5 block text-xs text-[#94a3b8]">{item.time}</span>
              </span>
            </button>
          )) : (
            <div className="rounded-lg px-3 py-4 text-sm text-[#94a3b8]">No recent builds yet.</div>
          )}
        </div>

        <div className="border-t border-[#1E1B3A] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7C5CFC] text-sm font-bold text-white">{userInitial}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white">{userEmail}</div>
              <Link href="/settings" className="mt-1 inline-flex items-center gap-1.5 text-xs text-[#9490B5] hover:text-[#ae9bc9]">
                <Settings className="h-3.5 w-3.5" /> Settings
              </Link>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-h-[calc(100vh-3.5rem)] lg:ml-[260px]">
        <div className="sticky top-14 z-20 flex items-center justify-between border-b border-[#1E1B3A] bg-[#0D0B1A]/95 px-4 py-3 backdrop-blur lg:hidden">
          <div>
            <div className="text-sm font-extrabold text-white">MeetvoAI Studio</div>
            <div className="mt-0.5 max-w-[220px] truncate text-xs text-[#9490B5]">{userEmail}</div>
          </div>
          <Link href="/settings" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1E1B3A] bg-[#100F1C] text-[#9490B5]">
            <Settings className="h-4 w-4" />
          </Link>
        </div>
        {stage === 'input' ? (
          <section className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
            <div className="w-full max-w-[760px] text-center">
              <h1 className="text-3xl font-[800] leading-[1.08] text-white sm:text-4xl lg:text-[48px]">What will you build today?</h1>
              <p className="mx-auto mt-4 mb-6 max-w-md whitespace-pre-line text-sm leading-6 text-[#9490B5] sm:mb-8 sm:text-[16px]">
                {'Describe in any language.\nAI builds the flow instantly.'}
              </p>

              {voiceStatus === 'listening' ? (
                <div className="mb-3 flex items-center justify-center gap-3 text-sm font-medium text-[#e11d48]">
                  <span>Listening... speak now</span>
                  <span className="flex h-5 items-end gap-1">
                    {[0, 1, 2, 3].map((item) => (
                      <span
                        key={item}
                        className="block w-1 rounded-full bg-[#e11d48] transition-all"
                        style={{ height: `${8 + Math.min(18, voiceLevel / 4 + item * 2)}px` }}
                      />
                    ))}
                  </span>
                </div>
              ) : voiceStatus === 'captured' ? (
                <div className="mb-3 text-sm font-medium text-[#10b981]">Voice captured ✓</div>
              ) : null}

              <div className={`mx-auto w-full max-w-[720px] rounded-[16px] border bg-[#100F1C] px-4 pb-4 pt-5 text-left shadow-[0_20px_60px_rgba(0,0,0,0.28)] transition sm:px-5 ${voiceStatus === 'listening' ? 'border-[#fb7185]' : 'border-[#1E1B3A]'}`}>
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder={'Describe what you want\nto build...'}
                  className="max-h-[200px] min-h-[80px] w-full resize-none border-0 bg-transparent p-0 text-[16px] leading-6 text-white outline-none placeholder:text-[#64748b]"
                  style={{ fontFamily: 'inherit' }}
                />

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPrompt('Create a restaurant WhatsApp bot that accepts orders and sends confirmations.')}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-[#9490B5] hover:bg-[#1E1B3A] hover:text-[#ae9bc9]"
                      aria-label="Add"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <select
                      value={language}
                      onChange={(event) => setLanguage(event.target.value)}
                      className="min-w-0 max-w-[160px] flex-1 rounded-full border border-[#1E1B3A] bg-[#08080F] px-3 py-1.5 text-sm font-medium text-[#9490B5] outline-none hover:border-[#ae9bc9] hover:text-[#ae9bc9]"
                      aria-label="Voice language"
                    >
                      {INDIAN_LANGUAGES.map((item) => (
                        <option key={item.code} value={item.code}>{item.label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={startVoiceRecording}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${voiceStatus === 'listening' ? 'text-[#e11d48] animate-pulse' : 'text-[#9490B5] hover:bg-[#1E1B3A] hover:text-[#ae9bc9]'}`}
                      aria-label="Voice input"
                    >
                      <Mic className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => generate()}
                    disabled={!canGenerate}
                    className="w-full rounded-[8px] bg-[#7C5CFC] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6F4EEA] disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
                  >
                    Generate <ArrowRight className="ml-1 inline h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-[#94a3b8]">
                <span>or start from</span>
                {STARTERS.map((starter) => (
                  <button
                    key={starter.label}
                    type="button"
                    onClick={() => starter.label === 'Voice' ? startVoiceRecording() : setPrompt(starter.prompt)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#1E1B3A] bg-[#100F1C] px-4 py-2 text-sm font-medium text-[#9490B5] hover:border-[#ae9bc9] hover:text-[#ae9bc9]"
                  >
                    <span>{starter.icon}</span>
                    {starter.label}
                  </button>
                ))}
              </div>

              <div className="mx-auto mt-6 flex max-w-[720px] flex-wrap justify-center gap-3">
                {EXAMPLES.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setPrompt(example)}
                    className="rounded-[8px] border border-[#1E1B3A] bg-[#100F1C] px-4 py-2 text-[13px] text-[#9490B5] transition hover:border-[#ae9bc9] hover:text-[#ae9bc9]"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section className="flex min-h-[calc(100vh-3.5rem)] flex-col lg:flex-row">
            <div className="flex w-full flex-col border-b border-[#1E1B3A] bg-[#0D0B1A] lg:w-[35%] lg:min-w-[360px] lg:border-b-0 lg:border-r">
              <div className="flex items-center gap-3 border-b border-[#1E1B3A] px-4 py-3 sm:px-5 sm:py-4">
                <button type="button" onClick={() => setStage('input')} className="rounded-lg p-2 text-[#9490B5] hover:bg-[#1E1B3A] hover:text-white" aria-label="Back">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">{buildTitle}</div>
                  <div className="text-xs text-[#94a3b8]">{mode || 'building'}</div>
                </div>
              </div>

              <div className="max-h-[45vh] space-y-4 overflow-y-auto px-4 py-4 sm:px-5 sm:py-6 lg:max-h-none lg:flex-1 lg:space-y-5">
                <div className="ml-auto max-w-[92%] rounded-2xl bg-[#6366f1] px-4 py-3 text-sm leading-6 text-white lg:max-w-[86%]">
                  {originalPrompt}
                </div>

                <div className="max-w-[96%] rounded-2xl border border-[#1E1B3A] bg-[#100F1C] px-4 py-4 text-sm text-[#9490B5] shadow-sm lg:max-w-[90%]">
                  <div className="font-semibold text-white">{generating ? 'AI is thinking' : 'Here is what I built:'}</div>
                  {generating ? (
                    <div className="mt-3 flex gap-1">
                      {[0, 1, 2].map((dot) => (
                        <span key={dot} className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#ae9bc9]" style={{ animationDelay: `${dot * 120}ms` }} />
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-[#1E1B3A] bg-[#08080F] p-4">
                      <div className="grid gap-3 text-sm">
                        <div><span className="font-semibold text-white">Type:</span> {mode === 'automation' ? 'Automation' : mode === 'combination' ? 'Website + automation' : 'Website'}</div>
                        <div><span className="font-semibold text-white">Business:</span> {config?.business_name || buildTitle}</div>
                        <div><span className="font-semibold text-white">Key features:</span> {workflow?.summary || 'Responsive preview, generated structure, deployment ready'}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-[#1E1B3A] p-3 sm:p-4">
                <div className="flex items-center gap-2 rounded-xl border border-[#1E1B3A] bg-[#100F1C] px-3 py-2">
                  <input
                    value={refinement}
                    onChange={(event) => setRefinement(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') refine();
                    }}
                    placeholder="Describe a change..."
                    className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#64748b]"
                  />
                  <button
                    type="button"
                    onClick={refine}
                    disabled={!refinement.trim() || generating}
                    className="rounded-lg bg-[#7C5CFC] p-2 text-white hover:bg-[#6F4EEA] disabled:pointer-events-none disabled:opacity-50"
                    aria-label="Send refinement"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex min-h-[520px] w-full flex-col bg-[#08080F] lg:w-[65%]">
              <div className="flex flex-col gap-3 border-b border-[#1E1B3A] bg-[#0D0B1A] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex rounded-lg bg-[#100F1C] p-1">
                  {(['preview', 'code'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`rounded-md px-4 py-2 text-sm font-semibold capitalize transition ${activeTab === tab ? 'bg-[#1E1B3A] text-white shadow-sm' : 'text-[#9490B5] hover:text-white'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {deployUrl ? (
                    <button type="button" onClick={copyDeployUrl} className="flex-1 rounded-lg border border-[#1E1B3A] bg-[#100F1C] px-4 py-2 text-sm font-semibold text-[#9490B5] hover:border-[#ae9bc9] hover:text-[#ae9bc9] sm:flex-none">
                      Copy URL
                    </button>
                  ) : null}
                  <button type="button" onClick={() => setShowDeployModal(true)} className="flex-1 rounded-lg bg-[#7C5CFC] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6F4EEA] sm:flex-none">
                    Deploy <ArrowRight className="ml-1 inline h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="min-h-[460px] flex-1 overflow-hidden p-3 sm:p-5">
                {generating ? (
                  <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-[#1E1B3A] bg-[#100F1C] p-8 text-center">
                    <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#1E1B3A] border-t-[#ae9bc9]" />
                    <div className="text-sm font-semibold text-white">Generating your build...</div>
                    <div className="mt-8 w-full max-w-2xl space-y-4">
                      <div className="h-5 w-2/3 animate-pulse rounded-full bg-[#1E1B3A]" />
                      <div className="h-5 w-1/2 animate-pulse rounded-full bg-[#1E1B3A]" />
                      <div className="h-64 animate-pulse rounded-2xl bg-[#1E1B3A]" />
                    </div>
                  </div>
                ) : activeTab === 'preview' ? (
                  isAutomation ? (
                    <div className="h-full overflow-auto rounded-2xl border border-[#1E1B3A] bg-[#100F1C] p-6">
                      {workflow ? (
                        <WorkflowDiagram automation={workflow} animate />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-[#9490B5]">Workflow preview will appear here.</div>
                      )}
                    </div>
                  ) : (
                    <iframe
                      title="Studio preview"
                      srcDoc={generatedHTML || '<div style="padding:32px;font-family:Inter,Arial,sans-serif;color:#475569;background:white;">Preview will appear here.</div>'}
                      sandbox="allow-scripts allow-same-origin"
                      className="h-full w-full rounded-2xl border border-[#1E1B3A] bg-white"
                    />
                  )
                ) : (
                  <div className="h-full overflow-hidden rounded-2xl bg-[#0f172a] text-[#e2e8f0]">
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                      <div className="text-sm font-semibold text-white">{generatedHTML ? 'HTML' : 'JSON'}</div>
                      <button type="button" onClick={copyCode} className="rounded-lg bg-[#7C5CFC] px-3 py-2 text-xs font-semibold text-white hover:bg-[#6F4EEA]">
                        <Copy className="mr-1 inline h-3.5 w-3.5" /> Copy
                      </button>
                    </div>
                    <pre className="h-full overflow-auto p-5 text-xs leading-6">
                      <code>{code}</code>
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      {showDeployModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#1E1B3A] bg-[#100F1C] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Deploy your agent</h2>
                <p className="mt-1 text-sm text-[#9490B5]">Choose your live MeetvoAI subdomain.</p>
              </div>
              <button type="button" onClick={() => setShowDeployModal(false)} className="rounded-lg p-2 text-[#9490B5] hover:bg-[#1E1B3A] hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="text-sm font-semibold text-white">Subdomain</label>
            <div className="mt-2 flex items-center rounded-xl border border-[#1E1B3A] bg-[#08080F] px-3 py-2 focus-within:border-[#ae9bc9]">
              <input
                value={subdomain}
                onChange={(event) => setSubdomain(cleanSubdomain(event.target.value))}
                placeholder="myagent"
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none"
              />
              <span className="text-sm text-[#94a3b8]">.meetvoai.in</span>
            </div>

            <div className="mt-5 rounded-xl bg-[#08080F] p-4 text-sm text-[#9490B5]">
              <div className="font-semibold text-white">What you get:</div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#10b981]" /> Live URL instantly</div>
                <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#10b981]" /> Runs 24/7</div>
                <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#10b981]" /> Free SSL</div>
              </div>
            </div>

            <button
              type="button"
              onClick={deployAgent}
              disabled={deploying || !subdomain.trim()}
              className="mt-6 w-full rounded-xl bg-[#7C5CFC] px-4 py-3 text-sm font-semibold text-white hover:bg-[#6F4EEA] disabled:pointer-events-none disabled:opacity-50"
            >
              {deploying ? 'Deploying...' : 'Deploy Now'}
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
