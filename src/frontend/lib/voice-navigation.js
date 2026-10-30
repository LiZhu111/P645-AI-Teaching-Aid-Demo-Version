const navigationCommands = [
  { route: "/learn", words: ["learn", "lesson", "material", "study", "topic"] },
  { route: "/profile", words: ["profile", "progress", "account"] },
  { route: "/learn", words: ["home", "menu", "dashboard"] }
];

export function getNavigationTarget(transcript) {
  const words = transcript.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  return navigationCommands.find((command) => command.words.some((word) => words.includes(word)))?.route || null;
}
