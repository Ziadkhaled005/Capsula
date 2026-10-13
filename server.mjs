import { serve } from "srvx";
import { serveStatic } from "srvx/static";
import app from "./dist/server/server.js";

serve({
  port: Number(process.env.PORT || 3000),
  middleware: [serveStatic({ dir: "./dist/client" })],
  fetch: (req) => app.fetch(req),
});
