"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useAuth } from "@/components/AuthProvider";
import { progressKey, readProgress, saveSpeechPosition, startMaterial } from "@/lib/progress";

const changeEvent = "aita:progress-changed";
const serverSnapshot = () => null;
function subscribe(callback) {
  window.addEventListener("storage", callback);
  window.addEventListener(changeEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(changeEvent, callback);
  };
}
function read(key) {
  try { return window.localStorage.getItem(key); } catch { return null; }
}

export function useLearningProgress(unitCode, materials) {
  const { user, isReady } = useAuth();
  const key = isReady ? progressKey(user?.email, unitCode) : null;
  const getSnapshot = useCallback(() => key ? read(key) : null, [key]);
  const raw = useSyncExternalStore(subscribe, getSnapshot, serverSnapshot);
  const progress = readProgress(raw, materials);
  const selectedIndex = Math.max(0, materials.findIndex(material => material.id === progress.selectedMaterialId));
  function markStarted(materialId) {
    if (!key) return;
    const next = startMaterial(read(key), materials, materialId);
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
      window.dispatchEvent(new Event(changeEvent));
    } catch { /* Storage may be unavailable in a restricted browser session. */ }
  }
  function savePosition(materialId, speechSegment, speechOffset, speechSentence) {
    if (!key) return;
    const next = saveSpeechPosition(read(key), materials, materialId, speechSegment, speechOffset, speechSentence);
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
      window.dispatchEvent(new Event(changeEvent));
    } catch { /* Storage may be unavailable in a restricted browser session. */ }
  }
  return {
    ...progress,
    selectedIndex,
    startedCount: progress.startedMaterialIds.length,
    progressPercent: materials.length ? Math.round(progress.startedMaterialIds.length / materials.length * 100) : 0,
    markStarted,
    savePosition
  };
}
