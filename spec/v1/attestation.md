# Setup Attestation V1

Setup attestation is an optional exchange for servers that want to ask a player
to apply the current manifest before joining. It is separate from manifest
publication: producers and consumers may implement either feature independently.

## Security boundary

An attestation says that a setup client reports successfully validating a
specific manifest for the holder of a short-lived challenge. It does not prove
that the client is trusted, that files remain unchanged, or that an unmodified
Minecraft client is in use. The request format is public and can be reproduced.

Servers MUST present this feature as setup compliance rather than anti-cheat or
device attestation. Stronger continuous enforcement requires a separately
reviewed client component and handshake protocol.

## Identity

A server issues a challenge during a player's connection attempt and binds it
server-side to:

- the authenticated player UUID;
- the current canonical manifest fingerprint; and
- an expiry time.

The client never submits a player name or UUID. Possession of the challenge is
the link to the pending connection. Strict enforcement MUST NOT be enabled when
the server cannot trust player UUIDs, such as an offline-mode server or a proxy
without secure identity forwarding.

Challenges MUST contain at least 80 bits of cryptographically secure randomness,
be single-use, and expire within 15 minutes. Implementations SHOULD render a
16-character Crockford Base32 code in four groups for manual entry. They MUST
rate-limit failed redemption attempts and MUST NOT write raw challenge values to
logs or durable storage.

A server SHOULD reuse an unexpired challenge for the same player and fingerprint
instead of replacing it on every reconnect.

## Endpoint

The attestation endpoint uses the manifest origin and this fixed path:

```text
POST /.well-known/minecraft-setup-manager/attestations
```

Public endpoints MUST use HTTPS. Literal loopback HTTP is allowed only behind a
same-host reverse proxy or for local integration tests. The request body MUST be
UTF-8 JSON, use `Content-Type: application/json`, and be no larger than 16 KiB.

```json
{
  "protocolVersion": 1,
  "challenge": "0123-4567-89AB-CDEF",
  "manifestFingerprint": "msm-v1-sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "profileId": "balanced",
  "client": {
    "name": "minecraft-setup-manager",
    "version": "0.2.0"
  }
}
```

`challenge` comparison ignores ASCII hyphens and ASCII letter case. All other
fields use exact comparison. `profileId` MUST identify a profile in the bound
manifest. `client` is diagnostic metadata and MUST NOT be treated as proof of
client identity.

After atomically consuming a valid challenge, the server records the bound
player UUID, exact manifest fingerprint, selected profile, and validation time.
It responds with `200 OK`:

```json
{
  "status": "accepted",
  "manifestFingerprint": "msm-v1-sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
}
```

The server MUST reject a challenge when it is unknown, expired, already used,
bound to another fingerprint, or paired with an unknown profile. A failed
request must not create or update a compliance record.

## Errors

Errors use `application/problem+json` with a stable machine-readable `code`:

```json
{
  "type": "about:blank",
  "title": "Setup code expired",
  "status": 410,
  "code": "challenge_expired"
}
```

V1 defines these codes:

| Status | Code | Meaning |
| --- | --- | --- |
| `400` | `invalid_request` | The body or a field is invalid. |
| `404` | `challenge_invalid` | The challenge is unknown or already used. |
| `409` | `fingerprint_mismatch` | The server setup changed after challenge issue. |
| `409` | `profile_invalid` | The selected profile is not in the current manifest. |
| `410` | `challenge_expired` | The challenge is no longer current. |
| `429` | `rate_limited` | Too many attempts were made. |
| `503` | `attestation_unavailable` | The server cannot safely record compliance. |

Servers SHOULD avoid revealing whether a valid challenge belongs to a
particular player. Clients MUST show ordinary language for known error codes and
MUST treat unknown codes as a failed attestation.

## Login policy

A server may allow login when a compliance record matches the exact current
manifest fingerprint. Publishing any desired-state change produces a different
fingerprint and therefore invalidates prior compliance without mutating records.

Enforcement MUST be configurable and disabled by default. Deployments SHOULD
support an advisory mode, bypass permissions, configurable disconnect messages,
and an explicit fail-open or fail-closed policy for storage failures. Fail-open
is the safer operational default because a storage outage should not
accidentally lock every player out.
