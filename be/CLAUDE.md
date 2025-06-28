# Development Guidelines

## API Handler Body Parameter

Always use `{}` destructuring assignment for the body parameter in API handlers instead of `_body`:

```typescript
// ✅ Correct
export const apiHandler: ApiHandler<"apiName"> = async ({}, req) => {
  // Use {} destructuring assignment for body
};

// ❌ Incorrect
export const apiHandler: ApiHandler<"apiName"> = async (_body, req) => {
  // Don't use _body
};
```

The body parameter must always use `{}` destructuring assignment to maintain consistency across all API handlers.

## Development Process Guidelines

**IMPORTANT**: When encountering technical limitations or errors:
- **STOP immediately** and inform the user about the limitation
- **DO NOT** continue development with workarounds without user approval
- **ASK** the user how they want to proceed before making compromises
- **NEVER** silently switch to suboptimal solutions

Example: If a schema generator doesn't support nested objects, stop and ask:
"The schema generator doesn't support nested objects. Should I use JSON strings instead, or would you prefer a different approach?"