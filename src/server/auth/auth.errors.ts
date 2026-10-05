export class AuthenticationError extends Error {
  readonly code = "AUTHENTICATION_FAILED";
}

export class AuthorizationError extends Error {
  readonly code = "FORBIDDEN";
}

export class InvalidCsrfError extends Error {
  readonly code = "CSRF_REQUIRED";
}
