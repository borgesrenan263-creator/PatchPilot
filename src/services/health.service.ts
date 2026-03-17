import fetch from "node-fetch";

export type FailureType =
  | "healthy"
  | "timeout"
  | "dns_error"
  | "connection_refused"
  | "unreachable"
  | "http_401_403"
  | "http_404"
  | "http_500"
  | "http_502_503_504"
  | "http_error"
  | "unknown";

export type HealthProbeResult = {
  ok: boolean;
  statusCode: number | null;
  latency: number;
  failureType: FailureType;
  message: string;
};

function classifyHttpStatus(statusCode: number): FailureType {
  if (statusCode === 401 || statusCode === 403) {
    return "http_401_403";
  }

  if (statusCode === 404) {
    return "http_404";
  }

  if (statusCode === 500) {
    return "http_500";
  }

  if (statusCode === 502 || statusCode === 503 || statusCode === 504) {
    return "http_502_503_504";
  }

  return "http_error";
}

function classifyNetworkError(error: any): FailureType {
  const text = String(error?.message || error || "").toLowerCase();

  if (error?.name === "AbortError" || text.includes("abort")) {
    return "timeout";
  }

  if (
    text.includes("enotfound") ||
    text.includes("eai_again") ||
    text.includes("dns")
  ) {
    return "dns_error";
  }

  if (
    text.includes("econnrefused") ||
    text.includes("connection refused")
  ) {
    return "connection_refused";
  }

  if (
    text.includes("fetch failed") ||
    text.includes("network") ||
    text.includes("socket") ||
    text.includes("connect")
  ) {
    return "unreachable";
  }

  return "unknown";
}

function buildFailureMessage(
  failureType: FailureType,
  statusCode: number | null
) {
  if (failureType === "healthy") {
    return "Healthy";
  }

  if (failureType === "timeout") {
    return "Healthcheck timeout";
  }

  if (failureType === "dns_error") {
    return "DNS resolution failed";
  }

  if (failureType === "connection_refused") {
    return "Connection refused";
  }

  if (failureType === "unreachable") {
    return "Service unreachable";
  }

  if (failureType === "http_401_403") {
    return `Auth/permission error (${statusCode})`;
  }

  if (failureType === "http_404") {
    return "Health route not found (404)";
  }

  if (failureType === "http_500") {
    return "Internal server error (500)";
  }

  if (failureType === "http_502_503_504") {
    return `Gateway/upstream error (${statusCode})`;
  }

  if (failureType === "http_error") {
    return `HTTP error (${statusCode})`;
  }

  return "Unknown healthcheck error";
}

export async function probeHealth(
  healthcheckUrl: string,
  timeoutMs = 4000
): Promise<HealthProbeResult> {
  const controller = new AbortController();
  const startedAt = Date.now();

  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(healthcheckUrl, {
      signal: controller.signal,
    });

    const latency = Date.now() - startedAt;

    if (response.ok) {
      return {
        ok: true,
        statusCode: response.status,
        latency,
        failureType: "healthy",
        message: "Healthy",
      };
    }

    const failureType = classifyHttpStatus(response.status);

    return {
      ok: false,
      statusCode: response.status,
      latency,
      failureType,
      message: buildFailureMessage(failureType, response.status),
    };
  } catch (error: any) {
    const latency = Date.now() - startedAt;
    const failureType = classifyNetworkError(error);

    return {
      ok: false,
      statusCode: null,
      latency,
      failureType,
      message: buildFailureMessage(failureType, null),
    };
  } finally {
    clearTimeout(timer);
  }
}
