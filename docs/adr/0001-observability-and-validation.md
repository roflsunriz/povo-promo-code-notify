# ADR 0001: Observability and IPC Validation

## Status

Accepted

## Context

The application handles user inputs through IPC and stores data locally. For production readiness, we need
consistent input validation and structured logs that support troubleshooting without exposing sensitive
data.

## Decision

- Validate all IPC requests in the main process using Zod schemas.
- Emit structured JSON logs with a per-request trace ID.
- Capture unhandled errors to the same log stream for later analysis.

## Consequences

- IPC handlers reject invalid inputs early and return clear errors.
- Logs are available in the user data directory and can be correlated by trace ID.
