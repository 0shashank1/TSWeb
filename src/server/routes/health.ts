import { get } from "../db";
import { safe } from "../problem";

export const healthRoutes = {
  "/health": {
    GET: safe(async () => Response.json({ status: "Healthy" })),
  },
  "/health/ready": {
    GET: safe(async () => {
      try {
        get("SELECT 1 AS ok");
        return Response.json({
          status: "Healthy",
          checks: { database: "Healthy" },
        });
      } catch {
        return Response.json(
          {
            status: "Unhealthy",
            checks: { database: "Unhealthy" },
          },
          { status: 503 },
        );
      }
    }),
  },
};
