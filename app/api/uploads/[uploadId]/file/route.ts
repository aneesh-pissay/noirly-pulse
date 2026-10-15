import { readFile } from "node:fs/promises";
import { Types } from "mongoose";
import { ApiError, jsonError, requirePulseSession } from "@/src/server/api/http";
import { withDb } from "@/src/server/db/mongodb";
import { ConversationMember, Message, Upload } from "@/src/server/models";
import { getObjectBuffer } from "@/src/server/storage/r2";
import { uploadResponseHeaders } from "@/src/server/storage/served-type";

type Params = { params: Promise<{ uploadId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requirePulseSession();
    const { uploadId } = await params;
    if (!Types.ObjectId.isValid(uploadId)) {
      throw new ApiError(400, "invalid_request", "Invalid upload");
    }

    const file = await withDb(async () => {
      const upload = await Upload.findById(uploadId).lean();
      if (!upload) throw new ApiError(404, "not_found", "Upload not found");
      if (upload.userId.toString() === ctx.userId) return upload;

      // Shared through a message that still exists, in a conversation the
      // viewer is in. Deleting the message takes the file away from others.
      const message = await Message.findOne({
        "attachments.id": uploadId,
        deletedAt: null,
      }).lean();
      if (!message) throw new ApiError(404, "not_found", "Upload not found");
      const member = await ConversationMember.findOne({
        conversationId: message.conversationId,
        userId: new Types.ObjectId(ctx.userId),
      }).lean();
      if (!member) throw new ApiError(404, "not_found", "Upload not found");
      return upload;
    });

    // Read the bytes here rather than redirecting to the bucket: a redirect
    // would hand out a link that works for anyone, forever.
    const bytes = file.storagePath.startsWith("r2:")
      ? await getObjectBuffer(file.storagePath.slice(3))
      : await readFile(file.storagePath);
    return new Response(new Uint8Array(bytes), {
      headers: uploadResponseHeaders(file.mime, file.filename),
    });
  } catch (error) {
    return jsonError(error);
  }
}
