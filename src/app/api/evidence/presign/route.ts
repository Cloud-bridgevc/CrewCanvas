import { NextResponse } from "next/server";
import { evidenceKey, presignUpload } from "@/lib/storage";

export async function POST(req: Request) {
  const { projectId, workPackageId, filename, contentType } = await req.json();
  if (!projectId || !workPackageId || !filename || !contentType) {
    return NextResponse.json({ error: "projectId, workPackageId, filename and contentType are required" }, { status: 400 });
  }
  try {
    const key = evidenceKey(projectId, workPackageId, filename);
    const url = await presignUpload(key, contentType);
    return NextResponse.json({ key, url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
