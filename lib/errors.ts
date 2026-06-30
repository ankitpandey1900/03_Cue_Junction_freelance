export function formatActionError(
  error: unknown,
  defaultMessage: string = "An unexpected error occurred."
): string {
  // Check if it's a Prisma error (they typically have a .code starting with P)
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string" && error.code.startsWith("P")) {
    switch (error.code) {
      case "P2002":
        return "A record with this data already exists."
      case "P2003":
        return "Cannot complete action because this record is tied to other data (e.g., active sessions or past invoices)."
      case "P2025":
        return "Record not found. It may have been deleted already."
      default:
        // For any other Prisma error, hide the technical details
        return "Database operation failed. Please try again."
    }
  }

  // Handle standard JavaScript Errors (typically thrown by our business logic intentionally)
  if (error instanceof Error) {
    return error.message || defaultMessage
  }

  // Handle string errors
  if (typeof error === "string") {
    return error
  }

  return defaultMessage
}
