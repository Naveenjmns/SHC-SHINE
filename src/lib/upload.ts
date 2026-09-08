import { saveImageToStore } from "@/lib/imageStorage";

export async function saveUploadedFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const mimeType = file.type || "image/png";

  const publicUrl = await saveImageToStore(buffer, mimeType, file.name);
  return publicUrl;
}

