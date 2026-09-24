export type FaceEffectPlan = "FREE" | "PLUS" | "PRO";

export type FaceEffect = {
  id: string;
  name: string;
  description: string;
  plan: FaceEffectPlan;
  kind: "ACCESSORY" | "DECORATION" | "DISTORTION" | "ANIMATION";
};

export const FACE_EFFECTS = [
  { id: "none", name: "None", description: "Keep your face completely natural.", plan: "FREE", kind: "ACCESSORY" },
  { id: "classic-sunglasses", name: "Classic Sunglasses", description: "Dark sunglasses that follow the eyes.", plan: "FREE", kind: "ACCESSORY" },
  { id: "nerd-glasses", name: "Nerd Glasses", description: "Oversized round glasses with a playful look.", plan: "FREE", kind: "ACCESSORY" },
  { id: "bunny-ears", name: "Bunny Ears", description: "Cartoon bunny ears attached above the head.", plan: "FREE", kind: "ACCESSORY" },
  { id: "cat-ears", name: "Cat Ears", description: "Cute cat ears that follow head movement.", plan: "FREE", kind: "ACCESSORY" },
  { id: "bear-ears", name: "Bear Ears", description: "Rounded bear ears for a soft cartoon look.", plan: "FREE", kind: "ACCESSORY" },
  { id: "cartoon-moustache", name: "Cartoon Moustache", description: "A playful moustache anchored under the nose.", plan: "FREE", kind: "ACCESSORY" },
  { id: "blush", name: "Blush", description: "Soft pink cartoon blush on the cheeks.", plan: "FREE", kind: "DECORATION" },
  { id: "cartoon-tears", name: "Cartoon Tears", description: "Exaggerated tears under the eyes.", plan: "FREE", kind: "DECORATION" },
  { id: "face-sparkles", name: "Face Sparkles", description: "Small sparkles around the face.", plan: "FREE", kind: "DECORATION" },
  { id: "party-hat", name: "Party Hat", description: "A colourful party hat that follows the head.", plan: "FREE", kind: "ACCESSORY" },
  { id: "halo", name: "Halo", description: "A glowing halo floating above the head.", plan: "FREE", kind: "ACCESSORY" },
  { id: "royal-crown", name: "Royal Crown", description: "A crown scaled and rotated with the head.", plan: "FREE", kind: "ACCESSORY" },
  { id: "graduation-cap", name: "Graduation Cap", description: "A graduation cap anchored above the head.", plan: "FREE", kind: "ACCESSORY" },
  { id: "heart-glasses", name: "Heart Glasses", description: "Heart-shaped glasses following the eyes.", plan: "FREE", kind: "ACCESSORY" },
  { id: "bunny-face", name: "Bunny Face", description: "Bunny nose and whiskers with ears.", plan: "FREE", kind: "DECORATION" },
  { id: "puppy-face", name: "Puppy Face", description: "Puppy ears, nose and a tiny tongue.", plan: "FREE", kind: "DECORATION" },
  { id: "butterfly-face", name: "Butterfly Face", description: "Butterflies decorate the cheeks and temples.", plan: "FREE", kind: "DECORATION" },

  { id: "retro-shades", name: "Retro Shades", description: "Large vintage sunglasses with head tracking.", plan: "PLUS", kind: "ACCESSORY" },
  { id: "devil-horns", name: "Devil Horns", description: "Small cartoon horns above the head.", plan: "PLUS", kind: "ACCESSORY" },
  { id: "disguise", name: "Disguise", description: "Glasses, fake nose and moustache together.", plan: "PLUS", kind: "ACCESSORY" },
  { id: "embarrassed", name: "Embarrassed", description: "Pink cheeks with expressive cartoon marks.", plan: "PLUS", kind: "DECORATION" },
  { id: "star-eyes", name: "Star Eyes", description: "Bright cartoon stars over the eyes.", plan: "PLUS", kind: "DECORATION" },
  { id: "heart-eyes", name: "Heart Eyes", description: "Hearts replace the eye highlights.", plan: "PLUS", kind: "DECORATION" },
  { id: "kiss-marks", name: "Kiss Marks", description: "Decorative kiss marks around the cheeks.", plan: "PLUS", kind: "DECORATION" },
  { id: "glitter-face", name: "Glitter Face", description: "Glitter particles around facial landmarks.", plan: "PLUS", kind: "ANIMATION" },
  { id: "dizzy-face", name: "Dizzy Face", description: "Cartoon stars orbit around the head.", plan: "PLUS", kind: "ANIMATION" },
  { id: "party-confetti", name: "Party Confetti", description: "Confetti and tiny balloons around the head.", plan: "PLUS", kind: "ANIMATION" },
  { id: "frost-face", name: "Frost Face", description: "Snowflakes and frosty accents around the face.", plan: "PLUS", kind: "DECORATION" },
  { id: "electric-face", name: "Electric Face", description: "Cartoon lightning accents around the head.", plan: "PLUS", kind: "ANIMATION" },
  { id: "fire-head", name: "Fire Head", description: "Stylised cartoon flames above the head.", plan: "PLUS", kind: "ANIMATION" },

  { id: "goofy-face", name: "Goofy Face", description: "Exaggerated facial proportions for a silly look.", plan: "PRO", kind: "DISTORTION" },
  { id: "big-eyes", name: "Big Eyes", description: "Playfully enlarged cartoon eyes.", plan: "PRO", kind: "DISTORTION" },
  { id: "big-nose", name: "Big Nose", description: "Cartoonishly enlarged nose.", plan: "PRO", kind: "DISTORTION" },
  { id: "duck-face", name: "Duck Face", description: "A funny cartoon-style mouth distortion.", plan: "PRO", kind: "DISTORTION" },
  { id: "angry-face", name: "Angry Face", description: "Exaggerated angry eyebrows and expression marks.", plan: "PRO", kind: "DISTORTION" },
  { id: "alien-face", name: "Alien Face", description: "Playful alien eyes with a sci-fi face treatment.", plan: "PRO", kind: "DISTORTION" },
  { id: "love-burst", name: "Love Burst", description: "Hearts burst outward around the face.", plan: "PRO", kind: "ANIMATION" },
  { id: "camera-flash", name: "Camera Flash", description: "A dramatic flash-style snapshot effect.", plan: "PRO", kind: "ANIMATION" },
  { id: "retro-advanced-cartoon", name: "Retro/Advanced Cartoon Face", description: "A stylised comic face treatment with multiple accents.", plan: "PRO", kind: "DISTORTION" },
] as const satisfies readonly FaceEffect[];

export type FaceEffectId = typeof FACE_EFFECTS[number]["id"];

export function getFaceEffect(id: string) {
  return FACE_EFFECTS.find((effect) => effect.id === id) ?? FACE_EFFECTS[0];
}

export function getFaceEffectRequiredPlan(id: string): FaceEffectPlan {
  return getFaceEffect(id).plan;
}
