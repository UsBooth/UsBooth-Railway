export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validateRegistration(input: {
  email: string;
  password: string;
  displayName: string;
}) {
  const email = normalizeEmail(input.email);
  const displayName = input.displayName.trim();

  if (!email || !email.includes("@") || email.length > 254) {
    return "Enter a valid email address.";
  }

  if (displayName.length < 2 || displayName.length > 80) {
    return "Display name must be between 2 and 80 characters.";
  }

  if (input.password.length < 8 || input.password.length > 128) {
    return "Password must be between 8 and 128 characters.";
  }

  return null;
}

