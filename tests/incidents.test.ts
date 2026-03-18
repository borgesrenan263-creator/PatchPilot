import request from "supertest";
import app from "../src/app";

describe("Incidents routes", () => {
  it("deve listar incidentes vazio no início", async () => {
    const res = await request(app).get("/incidents");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });

  it("deve criar um incidente válido", async () => {
    const projectRes = await request(app).post("/projects").send({
      name: "api-incidents",
      repoUrl: "https://github.com/test/api-incidents",
      healthUrl: "http://127.0.0.1:3000/health",
      command: "echo heal"
    });

    const projectId = projectRes.body.id;

    const res = await request(app).post("/incidents").send({
      projectId,
      message: "API OFFLINE"
    });

    expect([200, 201]).toContain(res.status);
    expect(res.body).toBeTruthy();
    expect(res.body.projectId).toBe(projectId);
    expect(res.body.status).toBe("open");
  });

  it("deve rejeitar incidente inválido", async () => {
    const res = await request(app).post("/incidents").send({
      projectId: "",
      message: ""
    });

    expect(res.status).toBe(400);
  });

  it("deve listar apenas incidentes abertos", async () => {
    const projectRes = await request(app).post("/projects").send({
      name: "api-open",
      repoUrl: "https://github.com/test/api-open",
      healthUrl: "http://127.0.0.1:3000/health",
      command: "echo heal"
    });

    const projectId = projectRes.body.id;

    const incidentRes = await request(app).post("/incidents").send({
      projectId,
      message: "erro aberto"
    });

    await request(app)
      .patch(`/incidents/${incidentRes.body.id}/resolve`)
      .send();

    await request(app).post("/incidents").send({
      projectId,
      message: "erro ainda aberto"
    });

    const res = await request(app).get("/incidents/open");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].message).toBe("erro ainda aberto");
  });

  it("deve resolver incidente existente", async () => {
    const projectRes = await request(app).post("/projects").send({
      name: "api-resolve",
      repoUrl: "https://github.com/test/api-resolve",
      healthUrl: "http://127.0.0.1:3000/health",
      command: "echo heal"
    });

    const projectId = projectRes.body.id;

    const incidentRes = await request(app).post("/incidents").send({
      projectId,
      message: "erro para resolver"
    });

    const res = await request(app)
      .patch(`/incidents/${incidentRes.body.id}/resolve`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("resolved");
  });

  it("deve retornar 404 ao resolver incidente inexistente", async () => {
    const res = await request(app)
      .patch("/incidents/nao-existe/resolve")
      .send();

    expect(res.status).toBe(404);
  });
});
