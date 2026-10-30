export const statusKeys = {
  idle: "idle",
  listening: "listening",
  speaking: "speaking",
  stopped: "stopped",
  thinking: "thinking",
  answered: "answered",
  unsupported: "unsupported",
  noVoice: "noVoice",
  noTts: "noTts",
  voiceError: "voiceError",
  speechError: "speechError",
  networkError: "networkError",
  answerError: "answerError"
};

export function getActionStatus(key, statusCopy) {
  return statusCopy[key] || statusCopy[statusKeys.idle];
}
