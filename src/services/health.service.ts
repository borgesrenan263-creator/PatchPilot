import fetch from "node-fetch";

export type HealthProbeResult = {
  ok: boolean;
  latency: number;
  statusCode: number;
  failureType:
    | "healthy"
    | "connection_refused"
    | "unreachable"
    | "timeout"
    | "http_404"
    | "http_500"
    | "http_502_503_504"
    | "http_error"
    | "unknown";
};

export async function probeHealth(url: string): Promise<HealthProbeResult> {
  const startedAt = Date.now();

  try {
    const response = await fetch(url);
    const latency = Date.now() - startedAt;
    const statusCode = response.status;

    if (response.ok) {
      return {
        ok: true,
        latency,
        statusCode,
        failureType: "healthy",
      };
    }

    if (statusCode === 404) {
      return {
        ok: false,
        latency,
        statusCode,
        failureType: "http_404",
      };
    }

    if (statusCode === 500) {
      return {
        ok: false,
        latency,
        statusCode,
        failureType: "http_500",
      };
    }

    if ([502, 503, 504].includes(statusCode)) {
      return {
        ok: false,
        latency,
        statusCode,
        failureType: "http_502_503_504",
      };
    }

    return {
      ok: false,
      latency,
      statusCode,
      failureType: "http_error",
    };
  } catch (error: any) {
    const latency = Date.now() - startedAt;
    const message = String(error?.message || "").toLowerCase();

    if (message.includes("timeout")) {
      return {
        ok: false,
        latency,
        statusCode: 0,
        failureType: "timeout",
      };
    }

    if (
      message.includes("econnrefused") ||
      message.includes("connection refused") ||
      message.includes("refused")
    ) {
      return {
        ok: false,
        latency,
        statusCode: 0,
        failureType: "connection_refused",
      };
    }

    return {
      ok: false,
      latency,
      statusCode: 0,
      failureType: "unreachable",
    };
  }
}
