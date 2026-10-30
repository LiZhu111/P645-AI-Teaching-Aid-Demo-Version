// One browser audio session shared by the header and all feature panels.
export function createSpeechSession(getEnvironment) {
  const idle = Object.freeze({ owner: null, speechId: null, listening: false });
  let snapshot = idle;
  let current = null;
  let version = 0;
  let cancellationGeneration = 0;
  const subscribers = new Set();
  function publish(next) {
    snapshot = next;
    subscribers.forEach((subscriber) => subscriber());
  }
  function finish(session) {
    if (current !== session) return;
    current = null;
    publish(idle);
  }
  function stopAll() {
    version += 1;
    const previous = current;
    current = null; // Invalidate callbacks before cancel/abort can fire events.
    if (previous?.recognition) {
      try { previous.recognition.abort(); } catch { /* Already ended. */ }
    }
    const environment = getEnvironment();
    const synthesis = environment?.speechSynthesis;
    const generation = ++cancellationGeneration;
    const hadPlayback = previous?.utterance || synthesis?.speaking || synthesis?.pending;
    // Pause first, then clear both the active utterance and the browser queue.
    if (hadPlayback) synthesis?.pause?.();
    synthesis?.cancel();
    if (hadPlayback && environment?.setTimeout) {
      environment.setTimeout(() => {
        // A delayed cancellation must never interrupt a newer Read action.
        if (generation !== cancellationGeneration || current?.utterance) return;
        if (synthesis.speaking || synthesis.pending) {
          synthesis.pause?.();
          synthesis.cancel();
        }
      }, 60);
    }
    publish(idle);
  }
  function speak(owner, speechId, text, options, onBoundary, onEnd) {
    stopAll();
    const environment = getEnvironment();
    if (!environment?.speechSynthesis || !environment.SpeechSynthesisUtterance) return false;
    const session = { owner };
    try {
      const utterance = new environment.SpeechSynthesisUtterance(text);
      session.utterance = utterance;
      utterance.lang = options.language;
      utterance.rate = options.rate;
      utterance.onend = () => {
        if (current !== session) return;
        finish(session);
        onEnd?.();
      };
      utterance.onerror = () => finish(session);
      utterance.onboundary = event => { if (current === session) onBoundary?.(event); };
      current = session;
      // Include queued speech so rapid Stop clicks work before onstart.
      publish({ owner, speechId, listening: false });
      if (environment.speechSynthesis.paused) environment.speechSynthesis.resume();
      environment.speechSynthesis.speak(utterance);
      return true;
    } catch {
      finish(session);
      return false;
    }
  }
  function listen(owner, onTranscript, onUnsupported, onError, options) {
    stopAll();
    const environment = getEnvironment();
    const Recognition = environment?.SpeechRecognition || environment?.webkitSpeechRecognition;
    if (!Recognition) { onUnsupported(); return; }
    let session;
    try {
      const recognition = new Recognition();
      session = { owner, recognition };
      recognition.lang = options.language;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = options.maxAlternatives;
      recognition.onresult = (event) => {
        if (current !== session) return;
        const transcript = event.results?.[0]?.[0]?.transcript;
        // Release the microphone before the callback can request an answer.
        finish(session);
        try { recognition.abort(); } catch { /* Already ended. */ }
        if (typeof transcript === 'string' && transcript.trim()) onTranscript(transcript);
        else onError({ error: "no-speech" });
      };
      recognition.onerror = (event) => {
        if (current !== session) return;
        finish(session);
        try { recognition.abort(); } catch { /* Already ended. */ }
        onError(event);
      };
      recognition.onend = () => {
        if (current !== session) return;
        finish(session);
        onError({ error: "no-speech" });
      };
      current = session;
      publish({ owner, speechId: null, listening: true });
      recognition.start();
    } catch {
      if (session && current === session) {
        finish(session);
        try { session.recognition.abort(); } catch { /* Start failed. */ }
      }
      onError();
    }
  }
  return {
    subscribe(listener) { subscribers.add(listener); return () => subscribers.delete(listener); },
    getSnapshot: () => snapshot,
    getServerSnapshot: () => idle,
    getVersion: () => version,
    stopAll,
    release(owner) {
      // Also invalidate delayed answers owned by an unmounting view.
      version += 1;
      if (current?.owner === owner) stopAll();
    },
    speak,
    listen,
    toggleSpeech(owner, id, text, options, onBoundary, onEnd) {
      if (snapshot.owner === owner && snapshot.speechId === id) { stopAll(); return true; }
      return speak(owner, id, text, options, onBoundary, onEnd);
    }
  };
}
