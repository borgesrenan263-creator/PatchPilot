import request from "supertest";
import app from "../src/app";

describe("Projects routes", () => {
  it("deve listar projetos", async () => {
    const res = await request(app).get("/projects");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("deve criar um projeto válido", async () => {
    const payload = {
      name: "api-test",
      repoUrl: "https://github.com/test/api-test",
      healthUrl: "http://127.0.0.1:3000/health",
      command: "echo restart-service"
    };

    const res = await request(app).post("/projects").send(payload);

    expect([200, 201]).toContain(res.status);
    expect(res.body).toBeTruthy();
  });

  it("deve rejeitar projeto inválido", async () => {
    const payload = {
      name: "",
      healthUrl: ""
    };

    const res = await request(app).post("/projects").send(payload);

    expect(res.status).toBe(400);
  });

  it("deve listar projeto após criação", async () => {
    await request(app).post("/projects").send({
      name: "api-teste-2",
      repoUrl: "https://github.com/test/api-teste-2",
      healthUrl: "http://127.0.0.1:3000/health",
      command: "echo ok"
    });

    const res = await request(app).get("/projects");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
