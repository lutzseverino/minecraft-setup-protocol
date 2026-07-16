import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  canonicalManifest,
  fingerprintManifest,
} from "../src/canonicalization.mjs";
import { createProtocolValidator } from "../src/reference-validator.mjs";

const schema = JSON.parse(
  await readFile(
    new URL("../schema/v1/manifest.schema.json", import.meta.url),
    "utf8",
  ),
);
const validate = createProtocolValidator(schema);

test("accepts a minimal vanilla manifest", () => {
  const result = validate(manifest());
  assert.deepEqual(result, { valid: true, errors: [] });
});

test("reports semantic errors with stable codes", () => {
  const value = manifest();
  value.install.gameDirectoryName = "NUL";
  const result = validate(value);

  assert.equal(result.valid, false);
  assert.equal(result.errors[0].code, "portable_name.reserved");
});

test("canonicalization inserts defaults and sorts set-valued profile references", () => {
  const value = manifest();
  value.profiles.push({
    id: "visual",
    label: "Visual",
    recommendedMemoryMb: 6144,
  });
  value.minecraft = {
    version: "1.21.6",
    loader: { kind: "fabric", version: "0.16.14" },
  };
  value.resources.push({
    id: "example-mod",
    name: "Example Mod",
    resourceType: "mod",
    target: "mods",
    fileName: "example.jar",
    profiles: ["visual", "default"],
    source: { kind: "modrinth", project: "AABBCCDD", version: "11223344" },
  });

  const canonical = canonicalManifest(value);
  assert.match(canonical, /"profiles":\["default","visual"\]/);
  assert.match(canonical, /"required":false/);
  assert.match(fingerprintManifest(value), /^msm-v1-sha256:[a-f0-9]{64}$/);
});

function manifest() {
  return {
    schemaVersion: 1,
    manifestVersion: "1",
    id: "example",
    displayName: "Example Server",
    server: { name: "Example Server", address: "play.example.com" },
    minecraft: { version: "1.21.6", loader: { kind: "none" } },
    install: {
      gameDirectoryName: "Example Server",
      launcherProfileName: "Example Server",
    },
    profiles: [{ id: "default", label: "Default", recommendedMemoryMb: 4096 }],
    resources: [],
  };
}
