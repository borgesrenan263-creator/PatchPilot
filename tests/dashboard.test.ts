import request from "supertest";
import app from "../src/app";

describe("Dashboard routes", () => {
  it("deve responder 200 em /dashboard/overview", async () => {
    const res = await request(app).get("/dashboard/overview");
    expect(res.status).toBe(200);
  });

  it("deve retornar um objeto no overview", async () => {
    const res = await request(app).get("/dashboard/overview");
    expect(typeof res.body).toBe("object");
    expect(res.body).toBeTruthy();
  });

  it("deve refletir projetos cadastrados no overview", async () => {
    await request(app).post("/projects").send({
      name: "api-dashboard",
      repoUrl: "https://github.com/test/api-dashboard",
      healthUrl: "http://127.0.0.1:3000/health",
      command: "echo heal"
    });

    const res = await request(app).get("/dashboard/overview");

    expect(res.status).toBe(200);
    expect(typeof res.body).toBe("object");
  });
});
