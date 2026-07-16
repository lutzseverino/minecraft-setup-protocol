import { readFile } from "node:fs/promises";

import { fingerprintManifest } from "../src/canonicalization.mjs";
import { createProtocolValidator } from "../src/reference-validator.mjs";

const root = new URL("../", import.meta.url);
const [schema, catalog] = await Promise.all([
  readJson(new URL("schema/v1/manifest.schema.json", root)),
  readJson(new URL("fixtures/v1/catalog.json", root)),
]);
const validate = createProtocolValidator(schema);
const failures = [];

for (const fixture of catalog.valid) {
  const manifest = await readJson(new URL(`fixtures/v1/${fixture.path}`, root));
  const result = validate(manifest);
  if (!result.valid) {
    failures.push(
      `${fixture.path} should be valid, but returned ${formatErrors(result.errors)}`,
    );
    continue;
  }
  const fingerprint = fingerprintManifest(manifest);
  if (fingerprint !== fixture.fingerprint) {
    failures.push(
      `${fixture.path} expected ${fixture.fingerprint}, but produced ${fingerprint}.`,
    );
  }
}

for (const fixture of catalog.invalid) {
  const result = validate(
    await readJson(new URL(`fixtures/v1/${fixture.path}`, root)),
  );
  if (result.valid) {
    failures.push(`${fixture.path} should be invalid, but passed.`);
    continue;
  }
  if (!result.errors.some((error) => error.code === fixture.error)) {
    failures.push(
      `${fixture.path} expected ${fixture.error}, but returned ${formatErrors(result.errors)}`,
    );
  }
}

if (failures.length > 0) {
  throw new Error(
    `Fixture validation failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`,
  );
}

console.log(
  `Validated ${catalog.valid.length} valid and ${catalog.invalid.length} invalid protocol fixtures.`,
);

async function readJson(url) {
  return JSON.parse(await readFile(url, "utf8"));
}

function formatErrors(errors) {
  return errors.map((error) => `${error.code} at ${error.path}`).join(", ");
}
