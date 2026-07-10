# Versioning Policy

The protocol repository follows Semantic Versioning because producers and
consumers depend on its compatibility mechanically.

`schemaVersion` is the incompatible wire-contract major. A consumer that does
not support a schema version must reject it. Version 1 rejects unknown fields,
so adding a new field, enum value, loader, source kind, target, or changed default
requires a new schema version rather than a silent additive edit.

Patch releases may clarify prose, improve fixtures, or fix tooling without
changing which manifests are valid. A minor protocol release may add tooling or
non-normative guidance while preserving all v1 validation and fingerprinting.
Published tags and fixture expectations are immutable.

`manifestVersion` belongs to an individual server manifest. It is a restricted
opaque revision token, compared only for equality, and must change for every
desired-state update. It is not the protocol version and does not use protocol
compatibility rules.

Desktop applications and server plugins version their products independently.
They may use Romantic Versioning, Semantic Versioning, or another documented
scheme without changing the protocol contract.
