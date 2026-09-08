import fs from "fs";
import path from "path";

export async function saveUploadedFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // 1. Write file to disk if possible (for local development or static serving)
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const sanitizeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${Date.now()}_${sanitizeName}`;
    const filePath = path.join(uploadDir, fileName);

    await fs.promises.writeFile(filePath, buffer);
  } catch (err) {
    console.warn("Notice: Could not write file to ephemeral disk:", err);
  }

  // 2. Return base64 Data URL so it is stored directly in PostgreSQL database.
  // This guarantees image persistence across Railway redeployments, restarts, and new user sessions.
  const mimeType = file.type || "image/png";
  const base64 = buffer.toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

