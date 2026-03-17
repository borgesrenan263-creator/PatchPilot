const API_BASE = "http://127.0.0.1:3000";

let lastAlertState = false;

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function formatText(value) {
  if (value === null || value === undefined || value === "") return "--";
  return String(value);
}

function formatLatency(value) {
  if (value === null || value === undefined) return "--";
  return `${value}ms`;
}

function formatIntegrity(value) {
  if (value === null || value === undefined) return "--";
  return `${value}%`;
}

function formatTimeAgo(date) {
  if (!date) return "--";

  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

  if (diff < 5) return "agora";
  if (diff < 60) return `${diff}s atrás`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

function humanizeFailure(type) {
  if (!type) return "--";

  const map = {
    connection_refused: "API OFFLINE",
    unreachable: "SEM RESPOSTA",
    timeout: "TIMEOUT",
    dns_error: "ERRO DNS",
    http_500: "ERRO INTERNO",
    http_404: "ROTA NÃO ENCONTRADA",
    http_401_403: "ERRO DE AUTENTICAÇÃO",
    http_502_503_504: "UPSTREAM DOWN",
    http_error: "ERRO HTTP",
    healthy: "SAUDÁVEL",
    unknown: "DESCONHECIDO",
  };

  return map[type] || type;
}

function getSeverity(type) {
  if (!type) return "info";

  if (type === "connection_refused" || type === "unreachable") return "critical";
  if (type === "timeout") return "warning";
  if (type === "http_500" || type === "http_502_503_504") return "warning";
  return "info";
}

function updateBanner(hasAlert) {
  const banner = document.getElementById("alert-banner");
  if (!banner) return;

  if (hasAlert) {
    banner.classList.remove("hidden");
  } else {
    banner.classList.add("hidden");
  }
}

function getRecoveryMeta(status) {
  if (status === "recovered") {
    return { label: "RECOVERED", className: "recovery-ok" };
  }

  if (status === "attempted_but_not_recovered") {
    return { label: "ATTEMPTED", className: "recovery-warn" };
  }

  if (status === "failed") {
    return { label: "FAILED", className: "recovery-bad" };
  }

  return { label: "NONE", className: "status-neutral" };
}

function updateChart(summary) {
  const healthyArc = document.getElementById("healthyArc");
  const alertArc = document.getElementById("alertArc");

  if (!healthyArc || !alertArc) return;

  const healthy = Number(summary.healthyProjects || 0);
  const alert = Number(summary.alertProjects || 0);
  const total = healthy + alert;

  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  if (total === 0) {
    healthyArc.style.strokeDasharray = `0 ${circumference}`;
    healthyArc.style.strokeDashoffset = "0";

    alertArc.style.strokeDasharray = `${circumference} ${circumference}`;
    alertArc.style.strokeDashoffset = "0";

    setText("chart-total", 0);
    setText("legend-healthy", 0);
    setText("legend-alert", 0);
    return;
  }

  const healthyLength = (healthy / total) * circumference;
  const alertLength = (alert / total) * circumference;

  healthyArc.style.strokeDasharray = `${healthyLength} ${circumference}`;
  healthyArc.style.strokeDashoffset = "0";

  alertArc.style.strokeDasharray = `${alertLength} ${circumference}`;
  alertArc.style.strokeDashoffset = `${-healthyLength}`;

  setText("chart-total", total);
  setText("legend-healthy", healthy);
  setText("legend-alert", alert);
}

function updateProjectCards(projects) {
  const container = document.getElementById("project-cards");
  if (!container) return;

  if (!projects.length) {
    container.innerHTML = `<div class="empty-state">Nenhum projeto cadastrado.</div>`;
    return;
  }

  container.innerHTML = projects.map((p) => {
    const severity = getSeverity(p.latestFailureType);
    const recovery = getRecoveryMeta(p.recoveryStatus);
    const statusClass = p.status === "alert" ? "status-alert" : "status-healthy";
    const statusLabel = p.status === "alert" ? "ALERT" : "HEALTHY";
    const itemClass = p.status === "alert" ? "alert" : "healthy";

    return `
      <div class="project-item ${itemClass} severity-${severity}">
        <div class="project-title">
          <h3>${p.name}</h3>
          <span class="status-pill ${statusClass}">${statusLabel}</span>
        </div>

        <div class="kv">
          <div>
            <strong>Integridade</strong>
            ${formatIntegrity(p.integrity)}
          </div>

          <div>
            <strong>Latência</strong>
            ${formatLatency(p.latestLatency)}
          </div>

          <div>
            <strong>Falha</strong>
            ${humanizeFailure(p.latestFailureType)}
          </div>

          <div>
            <strong>Severidade</strong>
            <span class="badge severity-${severity}">
              ${severity.toUpperCase()}
            </span>
          </div>

          <div>
            <strong>Última verificação</strong>
            ${formatTimeAgo(p.latestCheckAt)}
          </div>

          <div>
            <strong>Recuperação</strong>
            <span class="recovery-pill ${recovery.className}">
              ${recovery.label}
            </span>
          </div>

          <div>
            <strong>Incidente</strong>
            ${formatText(p.openIncidentMessage)}
          </div>

          <div>
            <strong>Status code</strong>
            ${formatText(p.latestStatusCode)}
          </div>

          <div style="grid-column: 1 / -1;">
            <strong>Último auto-heal</strong>
            <div class="code-mini">${formatText(p.latestAutoHealCommand)}</div>
          </div>

          <div style="grid-column: 1 / -1;">
            <strong>Saída do auto-heal</strong>
            <div class="code-mini">${formatText(p.latestAutoHealOutput)}</div>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function updateTable(projects) {
  const tbody = document.getElementById("projects-table");
  if (!tbody) return;

  if (!projects.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">Nenhum projeto cadastrado.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = projects.map((p) => {
    const rowClass = p.status === "alert" ? "row-alert" : "row-healthy";
    const statusClass = p.status === "alert" ? "status-alert" : "status-healthy";
    const statusLabel = p.status === "alert" ? "ALERTA" : "HEALTHY";
    const recovery = getRecoveryMeta(p.recoveryStatus);

    return `
      <tr class="${rowClass}">
        <td>${p.name}</td>
        <td>${formatIntegrity(p.integrity)}</td>
        <td>${formatLatency(p.latestLatency)}</td>
        <td>
          <span class="status-pill ${statusClass}">
            ${statusLabel}
          </span>
        </td>
        <td>${humanizeFailure(p.latestFailureType)}</td>
        <td>
          <div>
            <span class="recovery-pill ${recovery.className}">
              ${recovery.label}
            </span>
          </div>
          <div class="code-mini">${formatText(p.latestAutoHealCommand)}</div>
        </td>
      </tr>
    `;
  }).join("");
}

function showFormMessage(text, isError = false) {
  const el = document.getElementById("form-message");
  if (!el) return;

  el.textContent = text;
  el.style.color = isError ? "#fca5a5" : "#93c5fd";
}

async function addProject(event) {
  event.preventDefault();

  const name = document.getElementById("name")?.value.trim() || "";
  const repoUrl = document.getElementById("repoUrl")?.value.trim() || "";
  const healthcheckUrl = document.getElementById("healthcheckUrl")?.value.trim() || "";
  const autoHealCommand = document.getElementById("autoHealCommand")?.value.trim() || "";

  showFormMessage("Enviando...");

  try {
    const response = await fetch(`${API_BASE}/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        repoUrl,
        healthcheckUrl,
        autoHealCommand: autoHealCommand || undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(errorData);
      showFormMessage("Erro ao adicionar projeto.", true);
      return;
    }

    showFormMessage("Projeto adicionado com sucesso.");

    const form = document.getElementById("project-form");
    if (form) form.reset();

    await loadOverview();
  } catch (error) {
    console.error(error);
    showFormMessage("Falha de conexão ao adicionar projeto.", true);
  }
}

function triggerLocalNotification() {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification("PatchPilot Alert", {
      body: "Existe pelo menos uma API com incidente aberto.",
    });
    return;
  }

  if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification("PatchPilot Alert", {
          body: "Existe pelo menos uma API com incidente aberto.",
        });
      }
    });
  }
}

async function loadOverview() {
  try {
    const response = await fetch(`${API_BASE}/dashboard/overview`);
    const data = await response.json();

    setText("total-projects", data.summary.totalProjects);
    setText("healthy-projects", data.summary.healthyProjects);
    setText("alert-projects", data.summary.alertProjects);
    setText("autoheal-attempts", data.summary.autoHealAttempts);
    setText("last-update", `Atualizado: ${new Date().toLocaleTimeString()}`);

    updateBanner(data.summary.alertProjects > 0);
    updateChart(data.summary);
    updateProjectCards(data.projects);
    updateTable(data.projects);

    if (data.summary.alertProjects > 0 && !lastAlertState) {
      triggerLocalNotification();
    }

    lastAlertState = data.summary.alertProjects > 0;
  } catch (error) {
    console.error("Erro ao carregar overview:", error);
  }
}

const form = document.getElementById("project-form");
if (form) {
  form.addEventListener("submit", addProject);
}

loadOverview();
setInterval(loadOverview, 5000);
