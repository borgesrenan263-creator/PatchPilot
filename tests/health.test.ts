import request from "supertest";
import { app } from "../src/app";

describe("Health route", () => {
  it("should return health status", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });
});
