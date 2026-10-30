export function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export function validateRegistration({ name, email, password, confirmPassword }) {
  if (!name.trim()) return "Please enter your name.";
  if (!normalizeEmail(email)) return "Please enter your email and password.";
  if (password.length < 6) return "Your password must contain at least 6 characters.";
  if (password !== confirmPassword) return "The passwords do not match.";
  return "";
}

export function createMockUser({ name, email, password }) {
  return { name: name.trim(), email: normalizeEmail(email), password, role: "Learner" };
}

export function matchesMockCredentials(user, { email, password }) {
  return Boolean(user) && user.email === normalizeEmail(email) && user.password === password;
}
