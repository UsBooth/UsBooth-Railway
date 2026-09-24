export type TemplatePlan = "FREE" | "PLUS" | "PRO";

export type BoothTemplate = readonly [string, string, string, TemplatePlan];

// Curated from the final template reference set. The split is intentionally
// weighted toward Free so the basic product still feels complete.
export const BOOTH_TEMPLATES = [
  ["classic-love-collage", "Classic Love Collage", "Romantic", "FREE"],
  ["pink-bow-memories", "Pink Bow Memories", "Cute", "FREE"],
  ["red-love-note", "Red Love Note", "Scrapbook", "FREE"],
  ["vintage-lace", "Vintage Lace", "Vintage", "FREE"],
  ["retro-polaroid", "Retro Polaroid", "Retro", "FREE"],
  ["classic-red-polaroids", "Classic Red Polaroids", "Instant", "FREE"],
  ["blue-floral", "Blue Floral", "Floral", "FREE"],
  ["pink-cd", "Pink CD", "Y2K", "FREE"],
  ["black-white-stars", "Black & White Stars", "Monochrome", "FREE"],
  ["vintage-film-strip", "Vintage Film Strip", "Analog", "FREE"],
  ["blue-retro-camera", "Blue Retro Camera", "Retro", "FREE"],
  ["green-memories", "Green Memories", "Nostalgic", "FREE"],
  ["picnic-memories", "Picnic Memories", "Playful", "FREE"],
  ["pink-green-childhood", "Pink & Green Childhood", "Cute", "FREE"],
  ["handmade-doodle", "Handmade Doodle", "Doodle", "FREE"],
  ["simple-pink-frames", "Simple Pink Frames", "Minimal", "FREE"],
  ["retro-sun", "Retro Sun", "Summer", "FREE"],
  ["travel-scrapbook", "Travel Scrapbook", "Travel", "FREE"],

  ["leopard-lace", "Leopard Lace", "Editorial", "PLUS"],
  ["leopard-contact-sheet", "Leopard Contact Sheet", "Editorial", "PLUS"],
  ["red-record-player", "Red Record Player", "Music", "PLUS"],
  ["cherry-camera", "Cherry Camera", "Retro", "PLUS"],
  ["black-music-collage", "Black Music Collage", "Music", "PLUS"],
  ["pink-music-diary", "Pink Music Diary", "Dreamy", "PLUS"],
  ["swan-memories", "Swan Memories", "Cinematic", "PLUS"],
  ["blue-camera-collage", "Blue Camera Collage", "Denim", "PLUS"],
  ["pinboard-memories", "Pinboard Memories", "Scrapbook", "PLUS"],
  ["retro-tv-frames", "Retro TV Frames", "Retro", "PLUS"],
  ["pastel-camera-roll", "Pastel Camera Roll", "Pastel", "PLUS"],
  ["floral-polaroid-stack", "Floral Polaroid Stack", "Floral", "PLUS"],
  ["red-gingham-camera", "Red Gingham Camera", "Cute", "PLUS"],
  ["cute-sticker-album", "Cute Sticker Album", "Sticker", "PLUS"],

  ["love-story-editorial", "Love Story Editorial", "Editorial", "PRO"],
  ["about-you", "About You", "Newspaper", "PRO"],
  ["retro-tv-stack", "Retro TV Stack", "Pop", "PRO"],
  ["japanese-retro-camera", "Japanese Retro Camera", "Nostalgic", "PRO"],
  ["midnight-romance", "Midnight Romance", "Romantic", "PRO"],
  ["analog-music", "Analog Music", "Monochrome", "PRO"],
  ["dreamy-vinyl", "Dreamy Vinyl", "Dreamy", "PRO"],
  ["retro-pinboard", "Retro Pinboard", "Memory", "PRO"],
  ["y2k-pop-collage", "Y2K Pop Collage", "Y2K", "PRO"],
  ["comic-pop", "Comic Pop", "Comic", "PRO"],
] as const satisfies readonly BoothTemplate[];

export type BoothTemplateId = typeof BOOTH_TEMPLATES[number][0];

export type TemplatePreset = {
  layout: "JOINED" | "STACKED" | "STRIP" | "GRID" | "FILM";
  frame: "NONE" | "CREAM" | "ROSE" | "FILM" | "DARK" | "BLUSH" | "LACE" | "DOUBLE" | "POSTCARD";
  filter: "NONE" | "WARM" | "SOFT" | "BW" | "VINTAGE" | "FADE" | "ROSE" | "DUSK" | "GOLD" | "MATTE";
  background: "CREAM" | "BLUSH" | "PAPER" | "DUSK";
  polaroid: boolean;
  spacing: "TIGHT" | "RELAXED";
  captionPosition: "BOTTOM" | "TOP" | "OVERLAY";
};

const TEMPLATE_PRESETS: Record<string, TemplatePreset> = {
  "classic-love-collage": { layout: "GRID", frame: "CREAM", filter: "SOFT", background: "CREAM", polaroid: false, spacing: "RELAXED", captionPosition: "BOTTOM" },
  "pink-bow-memories": { layout: "STACKED", frame: "BLUSH", filter: "ROSE", background: "BLUSH", polaroid: false, spacing: "RELAXED", captionPosition: "BOTTOM" },
  "red-love-note": { layout: "STRIP", frame: "ROSE", filter: "WARM", background: "BLUSH", polaroid: false, spacing: "TIGHT", captionPosition: "BOTTOM" },
  "vintage-lace": { layout: "STACKED", frame: "LACE", filter: "VINTAGE", background: "PAPER", polaroid: false, spacing: "RELAXED", captionPosition: "BOTTOM" },
  "retro-polaroid": { layout: "STACKED", frame: "CREAM", filter: "VINTAGE", background: "CREAM", polaroid: true, spacing: "RELAXED", captionPosition: "BOTTOM" },
  "classic-red-polaroids": { layout: "STACKED", frame: "ROSE", filter: "WARM", background: "BLUSH", polaroid: true, spacing: "RELAXED", captionPosition: "BOTTOM" },
  "blue-floral": { layout: "GRID", frame: "CREAM", filter: "SOFT", background: "CREAM", polaroid: false, spacing: "RELAXED", captionPosition: "BOTTOM" },
  "pink-cd": { layout: "STRIP", frame: "BLUSH", filter: "ROSE", background: "BLUSH", polaroid: false, spacing: "TIGHT", captionPosition: "BOTTOM" },
  "black-white-stars": { layout: "FILM", frame: "DARK", filter: "BW", background: "DUSK", polaroid: false, spacing: "TIGHT", captionPosition: "OVERLAY" },
  "vintage-film-strip": { layout: "FILM", frame: "FILM", filter: "VINTAGE", background: "DUSK", polaroid: false, spacing: "TIGHT", captionPosition: "BOTTOM" },
  "blue-retro-camera": { layout: "GRID", frame: "CREAM", filter: "FADE", background: "PAPER", polaroid: false, spacing: "RELAXED", captionPosition: "BOTTOM" },
  "green-memories": { layout: "GRID", frame: "CREAM", filter: "SOFT", background: "CREAM", polaroid: false, spacing: "RELAXED", captionPosition: "BOTTOM" },
  "picnic-memories": { layout: "GRID", frame: "BLUSH", filter: "WARM", background: "PAPER", polaroid: false, spacing: "RELAXED", captionPosition: "BOTTOM" },
  "pink-green-childhood": { layout: "GRID", frame: "LACE", filter: "SOFT", background: "BLUSH", polaroid: false, spacing: "RELAXED", captionPosition: "BOTTOM" },
  "handmade-doodle": { layout: "GRID", frame: "NONE", filter: "FADE", background: "PAPER", polaroid: false, spacing: "RELAXED", captionPosition: "BOTTOM" },
  "simple-pink-frames": { layout: "STACKED", frame: "CREAM", filter: "SOFT", background: "BLUSH", polaroid: false, spacing: "TIGHT", captionPosition: "BOTTOM" },
  "retro-sun": { layout: "STRIP", frame: "ROSE", filter: "GOLD", background: "BLUSH", polaroid: false, spacing: "TIGHT", captionPosition: "BOTTOM" },
  "travel-scrapbook": { layout: "GRID", frame: "POSTCARD", filter: "FADE", background: "PAPER", polaroid: false, spacing: "RELAXED", captionPosition: "BOTTOM" },
  "leopard-lace": { layout: "GRID", frame: "LACE", filter: "WARM", background: "PAPER", polaroid: false, spacing: "RELAXED", captionPosition: "BOTTOM" },
  "leopard-contact-sheet": { layout: "GRID", frame: "CREAM", filter: "WARM", background: "PAPER", polaroid: false, spacing: "TIGHT", captionPosition: "BOTTOM" },
  "red-record-player": { layout: "FILM", frame: "ROSE", filter: "VINTAGE", background: "BLUSH", polaroid: false, spacing: "RELAXED", captionPosition: "BOTTOM" },
  "cherry-camera": { layout: "GRID", frame: "ROSE", filter: "WARM", background: "BLUSH", polaroid: false, spacing: "RELAXED", captionPosition: "BOTTOM" },
  "black-music-collage": { layout: "GRID", frame: "DARK", filter: "BW", background: "DUSK", polaroid: false, spacing: "RELAXED", captionPosition: "BOTTOM" },
  "pink-music-diary": { layout: "JOINED", frame: "BLUSH", filter: "ROSE", background: "BLUSH", polaroid: false, spacing: "RELAXED", captionPosition: "OVERLAY" },
  "swan-memories": { layout: "GRID", frame: "CREAM", filter: "SOFT", background: "CREAM", polaroid: true, spacing: "RELAXED", captionPosition: "BOTTOM" },
  "blue-camera-collage": { layout: "GRID", frame: "CREAM", filter: "FADE", background: "PAPER", polaroid: false, spacing: "RELAXED", captionPosition: "BOTTOM" },
  "pinboard-memories": { layout: "GRID", frame: "POSTCARD", filter: "VINTAGE", background: "PAPER", polaroid: true, spacing: "RELAXED", captionPosition: "BOTTOM" },
  "retro-tv-frames": { layout: "STACKED", frame: "ROSE", filter: "VINTAGE", background: "BLUSH", polaroid: false, spacing: "RELAXED", captionPosition: "BOTTOM" },
  "pastel-camera-roll": { layout: "FILM", frame: "CREAM", filter: "SOFT", background: "CREAM", polaroid: false, spacing: "TIGHT", captionPosition: "BOTTOM" },
  "floral-polaroid-stack": { layout: "STACKED", frame: "LACE", filter: "SOFT", background: "CREAM", polaroid: true, spacing: "RELAXED", captionPosition: "BOTTOM" },
  "red-gingham-camera": { layout: "GRID", frame: "ROSE", filter: "WARM", background: "BLUSH", polaroid: false, spacing: "RELAXED", captionPosition: "BOTTOM" },
  "cute-sticker-album": { layout: "GRID", frame: "BLUSH", filter: "SOFT", background: "BLUSH", polaroid: false, spacing: "RELAXED", captionPosition: "BOTTOM" },
  "love-story-editorial": { layout: "GRID", frame: "LACE", filter: "SOFT", background: "BLUSH", polaroid: false, spacing: "RELAXED", captionPosition: "TOP" },
  "about-you": { layout: "GRID", frame: "DARK", filter: "BW", background: "DUSK", polaroid: false, spacing: "TIGHT", captionPosition: "TOP" },
  "retro-tv-stack": { layout: "STACKED", frame: "ROSE", filter: "VINTAGE", background: "BLUSH", polaroid: false, spacing: "RELAXED", captionPosition: "BOTTOM" },
  "japanese-retro-camera": { layout: "GRID", frame: "CREAM", filter: "VINTAGE", background: "PAPER", polaroid: false, spacing: "RELAXED", captionPosition: "BOTTOM" },
  "midnight-romance": { layout: "STRIP", frame: "DARK", filter: "DUSK", background: "DUSK", polaroid: false, spacing: "TIGHT", captionPosition: "OVERLAY" },
  "analog-music": { layout: "GRID", frame: "DARK", filter: "BW", background: "DUSK", polaroid: false, spacing: "RELAXED", captionPosition: "BOTTOM" },
  "dreamy-vinyl": { layout: "GRID", frame: "CREAM", filter: "SOFT", background: "CREAM", polaroid: true, spacing: "RELAXED", captionPosition: "BOTTOM" },
  "retro-pinboard": { layout: "GRID", frame: "POSTCARD", filter: "FADE", background: "PAPER", polaroid: true, spacing: "RELAXED", captionPosition: "BOTTOM" },
  "y2k-pop-collage": { layout: "GRID", frame: "BLUSH", filter: "ROSE", background: "BLUSH", polaroid: false, spacing: "RELAXED", captionPosition: "OVERLAY" },
  "comic-pop": { layout: "GRID", frame: "CREAM", filter: "GOLD", background: "PAPER", polaroid: false, spacing: "RELAXED", captionPosition: "BOTTOM" },
};

export function getTemplatePreset(id: string): TemplatePreset {
  return TEMPLATE_PRESETS[id] ?? TEMPLATE_PRESETS["classic-love-collage"];
}

export function getTemplateName(id: string) {
  return BOOTH_TEMPLATES.find(([templateId]) => templateId === id)?.[1] ?? "Classic Love Collage";
}

export function getTemplateTag(id: string) {
  return BOOTH_TEMPLATES.find(([templateId]) => templateId === id)?.[2] ?? "Romantic";
}

export function getTemplateRequiredPlan(id: string): TemplatePlan {
  return BOOTH_TEMPLATES.find(([templateId]) => templateId === id)?.[3] ?? "FREE";
}

export function isValidTemplate(id: string) {
  return BOOTH_TEMPLATES.some(([templateId]) => templateId === id);
}
