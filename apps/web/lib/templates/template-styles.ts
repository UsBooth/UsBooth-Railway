export type TemplateStyle = {
  background: string;
  ink: string;
  accent: string;
  top: string;
  bottom: string;
  mark: string;
  border: string;
  dark?: boolean;
};

export const TEMPLATE_STYLES: Record<string, TemplateStyle> = {
  "classic-love-collage": { background: "#f7efe3", ink: "#4a342c", accent: "#b43d5b", top: "LOVE IS EVERYWHERE", bottom: "CLASSIC LOVE COLLAGE", mark: "♡", border: "#a66a78" },
  "pink-bow-memories": { background: "#f5d9e4", ink: "#51394a", accent: "#d33f78", top: "YOU'RE CUTE", bottom: "PINK BOW MEMORIES", mark: "🎀", border: "#c35a83" },
  "red-love-note": { background: "#f5e7d8", ink: "#4a2022", accent: "#c62f3d", top: "MY FAVORITE PERSON", bottom: "RED LOVE NOTE", mark: "♥", border: "#9f3039" },
  "vintage-lace": { background: "#efe8df", ink: "#4b413b", accent: "#8f6b55", top: "FOUND · KEPT · LOVED", bottom: "VINTAGE LACE", mark: "✿", border: "#9b806c" },
  "retro-polaroid": { background: "#e8dcc8", ink: "#3c4a45", accent: "#b45b2a", top: "INSTANT MEMORY", bottom: "RETRO POLAROID", mark: "▣", border: "#9f7655" },
  "classic-red-polaroids": { background: "#f2eee5", ink: "#4b2528", accent: "#b51f2f", top: "LOVE, ALWAYS", bottom: "CLASSIC RED POLAROIDS", mark: "♥", border: "#9e4247" },
  "blue-floral": { background: "#dceaf2", ink: "#243e56", accent: "#347da5", top: "MEMORY GARDEN", bottom: "BLUE FLORAL", mark: "✿", border: "#4d88a3" },
  "pink-cd": { background: "#eadcf4", ink: "#3d2c51", accent: "#a844a7", top: "PLAYLIST OF US", bottom: "PINK CD", mark: "✦", border: "#9b5ba4" },
  "black-white-stars": { background: "#17191d", ink: "#f4f1ea", accent: "#f0c84b", top: "AFTER HOURS", bottom: "BLACK & WHITE STARS", mark: "★", border: "#d8d3c8", dark: true },
  "vintage-film-strip": { background: "#3a2720", ink: "#f4eadb", accent: "#d58a43", top: "35MM MEMORIES", bottom: "VINTAGE FILM STRIP", mark: "35", border: "#c49368", dark: true },
  "blue-retro-camera": { background: "#cfe2ee", ink: "#173a52", accent: "#1976a8", top: "CAPTURED MOMENTS", bottom: "BLUE RETRO CAMERA", mark: "01", border: "#3e7899" },
  "green-memories": { background: "#dce8c9", ink: "#31482d", accent: "#5f8f4d", top: "A LITTLE MEMORY", bottom: "GREEN MEMORIES", mark: "✿", border: "#668a54" },
  "picnic-memories": { background: "#fff0cf", ink: "#4b3424", accent: "#e55b45", top: "GOOD DAYS", bottom: "PICNIC MEMORIES", mark: "♡", border: "#d26d51" },
  "pink-green-childhood": { background: "#f4e6d1", ink: "#36503b", accent: "#d85d87", top: "LITTLE MOMENTS", bottom: "PINK & GREEN CHILDHOOD", mark: "✿", border: "#8b9e62" },
  "handmade-doodle": { background: "#fff8df", ink: "#343a56", accent: "#ee6b52", top: "DRAWN BY US", bottom: "HANDMADE DOODLE", mark: "✦", border: "#4e78a2" },
  "simple-pink-frames": { background: "#f7e1e8", ink: "#4b3b43", accent: "#b93e73", top: "SWEET MOMENTS", bottom: "SIMPLE PINK FRAMES", mark: "♡", border: "#bd668e" },
  "retro-sun": { background: "#f3d39a", ink: "#503326", accent: "#e56d32", top: "SUNNY DAYS", bottom: "RETRO SUN", mark: "☀", border: "#d06b35" },
  "travel-scrapbook": { background: "#dbe8df", ink: "#2e4a46", accent: "#2f8a78", top: "POSTCARD FROM US", bottom: "TRAVEL SCRAPBOOK", mark: "✈", border: "#5b8277" },
  "leopard-lace": { background: "#e8d1a8", ink: "#3d2a22", accent: "#8d5b2e", top: "FAVORITE PERSON", bottom: "LEOPARD LACE", mark: "★", border: "#8f6d42" },
  "leopard-contact-sheet": { background: "#f0dfbd", ink: "#402a20", accent: "#b86a2d", top: "CONTACT SHEET", bottom: "LEOPARD CONTACT SHEET", mark: "04", border: "#99633c" },
  "red-record-player": { background: "#f0d4c7", ink: "#3b2020", accent: "#d32736", top: "PLAY IT AGAIN", bottom: "RED RECORD PLAYER", mark: "♪", border: "#9f353e" },
  "cherry-camera": { background: "#fff0e5", ink: "#3b2522", accent: "#d5223e", top: "SWEET SHOTS", bottom: "CHERRY CAMERA", mark: "●", border: "#b83a45" },
  "black-music-collage": { background: "#111317", ink: "#f4efe5", accent: "#e7b84b", top: "MUSIC & MEMORIES", bottom: "BLACK MUSIC COLLAGE", mark: "♪", border: "#a9a59b", dark: true },
  "pink-music-diary": { background: "#f1d8e8", ink: "#432d43", accent: "#8d45a8", top: "PLAYLIST OF US", bottom: "PINK MUSIC DIARY", mark: "♫", border: "#9b5d91" },
  "swan-memories": { background: "#d9eef0", ink: "#294a56", accent: "#5c93a2", top: "MOONLIGHT MEMORY", bottom: "SWAN MEMORIES", mark: "✦", border: "#6c8d98" },
  "blue-camera-collage": { background: "#d7e7f4", ink: "#263d58", accent: "#2869a1", top: "CAPTURED", bottom: "BLUE CAMERA COLLAGE", mark: "✦", border: "#4f789f" },
  "pinboard-memories": { background: "#d7c6aa", ink: "#49382c", accent: "#d05a38", top: "TIME FLIES", bottom: "PINBOARD MEMORIES", mark: "📌", border: "#8c725b" },
  "retro-tv-frames": { background: "#e6d1b4", ink: "#382e2b", accent: "#e4573e", top: "BOOM!", bottom: "RETRO TV FRAMES", mark: "★", border: "#a95c48" },
  "pastel-camera-roll": { background: "#e6f0e6", ink: "#39465a", accent: "#6f8fc4", top: "GOOD VIBES", bottom: "PASTEL CAMERA ROLL", mark: "♡", border: "#7186a6" },
  "floral-polaroid-stack": { background: "#f0eadc", ink: "#3c4b38", accent: "#6c9b5a", top: "SWEET MOMENTS", bottom: "FLORAL POLAROID STACK", mark: "✿", border: "#7e8e67" },
  "red-gingham-camera": { background: "#f7dfd5", ink: "#4c2024", accent: "#d52f3b", top: "SMILE!", bottom: "RED GINGHAM CAMERA", mark: "♡", border: "#ad343c" },
  "cute-sticker-album": { background: "#e4efd2", ink: "#3c4a36", accent: "#f08b38", top: "CAPTURED MOMENTS", bottom: "CUTE STICKER ALBUM", mark: "✿", border: "#c36c45" },
  "love-story-editorial": { background: "#efe2d6", ink: "#2d2a28", accent: "#7b2436", top: "A LOVE STORY", bottom: "LOVE STORY EDITORIAL", mark: "♡", border: "#7e4350" },
  "about-you": { background: "#eee9dc", ink: "#202a33", accent: "#2e6172", top: "ABOUT YOU", bottom: "ABOUT YOU", mark: "01", border: "#4a6872" },
  "retro-tv-stack": { background: "#c9e1dd", ink: "#2a3736", accent: "#d54d3e", top: "RETRO REWIND", bottom: "RETRO TV STACK", mark: "03", border: "#a74e43" },
  "japanese-retro-camera": { background: "#e8e0c9", ink: "#3d3b34", accent: "#c85d3f", top: "TOKYO MEMORY", bottom: "JAPANESE RETRO CAMERA", mark: "✦", border: "#866c56" },
  "midnight-romance": { background: "#171d35", ink: "#f2e8df", accent: "#c83f67", top: "ONLY US", bottom: "MIDNIGHT ROMANCE", mark: "♥", border: "#8e4963", dark: true },
  "analog-music": { background: "#20252a", ink: "#f2eee6", accent: "#58a6a6", top: "ANALOG / PLAY", bottom: "ANALOG MUSIC", mark: "♪", border: "#708b8d", dark: true },
  "dreamy-vinyl": { background: "#d9d6ef", ink: "#38344f", accent: "#7356b5", top: "DREAM A LITTLE", bottom: "DREAMY VINYL", mark: "✦", border: "#76669e" },
  "retro-pinboard": { background: "#e5c7a0", ink: "#433127", accent: "#e05c35", top: "TIME FLIES", bottom: "RETRO PINBOARD", mark: "📌", border: "#9a6547" },
  "y2k-pop-collage": { background: "#d8f0ff", ink: "#372b55", accent: "#f03c9e", top: "KEEP SMILING", bottom: "Y2K POP COLLAGE", mark: "★", border: "#8d5eb5" },
  "comic-pop": { background: "#fff1b8", ink: "#20272f", accent: "#ef3f35", top: "COOL! COOL! COOL!", bottom: "COMIC POP", mark: "!", border: "#d43d35" },
};

export function getTemplateStyle(id: string): TemplateStyle {
  return TEMPLATE_STYLES[id] ?? TEMPLATE_STYLES["classic-love-collage"];
};
