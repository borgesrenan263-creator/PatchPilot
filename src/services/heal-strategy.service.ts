type FailureType =
  | "healthy"
  | "connection_refused"
  | "unreachable"
  | "timeout"
  | "http_404"
  | "http_500"
  | "http_502_503_504"
  | "http_error"
  | "unknown";

type StrategyContext = {
  project: any;
  failureType: FailureType;
  statusCode?: number;
};

export function buildHealStrategy(ctx: StrategyContext): string[] {
  const custom = ctx.project?.autoHealCommand;

  if (custom && typeof custom === "string" && custom.trim().length > 0) {
    return [
      custom.trim(),
      "echo strategy-custom-command"
    ];
  }

  if (ctx.failureType === "connection_refused" || ctx.failureType === "unreachable") {
    return [
      "echo strategy-restart-for-unreachable",
      "echo strategy-network-retry",
      "echo strategy-generic-restart"
    ];
  }

  if (ctx.failureType === "timeout") {
    return [
      "echo strategy-timeout-retry",
      "echo strategy-reduce-load",
      "echo strategy-generic-restart"
    ];
  }

  if (ctx.failureType === "http_500") {
    return [
      "echo strategy-restart-for-500",
      "echo strategy-clear-runtime-state",
      "echo strategy-generic-restart"
    ];
  }

  if (ctx.failureType === "http_502_503_504") {
    return [
      "echo strategy-upstream-retry",
      "echo strategy-restart-upstream-service",
      "echo strategy-generic-restart"
    ];
  }

  if (ctx.failureType === "http_404") {
    return [
      "echo strategy-check-route-config",
      "echo strategy-fallback-no-action"
    ];
  }

  if (ctx.failureType === "http_error") {
    return [
      "echo strategy-http-generic-retry",
      "echo strategy-generic-restart"
    ];
  }

  return [
    "echo strategy-fallback-no-action"
  ];
}
