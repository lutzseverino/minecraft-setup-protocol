# Run The Conformance Suite

Validate the reference implementation and every shared fixture.

## Steps

Install Node.js 22, then run:

```bash
npm ci
npm test
npm run validate
```

## Verification

The test command reports no failures. The validation command reports the number
of valid and invalid protocol fixtures it checked.

