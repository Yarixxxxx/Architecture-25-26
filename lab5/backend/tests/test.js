const request = require("supertest");
const app = require("../app/app");

describe("API test", () => {
  it("GET /rooms should return 200", async () => {
    const res = await request(app).get("/rooms");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /health should return status ok", async () => {
    const res = await request(app).get("/health");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});