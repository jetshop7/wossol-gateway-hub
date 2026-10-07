export function duplicateClientUserEmailMessage(error: unknown): string | null {
  if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002")
    return "That email is already assigned to a Client User.";
  return null;
}
