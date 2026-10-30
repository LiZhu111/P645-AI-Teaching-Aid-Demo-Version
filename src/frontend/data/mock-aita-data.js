export const mockUnit = {
  code: "DEMO101",
  name: "Workshop Safety Basics",
  label: "Demo course"
};

export const mockLearner = {
  name: "Demo Learner",
  email: "learner@example.invalid",
  role: "Learner",
  joined: "Demo account"
};

export const mockProgress = { completedMaterialIds: ["demo-start"] };

export const mockMaterials = [
  { id: "DEMO101:PC:1", criterion: "Criterion 1.1", sequence: 1, title: "Getting Started", summary: "Check a shared work area", text: ["Before beginning a shared activity, pause and look around the work area. Check that the space is clear, the equipment appears undamaged, and the instructions are available.", "If something is unclear, ask the person leading the activity before continuing."], keywords: ["check", "equipment", "instructions"] },
  { id: "DEMO101:PC:2", criterion: "Criterion 1.1", sequence: 2, title: "Spotting a Concern", summary: "Notice and share a concern", text: ["A concern is a condition that could make an activity unsafe or difficult. Examples include a blocked walkway, a loose cable, or damaged equipment.", "Keep a safe distance and tell the activity lead what you noticed."], keywords: ["concern", "report", "equipment"] },
  { id: "DEMO101:PC:3", criterion: "Criterion 1.2", sequence: 3, title: "Choosing a Next Step", summary: "Follow an agreed control", text: ["A simple control can reduce the chance of harm. The activity lead may clear the area, replace equipment, or explain a safer method.", "Follow the agreed instructions and check that the concern has been addressed before work resumes."], keywords: ["control", "instructions", "safe"] }
];

export const mockQuestions = [
  "What should I check before using shared equipment?",
  "What should I do if I notice a concern?",
  "Why should I follow the agreed instructions?"
];

export const mockFeedback = {
  correct: "Demonstration: the sample response was marked correct by a fictional reviewer. The main point is to check the equipment and follow the instructions.",
  incorrect: "Demonstration: the sample response was marked incorrect by a fictional reviewer. Review the lesson and focus on checking the equipment before use. The application does not assign marks."
};
