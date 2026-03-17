import fetch from "node-fetch";

export async function checkHealth(url: string) {
  try {
    const res = await fetch(url, { timeout: 3000 });
    return res.ok ? "online" : "offline";
  } catch {
    return "offline";
  }
}
