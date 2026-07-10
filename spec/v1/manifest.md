# Manifest Semantics V1

This document defines rules that are normative but cannot be expressed fully by
JSON Schema. The key words MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY describe
protocol requirements.

## Document Rules

The document MUST be UTF-8 JSON as defined by RFC 8259 and MUST satisfy
`schema/v1/manifest.schema.json`. Duplicate object keys and explicit `null`
values MUST be rejected. Every string MUST use Unicode NFC normalization.

`schemaVersion` MUST be `1`. `manifestVersion` is an opaque display revision and
MUST change whenever desired setup state changes. Consumers MUST still compare a
fingerprint of the complete normalized document because a producer may forget
to change the display revision.

Manifest, profile, and resource IDs are ownership identifiers. They MUST remain
stable while the represented concept remains the same. Profile IDs and resource
IDs MUST each be unique within their arrays.

The first profile is the default for a newly saved server. Profile order is
therefore significant. Resource order is significant for review presentation,
but not permission to overwrite another resource's destination.

## Server Identity

`server.address` is the canonical playable Minecraft endpoint requested by the
manifest. It may differ from a discovery alias or from a direct manifest URL,
but the client MUST show it before applying the setup.

`displayName` names the setup throughout the manager. `server.name` names the
playable endpoint. `serverEntry`, when present, is the exact launcher multiplayer
entry to create or update and may intentionally use another proxy address.

## Profiles And Resources

An empty resource `profiles` array selects the resource for every profile.
Otherwise, every listed profile ID MUST exist and the resource is selected only
for those profiles. Duplicate profile references are invalid.

Every selected resource is mandatory desired state for the chosen profile. The
`required` flag is presentation metadata that distinguishes core resources from
profile extras; it does not make installation optional.

Every resource MUST provide an explicit portable `fileName`. The name MUST:

- use NFC and occupy no more than 200 UTF-8 bytes;
- contain no control characters or `< > : " / \\ | ? *`;
- have no leading or trailing whitespace and no trailing period;
- not be `.`, `..`, `CON`, `PRN`, `AUX`, `NUL`, `COM1` through `COM9`, or
  `LPT1` through `LPT9`, including those names followed by an extension.

The pair `(target, case-folded fileName)` MUST be globally unique across the
whole manifest, including resources assigned to disjoint profiles. This keeps
profile changes installable without transferring ownership between resource IDs.

Resource types and targets MUST correspond:

| Resource type | Target directory |
| --- | --- |
| `mod` | `mods` |
| `resource_pack` | `resourcepacks` |
| `shader_pack` | `shaderpacks` |
| `config` | `config` |

A manifest using loader `none` MUST NOT contain mod resources.

## Direct Resources

A direct resource MUST use public HTTPS and MUST NOT embed credentials. Literal
loopback HTTP or HTTPS MAY be accepted only in an explicit local-development
mode when the manifest itself was loaded from literal loopback.

At least one SHA-256 or SHA-512 digest is required. If both are present, both
MUST match the downloaded bytes. Hash text MUST use lowercase hexadecimal.

## Modrinth Resources

`project` and `version` identify one immutable Modrinth project and version. A
stable project ID SHOULD be used instead of a mutable slug.

The client MUST verify that the version belongs to the declared project and is
compatible with the manifest's Minecraft version and loader. It selects the
single file marked primary; when no file is marked primary, it selects the first
file as specified by Modrinth. The selected file name MUST exactly match the
manifest `fileName`.

The Modrinth SHA-512 digest is authoritative and MUST be checked against the
download. Any manifest digest that is present MUST also match both Modrinth
metadata and the downloaded bytes.

## Limits And Ownership

A consumer MUST reject an individual resource larger than 512 MiB and selected
resources whose known or downloaded total exceeds 2 GiB in one apply operation.

Clients MUST isolate server-owned setup files from unrelated Minecraft data.
Removing or replacing an existing file requires evidence that the client owns
the previous recorded version and that the user has not changed it. A manifest
never grants ownership over an arbitrary existing file.
