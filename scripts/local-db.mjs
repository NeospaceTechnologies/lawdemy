// Local PostgreSQL for development (real Postgres binaries via embedded-postgres).
// Data lives in ./.pgdata. Stop with Ctrl+C so the server shuts down cleanly.
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import path from "node:path";

const dataDir = path.resolve(".pgdata");
const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "postgres",
  password: "postgres",
  port: 5432,
  persistent: true,
  // Always UTF-8: Windows would otherwise default to WIN1252, which can't store ₦.
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
  onLog: () => {},
});

const fresh = !existsSync(path.join(dataDir, "PG_VERSION"));
if (fresh) await pg.initialise();
await pg.start();
if (fresh) await pg.createDatabase("lawdemy");
console.log("PostgreSQL ready on 127.0.0.1:5432 (database: lawdemy). Ctrl+C to stop.");

let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await pg.stop();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
