"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionStatus } from "@/components/ActionStatus";
import { VoiceInputButton } from "@/components/VoiceInputButton";
import { useSpeech } from "@/hooks/useSpeech";
import { getNavigationTarget } from "@/lib/voice-navigation";

export function GlobalVoiceControl() {
  const router = useRouter();
  const { isListening, listen, stopListening } = useSpeech();
  const [status, setStatus] = useState({ message: "Ready for a voice command.", tone: "neutral" });

  function toggleListening() {
    if (isListening) {
      stopListening();
      setStatus({ message: "Stopped.", tone: "neutral" });
      return;
    }

    setStatus({ message: "Listening for a section name...", tone: "info" });
    listen(
      (transcript) => {
        const route = getNavigationTarget(transcript);
        if (!route) {
          setStatus({ message: "Try Learn or My progress.", tone: "warning" });
          return;
        }
        setStatus({ message: `Opening ${route.slice(1)}.`, tone: "success" });
        router.push(route);
      },
      () => setStatus({ message: "Voice input is unavailable in this browser.", tone: "warning" }),
      () => setStatus({ message: "I could not hear that command.", tone: "error" })
    );
  }

  const visibleStatus = !isListening && status.message === "Listening for a section name..."
    ? { message: "Ready for a voice command.", tone: "neutral" }
    : status;

  return <div className="flex shrink-0 items-center gap-2"><VoiceInputButton activeLabel="Stop" compact idleLabel="Speak" isListening={isListening} onClick={toggleListening} /><span className="sr-only sm:not-sr-only sm:max-w-36 sm:text-xs sm:text-slate-500">{visibleStatus.message}</span><div className="sr-only"><ActionStatus message={visibleStatus.message} tone={visibleStatus.tone} /></div></div>;
}
