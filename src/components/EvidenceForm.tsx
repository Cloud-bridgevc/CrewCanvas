"use client";

import { useRef, useState, useTransition } from "react";
import { addProgressNote } from "@/app/app/actions";

export function EvidenceForm({ projectId, workPackages }: { projectId: string; workPackages: { id: string; name: string }[] }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const form = useRef<HTMLFormElement>(null);

  async function submit(fd: FormData) {
    const wp = String(fd.get("wp"));
    const title = String(fd.get("title"));
    const body = String(fd.get("body") ?? "");
    const file = fd.get("file") as File | null;
    let s3Key: string | undefined;
    let type: "progress_note" | "photo" | "document" = "progress_note";
    if (file && file.size > 0) {
      // Presign -> direct browser PUT to S3. Without a bucket configured we record metadata only.
      const res = await fetch("/api/evidence/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, workPackageId: wp, filename: file.name, contentType: file.type }),
      });
      const json = await res.json();
      if (!res.ok) return setMsg({ ok: false, text: json.error ?? "Upload failed" });
      if (json.url) {
        const put = await fetch(json.url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
        if (!put.ok) return setMsg({ ok: false, text: `S3 upload failed (${put.status})` });
      }
      s3Key = json.key;
      type = file.type === "application/pdf" ? "document" : "photo";
    }
    const r = await addProgressNote(projectId, wp, title, body, s3Key, type);
    setMsg(r.ok ? { ok: true, text: s3Key ? `Saved. Stored as s3://…/${s3Key}` : "Saved." } : { ok: false, text: r.error });
    if (r.ok) form.current?.reset();
  }

  return (
    <form ref={form} action={(fd) => start(() => submit(fd))} className="space-y-3 px-5 py-4 text-sm">
      <select name="wp" required className="w-full rounded-md border border-char-200 px-3 py-2">
        {workPackages.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
      </select>
      <input name="title" required placeholder="Title — e.g. L2 deck north bay, after cleanup" className="w-full rounded-md border border-char-200 px-3 py-2" />
      <textarea name="body" rows={3} placeholder="Progress note (optional)" className="w-full rounded-md border border-char-200 px-3 py-2" />
      <input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/heic,application/pdf" className="block w-full text-xs text-char-500 file:mr-3 file:rounded-md file:border-0 file:bg-char-100 file:px-3 file:py-1.5 file:text-char-700" />
      <button disabled={pending} className="rounded-md bg-char-900 px-4 py-2 font-semibold text-white hover:bg-char-700 disabled:opacity-50">
        {pending ? "Saving…" : "Add evidence"}
      </button>
      {msg && <p className={`text-xs ${msg.ok ? "text-ok-600" : "text-bad-600"}`}>{msg.text}</p>}
      <p className="text-xs text-char-400">Evidence documents work; it does not verify checklist items. Verification is recorded on the Readiness tab.</p>
    </form>
  );
}
