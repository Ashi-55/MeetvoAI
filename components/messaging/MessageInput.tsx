"use client";

import { Send } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

export function MessageInput({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState("");
  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText("");
  };
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };
  return (
    <div className="flex items-end gap-2 border-t border-border bg-bg-secondary p-3">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Type a message..."
        className="min-h-[44px] flex-1 resize-none"
      />
      <Button type="button" size="sm" onClick={submit} aria-label="Send">
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
