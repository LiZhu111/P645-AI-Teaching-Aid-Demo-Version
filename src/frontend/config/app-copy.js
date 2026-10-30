export const appCopy = {
  appName: "Study Companion",
  appSubtitle: "Learning Demo",
  unitLabel: "Unit",
  progressLabel: "Progress",
  autoReadLabel: "Auto-read answers",
  readerActions: {
    read: "Read",
    stop: "Stop"
  },
  questionPanel: {
    eyebrow: "Ask a question",
    title: "Question",
    listeningButton: "Stop",
    placeholder: "Example: What should I do if I see a hazard?",
    speakQuestionButton: "Speak"
  },
  answerPanel: {
    eyebrow: "Grounded Answer",
    title: "Study companion says",
    readButton: "Read",
    sourceLabel: "Source"
  },
  feedbackPanel: {
    eyebrow: "Assessment Support",
    title: "Feedback",
    readButton: "Read",
    statuses: {
      correct: "Marked correct by assessor",
      incorrect: "Marked incorrect by assessor"
    }
  },
  answerStates: {
    ready: "Ready",
    waiting: "Waiting",
    answered: "Answered",
    unsupported: "Unsupported",
    noTts: "No TTS",
    noVoice: "No voice",
    voiceError: "Voice error"
  },
  messages: {
    initialAnswer: "Select a topic or ask a question. The study companion will use the fictional demo material and show its source.",
    initialFeedback: "This demo explains feedback after a fictional reviewer has marked a sample response. The study companion does not mark answers.",
    emptyQuestion: "Type or speak a question first.",
    unsupportedAnswer:
      "I cannot find support for that in the demo demo course material. Please ask your trainer or assessor for that topic.",
    unsupportedSource: "Boundary: the assistant should not invent answers beyond the supplied demo lesson.",
    noTts: "This browser does not support text-to-speech. Use Chrome or Edge for the MVP demo.",
    noVoice: "This browser does not support speech recognition. Use text input for the MVP demo.",
    voiceError: "Voice input could not be captured. Try typing the question instead.",
    networkError: "the study companion cannot reach the answer service right now. Please check the connection and try again.",
    answerError: "the study companion received something it could not turn into a useful answer. Please try again."
  },
  actionStatuses: {
    idle: {
      tone: "neutral",
      message: "Ready when you are."
    },
    listening: {
      tone: "info",
      message: "I'm listening. Say it like you would to a trainer."
    },
    speaking: {
      tone: "info",
      message: "the study companion is speaking now."
    },
    stopped: {
      tone: "neutral",
      message: "Stopped. Nice and quiet."
    },
    thinking: {
      tone: "info",
      message: "the study companion is thinking... tiny hard hat on."
    },
    answered: {
      tone: "success",
      message: "Answer received and grounded in the demo material."
    },
    unsupported: {
      tone: "warning",
      message: "I could not ground that in the course material."
    },
    noVoice: {
      tone: "warning",
      message: "Voice input is unavailable in this browser."
    },
    noTts: {
      tone: "warning",
      message: "Speech output is unavailable in this browser."
    },
    voiceError: {
      tone: "error",
      message: "I missed that one. Please try speaking again."
    },
    speechError: {
      tone: "error",
      message: "Speech playback failed. The browser had a wobble."
    },
    networkError: {
      tone: "error",
      message: "Network connection failed. the study companion cannot reach the answer service."
    },
    answerError: {
      tone: "error",
      message: "the study companion could not receive a usable answer."
    }
  }
};
