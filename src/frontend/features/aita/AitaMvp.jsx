"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AppHeader } from "@/components/AppHeader";
import { appConfig } from "@/config/app-config";
import { appCopy } from "@/config/app-copy";
import { useCourse, CourseStatus } from "@/components/CourseProvider";
import { requestAita, materialForView, explanationForView } from "@/lib/aita-service";
import { useLearningProgress } from "@/hooks/useLearningProgress";
import { useSpeech } from "@/hooks/useSpeech";
import { getActionStatus, statusKeys } from "@/lib/action-status";
import { getParagraphIndex, getParagraphStartOffset, getSentencePosition } from "@/lib/progress";

import { AnswerPanel } from "./components/AnswerPanel";
import { FeedbackPanel } from "./components/FeedbackPanel";
import { CourseDirectory } from "./components/CourseDirectory";
import { LearningDialoguePanel } from "./components/LearningDialoguePanel";
import { QuestionPanel } from "./components/QuestionPanel";
import { ReaderPanel } from "./components/ReaderPanel";
import { Sidebar } from "./components/Sidebar";

const initialAnswer = {
  status: appCopy.answerStates.ready,
  body: appCopy.messages.initialAnswer,
  source: ""
};

const guidedReadingEvent = "aita:guided-reading-changed";

function subscribeGuidedReading(callback) {
  window.addEventListener("storage", callback);
  window.addEventListener(guidedReadingEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(guidedReadingEvent, callback);
  };
}

function getGuidedReadingSnapshot() {
  try {
    return window.localStorage.getItem(appConfig.storageKeys.guidedReading) === "true";
  } catch {
    return false;
  }
}

export function AitaMvp({ pageMode = "all" }) {
  const course = useCourse();
  const searchParams = useSearchParams();
  if (course.loading || course.error) return <><AppHeader /><CourseStatus /></>;
  if (!course.materials.length) return <><AppHeader /><p className="px-5 py-6 lg:ml-[248px]">No readable material is available for this course.</p></>;
  return <AitaWorkspace key={`${course.unit.code}:${searchParams.get('item') || ''}`} initialLinkedItem={searchParams.get('item')} {...course} pageMode={pageMode} />;
}

function AitaWorkspace({ initialLinkedItem, unit, materials, units, selectUnit, pageMode }) {
  const router = useRouter();
  const pathname = usePathname();
  const questions = ["What are the different types of hazard?", "What does PPE mean?", "How do I report a hazard?"];
  const { selectedIndex, selectedMaterialId: savedMaterialId, startedCount, progressPercent, startedMaterialIds, speechSegment, speechOffset, speechSentence, markStarted, savePosition } = useLearningProgress(unit.code, materials);
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState([]);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [materialVisible, setMaterialVisible] = useState(false);
  const [answer, setAnswer] = useState(initialAnswer);
  const [feedbackStatus, setFeedbackStatus] = useState(appConfig.feedback.defaultStatus);
  const [feedback, setFeedback] = useState("Select a pre-marked demonstration case to request an explanation.");
  const [autoSpeak, setAutoSpeak] = useState(true);
  const storedGuidedReading = useSyncExternalStore(
    subscribeGuidedReading,
    getGuidedReadingSnapshot,
    () => false
  );
  const [guidedReadingOverride, setGuidedReadingOverride] = useState(null);
  const guidedReading = guidedReadingOverride ?? storedGuidedReading;
  const [guidedMessage, setGuidedMessage] = useState("");
  const [guidedAnswerVisible, setGuidedAnswerVisible] = useState(false);
  const autoReadNextIdRef = useRef(null);
  const guidedReadingRef = useRef(false);
  const guidedRequest = useRef(0);
  const selectedMaterialPlayRef = useRef(null);
  const { activeSpeechId, isListening, listen, speak, stop, stopListening, getSpeechVersion, toggleSpeech } = useSpeech();
  guidedReadingRef.current = guidedReading;
  const answerRequest = useRef(0);
  useEffect(() => () => {
    answerRequest.current += 1;
    guidedRequest.current += 1;
  }, [pageMode]);
  const [panelStatuses, setPanelStatuses] = useState({
    material: statusKeys.idle,
    voice: statusKeys.idle,
    answer: statusKeys.idle,
    feedback: statusKeys.idle
  });

  const [loadedMaterial, setLoadedMaterial] = useState(null);
  const [materialError, setMaterialError] = useState("");
  const [materialAttempt, setMaterialAttempt] = useState(0);
  const [linkedItem, setLinkedItem] = useState(initialLinkedItem);
  const linkedIndex = materials.findIndex(item => item.id === linkedItem);
  const visibleIndex = linkedIndex >= 0 ? linkedIndex : selectedIndex;
  const selected = materials[visibleIndex];
  const currentMaterial = loadedMaterial?.id === selected.id ? loadedMaterial : null;
  useEffect(() => {
    const controller = new AbortController();
    requestAita('material', { unit_code: unit.code, item_id: selected.id }, controller.signal)
      .then(result => { if (!controller.signal.aborted) { setLoadedMaterial(materialForView(result)); setMaterialError(''); } })
      .catch(error => { if (!controller.signal.aborted) setMaterialError(error.message); });
    return () => controller.abort();
  }, [selected.id, unit.code, materialAttempt]);
  useEffect(() => {
    if (!autoReadNextIdRef.current || currentMaterial?.id !== autoReadNextIdRef.current) return;
    autoReadNextIdRef.current = null;
    const timer = window.setTimeout(() => {
      selectedMaterialPlayRef.current?.();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [currentMaterial?.id]);
  const feedbackRequest = useRef(0);
  useEffect(() => () => { feedbackRequest.current += 1; }, []);
  const statusCopy = appCopy.actionStatuses;
  const materialStatus = getActionStatus(
    [appConfig.speech.targets.material, appConfig.speech.targets.guidedPrompt].includes(activeSpeechId)
      ? statusKeys.speaking : panelStatuses.material,
    statusCopy
  );
  const voiceInputStatus = getActionStatus(isListening ? statusKeys.listening : panelStatuses.voice, statusCopy);
  const answerStatus = getActionStatus(
    activeSpeechId === appConfig.speech.targets.answer ? statusKeys.speaking : panelStatuses.answer,
    statusCopy
  );
  const feedbackAudioStatus = getActionStatus(
    activeSpeechId === appConfig.speech.targets.feedback ? statusKeys.speaking : panelStatuses.feedback,
    statusCopy
  );

  function selectMaterial(index) {

    stop();
    answerRequest.current += 1;
    if (!materials[index]) return;
    const alreadySavedSelection = linkedIndex < 0 && materials[index].id === savedMaterialId;
    setMaterialError("");
    setLinkedItem(null);
    setQuestion("");
    autoReadNextIdRef.current = null;
    setGuidedAnswerVisible(false);
    setGuidedMessage("");
    guidedRequest.current += 1;
    if (!alreadySavedSelection) markStarted(materials[index].id);
    if (initialLinkedItem) router.replace(pathname);
    updatePanelStatus("material", statusKeys.idle);
  }

  function updatePanelStatus(panel, status) {
    setPanelStatuses((currentStatuses) => ({ ...currentStatuses, [panel]: status }));
  }

  function setGuidedMode(enabled) {
    setGuidedReadingOverride(enabled);
    try {
      window.localStorage.setItem(appConfig.storageKeys.guidedReading, String(enabled));
      window.dispatchEvent(new Event(guidedReadingEvent));
    } catch { /* Settings may be unavailable in a restricted browser session. */ }
    setGuidedMessage(enabled
      ? "Guided reading is on. Select Read to start; Aita listens only after a topic finishes."
      : "Guided reading is off. You control when to move on.");
    if (!enabled) {
      autoReadNextIdRef.current = null;
      if (isListening) stopListening();
    }
  }

  async function makeGuidedRecap(item) {
    try {
      const result = await requestAita("ask", {
        question: `Give a brief one-sentence recap of ${item.title} using the course material.`,
        unit_code: unit.code,
        near_sequence: item.sequence
      });
      const view = explanationForView(result);
      if (view.canSpeak) return view.body;
    } catch { /* Fall back to a sentence from the source material. */ }
    const firstParagraph = item.text?.[0]?.trim() || "";
    return firstParagraph.match(/[^.!?]+[.!?]/)?.[0]?.trim() || item.title;
  }

  function listenForGuidedResponse(nextIndex, afterAnswer = false) {
    if (!guidedReadingRef.current) return;
    setGuidedMessage("Listening briefly. If you say nothing, Aita will continue automatically.");
    listen(
      (transcript) => handleGuidedTranscript(transcript, nextIndex, afterAnswer),
      () => setGuidedMessage("Voice input is unavailable. Use Continue to next topic when you are ready."),
      (error) => {
        if (error?.error === "no-speech") moveToNextTopic(nextIndex);
        else setGuidedMessage("Aita could not hear you. Use Continue to next topic or try the microphone again.");
      }
    );
  }

  function moveToNextTopic(nextIndex) {
    if (!guidedReadingRef.current) return;
    const next = materials[nextIndex];
    if (!next) {
      setGuidedMessage("You have reached the end of this unit. Choose another topic whenever you are ready.");
      return;
    }
    setGuidedMessage(`Great. Moving on to ${next.title}.`);
    setConversation((messages) => [...messages, { role: "assistant", text: `Great, let's move on to ${next.title}.` }]);
    const didSpeak = speak(appConfig.speech.targets.guidedPrompt, `Great, let's move on to ${next.title}.`, undefined, () => {
      if (!guidedReadingRef.current) return;
      selectMaterial(nextIndex);
      autoReadNextIdRef.current = next.id;
    });
    if (!didSpeak) setGuidedMessage("Speech is unavailable. Select the next topic when you are ready.");
  }

  function startContinuePrompt(nextIndex) {
    if (!guidedReadingRef.current) return;
    const next = materials[nextIndex];
    if (!next) {
      setGuidedMessage("That was the last topic in this unit. You can choose another topic or ask Aita a question.");
      return;
    }
    const prompt = `Would you like me to continue to ${next.title}? Say no to pause. If I hear nothing, I will continue in a few seconds.`;
    setConversation((messages) => [...messages, { role: "assistant", text: prompt }]);
    const didSpeak = speak(appConfig.speech.targets.guidedPrompt, prompt, undefined, () => {
      listenForGuidedResponse(nextIndex, true);
    });
    if (!didSpeak) setGuidedMessage("Speech is unavailable. Use Continue to next topic when you are ready.");
  }

  function handleGuidedTranscript(transcript, nextIndex, afterAnswer = false) {
    const clean = transcript.trim();
    const command = clean.toLowerCase().replace(/[.!?]+$/g, "").trim();
    if (!clean) {
      moveToNextTopic(nextIndex);
      return;
    }
    if (afterAnswer && /^(no|no thanks|not now|pause|stop)$/.test(command)) {
      setGuidedMessage("Paused. Continue reading whenever you are ready.");
      return;
    }
    if (/^(no|no thanks|no questions|continue|next|go ahead|keep going|move on|yes|yeah|yep|sure|okay|ok)$/.test(command)) {
      if (!afterAnswer && /^(yes|yeah|yep)$/.test(command)) {
        setGuidedMessage("Go ahead and ask your question.");
        listenForGuidedResponse(nextIndex, false);
        return;
      }
      moveToNextTopic(nextIndex);
      return;
    }
    setQuestion(clean);
    setGuidedAnswerVisible(true);
    setGuidedMessage("Aita is finding an answer in your course material.");
    askQuestion(clean, nextIndex);
  }

  async function startGuidedCheck(item, itemIndex) {
    if (!guidedReadingRef.current) return;
    const request = ++guidedRequest.current;
    setGuidedMessage("Preparing a short recap from your course material.");
    const recap = await makeGuidedRecap(item);
    if (!guidedReadingRef.current || request !== guidedRequest.current) return;
    const next = materials[itemIndex + 1];
    const prompt = next
      ? `Quick recap: ${recap} Do you have a question? If not, stay quiet and I will continue to ${next.title} in a few seconds.`
      : `Quick recap: ${recap} This was the last topic. Ask a question if you would like help reviewing it.`;
    setConversation((messages) => [...messages, { role: "assistant", text: prompt }]);
    setGuidedMessage("Aita will read a recap, then listen briefly for a question.");
    const didSpeak = speak(appConfig.speech.targets.guidedPrompt, prompt, undefined, () => {
      if (guidedReadingRef.current) listenForGuidedResponse(itemIndex + 1, false);
    });
    if (!didSpeak) setGuidedMessage("Speech is unavailable. You can choose another topic from the list.");
  }

  function toggleMaterialAudio(fromBeginning = false) {
    if (activeSpeechId === appConfig.speech.targets.guidedPrompt) {
      stop();
      updatePanelStatus("material", statusKeys.stopped);
      return;
    }
    if (!currentMaterial) return;
    setMaterialVisible(true);
    const wasSpeaking = !fromBeginning && activeSpeechId === appConfig.speech.targets.material;
    const narration = currentMaterial.text.join(" ");
    const resumeOffset = !fromBeginning && visibleIndex === selectedIndex
      ? speechOffset ?? getParagraphStartOffset(currentMaterial.text, speechSegment)
      : 0;
    const start = Math.min(resumeOffset, Math.max(0, narration.length - 1));
    const text = narration.slice(start);
    const onBoundary = event => {
      if (typeof event.charIndex !== 'number') return;
      const position = Math.min(start + event.charIndex, narration.length);
      const sentencePosition = getSentencePosition(narration, position);
      savePosition(currentMaterial.id, getParagraphIndex(currentMaterial.text, position), sentencePosition.offset, sentencePosition.sentence);
    };
    const onEnd = () => {
      if (guidedReadingRef.current) startGuidedCheck(currentMaterial, visibleIndex);
    };
    const didSpeak = fromBeginning
      ? speak(appConfig.speech.targets.material, text, onBoundary, onEnd)
      : toggleSpeech(appConfig.speech.targets.material, text, onBoundary, onEnd);
    if (!didSpeak) { updatePanelStatus('material', statusKeys.noTts); return; }
    if (!wasSpeaking) {
      const sentencePosition = getSentencePosition(narration, start);
      savePosition(currentMaterial.id, getParagraphIndex(currentMaterial.text, start), sentencePosition.offset, sentencePosition.sentence);
    }
    updatePanelStatus('material', wasSpeaking ? statusKeys.stopped : statusKeys.idle);
  }

  async function askQuestion(nextQuestion = question, guidedNextIndex = null) {
    const cleanQuestion = nextQuestion.trim();
    if (!cleanQuestion) {
      updatePanelStatus("answer", statusKeys.idle);
      setAnswer({ status: appCopy.answerStates.waiting, body: appCopy.messages.emptyQuestion, source: "" });
      return;
    }
    stop();
    const request = ++answerRequest.current;
    if (pageMode === "learn") setConversation((messages) => [...messages, { role: "user", text: cleanQuestion }]);
    const speechVersion = getSpeechVersion();
    updatePanelStatus("answer", statusKeys.thinking);

    try {
      const result = await requestAita('ask', { question: cleanQuestion, unit_code: unit.code, near_sequence: materials[visibleIndex]?.sequence ?? selected.sequence });
      if (request !== answerRequest.current) return;
      const view = explanationForView(result);
      setAnswer(view);
      if (pageMode === "learn" || guidedNextIndex !== null) setGuidedAnswerVisible(true);
      if (pageMode === "learn") setConversation((messages) => [...messages, { role: "assistant", text: view.body }]);
      updatePanelStatus('answer', result.model_error ? statusKeys.answerError : ['abstain', 'refused_assessment'].includes(result.grounding) ? statusKeys.unsupported : statusKeys.answered);
      const shouldSpeak = guidedNextIndex !== null || autoSpeak;
      if (view.canSpeak && shouldSpeak && speechVersion === getSpeechVersion()) {
        const onEnd = guidedNextIndex === null ? undefined : () => startContinuePrompt(guidedNextIndex);
        const didSpeak = speak(appConfig.speech.targets.answer, view.body, undefined, onEnd);
        if (!didSpeak) updatePanelStatus('answer', statusKeys.noTts);
      } else if (guidedNextIndex !== null) {
        setGuidedMessage("The answer is shown below. Use Continue to next topic when you are ready.");
      }
    } catch {
      if (request !== answerRequest.current) return;
      updatePanelStatus("answer", statusKeys.networkError);
      setAnswer({ status: appCopy.answerStates.voiceError, body: appCopy.messages.networkError, source: "" });
      if (pageMode === "learn") {
        setGuidedAnswerVisible(true);
        setConversation((messages) => [...messages, { role: "assistant", text: appCopy.messages.networkError }]);
      }
      if (guidedNextIndex !== null) setGuidedMessage("I could not get an answer. Use Continue to next topic when you are ready.");
    }
  }

  function addDialogueTurn(userText, assistantText) {
    setGuidedAnswerVisible(false);
    setConversation((messages) => [...messages, { role: "user", text: userText }, { role: "assistant", text: assistantText }]);
  }

  function handleDialogueInput(rawInput) {
    const clean = rawInput.trim();
    if (!clean) return;
    setQuestion("");
    const lower = clean.toLowerCase();

    if (/^(hi|hello|hey|hiya|greetings|good morning|good afternoon|good evening)(?: aita)?[!. ]*$/i.test(clean)) {
      addDialogueTurn(clean, "Hi! I can continue reading from your saved sentence, read or pause a topic, answer questions about your course, move to another topic, or explain assessment feedback. Tell me what you would like to do, or use the microphone to speak.");
      return;
    }

    const assessmentIntent = /\b(assessment|feedback|explain (my )?(result|score)|marking)\b/i.test(clean)
      || /\b(explain|review)\b.*\b(correct|right|incorrect|wrong)\b/i.test(clean)
      || (feedbackVisible && /\b(correct|right|incorrect|wrong)\b/i.test(clean));
    if (assessmentIntent) {
      setFeedbackVisible(true);
      const requestedStatus = /\b(incorrect|wrong)\b/i.test(clean) ? "incorrect" : /\b(correct|right)\b/i.test(clean) ? "correct" : null;
      if (/\b(read|speak|say)\b.*\b(feedback|explanation)\b/i.test(clean) && panelStatuses.feedback === statusKeys.answered) {
        toggleFeedbackAudio();
        addDialogueTurn(clean, "I’ll read the feedback aloud.");
        return;
      }
      if (requestedStatus) changeFeedbackStatus(requestedStatus);
      addDialogueTurn(clean, requestedStatus ? "I’ll explain the selected assessor decision." : "Which demonstration case should I explain: correct or incorrect? Tell me here and I’ll show its feedback.");
      return;
    }

    const courseMatch = units.find((item) => lower.includes(item.unit_code.toLowerCase()) || lower.includes(item.name.toLowerCase()));
    if (courseMatch && /\b(switch|change|open|select|course|unit)\b/.test(lower)) {
      addDialogueTurn(clean, `Switching to ${courseMatch.unit_code}: ${courseMatch.name}.`);
      selectUnit(courseMatch.unit_code);
      return;
    }

    if (/\b(turn|switch|set) guided (reading )?(on|off)\b/i.test(clean)) {
      const enabled = /\bon\b/i.test(clean);
      setGuidedMode(enabled);
      addDialogueTurn(clean, enabled ? "Guided reading is on. I’ll recap each topic and listen briefly for questions before continuing." : "Guided reading is off. Tell me when you’d like to continue.");
      return;
    }

    if (/\b(pause|stop reading|stop talking)\b/.test(lower)) {
      stop();
      if (isListening) stopListening();
      addDialogueTurn(clean, "Paused. Tell me when you’re ready to continue.");
      return;
    }

    const isNext = /\b(next|move on|go to the next|continue to next)\b/.test(lower);
    if (isNext) {
      const nextIndex = visibleIndex + 1;
      const next = materials[nextIndex];
      if (!next) {
        addDialogueTurn(clean, "You’ve reached the end of this course. You can ask a question or choose another course by name.");
        return;
      }
      setMaterialVisible(true);
      selectMaterial(nextIndex);
      autoReadNextIdRef.current = next.id;
      addDialogueTurn(clean, `Moving on to ${next.title}. I’ll continue reading from there.`);
      return;
    }

    const isRepeat = /^\s*(reread|repeat)\s*$/i.test(clean) || /\b(read|start|begin|repeat|reread)\b.*\b(from the beginning|from start|again|over)\b/.test(lower);
    const readIntent = /^(?:(?:please|can you|could you)\s+)?(read|reread|resume|continue|start reading|read this|read aloud|open topic|study)/i.test(clean);
    const requestedTopicIndex = readIntent ? (() => {
      const titleIndex = materials.findIndex((item) => lower.includes(item.title.toLowerCase()));
      if (titleIndex >= 0) return titleIndex;
      const topicNumber = clean.match(/\b(?:topic|chapter|section)\s+(\d+)\b/i)?.[1];
      return topicNumber ? Math.max(0, Math.min(materials.length - 1, Number(topicNumber) - 1)) : -1;
    })() : -1;
    if (isRepeat || readIntent) {
      const targetIndex = requestedTopicIndex >= 0 ? requestedTopicIndex : visibleIndex;
      const target = materials[targetIndex];
      setMaterialVisible(true);
      if (targetIndex !== visibleIndex) selectMaterial(targetIndex);
      if (currentMaterial?.id === target.id && targetIndex === visibleIndex) {
        toggleMaterialAudio(isRepeat);
      } else {
        autoReadNextIdRef.current = target.id;
      }
      addDialogueTurn(clean, isRepeat ? `I’ll reread ${target.title} from the beginning.` : `I’ll continue with ${target.title}.`);
      return;
    }

    setFeedbackVisible(false);
    askQuestion(clean);
  }

  function selectQuestion(exampleQuestion) {
    setQuestion(exampleQuestion);
    askQuestion(exampleQuestion);
  }

  async function handleVoiceTranscript(transcript) {
    if (pageMode === "learn" && guidedReadingRef.current) {
      setGuidedAnswerVisible(true);
      setGuidedMessage("Aita is finding an answer in your course material.");
      askQuestion(transcript, visibleIndex + 1);
      return;
    }

    if (pageMode === "learn") {
      const request = ++answerRequest.current;
      try {
        const result = await requestAita('search', { question: transcript, unit_code: unit.code, near_sequence: selected.sequence });
        if (request !== answerRequest.current) return;
        const nextIndex = materials.findIndex(material => material.id === result.results?.[0]?.item_id);
        if (result.grounding === 'abstain' || nextIndex < 0) { updatePanelStatus('voice', statusKeys.unsupported); return; }
        selectMaterial(nextIndex);
        updatePanelStatus('voice', statusKeys.answered);
      } catch { if (request === answerRequest.current) updatePanelStatus('voice', statusKeys.networkError); }
      return;
    }

    if (pageMode === "assessment") {
      const lowerTranscript = transcript.toLowerCase();
      const nextStatus = lowerTranscript.includes("incorrect") || lowerTranscript.includes("wrong") ? "incorrect" : lowerTranscript.includes("correct") || lowerTranscript.includes("right") ? "correct" : null;
      if (nextStatus) {
        changeFeedbackStatus(nextStatus);
        updatePanelStatus("voice", statusKeys.answered);
      } else {
        updatePanelStatus("voice", statusKeys.unsupported);
      }
      return;
    }

    updatePanelStatus("voice", statusKeys.answered);
    setQuestion(transcript);
    askQuestion(transcript);
  }

  function startVoiceInput() {
    updatePanelStatus("voice", statusKeys.idle);
    listen(
      (transcript) => {
        handleVoiceTranscript(transcript);
      },
      () => {
        updatePanelStatus("voice", statusKeys.noVoice);
        setAnswer({ status: appCopy.answerStates.noVoice, body: appCopy.messages.noVoice, source: "" });
      },
      () => {
        updatePanelStatus("voice", statusKeys.voiceError);
        setAnswer({ status: appCopy.answerStates.voiceError, body: appCopy.messages.voiceError, source: "" });
      }
    );
  }

  async function changeFeedbackStatus(nextStatus) {
    stop();
    const request = ++feedbackRequest.current;
    setFeedbackStatus(nextStatus);
    setFeedback('Loading the pre-marked demonstration case…');
    updatePanelStatus('feedback', statusKeys.thinking);
    try {
      const result = await requestAita('feedback', { case_id: nextStatus });
      if (request !== feedbackRequest.current) return;
      const view = explanationForView(result);
      setFeedback(`${result.demo_notice} ${view.body}${view.source ? ` Source: ${view.source}` : ''}`);
      if (pageMode === "learn") setConversation((messages) => [...messages, { role: "assistant", text: `${result.demo_notice} ${view.body}${view.source ? ` Source: ${view.source}` : ''}` }]);
      updatePanelStatus('feedback', result.model_error ? statusKeys.answerError : statusKeys.answered);
    } catch (error) {
      if (request !== feedbackRequest.current) return;
      setFeedback(error.message);
      updatePanelStatus('feedback', statusKeys.networkError);
    }
  }

  function toggleFeedbackAudio() {
    const wasSpeaking = activeSpeechId === appConfig.speech.targets.feedback;
    const didSpeak = toggleSpeech(appConfig.speech.targets.feedback, feedback);
    updatePanelStatus('feedback', !didSpeak ? statusKeys.noTts : wasSpeaking ? statusKeys.stopped : statusKeys.idle);
  }

  function toggleAnswerAudio() {
    const wasSpeaking = activeSpeechId === appConfig.speech.targets.answer;
    const didSpeak = toggleSpeech(appConfig.speech.targets.answer, answer.body);
    if (!didSpeak) {
      updatePanelStatus("answer", statusKeys.noTts);
      setAnswer({ status: appCopy.answerStates.noTts, body: appCopy.messages.noTts, source: "" });
      return;
    }

    updatePanelStatus("answer", wasSpeaking ? statusKeys.stopped : statusKeys.idle);
  }

  function continueManually() {
    const nextIndex = visibleIndex + 1;
    const next = materials[nextIndex];
    if (!next) return;
    selectMaterial(nextIndex);
    if (guidedReading) autoReadNextIdRef.current = next.id;
  }

  function toggleVoiceInput() {
    if (isListening) {
      stopListening();
      updatePanelStatus("voice", statusKeys.stopped);
      return;
    }

    startVoiceInput();
  }

  function toggleDialogueVoiceInput() {
    if (isListening) {
      stopListening();
      updatePanelStatus("voice", statusKeys.stopped);
      return;
    }
    updatePanelStatus("voice", statusKeys.idle);
    listen(
      (transcript) => {
        updatePanelStatus("voice", statusKeys.answered);
        handleDialogueInput(transcript);
      },
      () => updatePanelStatus("voice", statusKeys.noVoice),
      () => updatePanelStatus("voice", statusKeys.voiceError)
    );
  }

  selectedMaterialPlayRef.current = toggleMaterialAudio;

  const showReader = pageMode === "all" || pageMode === "learn";
  const showAsk = pageMode === "all" || pageMode === "ask";
  const showAssessment = pageMode === "all" || pageMode === "assessment";
  const showDialogue = pageMode === "learn";
  const showCourseSidebar = showReader && !showDialogue;
  const activePath = pageMode === "learn" ? "/learn" : pageMode === "ask" ? "/ask" : pageMode === "assessment" ? "/assessment" : "/";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <AppHeader activePath={activePath} />
      <main className={`grid grid-cols-1 lg:ml-[248px] ${showDialogue ? "lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]" : showCourseSidebar ? "lg:grid-cols-[280px_minmax(0,1fr)]" : ""}`}>
        {showCourseSidebar ? <Sidebar units={units} onSelectUnit={selectUnit} startedCount={startedCount} isListening={isListening} materials={materials} onSelectMaterial={selectMaterial} onVoiceInput={null} progressPercent={progressPercent} selectedIndex={visibleIndex} unit={unit} voiceStatus={voiceInputStatus} /> : null}
        <div className={showDialogue ? "contents" : `grid w-full gap-4 p-4 lg:p-5 ${showReader && showAsk ? "lg:grid-cols-[minmax(0,1fr)_380px]" : "mx-auto max-w-4xl"}`}>
          {showDialogue ? <div className="order-2 min-w-0 px-4 pb-4 lg:order-1 lg:p-5"><CourseDirectory
            currentIndex={visibleIndex}
            material={currentMaterial}
            materialError={materialError}
            materials={materials}
            progressPercent={progressPercent}
            speechOffset={visibleIndex === selectedIndex ? speechOffset ?? 0 : 0}
            startedCount={startedCount}
            startedMaterialIds={startedMaterialIds}
            unit={unit}
            visible={materialVisible}
          /></div> : null}
          {showDialogue ? <div className="order-1 min-w-0 px-4 pt-4 lg:order-2 lg:p-5"><LearningDialoguePanel
            answer={answer}
            answerAudioStatus={answerStatus}
            answerIsSpeaking={activeSpeechId === appConfig.speech.targets.answer}
            answerLoading={panelStatuses.answer === statusKeys.thinking}
            answerVisible={guidedAnswerVisible}
            conversation={conversation}
            feedbackProps={{ audioStatus: feedbackAudioStatus, feedback, feedbackStatus, isListening, isSpeaking: activeSpeechId === appConfig.speech.targets.feedback, onStatusChange: changeFeedbackStatus, onToggleAudio: toggleFeedbackAudio, voiceStatus: voiceInputStatus }}
            feedbackVisible={feedbackVisible}
            isListening={isListening}
            onAsk={handleDialogueInput}
            onQuestionChange={setQuestion}
            onToggleAnswerAudio={toggleAnswerAudio}
            onVoiceQuestion={toggleDialogueVoiceInput}
            question={question}
          /></div> : null}
          {showReader && !showDialogue && currentMaterial ? <ReaderPanel audioStatus={materialStatus} guidedMessage={guidedMessage} guidedReading={guidedReading} isSpeaking={[appConfig.speech.targets.material, appConfig.speech.targets.guidedPrompt].includes(activeSpeechId)} material={currentMaterial} nextTitle={materials[visibleIndex + 1]?.title} onContinue={materials[visibleIndex + 1] ? continueManually : null} onToggleAudio={toggleMaterialAudio} onToggleGuidedReading={setGuidedMode} speechSegment={visibleIndex === selectedIndex ? speechSegment : 0} /> : null}
          {showReader && !showDialogue && !currentMaterial ? <div id="reader" role={materialError ? 'alert' : 'status'} className="rounded-lg bg-white p-5">{materialError || 'Loading material…'}{materialError ? <button className="ml-3 underline" onClick={() => { setMaterialError(''); setMaterialAttempt(value => value + 1); }}>Retry</button> : null}</div> : null}
          {showReader && !showDialogue && currentMaterial ? <p className="text-sm text-slate-600">This prototype includes readable text. Image-only slides are not included.</p> : null}
          {showAsk || showAssessment ? <section className="grid content-start gap-4" aria-label="Aita feature workspace">
            {showAsk ? <><QuestionPanel autoSpeak={autoSpeak} isListening={isListening} onQuestionChange={setQuestion} onSelectQuestion={selectQuestion} onSubmitQuestion={() => askQuestion()} onToggleAutoSpeak={setAutoSpeak} onVoiceInput={toggleVoiceInput} question={question} questions={questions} voiceStatus={voiceInputStatus} /><AnswerPanel answer={answer} audioStatus={answerStatus} isSpeaking={activeSpeechId === appConfig.speech.targets.answer} onToggleAudio={toggleAnswerAudio} /></> : null}
            {showAssessment ? <FeedbackPanel audioStatus={feedbackAudioStatus} feedback={feedback} feedbackStatus={feedbackStatus} isListening={isListening} isSpeaking={activeSpeechId === appConfig.speech.targets.feedback} onStatusChange={changeFeedbackStatus} onToggleAudio={toggleFeedbackAudio} onVoiceInput={pageMode === "assessment" ? toggleVoiceInput : null} voiceStatus={voiceInputStatus} /> : null}
          </section> : null}
        </div>
      </main>
    </div>
  );
}
