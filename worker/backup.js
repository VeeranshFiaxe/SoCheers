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

    /* Polled the way wrangler's own `d1 export` does it: straight away,
       each time handing back the bookmark the last reply gave. Reusing
       the first bookmark with long gaps in between left the export
       stuck at "not ready" for good. A failure retries the whole step,
       which starts a fresh export. */
    await step.do(
      "export and save to R2",
      { retries: { limit: 3, delay: "1 minute", backoff: "linear" }, timeout: "10 minutes" },
      async () => {
        let bookmark;
        let result;
        for (let i = 0; i < 120; i++) {
          result = await exportCall({ output_format: "polling", current_bookmark: bookmark });
          if (!result) throw new Error("Export request failed");
          if (result.status === "complete") break;
          if (result.status === "error") throw new Error(`Export failed: ${result.error}`);
          bookmark = result.at_bookmark;
          await new Promise((r) => setTimeout(r, 1000));
        }
        const signedUrl = result?.result?.signed_url;
        if (result?.status !== "complete" || !signedUrl) throw new Error("Export did not finish");
        const dump = await fetch(signedUrl);
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
