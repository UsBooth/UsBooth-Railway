import type { FaceEffectId } from "./face-effects";

export type FaceLandmark = { x: number; y: number; z?: number };
type Point = { x: number; y: number };

type FaceGeometry = {
  leftEye: Point;
  rightEye: Point;
  nose: Point;
  mouth: Point;
  chin: Point;
  forehead: Point;
  leftCheek: Point;
  rightCheek: Point;
  center: Point;
  faceWidth: number;
  faceHeight: number;
  eyeDistance: number;
  angle: number;
};

function point(landmarks: FaceLandmark[], index: number, width: number, height: number, mirror: boolean): Point {
  const item = landmarks[index] ?? { x: 0.5, y: 0.5 };
  return {
    x: (mirror ? 1 - item.x : item.x) * width,
    y: item.y * height,
  };
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function geometry(landmarks: FaceLandmark[], width: number, height: number, mirror: boolean): FaceGeometry {
  const leftEye = point(landmarks, 33, width, height, mirror);
  const rightEye = point(landmarks, 263, width, height, mirror);
  const nose = point(landmarks, 1, width, height, mirror);
  const mouth = point(landmarks, 13, width, height, mirror);
  const chin = point(landmarks, 152, width, height, mirror);
  const forehead = point(landmarks, 10, width, height, mirror);
  const leftCheek = point(landmarks, 234, width, height, mirror);
  const rightCheek = point(landmarks, 454, width, height, mirror);
  const faceWidth = Math.max(1, distance(leftCheek, rightCheek));
  const faceHeight = Math.max(1, distance(forehead, chin));
  const eyeDistance = Math.max(1, distance(leftEye, rightEye));
  return {
    leftEye,
    rightEye,
    nose,
    mouth,
    chin,
    forehead,
    leftCheek,
    rightCheek,
    center: { x: (leftCheek.x + rightCheek.x) / 2, y: (forehead.y + chin.y) / 2 },
    faceWidth,
    faceHeight,
    eyeDistance,
    angle: Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x),
  };
}

function pathRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, stroke?: string, lineWidth = 1) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function withFaceRotation(ctx: CanvasRenderingContext2D, center: Point, angle: number, draw: () => void) {
  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.rotate(angle);
  draw();
  ctx.restore();
}

function roundedBadge(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, stroke: string) {
  pathRoundRect(ctx, x, y, w, h, h * 0.28);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = Math.max(1.5, h * 0.045);
  ctx.stroke();
}

function drawGlasses(ctx: CanvasRenderingContext2D, g: FaceGeometry, lensFill: string, frame: string, lensScale = 1) {
  const d = g.eyeDistance;
  const lensW = d * 0.58 * lensScale;
  const lensH = d * 0.38 * lensScale;
  const bridge = d * 0.08;
  withFaceRotation(ctx, { x: (g.leftEye.x + g.rightEye.x) / 2, y: (g.leftEye.y + g.rightEye.y) / 2 }, g.angle, () => {
    ctx.lineWidth = Math.max(2, d * 0.045);
    const drawLens = (x: number) => {
      pathRoundRect(ctx, x - lensW / 2, -lensH / 2, lensW, lensH, lensH * 0.28);
      ctx.fillStyle = lensFill;
      ctx.fill();
      ctx.strokeStyle = frame;
      ctx.stroke();
    };
    drawLens(-d * 0.5);
    drawLens(d * 0.5);
    ctx.strokeStyle = frame;
    ctx.beginPath();
    ctx.moveTo(-d * 0.15, 0);
    ctx.lineTo(d * 0.15, 0);
    ctx.stroke();
    ctx.lineWidth = Math.max(2, d * 0.03);
    ctx.beginPath();
    ctx.moveTo(-d * 0.86, -lensH * 0.15);
    ctx.lineTo(-d * 0.98, -lensH * 0.22);
    ctx.moveTo(d * 0.86, -lensH * 0.15);
    ctx.lineTo(d * 0.98, -lensH * 0.22);
    ctx.stroke();
  });
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, fill: string, stroke?: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, size * 0.35);
  ctx.bezierCurveTo(-size * 0.8, -size * 0.15, -size * 0.52, -size * 0.75, 0, -size * 0.3);
  ctx.bezierCurveTo(size * 0.52, -size * 0.75, size * 0.8, -size * 0.15, 0, size * 0.35);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = Math.max(1.5, size * 0.06);
    ctx.stroke();
  }
  ctx.restore();
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, outer: number, fill: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 0 ? outer : outer * 0.42;
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

function drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, fill: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.quadraticCurveTo(size * 0.22, -size * 0.22, size, 0);
  ctx.quadraticCurveTo(size * 0.22, size * 0.22, 0, size);
  ctx.quadraticCurveTo(-size * 0.22, size * 0.22, -size, 0);
  ctx.quadraticCurveTo(-size * 0.22, -size * 0.22, 0, -size);
  ctx.fill();
  ctx.restore();
}

function drawEar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, inner: string, angle: number) {
  withFaceRotation(ctx, { x, y }, angle, () => {
    ctx.beginPath();
    ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = "rgba(40,20,18,.5)";
    ctx.lineWidth = Math.max(2, w * 0.08);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, h * 0.04, w * 0.48, h * 0.72, 0, 0, Math.PI * 2);
    ctx.fillStyle = inner;
    ctx.fill();
  });
}

function drawCrown(ctx: CanvasRenderingContext2D, g: FaceGeometry) {
  const w = g.faceWidth * 0.98;
  const h = g.faceHeight * 0.38;
  withFaceRotation(ctx, { x: g.center.x, y: g.forehead.y - g.faceHeight * 0.16 }, g.angle, () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, h * 0.22);
    ctx.lineTo(-w * 0.42, -h * 0.16);
    ctx.lineTo(-w * 0.16, h * 0.02);
    ctx.lineTo(0, -h * 0.5);
    ctx.lineTo(w * 0.16, h * 0.02);
    ctx.lineTo(w * 0.42, -h * 0.16);
    ctx.lineTo(w * 0.5, h * 0.22);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, -h * 0.5, 0, h * 0.3);
    gradient.addColorStop(0, "#ffe69a");
    gradient.addColorStop(1, "#dca83f");
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = "#8f6426";
    ctx.lineWidth = Math.max(2, w * 0.025);
    ctx.stroke();
    [0, -w * 0.27, w * 0.27].forEach((x, i) => {
      ellipse(ctx, x, i === 0 ? -h * 0.2 : -h * 0.02, w * 0.045, w * 0.045, i === 0 ? "#f06b76" : "#77b7d9", "#8f6426", 1.5);
    });
  });
}

function drawHalo(ctx: CanvasRenderingContext2D, g: FaceGeometry) {
  withFaceRotation(ctx, { x: g.center.x, y: g.forehead.y - g.faceHeight * 0.34 }, g.angle, () => {
    ctx.beginPath();
    ctx.ellipse(0, 0, g.faceWidth * 0.43, g.faceWidth * 0.11, 0, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffe28a";
    ctx.lineWidth = Math.max(4, g.faceWidth * 0.035);
    ctx.shadowColor = "rgba(255,220,115,.75)";
    ctx.shadowBlur = g.faceWidth * 0.08;
    ctx.stroke();
  });
}

export function drawFaceEffect(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  landmarks: FaceLandmark[],
  effectId: FaceEffectId,
  mirror = false,
) {
  if (effectId === "none" || landmarks.length < 100) return;

  const g = geometry(landmarks, width, height, mirror);
  const w = g.faceWidth;
  const h = g.faceHeight;
  const d = g.eyeDistance;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  switch (effectId) {
    case "classic-sunglasses":
      drawGlasses(ctx, g, "rgba(17,20,27,.94)", "#11151b", 1.12);
      break;
    case "nerd-glasses":
      drawGlasses(ctx, g, "rgba(244,237,221,.22)", "#4a322d", 1.22);
      break;
    case "heart-glasses": {
      withFaceRotation(ctx, { x: (g.leftEye.x + g.rightEye.x) / 2, y: (g.leftEye.y + g.rightEye.y) / 2 }, g.angle, () => {
        drawHeart(ctx, -d * 0.5, 0, d * 0.34, "rgba(236,89,119,.94)", "#8f394e");
        drawHeart(ctx, d * 0.5, 0, d * 0.34, "rgba(236,89,119,.94)", "#8f394e");
        ctx.strokeStyle = "#8f394e";
        ctx.lineWidth = Math.max(2, d * 0.035);
        ctx.beginPath(); ctx.moveTo(-d * 0.17, 0); ctx.lineTo(d * 0.17, 0); ctx.stroke();
      });
      break;
    }
    case "retro-shades":
      drawGlasses(ctx, g, "rgba(72,44,37,.93)", "#d69a69", 1.38);
      break;
    case "cat-ears":
      drawEar(ctx, g.center.x - w * 0.38, g.forehead.y - h * 0.27, w * 0.16, h * 0.28, "#d98c9b", "#f4c4cf", g.angle - 0.16);
      drawEar(ctx, g.center.x + w * 0.38, g.forehead.y - h * 0.27, w * 0.16, h * 0.28, "#d98c9b", "#f4c4cf", g.angle + 0.16);
      break;
    case "bear-ears":
      drawEar(ctx, g.center.x - w * 0.39, g.forehead.y - h * 0.15, w * 0.17, w * 0.17, "#916650", "#d8a38e", g.angle);
      drawEar(ctx, g.center.x + w * 0.39, g.forehead.y - h * 0.15, w * 0.17, w * 0.17, "#916650", "#d8a38e", g.angle);
      break;
    case "bunny-ears":
      drawEar(ctx, g.center.x - w * 0.26, g.forehead.y - h * 0.36, w * 0.13, h * 0.36, "#f0b8c5", "#ffdbe4", g.angle - 0.08);
      drawEar(ctx, g.center.x + w * 0.26, g.forehead.y - h * 0.36, w * 0.13, h * 0.36, "#f0b8c5", "#ffdbe4", g.angle + 0.08);
      break;
    case "devil-horns":
      withFaceRotation(ctx, g.center, g.angle, () => {
        [-w * 0.36, w * 0.36].forEach((x) => {
          ctx.beginPath();
          ctx.moveTo(x - w * 0.11, -h * 0.24);
          ctx.quadraticCurveTo(x - w * 0.09, -h * 0.54, x + w * 0.02, -h * 0.42);
          ctx.quadraticCurveTo(x + w * 0.13, -h * 0.53, x + w * 0.11, -h * 0.24);
          ctx.closePath();
          ctx.fillStyle = "#bf3f4f";
          ctx.fill();
          ctx.strokeStyle = "#702832";
          ctx.lineWidth = Math.max(2, w * 0.025);
          ctx.stroke();
        });
      });
      break;
    case "royal-crown": drawCrown(ctx, g); break;
    case "halo": drawHalo(ctx, g); break;
    case "graduation-cap":
      withFaceRotation(ctx, { x: g.center.x, y: g.forehead.y - h * 0.25 }, g.angle, () => {
        const cw = w * 0.98;
        const ch = cw * 0.3;
        ctx.beginPath(); ctx.moveTo(-cw * .5, 0); ctx.lineTo(0, -ch); ctx.lineTo(cw * .5, 0); ctx.lineTo(0, ch); ctx.closePath();
        ctx.fillStyle = "#24242b"; ctx.fill(); ctx.strokeStyle = "#b99755"; ctx.lineWidth = Math.max(2, cw * .018); ctx.stroke();
        ctx.fillRect(-cw * .29, ch * .08, cw * .58, ch * .38);
        ctx.beginPath(); ctx.moveTo(cw * .22, ch * .08); ctx.lineTo(cw * .34, ch * .5); ctx.stroke();
        ellipse(ctx, cw * .34, ch * .52, cw * .035, cw * .035, "#e1b85e");
      });
      break;
    case "party-hat":
      withFaceRotation(ctx, { x: g.center.x, y: g.forehead.y - h * .18 }, g.angle, () => {
        const pw = w * .48;
        ctx.beginPath(); ctx.moveTo(-pw * .52, 0); ctx.lineTo(0, -pw * 1.25); ctx.lineTo(pw * .52, 0); ctx.closePath();
        const gradient = ctx.createLinearGradient(0, -pw * 1.25, 0, 0); gradient.addColorStop(0, "#f28a91"); gradient.addColorStop(1, "#bb5e69");
        ctx.fillStyle = gradient; ctx.fill(); ctx.strokeStyle = "#6e3940"; ctx.lineWidth = Math.max(2, pw * .045); ctx.stroke();
        [0.25,0.55,0.78].forEach((p, i) => ellipse(ctx, -pw*.35 + p*pw*.7, -pw*1.25 + p*pw*1.25, pw*.035, pw*.035, i % 2 ? "#f4d36e" : "#8dc6d2"));
        ellipse(ctx, 0, -pw * 1.3, pw*.09, pw*.09, "#f4d36e", "#a26e38", 1.5);
      });
      break;
    case "cartoon-moustache":
      withFaceRotation(ctx, g.nose, g.angle, () => {
        const mw = w * .25;
        ctx.fillStyle = "#4a302b";
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-mw*.9,-mw*.5,-mw*1.2,mw*.45,0,mw*.12); ctx.bezierCurveTo(mw*1.2,mw*.45,mw*.9,-mw*.5,0,0); ctx.fill();
      });
      break;
    case "disguise":
      drawGlasses(ctx, g, "rgba(255,255,255,.08)", "#272127", 1.04);
      withFaceRotation(ctx, g.nose, g.angle, () => {
        ellipse(ctx, 0, h*.035, w*.07, h*.065, "#d28c78", "#70443d", 2);
        ctx.fillStyle = "#4a302b"; ctx.beginPath(); ctx.moveTo(0,h*.05); ctx.quadraticCurveTo(-w*.14,h*.11,0,h*.14); ctx.quadraticCurveTo(w*.14,h*.11,0,h*.05); ctx.fill();
      });
      break;
    case "blush":
    case "embarrassed":
      ellipse(ctx, g.leftCheek.x, g.leftCheek.y, w*.13, h*.045, "rgba(244,112,132,.34)");
      ellipse(ctx, g.rightCheek.x, g.rightCheek.y, w*.13, h*.045, "rgba(244,112,132,.34)");
      if (effectId === "embarrassed") {
        withFaceRotation(ctx, g.center, g.angle, () => {
          ctx.strokeStyle = "#db7181"; ctx.lineWidth = Math.max(2, w*.018);
          [-w*.34,w*.34].forEach((x) => { ctx.beginPath(); ctx.moveTo(x-w*.035, h*.015); ctx.lineTo(x+w*.035,h*.08); ctx.stroke(); });
        });
      }
      break;
    case "cartoon-tears":
      [g.leftEye,g.rightEye].forEach((eye) => {
        ctx.beginPath(); ctx.moveTo(eye.x,eye.y+d*.2); ctx.bezierCurveTo(eye.x-d*.12,eye.y+d*.45,eye.x+d*.12,eye.y+d*.55,eye.x,eye.y+d*.75); ctx.bezierCurveTo(eye.x-d*.15,eye.y+d*.55,eye.x-d*.15,eye.y+d*.35,eye.x,eye.y+d*.2); ctx.closePath(); ctx.fillStyle="#70c8f4"; ctx.fill(); ctx.strokeStyle="#3f8db8"; ctx.lineWidth=2; ctx.stroke();
      });
      break;
    case "star-eyes":
      drawStar(ctx,g.leftEye.x,g.leftEye.y,d*.34,"#ffd45d"); drawStar(ctx,g.rightEye.x,g.rightEye.y,d*.34,"#ffd45d"); break;
    case "heart-eyes":
      drawHeart(ctx,g.leftEye.x,g.leftEye.y,d*.35,"#e9576e"); drawHeart(ctx,g.rightEye.x,g.rightEye.y,d*.35,"#e9576e"); break;
    case "face-sparkles":
    case "glitter-face":
      drawSparkle(ctx,g.leftCheek.x-w*.13,g.leftCheek.y-h*.08,w*.055,"#f6d98a");
      drawSparkle(ctx,g.rightCheek.x+w*.13,g.rightCheek.y-h*.08,w*.055,"#f6d98a");
      drawSparkle(ctx,g.forehead.x,g.forehead.y-h*.08,w*.07,"#fff0b0");
      if (effectId === "glitter-face") {
        drawSparkle(ctx,g.leftCheek.x-w*.22,g.leftCheek.y+h*.03,w*.035,"#e7b5dc");
        drawSparkle(ctx,g.rightCheek.x+w*.22,g.rightCheek.y+h*.03,w*.035,"#b9d8e8");
      }
      break;
    case "kiss-marks":
      drawHeart(ctx,g.leftCheek.x-w*.08,g.leftCheek.y,w*.09,"#d85c70"); drawHeart(ctx,g.rightCheek.x+w*.08,g.rightCheek.y,w*.09,"#d85c70"); break;
    case "bunny-face":
      ellipse(ctx,g.nose.x,g.nose.y+h*.035,w*.055,h*.045,"#b96f83","#6d404a",1.5);
      ctx.strokeStyle="#8d5261"; ctx.lineWidth=Math.max(1.5,w*.012);
      [-1,1].forEach((side)=>{ctx.beginPath();ctx.moveTo(g.nose.x+side*w*.05,g.mouth.y);ctx.lineTo(g.nose.x+side*w*.22,g.mouth.y-h*.025);ctx.stroke();ctx.beginPath();ctx.moveTo(g.nose.x+side*w*.05,g.mouth.y+h*.015);ctx.lineTo(g.nose.x+side*w*.23,g.mouth.y+h*.055);ctx.stroke();});
      break;
    case "puppy-face":
      drawEar(ctx,g.center.x-w*.4,g.forehead.y-h*.05,w*.2,h*.28,"#9a6b57","#d8a891",g.angle-.22);
      drawEar(ctx,g.center.x+w*.4,g.forehead.y-h*.05,w*.2,h*.28,"#9a6b57","#d8a891",g.angle+.22);
      ellipse(ctx,g.nose.x,g.nose.y+h*.035,w*.075,h*.055,"#3c2a29");
      break;
    case "butterfly-face":
      withFaceRotation(ctx,g.center,g.angle,()=>{
        drawHeart(ctx,-w*.27,-h*.03,w*.10,"#8f7de0"); drawHeart(ctx,w*.27,-h*.03,w*.10,"#8f7de0");
        ellipse(ctx,0,-h*.03,w*.018,h*.09,"#4f446e");
      });
      break;
    case "dizzy-face":
      drawStar(ctx,g.center.x-w*.43,g.forehead.y-h*.28,w*.07,"#f3d477"); drawStar(ctx,g.center.x+w*.43,g.forehead.y-h*.18,w*.055,"#f3d477"); break;
    case "party-confetti":
    case "love-burst": {
      const items = effectId === "love-burst" ? ["heart","heart","heart","heart"] : ["star","dot","star","dot","star","dot"];
      const spots = [[-.48,-.25],[.48,-.23],[-.54,.04],[.54,.08],[-.36,.26],[.38,.28]];
      spots.forEach(([sx,sy],i)=>{
        const x=g.center.x+w*sx, y=g.center.y+h*sy;
        if(items[i]==="heart") drawHeart(ctx,x,y,w*.055,i%2?"#e95c75":"#f38da0");
        else if(items[i]==="star") drawStar(ctx,x,y,w*.045,"#f2c86d");
        else ellipse(ctx,x,y,w*.025,w*.025,"#8fc4d1");
      });
      break;
    }
    case "frost-face":
      drawSparkle(ctx,g.leftCheek.x,g.leftCheek.y-h*.04,w*.075,"#bde8ff"); drawSparkle(ctx,g.rightCheek.x,g.rightCheek.y-h*.04,w*.075,"#bde8ff"); break;
    case "electric-face":
      withFaceRotation(ctx,g.center,g.angle,()=>{
        ctx.strokeStyle="#f5d14c"; ctx.lineWidth=Math.max(2,w*.025); ctx.beginPath(); ctx.moveTo(-w*.5,0);ctx.lineTo(-w*.4,-h*.15);ctx.lineTo(-w*.28,-h*.02);ctx.lineTo(-w*.17,-h*.17);ctx.stroke();
        ctx.beginPath(); ctx.moveTo(w*.5,0);ctx.lineTo(w*.4,-h*.15);ctx.lineTo(w*.28,-h*.02);ctx.lineTo(w*.17,-h*.17);ctx.stroke();
      });
      break;
    case "fire-head":
      withFaceRotation(ctx,g.center,g.angle,()=>{
        const fw=w*.45; const fy=-h*.34;
        ctx.beginPath();ctx.moveTo(-fw,fy+h*.1);ctx.quadraticCurveTo(-fw*.9,fy-h*.1,-fw*.45,fy-h*.28);ctx.quadraticCurveTo(-fw*.48,fy-h*.5,-fw*.1,fy-h*.36);ctx.quadraticCurveTo(0,fy-h*.62,fw*.08,fy-h*.3);ctx.quadraticCurveTo(fw*.42,fy-h*.48,fw*.46,fy-h*.12);ctx.quadraticCurveTo(fw*.7,fy+h*.02,fw,fy+h*.1);ctx.closePath();ctx.fillStyle="#ef744f";ctx.fill();ctx.strokeStyle="#9f4735";ctx.lineWidth=Math.max(2,w*.02);ctx.stroke();
      });
      break;
    case "goofy-face":
      ellipse(ctx,g.leftEye.x,g.leftEye.y,d*.29,d*.34,"#fff","#282226",Math.max(2,d*.035)); ellipse(ctx,g.rightEye.x,g.rightEye.y,d*.22,d*.38,"#fff","#282226",Math.max(2,d*.035));
      ellipse(ctx,g.leftEye.x+d*.03,g.leftEye.y+d*.02,d*.095,d*.13,"#2e2530"); ellipse(ctx,g.rightEye.x-d*.02,g.rightEye.y+d*.03,d*.075,d*.11,"#2e2530");
      ellipse(ctx,g.nose.x,g.nose.y+h*.02,w*.105,h*.08,"#ef9e8c","#75433c",2);
      withFaceRotation(ctx,g.mouth,g.angle,()=>{ctx.fillStyle="#d76b76";ctx.beginPath();ctx.ellipse(0,h*.015,w*.13,h*.055,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#7b3c48";ctx.lineWidth=2;ctx.stroke();});
      break;
    case "big-eyes":
      ellipse(ctx,g.leftEye.x,g.leftEye.y,d*.28,d*.33,"#fff","#30262a",Math.max(2,d*.035)); ellipse(ctx,g.rightEye.x,g.rightEye.y,d*.28,d*.33,"#fff","#30262a",Math.max(2,d*.035));
      ellipse(ctx,g.leftEye.x,g.leftEye.y+d*.02,d*.095,d*.13,"#5a93d0"); ellipse(ctx,g.rightEye.x,g.rightEye.y+d*.02,d*.095,d*.13,"#5a93d0");
      break;
    case "big-nose":
      ellipse(ctx,g.nose.x,g.nose.y+h*.025,w*.16,h*.115,"#eea08f","#75443d",Math.max(2,w*.018));
      ellipse(ctx,g.nose.x-w*.045,g.nose.y+h*.025,w*.025,h*.02,"rgba(255,255,255,.45)"); break;
    case "duck-face":
      withFaceRotation(ctx,g.mouth,g.angle,()=>{ellipse(ctx,0,0,w*.15,h*.075,"#db6f7a","#873e49",2);ellipse(ctx,-w*.045,-h*.005,w*.055,h*.03,"#f6a5ad");}); break;
    case "angry-face":
      withFaceRotation(ctx,g.center,g.angle,()=>{ctx.strokeStyle="#9c404a";ctx.lineWidth=Math.max(3,w*.032);ctx.beginPath();ctx.moveTo(-w*.46,-h*.06);ctx.lineTo(-w*.22,-h*.15);ctx.moveTo(w*.46,-h*.06);ctx.lineTo(w*.22,-h*.15);ctx.stroke();});
      ctx.strokeStyle="#9c404a";ctx.lineWidth=Math.max(2,w*.018);ctx.beginPath();ctx.arc(g.mouth.x,g.mouth.y,w*.09,0,Math.PI);ctx.stroke(); break;
    case "alien-face":
      withFaceRotation(ctx,g.center,g.angle,()=>{ellipse(ctx,-d*.5,0,d*.31,d*.18,"#1e2630","#79d6d1",Math.max(2,d*.04));ellipse(ctx,d*.5,0,d*.31,d*.18,"#1e2630","#79d6d1",Math.max(2,d*.04));ellipse(ctx,-d*.5,0,d*.1,d*.11,"#d4fff8");ellipse(ctx,d*.5,0,d*.1,d*.11,"#d4fff8");});
      break;
    case "camera-flash":
      ctx.fillStyle="rgba(255,250,238,.20)";ctx.fillRect(0,0,width,height);
      roundedBadge(ctx,g.center.x-w*.24,g.forehead.y-h*.32,w*.48,h*.11,"rgba(255,255,255,.88)","rgba(120,80,60,.35)");
      ctx.fillStyle="#6b4a45";ctx.font=`800 ${Math.round(w*.075)}px Arial,sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("FLASH!",g.center.x,g.forehead.y-h*.265);break;
    case "retro-advanced-cartoon":
      withFaceRotation(ctx,g.center,g.angle,()=>{ctx.strokeStyle="rgba(255,255,255,.82)";ctx.lineWidth=Math.max(2,w*.018);ctx.beginPath();ctx.ellipse(0,0,w*.53,h*.52,0,0,Math.PI*2);ctx.stroke();drawStar(ctx,-w*.38,-h*.38,w*.06,"#f0c24f");drawStar(ctx,w*.38,-h*.32,w*.05,"#e76b7d");});
      roundedBadge(ctx,g.center.x-w*.18,g.forehead.y-h*.25,w*.36,h*.105,"#f4cf65","#8d6630");ctx.fillStyle="#553c36";ctx.font=`800 ${Math.round(w*.06)}px Arial,sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("WOW!",g.center.x,g.forehead.y-h*.198);break;
    default:
      break;
  }

  ctx.restore();
}
