<div align="center">
  <h1>Minecraft Setup Protocol</h1>
  <p>The language-neutral contract between Minecraft setup publishers and client setup managers.</p>
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

Version 1 consists of four normative parts:

| Artifact | Purpose |
| --- | --- |
| [`schema/v1/manifest.schema.json`](schema/v1/manifest.schema.json) | Structural JSON Schema 2020-12 contract |
| [`spec/v1/manifest.md`](spec/v1/manifest.md) | Semantic validation and resource behavior |
| [`spec/v1/canonicalization.md`](spec/v1/canonicalization.md) | Normalization and stable fingerprints |
| [`spec/v1/http.md`](spec/v1/http.md) | Discovery and publication over HTTPS |

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

## Development

```bash
npm ci
npm test
npm run validate
```

The protocol itself follows Semantic Versioning because implementations consume
it mechanically. Application and plugin product versions are independent; see
the [versioning policy](spec/versioning.md).

## License

Minecraft Setup Protocol is available under the [MIT License](LICENSE).
