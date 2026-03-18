import request from "supertest";
import app from "../src/app";

describe("Health routes", () => {
  it("deve responder 200 em /health", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
  });

  it("deve responder algo válido", async () => {
    const res = await request(app).get("/health");
    expect(res.text || res.body).toBeTruthy();
  });
});
