"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { appConfig } from "@/config/app-config";
import { createSpeechSession } from "@/lib/speech-session";

const session = createSpeechSession(() => typeof window === "undefined" ? null : window);

export function useSpeech() {
  const [owner] = useState(() => Symbol("speech-owner"));
  const pathname = usePathname();
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getServerSnapshot);

  useEffect(() => () => session.release(owner), [owner, pathname]);
  useEffect(() => {
    function stopWhenHidden() {
      if (document.hidden) session.stopAll();
    }
    window.addEventListener("pagehide", session.stopAll);
    document.addEventListener("visibilitychange", stopWhenHidden);
    return () => {
      window.removeEventListener("pagehide", session.stopAll);
      document.removeEventListener("visibilitychange", stopWhenHidden);
    };
  }, []);

  const speak = useCallback((id, text, onBoundary, onEnd) => session.speak(owner, id, text, appConfig.speech, onBoundary, onEnd), [owner]);
  const toggleSpeech = useCallback((id, text, onBoundary, onEnd) => session.toggleSpeech(owner, id, text, appConfig.speech, onBoundary, onEnd), [owner]);
  const listen = useCallback((onTranscript, onUnsupported, onError, onSilence) => {
    session.listen(owner, onTranscript, onUnsupported, onError, appConfig.speech, onSilence);
  }, [owner]);

  return {
    activeSpeechId: state.owner === owner ? state.speechId : null,
    isListening: state.owner === owner && state.listening,
    listen,
    speak,
    stop: session.stopAll,
    stopListening: session.stopAll,
    getSpeechVersion: session.getVersion,
    toggleSpeech
  };
}
