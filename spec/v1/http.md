# HTTP Publication V1

## Discovery

For a player-entered address such as `play.example.com:25566`, the default
manifest URL is:

```text
https://play.example.com/.well-known/minecraft-setup-manager/manifest.json
```

The Minecraft port is not reused for HTTPS discovery. A consumer may also accept
a direct HTTPS manifest URL.

Public discovery requires HTTPS on the web endpoint. A Paper or Spigot plugin
cannot assume it controls port 443 or the server's TLS certificate. The portable
publication model is therefore:

```text
plugin configuration -> validated manifest file -> web server or reverse proxy
```

A plugin MAY expose an HTTP adapter bound to literal loopback for a local reverse
proxy. It SHOULD also support atomic static-file output. Public certificate and
reverse-proxy management are deployment concerns, not manifest-domain behavior.

## Response

A successful response MUST use status `200`, contain UTF-8 JSON, and use
`Content-Type: application/json`. The body MUST NOT exceed 1 MiB.

The server SHOULD return the canonical manifest fingerprint as a strong `ETag`
and SHOULD honor `If-None-Match` with `304 Not Modified`. It SHOULD use
`Cache-Control: no-cache` so clients may reuse bytes only after revalidation.

Publication MUST be atomic. A client must never observe a partially written
manifest while a plugin reload or lock update is in progress.

Manifest endpoints MUST NOT require credentials in the URL. Redirects SHOULD be
avoided. Consumers MUST bound redirect count and reject any redirect that changes
origin, weakens HTTPS, embeds credentials, or targets a non-public address.

Literal loopback HTTP MAY be accepted for integration testing. Private-network,
link-local, multicast, `.local`, and loopback destinations are not public
publication targets.
