const $ = (selector) => document.querySelector(selector);

const elements = {
  form: $("#projectForm"),
  name: $("#name"),
  repoUrl: $("#repoUrl"),
  healthUrl: $("#healthUrl"),
  command: $("#command"),
  projectsList: $("#projectsList"),
  incidentsList: $("#incidentsList"),
  refreshBtn: $("#refreshBtn"),
  updatedAt: $("#updatedAt"),
  attentionBadge: $("#attentionBadge"),
  alertBanner: $("#alertBanner"),
  metricTotalProjects: $("#metricTotalProjects"),
  metricHealthy: $("#metricHealthy"),
  metricAlert: $("#metricAlert"),
  metricAutoHeals: $("#metricAutoHeals"),
  donutChart: $("#donutChart"),
  donutTotal: $("#donutTotal"),
  legendHealthy: $("#legendHealthy"),
  legendAlert: $("#legendAlert"),
  statusSummary: $("#statusSummary"),
};

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Erro na requisição");
  }
  return response.json();
}

function nowTime() {
  return new Date().toLocaleTimeString("pt-BR");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setLoadingState() {
  elements.projectsList.innerHTML = '<div class="empty-state">Carregando projetos...</div>';
  elements.incidentsList.innerHTML = '<div class="empty-state">Carregando incidentes...</div>';
}

function renderMetrics(summary) {
  const total = summary?.totalProjects || 0;
  const healthy = summary?.healthyCount || 0;
  const alert = summary?.alertCount || 0;
  const autoHeals = summary?.autoHeals || 0;

  elements.metricTotalProjects.textContent = total;
  elements.metricHealthy.textContent = healthy;
  elements.metricAlert.textContent = alert;
  elements.metricAutoHeals.textContent = autoHeals;

  elements.updatedAt.textContent = `Atualizado: ${nowTime()}`;
  elements.attentionBadge.textContent = `${alert} serviço(s) exigindo atenção`;

  if (alert > 0) {
    elements.alertBanner.classList.remove("hidden");
  } else {
    elements.alertBanner.classList.add("hidden");
  }

  const angle = total > 0 ? (healthy / total) * 360 : 0;
  elements.donutChart.style.setProperty("--healthy-angle", `${angle}deg`);
  elements.donutTotal.textContent = total;
  elements.legendHealthy.textContent = `Healthy: ${healthy}`;
  elements.legendAlert.textContent = `Alert: ${alert}`;

  const executive = alert > 0 ? "Operação com incidentes em aberto" : "Operação estável";
  const attention = alert > 0 ? "Alta atenção" : "Normal";
  const autoHealState =
    autoHeals > 0 ? "Auto-heal ativo em parte do ambiente" : "Auto-heal não utilizado";

  elements.statusSummary.innerHTML = `
    <div class="summary-item">
      <span>Visão executiva</span>
      <strong>${escapeHtml(executive)}</strong>
    </div>
    <div class="summary-item">
      <span>Nível de atenção</span>
      <strong>${escapeHtml(attention)}</strong>
    </div>
    <div class="summary-item">
      <span>Estado do auto-heal</span>
      <strong>${escapeHtml(autoHealState)}</strong>
    </div>
  `;
}

function renderProjects(projects) {
  if (!projects?.length) {
    elements.projectsList.innerHTML =
      '<div class="empty-state">Nenhum projeto monitorado ainda.</div>';
    return;
  }

  elements.projectsList.innerHTML = projects
    .map((project) => {
      const statusClass = project.status === "healthy" ? "healthy" : "alert";
      const attemptLabel =
        Number(project.attempts || 0) > 0
          ? `${project.attempts} tentativa${project.attempts > 1 ? "s" : ""}`
          : "0 tentativas";

      return `
        <article class="project-card ${statusClass}">
          <div class="project-card-header">
            <div>
              <h3 class="project-name">${escapeHtml(project.name)}</h3>
            </div>
            <span class="status-pill ${statusClass}">
              ${project.status === "healthy" ? "HEALTHY" : "ALERT"}
            </span>
          </div>

          <div class="project-grid">
            <div class="info-box">
              <span>Integridade</span>
              <strong>${escapeHtml(project.integrity)}%</strong>
            </div>
            <div class="info-box">
              <span>Latência</span>
              <strong>${escapeHtml(project.latency)}ms</strong>
            </div>
            <div class="info-box">
              <span>Falha</span>
              <strong>${escapeHtml(project.failure)}</strong>
            </div>
            <div class="info-box">
              <span>Severidade</span>
              <strong>${escapeHtml(project.severity)}</strong>
            </div>
            <div class="info-box">
              <span>Recuperação</span>
              <strong>${escapeHtml(project.recovery)}</strong>
            </div>
            <div class="info-box">
              <span>Tentativas</span>
              <strong>${escapeHtml(project.attempts)}</strong>
            </div>
            <div class="info-box">
              <span>Status code</span>
              <strong>${escapeHtml(project.statusCode)}</strong>
            </div>
            <div class="info-box">
              <span>Última verificação</span>
              <strong>${escapeHtml(new Date(project.lastCheck).toLocaleTimeString("pt-BR"))}</strong>
            </div>
            <div class="info-box">
              <span>Auto-heal</span>
              <code>${escapeHtml(project.latestAutoHealCommand || "--")}</code>
            </div>
            <div class="info-box">
              <span>Saída</span>
              <code>${escapeHtml(project.latestAutoHealOutput || project.latestAutoHealError || "--")}</code>
            </div>
          </div>

          <div class="project-actions">
            <button class="project-action-btn secondary" disabled>${escapeHtml(attemptLabel)}</button>
            <button class="project-action-btn primary" onclick="loadDashboard()">Atualizar status</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderIncidents(incidents) {
  if (!incidents?.length) {
    elements.incidentsList.innerHTML =
      '<div class="empty-state">Nenhum incidente recente.</div>';
    return;
  }

  elements.incidentsList.innerHTML = incidents
    .map((incident) => {
      const attempted = incident.autoHeal?.attempted;
      const label = attempted
        ? incident.autoHeal.success
          ? "AUTO-HEAL OK"
          : "AUTO-HEAL ATTEMPTED"
        : incident.status === "resolved"
          ? "RESOLVIDO"
          : "ABERTO";

      return `
        <article class="incident-card">
          <div class="incident-top">
            <div>
              <h3 class="incident-project">${escapeHtml(incident.projectName)}</h3>
            </div>
            <span class="attempt-pill">${escapeHtml(label)}</span>
          </div>

          <div class="incident-meta">
            <div><strong>Mensagem:</strong> ${escapeHtml(incident.message)}</div>
            <div><strong>Status:</strong> ${escapeHtml(incident.status)}</div>
            <div><strong>Data:</strong> ${escapeHtml(new Date(incident.createdAt).toLocaleString("pt-BR"))}</div>
            ${
              incident.autoHeal?.command
                ? `<div><strong>Comando:</strong> ${escapeHtml(incident.autoHeal.command)}</div>`
                : ""
            }
            ${
              incident.autoHeal?.stdout
                ? `<div><strong>Saída:</strong> ${escapeHtml(incident.autoHeal.stdout)}</div>`
                : ""
            }
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadDashboard() {
  try {
    const data = await fetchJSON("/dashboard/overview");

    renderMetrics(data.summary || {});
    renderProjects(data.projects || []);
    renderIncidents(data.incidents || []);
  } catch (error) {
    console.error(error);
    elements.projectsList.innerHTML =
      '<div class="empty-state">Erro ao carregar projetos.</div>';
    elements.incidentsList.innerHTML =
      '<div class="empty-state">Erro ao carregar incidentes.</div>';
  }
}

async function handleCreateProject(event) {
  event.preventDefault();

  const payload = {
    name: elements.name.value.trim(),
    repoUrl: elements.repoUrl.value.trim(),
    healthUrl: elements.healthUrl.value.trim(),
    command: elements.command.value.trim(),
  };

  try {
    await fetchJSON("/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    elements.form.reset();
    await loadDashboard();
  } catch (error) {
    alert("Erro ao adicionar projeto");
    console.error(error);
  }
}

elements.form.addEventListener("submit", handleCreateProject);
elements.refreshBtn.addEventListener("click", loadDashboard);

setLoadingState();
loadDashboard();
setInterval(loadDashboard, 10000);

window.loadDashboard = loadDashboard;
