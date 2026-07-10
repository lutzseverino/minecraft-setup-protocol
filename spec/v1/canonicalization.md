# Canonicalization V1

Canonicalization provides stable desired-state fingerprints across languages.
It is separate from a digest of published bytes: HTTP signatures and integrity
metadata may cover the exact representation, while this fingerprint identifies
the normalized manifest model.

## Normalization

After schema and semantic validation, an implementation MUST create a normalized
copy with these rules:

1. Insert `includesShaders: false` when absent.
2. Insert `required: false`, `profiles: []`, and `hashes: {}` when absent.
3. Sort each resource's `profiles` array in ascending ASCII order.
4. Convert SHA-256 and SHA-512 text to lowercase.
5. Preserve the order of the root `profiles` and `resources` arrays.
6. Omit absent optional properties. Do not insert `null`.
7. Preserve all other values exactly after required NFC normalization.

The normalized model is serialized using the JSON Canonicalization Scheme from
RFC 8785. Its UTF-8 bytes are hashed with SHA-256 and formatted as:

```text
msm-v1-sha256:<64 lowercase hexadecimal characters>
```

The algorithm prefix is part of the fingerprint. Implementations MUST NOT treat
legacy unprefixed or differently prefixed digests as the same algorithm.

Golden fingerprints live in `fixtures/v1/catalog.json`. Every implementation
must reproduce them before claiming fingerprint conformance.

## Signing

Protocol v1 does not yet define a trust bootstrap or signature envelope. A future
signing specification should sign exact canonical manifest bytes and identify
its algorithm independently from this desired-state fingerprint. Adding signing
must not permit untrusted manifest fields or arbitrary executable content.
