import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const WINDOWS_RESERVED_NAMES = new Set(["CON", "PRN", "AUX", "NUL"]);

export function createProtocolValidator(schema) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validateSchema = ajv.compile(schema);

  return function validateManifest(manifest, options = {}) {
    if (!validateSchema(manifest)) {
      return {
        valid: false,
        errors: validateSchema.errors.map((error) => ({
          code: "schema.invalid",
          path: error.instancePath || "/",
          message: error.message ?? "The value does not match the schema.",
        })),
      };
    }

    const errors = validateSemantics(manifest, options);
    return { valid: errors.length === 0, errors };
  };
}

export function validateSemantics(manifest, options = {}) {
  const errors = [];
  const profileIds = new Set();
  const resourceIds = new Set();
  const destinations = new Map();
  const allowLocalDevelopment = options.allowLocalDevelopment === true;

  validateUnicodeNormalization(manifest, "", errors);

  checkPortableName(
    manifest.install.gameDirectoryName,
    "/install/gameDirectoryName",
    errors,
  );

  for (const [index, profile] of manifest.profiles.entries()) {
    if (profileIds.has(profile.id)) {
      errors.push(error("profile.id.duplicate", `/profiles/${index}/id`, "Profile IDs must be unique."));
    }
    profileIds.add(profile.id);
  }

  for (const [index, resource] of manifest.resources.entries()) {
    const path = `/resources/${index}`;
    if (resourceIds.has(resource.id)) {
      errors.push(error("resource.id.duplicate", `${path}/id`, "Resource IDs must be unique."));
    }
    resourceIds.add(resource.id);

    for (const profileId of resource.profiles ?? []) {
      if (!profileIds.has(profileId)) {
        errors.push(
          error(
            "resource.profile.unknown",
            `${path}/profiles`,
            `Resource ${resource.id} refers to unknown profile ${profileId}.`,
          ),
        );
      }
    }

    if (resource.fileName != null) {
      checkPortableName(resource.fileName, `${path}/fileName`, errors);
    }

    if (resource.source.kind === "direct") {
      validateDirectUrl(resource.source.url, path, allowLocalDevelopment, errors);
    }

    const fileName = resource.fileName;
    checkPortableName(fileName, `${path}/fileName`, errors);
    const key = `${resource.target}\u0000${fileName.toLocaleLowerCase("en-US")}`;
    const existing = destinations.get(key);
    if (existing) {
      errors.push(
        error(
          "resource.destination.overlap",
          path,
          `Resources ${existing.id} and ${resource.id} select the same destination file.`,
        ),
      );
    } else if (!existing) {
      destinations.set(key, resource);
    }
  }

  return errors;
}

function validateDirectUrl(urlValue, resourcePath, allowLocalDevelopment, errors) {
  let url;
  try {
    url = new URL(urlValue);
  } catch {
    return;
  }

  if (url.username || url.password) {
    errors.push(
      error(
        "resource.url.credentials",
        `${resourcePath}/source/url`,
        "Direct resource URLs must not contain credentials.",
      ),
    );
  }

  const local = isLocalHost(url.hostname);
  const allowed = url.protocol === "https:" && !local
    || allowLocalDevelopment && local && ["http:", "https:"].includes(url.protocol);
  if (!allowed) {
    errors.push(
      error(
        "resource.url.public_https",
        `${resourcePath}/source/url`,
        "Direct resources must use public HTTPS.",
      ),
    );
  }
}

function checkPortableName(value, path, errors) {
  if (value !== value.normalize("NFC")) {
    errors.push(
      error(
        "portable_name.normalization",
        path,
        `${value} must use Unicode NFC normalization.`,
      ),
    );
  }
  if (Buffer.byteLength(value, "utf8") > 200) {
    errors.push(
      error(
        "portable_name.too_long",
        path,
        `${value} exceeds the 200-byte portable name limit.`,
      ),
    );
  }
  const stem = value.split(".", 1)[0].toUpperCase();
  const numberedDevice = /^(COM|LPT)[1-9]$/.test(stem);
  if (WINDOWS_RESERVED_NAMES.has(stem) || numberedDevice) {
    errors.push(
      error(
        "portable_name.reserved",
        path,
        `${value} is reserved by Windows and is not a portable name.`,
      ),
    );
  }
}

function isLocalHost(hostValue) {
  const host = hostValue.toLowerCase().replace(/^\[/, "").replace(/\]$/, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    return true;
  }
  if (host === "::1" || host === "0:0:0:0:0:0:0:1" || host.startsWith("fe80:") || host.startsWith("fc") || host.startsWith("fd")) {
    return true;
  }

  const octets = host.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return false;
  }

  const [first, second] = octets;
  return first === 0
    || first === 10
    || first === 127
    || first >= 224
    || first === 169 && second === 254
    || first === 172 && second >= 16 && second <= 31
    || first === 192 && second === 168;
}

function error(code, path, message) {
  return { code, path, message };
}

function validateUnicodeNormalization(value, path, errors) {
  if (typeof value === "string") {
    if (value !== value.normalize("NFC")) {
      errors.push(
        error(
          "text.normalization",
          path || "/",
          "Protocol strings must use Unicode NFC normalization.",
        ),
      );
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateUnicodeNormalization(item, `${path}/${index}`, errors));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      validateUnicodeNormalization(item, `${path}/${key}`, errors);
    }
  }
}
