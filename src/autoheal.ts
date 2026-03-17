const lastRun = {};

export function shouldRun(projectId) {
  const now = Date.now();
  const cooldown = 15000; // 15 segundos

  if (!lastRun[projectId] || now - lastRun[projectId] > cooldown) {
    lastRun[projectId] = now;
    return true;
  }

  return false;
}
