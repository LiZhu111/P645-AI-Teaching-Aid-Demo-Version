export const appConfig = {
  storageKeys: {
    selectedMaterial: "aita:selectedMaterial",
    guidedReading: "aita:guidedReading",
    registeredUser: "aita:registeredUser",
    loggedInUser: "aita:loggedInUser"
  },
  speech: {
    language: "en-AU",
    rate: 0.92,
    maxAlternatives: 1,
    targets: {
      material: "material",
      answer: "answer",
      feedback: "feedback",
      guidedPrompt: "guided-prompt"
    }
  },
  answerSimulation: {
    thinkingDelayMs: 350
  },
  feedback: {
    defaultStatus: "correct",
    statuses: ["correct", "incorrect"]
  }
};
