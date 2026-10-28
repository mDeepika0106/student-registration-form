
export const VALID_ROLES = [
  "Admin",
  "Manager",
  "Staff",
  "Viewer",
];

export function isSafeText(value, maxLength = 200) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= maxLength &&
    // oxlint-disable-next-line no-control-regex
!/[\u0000-\u001F\u007F]/.test(value)
  );
}

export function isValidRole(value) {
  return VALID_ROLES.includes(value);
}

export function getSafeId(id) {
  let numericId;

  if (typeof id === "number") {
    numericId = id;
  } else if (typeof id === "string" && id.length > 0) {
    for (let i = 0; i < id.length; i++) {
      const code = id.charCodeAt(i);

      if (code < 48 || code > 57) {
        throw new Error("Invalid record ID");
      }
    }

    numericId = Number(id);
  } else {
    throw new Error("Invalid record ID");
  }

  if (!Number.isSafeInteger(numericId) || numericId <= 0) {
    throw new Error("Invalid record ID");
  }

  return numericId;
}

export function getSafeApiUrl(value) {
  const trustedAzureOrigin =
    "https://studentregistrationform-api-deepika-c8cjcthmcgfjhecg.indiasouthcentral-01.azurewebsites.net";

const trustedLocalOrigins = [
  "http://localhost",
  "https://localhost",
  "http://localhost:5187",
  "https://localhost:5187",
  "http://localhost:7240",
  "https://localhost:7240",
  "http://127.0.0.1",
  "https://127.0.0.1",
  "http://127.0.0.1:5187",
  "https://127.0.0.1:5187",
  "http://127.0.0.1:7240",
  "https://127.0.0.1:7240",
];
  try {
    const url = new URL(value);

    const isTrustedAzure = url.origin === trustedAzureOrigin;
    const isTrustedLocal = trustedLocalOrigins.includes(url.origin);

    if (!isTrustedAzure && !isTrustedLocal) {
      throw new Error("API origin is not allowed");
    }

    if (url.username || url.password || url.search || url.hash) {
      throw new Error("Unexpected API URL components");
    }

    let pathname = url.pathname;
    while (pathname.endsWith("/") && pathname.length > 1) {
      pathname = pathname.slice(0, -1);
    }

    if (pathname !== "/api") {
      throw new Error("API path is not allowed");
    }

    return url.origin + "/api";
  } catch {
    return trustedAzureOrigin + "/api";
  }
}
