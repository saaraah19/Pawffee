import "dotenv/config";
import { pool } from "../src/lib/db";
import { upsertAdminUser } from "../src/lib/auth";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD (in .env.local, or inline before the command) " +
        "then re-run: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='new-password' npm run set-admin"
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Choose a password of at least 8 characters.");
    process.exit(1);
  }

  const user = await upsertAdminUser(email, password);
  console.log(`✓ Admin credentials set for ${user.email}`);
  console.log("  Existing sessions signed with the old credentials are unaffected until they");
  console.log("  expire (7 days) -- restart the app after rotating SESSION_SECRET if you want");
  console.log("  to invalidate all sessions immediately.");

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
