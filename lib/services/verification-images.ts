import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"
import { prisma } from "@/lib/db"

// ID photos for "attention" verifications, kept only for admin review.
// Smile ID sends short-lived (15-minute) signed image links in its webhook;
// we download them straight away, encrypt them with AES-256-GCM and store
// them, then delete them once an admin decides (or after 30 days).
//
// Env: ID_IMAGES_KEY — 32 random bytes, base64 (e.g. `openssl rand -base64 32`).
// Without it nothing is saved and admins review in the Smile ID portal.

export type ImageKind = "id_front" | "id_back" | "selfie"
export const IMAGE_KINDS: ImageKind[] = ["id_front", "id_back", "selfie"]
const MAX_BYTES = 8 * 1024 * 1024
export const RETENTION_DAYS = 30

function key(): Buffer | null {
  const raw = process.env.ID_IMAGES_KEY
  if (!raw) return null
  const k = Buffer.from(raw, "base64")
  return k.length === 32 ? k : null
}

export function canStoreReviewImages(): boolean {
  return key() !== null
}

function encrypt(plain: Buffer, k: Buffer): Buffer {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", k, iv)
  const body = Buffer.concat([cipher.update(plain), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), body]) // 12 + 16 + n bytes
}

function decrypt(blob: Buffer, k: Buffer): Buffer {
  const decipher = createDecipheriv("aes-256-gcm", k, blob.subarray(0, 12))
  decipher.setAuthTag(blob.subarray(12, 28))
  return Buffer.concat([decipher.update(blob.subarray(28)), decipher.final()])
}

// Called from the Smile ID webhook for "attention" results only. Failures are
// logged, never thrown — the review still works via the Smile ID portal.
export async function saveReviewImages(requestId: number, links: Partial<Record<ImageKind, string>>): Promise<number> {
  const k = key()
  if (!k) return 0
  let saved = 0
  for (const kind of IMAGE_KINDS) {
    const url = links[kind]
    if (!url) continue
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
      const type = res.headers.get("content-type")?.split(";")[0]?.trim() ?? ""
      if (!res.ok || !type.startsWith("image/")) continue
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length === 0 || buf.length > MAX_BYTES) continue
      const data = new Uint8Array(encrypt(buf, k))
      await prisma.verificationImage.upsert({
        where: { request_id_kind: { request_id: requestId, kind } },
        create: { request_id: requestId, kind, content_type: type, data },
        update: { content_type: type, data },
      })
      saved++
    } catch (err) {
      console.error("Saving verification image failed", { requestId, kind, err })
    }
  }
  return saved
}

export async function getReviewImage(requestId: number, kind: ImageKind): Promise<{ contentType: string; body: Buffer } | null> {
  const k = key()
  if (!k) return null
  const row = await prisma.verificationImage.findUnique({ where: { request_id_kind: { request_id: requestId, kind } } })
  if (!row) return null
  try {
    return { contentType: row.content_type, body: decrypt(Buffer.from(row.data), k) }
  } catch {
    return null
  }
}

export async function listReviewImageKinds(requestId: number): Promise<ImageKind[]> {
  const rows = await prisma.verificationImage.findMany({ where: { request_id: requestId }, select: { kind: true } })
  return rows.map((r) => r.kind as ImageKind)
}

export async function deleteReviewImages(requestId: number): Promise<void> {
  await prisma.verificationImage.deleteMany({ where: { request_id: requestId } })
}

// Daily cron: nothing is kept longer than RETENTION_DAYS, decided or not.
export async function purgeOldReviewImages(): Promise<number> {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000)
  const { count } = await prisma.verificationImage.deleteMany({ where: { created_at: { lt: cutoff } } })
  return count
}
