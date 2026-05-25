# Feature 65 — Media File Upload (Products, Profiles, Wallpapers)

## Status
Greenlit — build alongside Feature 43 (Fan Accounts). Blocks Feature 39 shop file delivery and Feature 37 profile customisation from feeling complete.

## Date
2026-05-25

## Context Links
- `docs/v2/features/39-shop.md` — product file & cover photo upload (Amendment section)
- `docs/v2/features/37-pro-themes.md` — profile picture and wallpaper upload
- `docs/pending-dependencies.md` — Vercel Blob entry

## Why

Currently three surfaces accept images or files via external URL:
1. Product cover image (`cover_image_url` text field)
2. Digital product file (`file_url` text field)
3. Profile picture (`avatar_url` text field)

Expecting creators to host their own images externally is wrong. Pasting a raw URL fails when the source moves or blocks hotlinking. Creators on mobile have no way to host files. This feature replaces all URL inputs with direct device upload across the whole platform.

---

## What Uploads Where

| Surface | Who | Format | Max size |
|---|---|---|---|
| Product cover image | BUSINESS, CONTENT_HOUSE | JPG, PNG, WEBP | 10 MB |
| Physical product photos (up to 5) | BUSINESS, CONTENT_HOUSE | JPG, PNG, WEBP | 10 MB each |
| Physical product video (optional, 1) | BUSINESS, CONTENT_HOUSE | MP4, MOV | 100 MB |
| Digital product file | BUSINESS, CONTENT_HOUSE | Any (PDF, MP3, ZIP, MP4, etc.) | 500 MB |
| Profile picture / avatar | All tiers + fans | JPG, PNG, WEBP | 5 MB |
| Profile wallpaper / background | Pro, Business, Content House | JPG, PNG, WEBP | 10 MB |
| Fundraiser cover image | Pro+ | JPG, PNG, WEBP | 10 MB |
| Post image (v3 creator posts) | All creator tiers | JPG, PNG, WEBP | 5 MB per image |

All files land in Vercel Blob. URLs returned by Blob are stored in the relevant DB column, replacing the old URL text fields.

---

## Upload Flow (all surfaces)

1. Client calls Sub-tree API to get a signed Vercel Blob upload URL
2. Client uploads the file directly to Vercel Blob (no Sub-tree server in the data path)
3. Client receives the final Blob URL from Vercel
4. Client calls Sub-tree API to confirm and store the URL

This pattern keeps large file transfers off Sub-tree's server and within Vercel's infrastructure.

---

## API Surface

```
# Profile picture
POST   /api/upload/avatar              — returns signed Blob upload URL + key
PATCH  /api/profile                    — existing; now accepts avatar_url as a Blob URL

# Profile wallpaper (Pro+)
POST   /api/upload/wallpaper           — returns signed Blob upload URL + key
PATCH  /api/profile/appearance         — existing; now accepts wallpaper_url field

# Product cover image
POST   /api/shop/products/[id]/upload?type=cover
# Physical product photo
POST   /api/shop/products/[id]/upload?type=photo&index=[0-4]
# Physical product video
POST   /api/shop/products/[id]/upload?type=video
# Digital product file
POST   /api/shop/products/[id]/upload?type=file

# Fundraiser cover
POST   /api/upload/fundraiser-cover

# Post image (Feature 61)
POST   /api/upload/post-image
```

All upload endpoints:
- Check auth + tier gate
- Call `vercelBlob.generateClientTokenFromReadWriteToken()` (or equivalent Vercel Blob API) to produce a time-limited signed upload URL
- Return `{ uploadUrl, key }` to client
- Client PUTs file to `uploadUrl` directly
- Client then calls the relevant confirm/patch endpoint with the resulting Blob URL

---

## Image Compression (Client-Side)

Per v3 Invariant 8 (post images compressed client-side before upload, max 1 MB per image):

- Cover images and profile pictures: compress to ≤ 1 MB client-side using `browser-image-compression` (or Canvas API) before initiating the upload flow
- Physical product photos: same compression rule
- Digital product files: never compressed (PDFs, ZIPs, MP3s must be delivered intact)
- Videos: not compressed client-side (too expensive); accept raw up to 100 MB

---

## UI Changes

### Profile settings (all tiers)
- Replace "Avatar URL" text input with: circular image preview + "Upload photo" button
- Drag-and-drop or tap to select file from device
- Shows upload progress bar
- On success: preview updates immediately

### Appearance (Pro+)
- Add "Upload wallpaper" button below theme presets
- Wallpaper renders as a subtle background on the public profile page (behind content, low opacity or blurred)
- "Remove wallpaper" button clears it

### Product creation / edit (BUSINESS, CONTENT_HOUSE)
- Cover image: replace URL input with image upload zone
- Physical product photos: up to 5 slots with drag-and-drop or tap-to-upload; first slot is the main image
- Physical product video: optional single slot, shows a video preview after upload
- Digital file: file picker with supported format hint, progress bar, file name + size shown on success

### Fundraiser creation
- Cover image: upload zone replaces URL input

---

## Schema Changes

Add to `Profile`:
```prisma
wallpaper_url  String?   // Vercel Blob URL — Pro+ only
```

`Product.cover_image_url` and `Product.file_url` remain as strings — the type doesn't change, just the source. `ProductPhoto` table added via Feature 39 amendment handles multiple physical product images.

---

## Scope

### In scope
- Avatar upload (all tiers)
- Wallpaper upload (Pro+)
- Product cover image upload
- Physical product photos + video upload
- Digital product file upload
- Fundraiser cover upload
- Post image upload (for Feature 61)
- Client-side image compression before upload

### Out of scope
- Server-side image resizing / thumbnail generation (deferred — use CSS object-fit for now)
- Video thumbnails auto-generated server-side
- CDN configuration beyond Vercel Blob's default
- Chunked upload for very large files (Vercel Blob handles this internally)

---

## Success Criteria

1. A creator on mobile can upload a profile picture by tapping "Upload photo" and selecting from their camera roll — no URL required
2. A BUSINESS creator adds 4 photos to a physical product from their desktop — all 4 appear on the product detail page
3. A digital product file upload of 100 MB completes successfully and the download link delivers the original file intact
4. A Pro creator uploads a wallpaper and it appears on their public profile page immediately
5. Image upload respects the 1 MB compression limit — files over 1 MB are compressed before the upload begins
