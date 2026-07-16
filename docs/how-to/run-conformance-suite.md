# Run The Conformance Suite

Validate the reference implementation and every shared fixture.

## Steps

Install Node.js 24 and npm 11.6.2, then run:

```bash
npm ci
npm run check
```

## Verification

The check reports no formatting, lint, or test failures and prints the number of
valid and invalid protocol fixtures it validated.
