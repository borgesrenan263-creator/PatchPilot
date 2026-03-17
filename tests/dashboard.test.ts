jest.mock("../src/lib/db", () => ({
  db: {
    query: jest.fn(),
  },
}));

import request from "supertest";
import { app } from "../src/app";
import { db } from "../src/lib/db";

const mockedDb = db as unknown as { query: jest.Mock };

describe("Dashboard routes", () => {
  beforeEach(() => {
    mockedDb.query.mockReset();
  });

  it(
    "should return dashboard overview",
    async () => {
      mockedDb.query
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              name: "api-teste",
              repoUrl: "https://github.com/test/api",
              healthcheckUrl: "http://127.0.0.1:3000/health",
              createdAt: new Date().toISOString(),
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              responseTime: 20,
              statusCode: 200,
              createdAt: new Date().toISOString(),
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              total: 10,
              healthy: 10,
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [],
        })
        .mockResolvedValueOnce({
          rows: [],
        });

      const response = await request(app).get("/dashboard/overview");

      expect(response.status).toBe(200);
      expect(response.body.summary).toBeDefined();
      expect(response.body.projects).toBeDefined();
      expect(Array.isArray(response.body.projects)).toBe(true);
      expect(response.body.summary.totalProjects).toBe(1);
      expect(response.body.projects[0].name).toBe("api-teste");
    },
    15000
  );
});
