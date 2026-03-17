jest.mock("../src/lib/db", () => ({
  db: {
    query: jest.fn(),
  },
}));

import request from "supertest";
import { app } from "../src/app";
import { db } from "../src/lib/db";

const mockedDb = db as unknown as { query: jest.Mock };

describe("Projects routes", () => {
  beforeEach(() => {
    mockedDb.query.mockReset();
  });

  it(
    "should list projects",
    async () => {
      mockedDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            name: "api-teste",
            repoUrl: "https://github.com/test/api",
            healthcheckUrl: "http://127.0.0.1:3000/health",
            createdAt: new Date().toISOString(),
          },
        ],
      });

      const response = await request(app).get("/projects");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe("api-teste");
    },
    15000
  );

  it(
    "should reject invalid project payload",
    async () => {
      const response = await request(app)
        .post("/projects")
        .send({
          name: "",
        });

      expect(response.status).toBe(400);
    },
    15000
  );
});
