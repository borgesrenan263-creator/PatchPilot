import request from "supertest";
import app from "../src/app";

describe("Auto-heal routes", () => {
  it("deve executar auto-heal com sucesso", async () => {
    const projectRes = await request(app).post("/projects").send({
      name: "api-autoheal-ok",
      repoUrl: "https://github.com/test/api-autoheal-ok",
      healthUrl: "http://127.0.0.1:3000/down",
      command: "echo fix-applied"
    });

    const incidentRes = await request(app).post("/incidents").send({
      projectId: projectRes.body.id,
      message: "API OFFLINE"
    });

    const res = await request(app)
      .post(`/incidents/${incidentRes.body.id}/auto-heal`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.execution.success).toBe(true);
    expect(res.body.execution.command).toBe("echo fix-applied");
    expect(res.body.execution.stdout).toContain("fix-applied");
    expect(res.body.incident.autoHeal.attempted).toBe(true);
  });

  it("deve falhar quando projeto não tiver comando", async () => {
    const projectRes = await request(app).post("/projects").send({
      name: "api-sem-comando",
      repoUrl: "https://github.com/test/api-sem-comando",
      healthUrl: "http://127.0.0.1:3000/down"
    });

    const incidentRes = await request(app).post("/incidents").send({
      projectId: projectRes.body.id,
      message: "Sem comando"
    });

    const res = await request(app)
      .post(`/incidents/${incidentRes.body.id}/auto-heal`)
      .send();

    expect(res.status).toBe(400);
  });

  it("deve retornar 404 para incidente inexistente", async () => {
    const res = await request(app)
      .post("/incidents/nao-existe/auto-heal")
      .send();

    expect(res.status).toBe(404);
  });

  it("deve refletir auto-heal no dashboard", async () => {
    const projectRes = await request(app).post("/projects").send({
      name: "api-dashboard-autoheal",
      repoUrl: "https://github.com/test/api-dashboard-autoheal",
      healthUrl: "http://127.0.0.1:3000/down",
      command: "echo healed-now"
    });

    const incidentRes = await request(app).post("/incidents").send({
      projectId: projectRes.body.id,
      message: "Falha com auto-heal"
    });

    await request(app)
      .post(`/incidents/${incidentRes.body.id}/auto-heal`)
      .send();

    const dashboardRes = await request(app).get("/dashboard/overview");

    expect(dashboardRes.status).toBe(200);
    expect(dashboardRes.body.projects[0].latestAutoHealCommand).toBe("echo healed-now");
  });
});
