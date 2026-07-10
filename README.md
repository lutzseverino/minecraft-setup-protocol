<div align="center">
  <h1>Minecraft Setup Protocol</h1>
  <p>The language-neutral contract between Minecraft setup publishers and client setup managers.</p>

  [![CI](https://github.com/lutzseverino/minecraft-setup-protocol/actions/workflows/ci.yml/badge.svg)](https://github.com/lutzseverino/minecraft-setup-protocol/actions/workflows/ci.yml)
  [![Releases](https://img.shields.io/github/v/release/lutzseverino/minecraft-setup-protocol?include_prereleases)](https://github.com/lutzseverino/minecraft-setup-protocol/releases)
  [![License: MIT](https://img.shields.io/badge/license-MIT-2f3437)](LICENSE)
</div>

Minecraft Setup Protocol defines the declarative document a server publishes to
describe its desired client setup. It is independently owned so a desktop app,
Paper plugin, static generator, or another implementation can conform without
depending on another product's internal models.

The protocol never carries commands or scripts. A manifest may describe a
Minecraft version, loader, setup profiles, managed resources, launcher display
names, and a multiplayer server entry. The client remains responsible for how
those requests are reviewed and safely applied.

## Protocol V1

Version 1 is defined by these normative artifacts:

| Artifact | Purpose |
| --- | --- |
| [`schema/v1/manifest.schema.json`](schema/v1/manifest.schema.json) | Structural JSON Schema 2020-12 contract |
| [`schema/v1/attestation-request.schema.json`](schema/v1/attestation-request.schema.json) | Setup attestation request contract |
| [`schema/v1/attestation-response.schema.json`](schema/v1/attestation-response.schema.json) | Successful attestation response contract |
| [`schema/v1/problem.schema.json`](schema/v1/problem.schema.json) | Machine-readable protocol error contract |
| [`spec/v1/manifest.md`](spec/v1/manifest.md) | Semantic validation and resource behavior |
| [`spec/v1/canonicalization.md`](spec/v1/canonicalization.md) | Normalization and stable fingerprints |
| [`spec/v1/http.md`](spec/v1/http.md) | Discovery and publication over HTTPS |
| [`spec/v1/attestation.md`](spec/v1/attestation.md) | Optional setup challenge and attestation exchange |

The fixtures under [`fixtures/v1`](fixtures/v1) are executable conformance
examples. Their catalog records whether each document is valid, the expected
error code for invalid documents, and golden fingerprints for valid documents.

## Implementations

A conforming producer must validate the final manifest bytes before publishing
them. It should generate immutable, hash-pinned resources rather than resolving
moving versions for every client request.

A conforming consumer must perform both schema and semantic validation before
saving, previewing, or applying a manifest. Accepting a document does not mean a
consumer must support every requested setup action; unsupported work must fail
closed rather than produce a partial successful setup.

The JavaScript modules in [`src`](src) are a reference validator and
canonicalizer for this repository's fixtures. They are not a runtime dependency
or privileged implementation of the protocol.

The optional attestation exchange lets a server ask a player to run the setup
manager before joining. It is a workflow signal, not remote proof that the
player's files remain unchanged. Servers needing a trusted client handshake
must use a separately reviewed client component.

## Development

```bash
npm ci
npm test
npm run validate
```

## Documentation

Start with the [documentation index](docs/README.md). The repository's versioning
policy and compatibility expectations are documented in the
[versioning reference](docs/reference/versioning.md).

## License

Minecraft Setup Protocol is available under the [MIT License](LICENSE).
