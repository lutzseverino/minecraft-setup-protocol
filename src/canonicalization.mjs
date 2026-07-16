import { createHash } from "node:crypto";

import canonicalize from "canonicalize";

export const FINGERPRINT_PREFIX = "msm-v1-sha256:";

export function normalizeManifest(manifest) {
  const normalized = structuredClone(manifest);

  for (const profile of normalized.profiles) {
    profile.includesShaders ??= false;
  }

  for (const resource of normalized.resources) {
    resource.required ??= false;
    resource.profiles ??= [];
    resource.profiles.sort(compareUnicodeCodePoints);
    resource.hashes ??= {};
    if (resource.hashes.sha512) {
      resource.hashes.sha512 = resource.hashes.sha512.toLowerCase();
    }
    if (resource.hashes.sha256) {
      resource.hashes.sha256 = resource.hashes.sha256.toLowerCase();
    }
  }

  return normalized;
}

export function canonicalManifest(manifest) {
  const canonical = canonicalize(normalizeManifest(manifest));
  if (canonical == null) {
    throw new Error("The manifest cannot be represented as canonical JSON.");
  }
  return canonical;
}

export function fingerprintManifest(manifest) {
  const digest = createHash("sha256")
    .update(canonicalManifest(manifest), "utf8")
    .digest("hex");
  return `${FINGERPRINT_PREFIX}${digest}`;
}

function compareUnicodeCodePoints(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}
