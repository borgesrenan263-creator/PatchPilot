function showToast(msg, type = "ok") {
  const el = document.createElement("div");
  el.innerText = msg;

  el.style.position = "fixed";
  el.style.bottom = "20px";
  el.style.left = "50%";
  el.style.transform = "translateX(-50%)";
  el.style.padding = "12px 20px";
  el.style.borderRadius = "10px";
  el.style.fontSize = "14px";
  el.style.zIndex = "9999";

  el.style.background =
    type === "error" ? "#ef4444" :
    type === "warn" ? "#f59e0b" :
    "#22c55e";

  el.style.color = "#fff";

  document.body.appendChild(el);

  setTimeout(() => el.remove(), 2500);
}

function setLoading(state) {
  document.body.style.opacity = state ? "0.6" : "1";
  document.body.style.pointerEvents = state ? "none" : "auto";
}

async function api(url, options = {}) {
  try {
    setLoading(true);
    const res = await fetch(url, options);
    const data = await res.json();
    setLoading(false);
    return data;
  } catch (e) {
    setLoading(false);
    showToast("Erro de conexão", "error");
    return null;
  }
}

window.showToast = showToast;
window.api = api;
