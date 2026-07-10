# Protocol Design

## Purpose

Minecraft setup producers and consumers need a shared contract without sharing
an implementation language or trusting arbitrary executable instructions.

## Overview

The protocol describes desired client state as strict data. A producer publishes
a manifest; a consumer validates, previews, and applies supported actions. The
protocol owns the wire format and stable fingerprinting, while each product owns
its filesystem, networking, and user-experience choices.

Setup attestation is an independent optional exchange. It coordinates an
ordinary setup workflow but cannot prove that a public client is unmodified or
that local files remain unchanged.

## Key Concepts

- Manifests are declarative and never contain scripts.
- Unknown or unsupported work fails closed.
- Canonical fingerprints identify exact desired state across languages.
- Publication, installation, and login policy remain separate responsibilities.

## Implications

Servers can replace the producer and players can replace the consumer as long as
both conform. Security claims must stay within what the public data exchange can
actually establish.

