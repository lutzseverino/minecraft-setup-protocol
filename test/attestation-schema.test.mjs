import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

async function validator(name) {
  const schema = JSON.parse(
    await readFile(new URL(`../schema/v1/${name}.schema.json`, import.meta.url)),
  );
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return ajv.compile(schema);
}

test("attestation schemas accept the v1 examples", async () => {
  const validateRequest = await validator("attestation-request");
  const validateResponse = await validator("attestation-response");
  const fingerprint = `msm-v1-sha256:${"a".repeat(64)}`;

  assert.equal(
    validateRequest({
      protocolVersion: 1,
      challenge: "0123-4567-89ab-cdef",
      manifestFingerprint: fingerprint,
      profileId: "Balanced.Profile",
      client: { name: "minecraft-setup-manager", version: "0.2.0" },
    }),
    true,
    JSON.stringify(validateRequest.errors),
  );
  assert.equal(
    validateResponse({ status: "accepted", manifestFingerprint: fingerprint }),
    true,
    JSON.stringify(validateResponse.errors),
  );
});

test("attestation request rejects weak or ambiguous codes", async () => {
  const validate = await validator("attestation-request");
  const base = {
    protocolVersion: 1,
    manifestFingerprint: `msm-v1-sha256:${"a".repeat(64)}`,
    profileId: "standard",
    client: { name: "client", version: "1" },
  };

  assert.equal(validate({ ...base, challenge: "short" }), false);
  assert.equal(validate({ ...base, challenge: "0123-ILOU-89AB-CDEF" }), false);
});

