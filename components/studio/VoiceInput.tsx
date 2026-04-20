"use client";

import { Mic } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

type SpeechRec = SpeechRecognition | null;

function getRecognition(): SpeechRecognition | null {
  if (typeof window === "undefined") return null;
  const SR =
    window.SpeechRecognition ||
    (
      window as unknown as {
        webkitSpeechRecognition?: typeof SpeechRecognition;
      }
    ).webkitSpeechRecognition;
  if (!SR) return null;
  return new SR();
}

function looksLikeHindi(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

export function VoiceInput({
  onTranscript,
  disabled,
}: {
  onTranscript: (text: string, interim: boolean) => void;
  disabled?: boolean;
}) {
  const [recording, setRecording] = useState(false);
  const [listeningHint, setListeningHint] = useState(false);
  const recRef = useRef<SpeechRec>(null);
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulated = useRef("");

  const clearSilence = useCallback(() => {
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }
  }, []);

  const stopRec = useCallback(() => {
    clearSilence();
    recRef.current?.stop();
    setRecording(false);
    setListeningHint(false);
  }, [clearSilence]);

  const scheduleSilenceStop = useCallback(() => {
    clearSilence();
    silenceTimer.current = setTimeout(() => {
      stopRec();
      toast.success("Voice captured! Review and send.");
    }, 2000);
  }, [clearSilence, stopRec]);

  useEffect(() => {
    return () => {
      clearSilence();
      recRef.current?.stop();
    };
  }, [clearSilence]);

  const startRec = useCallback(() => {
    const rec = getRecognition();
    if (!rec) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }
    recRef.current = rec;
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-IN";
    accumulated.current = "";

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        const t = r[0]?.transcript ?? "";
        if (r.isFinal) final += t;
        else interim += t;
      }
      const piece = final || interim;
      if (piece && looksLikeHindi(piece)) {
        rec.lang = "hi-IN";
      }
      const full = accumulated.current + final;
      if (final) accumulated.current = full;
      onTranscript(full + interim, !final);
      if (final) scheduleSilenceStop();
    };

    rec.onerror = () => {
      stopRec();
    };

    rec.onend = () => {
      setRecording(false);
      setListeningHint(false);
    };

    try {
      setRecording(true);
      setListeningHint(true);
      rec.start();
    } catch {
      toast.error("Could not start microphone.");
      setRecording(false);
      setListeningHint(false);
    }
  }, [onTranscript, scheduleSilenceStop, stopRec]);

  return (
    <div className="flex flex-col items-center gap-1">
      {listeningHint ? (
        <p className="text-xs text-accent-orange">Listening... speak now</p>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        className={cn(
          "h-10 w-10 shrink-0 rounded-full p-0",
          recording && "animate-pulse bg-red-500/20 text-red-400"
        )}
        onClick={() => {
          if (recording) stopRec();
          else void startRec();
        }}
        aria-label={recording ? "Stop recording" : "Start voice input"}
      >
        <Mic className="h-5 w-5" />
      </Button>
    </div>
  );
}
