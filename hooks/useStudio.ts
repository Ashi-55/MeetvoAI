"use client";

import { useStudioStore } from "@/store/studioStore";

export function useStudio() {
  return useStudioStore();
}
