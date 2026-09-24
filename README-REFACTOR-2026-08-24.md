# UsBooth — full refactor/fix pass

This repository is based on the uploaded `UsBooth-main(6).zip` and keeps the existing application structure/UI while separating the most fragile responsibilities.

## Fixed / changed in this pass

### Two-device capture synchronization
- Every shutter cycle has one immutable `captureId`.
- The countdown signal is processed once per device.
- The old `capture-complete` UI signal is no longer used.
- Each device captures its own local camera frame for that exact `captureId`.
- The exact JPEG frame is transferred through an ordered WebRTC data channel (`usbooth-capture-v2`) in chunks.
- The review editor opens only after both exact frames for the same `captureId` exist locally.
- Duplicate popup openings are guarded by `openedCaptureIdsRef`.
- Signal polling uses an inclusive timestamp cursor (`gte`) plus client-side signal IDs to avoid missing signals created at the same timestamp.

### Templates
- All 24 template IDs are defined once in `lib/templates/templates.ts`.
- Template visual identity lives in `lib/templates/template-styles.ts`.
- Template selection made during booth creation is normalized and stored in `booth_settings.default_template`.
- The booth session returns that stored template.
- Live preview displays template-specific colour/chrome.
- The editor popup displays template-specific colour/chrome.
- Final JPEG rendering uses the selected template.
- Memory records store the selected template and template metadata.
- The public Templates page uses the same 24-template source of truth and visual palettes.

### Final photo quality
- Default filter is neutral instead of automatically washing the image out.
- Final JPEG quality is increased to 0.96.
- Template-specific palette/chrome is baked into the exported photo.
- JOINED layouts use a thinner blended centre seam rather than thick independent borders.
- Rendering lives in `lib/photo/renderer.ts`.

### Memories
- Existing owner-only GET behaviour retained.
- Delete memory is owner-scoped and cascades to its asset through the schema.
- Edit title is owner-scoped.
- Download remains explicit; saving to Memories does not trigger a download.
- Fullscreen memory preview added.
- Template/layout/privacy/metadata are displayed in the viewer.
- Memory asset dimensions are recorded when saved.
- Memory count is shown on the account page.
- The database remains the persistence layer, so memories survive logout/login.

### Booth/account UX
- Booth creation now exposes all 24 templates rather than a six-item subset.
- Mobile template buttons are single-column and constrained to the viewport.
- The missing `/api/booths/joined` endpoint is implemented so the account page can load joined rooms safely.
- The account page's template query parameter preserves the canonical lowercase template ID.
- The booth session route reads the template from `booth_settings` rather than a non-existent `booths.template` field.

### Code organization
- `components/booth/` contains presentation components such as the save popup, editor controls, and camera shutter.
- `lib/templates/` contains template data and visual definitions.
- `lib/photo/` contains final image rendering.
- `lib/booth/` contains capture protocol/types.
- The duplicate frontend files under `app/api/booths/[boothId]/` were moved into `docs/archive/api-booth-legacy/` so API routes are not mixed with frontend pages.
- The architecture flowchart is stored at `docs/architecture/usbooth-architecture-flowchart.png`.

## Verification note

A complete Next.js production build could not be run in this environment because the repository has no installed `node_modules` and package installation could not complete here. TypeScript parsing of the changed source was checked; dependency-resolution errors are expected without the project's installed packages.

Before replacing the live GitHub branch, run:

```bash
npm install
npm run build
```

Then perform the two-device regression test: connect both devices, click shutter from either device, confirm one popup per device, confirm both previews contain the exact same capture cycle, change templates, capture again, save to Memories, log out/in, and verify the memory metadata/download/delete/title flows.
