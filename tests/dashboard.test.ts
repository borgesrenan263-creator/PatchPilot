import request from "supertest";
import app from "../src/app";

describe("Dashboard routes", () => {
  it("deve responder 200 em /dashboard/overview", async () => {
    const res = await request(app).get("/dashboard/overview");
    expect(res.status).toBe(200);
  });

  it("deve retornar summary vazio inicialmente", async () => {
    const res = await request(app).get("/dashboard/overview");

    expect(res.status).toBe(200);
    expect(res.body.summary.totalProjects).toBe(0);
    expect(res.body.summary.healthyCount).toBe(0);
    expect(res.body.summary.alertCount).toBe(0);
    expect(Array.isArray(res.body.projects)).toBe(true);
    expect(Array.isArray(res.body.incidents)).toBe(true);
  });

  it("deve refletir projeto saudável sem incidentes", async () => {
    await request(app).post("/projects").send({
      name: "api-dashboard-ok",
      repoUrl: "https://github.com/test/api-dashboard-ok",
      healthUrl: "http://127.0.0.1:3000/health",
      command: "echo heal"
    });

    const res = await request(app).get("/dashboard/overview");

    expect(res.status).toBe(200);
    expect(res.body.summary.totalProjects).toBe(1);
    expect(res.body.summary.healthyCount).toBe(1);
    expect(res.body.summary.alertCount).toBe(0);
    expect(res.body.projects[0].status).toBe("healthy");
  });

  it("deve refletir projeto em alerta com incidente aberto", async () => {
    const projectRes = await request(app).post("/projects").send({
      name: "api-dashboard-alert",
      repoUrl: "https://github.com/test/api-dashboard-alert",
      healthUrl: "http://127.0.0.1:3000/broken",
      command: "echo heal"
    });

    await request(app).post("/incidents").send({
      projectId: projectRes.body.id,
      message: "API OFFLINE"
    });

    const res = await request(app).get("/dashboard/overview");

    expect(res.status).toBe(200);
    expect(res.body.summary.totalProjects).toBe(1);
    expect(res.body.summary.healthyCount).toBe(0);
    expect(res.body.summary.alertCount).toBe(1);
    expect(res.body.projects[0].status).toBe("alert");
    expect(res.body.projects[0].failure).toBe("API OFFLINE");
  });

  it("deve refletir múltiplos projetos e múltiplos incidentes", async () => {
    const p1 = await request(app).post("/projects").send({
      name: "api-1",
      repoUrl: "https://github.com/test/api-1",
      healthUrl: "http://127.0.0.1:3000/health",
      command: "echo fix-1"
    });

    const p2 = await request(app).post("/projects").send({
      name: "api-2",
      repoUrl: "https://github.com/test/api-2",
      healthUrl: "http://127.0.0.1:3000/down",
      command: "echo fix-2"
    });

    await request(app).post("/incidents").send({
      projectId: p2.body.id,
      message: "erro 1"
    });

    await request(app).post("/incidents").send({
      projectId: p2.body.id,
      message: "erro 2"
    });

    const res = await request(app).get("/dashboard/overview");

    expect(res.status).toBe(200);
    expect(res.body.summary.totalProjects).toBe(2);
    expect(res.body.summary.healthyCount).toBe(1);
    expect(res.body.summary.alertCount).toBe(1);
    expect(res.body.incidents.length).toBeGreaterThan(0);
  });
});
