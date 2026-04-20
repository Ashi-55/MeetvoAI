import { create } from "zustand";
import type { AgentFlowJson, StudioBuildType, StudioIntent } from "@/types";

interface StudioState {
  intent: StudioIntent | null;
  mode: StudioBuildType | null;
  generatedHtml: string;
  agentFlow: AgentFlowJson | null;
  setIntent: (i: StudioIntent | null) => void;
  setMode: (m: StudioBuildType | null) => void;
  setGeneratedHtml: (html: string) => void;
  setAgentFlow: (flow: AgentFlowJson | null) => void;
  reset: () => void;
}

export const useStudioStore = create<StudioState>((set) => ({
  intent: null,
  mode: null,
  generatedHtml: "",
  agentFlow: null,
  setIntent: (intent) => set({ intent }),
  setMode: (mode) => set({ mode }),
  setGeneratedHtml: (generatedHtml) => set({ generatedHtml }),
  setAgentFlow: (agentFlow) => set({ agentFlow }),
  reset: () =>
    set({
      intent: null,
      mode: null,
      generatedHtml: "",
      agentFlow: null,
    }),
}));
