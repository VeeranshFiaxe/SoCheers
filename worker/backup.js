/* ============================================================
   NIGHTLY BACKUP OF THE ADMIN DATABASE.

   A Workflow, started by Cloudflare on the cron in wrangler.jsonc
   (workflows[].schedules). It asks the D1 REST API for a SQL export of
   the DB binding's database, waits for it, and streams the dump into
   the socheers-backups R2 bucket as <YYYY-MM-DD>.sql. Then it deletes
   any backup older than KEEP_DAYS, so the bucket holds two weeks.

   Needs the D1_REST_API_TOKEN secret: an API token with
   Account > D1 > Edit. `npx wrangler secret put D1_REST_API_TOKEN`.
   ============================================================ */
import { WorkflowEntrypoint } from "cloudflare:workers";

const KEEP_DAYS = 14;
const DAY = 24 * 60 * 60 * 1000;

export class BackupWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    const { ACCOUNT_ID, DATABASE_ID, D1_REST_API_TOKEN } = this.env;
    const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/export`;
    const exportCall = async (body) => {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${D1_REST_API_TOKEN}`,
        },
        body: JSON.stringify(body),
      });
      const { result } = await res.json();
      return result;
    };

    const when = new Date(event.schedule?.scheduledTime ?? event.timestamp);
    const key = `${when.toISOString().slice(0, 10)}.sql`;

    const bookmark = await step.do("start export", async () => {
      const result = await exportCall({ output_format: "polling" });
      if (!result?.at_bookmark) throw new Error("Missing at_bookmark");
      return result.at_bookmark;
    });

    // Throwing retries the step, so this polls until the dump is ready.
    await step.do(
      "save dump to R2",
      { retries: { limit: 20, delay: "15 seconds", backoff: "linear" }, timeout: "10 minutes" },
      async () => {
        const result = await exportCall({ output_format: "polling", current_bookmark: bookmark });
        if (!result?.signed_url) throw new Error("Export not ready");
        const dump = await fetch(result.signed_url);
        if (!dump.ok) throw new Error("Failed to fetch dump");
        await this.env.BACKUPS.put(key, dump.body, {
          httpMetadata: { contentType: "application/sql" },
        });
        return key;
      },
    );

    await step.do("delete backups older than 14 days", async () => {
      const cutoff = Date.now() - KEEP_DAYS * DAY;
      const old = [];
      let cursor;
      do {
        const page = await this.env.BACKUPS.list({ cursor });
        for (const obj of page.objects) {
          if (obj.uploaded.getTime() < cutoff) old.push(obj.key);
        }
        cursor = page.truncated ? page.cursor : undefined;
      } while (cursor);
      if (old.length) await this.env.BACKUPS.delete(old);
      return old;
    });
  }
}
