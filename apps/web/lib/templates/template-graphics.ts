
export type TemplatePhotoSlot = {
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
  radius?: number;
  polaroid?: boolean;
  label?: string;
  shape?: "rect" | "rounded" | "ellipse";
  objectPosition?: string;
};

export type GraphicRect = TemplatePhotoSlot;

export type TemplateTextSlot = {
  id: string;
  kind: "names" | "title" | "subtitle" | "caption" | "date";
  x: number;
  y: number;
  w: number;
  h: number;
  align?: CanvasTextAlign;
  font?: string;
  color?: string;
  background?: string;
  radius?: number;
  mask?: boolean;
};

export type TemplateArtwork = {
  background: string;
  foreground: string;
  photoRects: GraphicRect[];
  textSlots?: TemplateTextSlot[];
  drawBackground?: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  drawForeground?: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
};

const inset = (w:number,h:number,x:number,y:number,ww:number,hh:number,rotation=0,radius=0) => ({x:w*x,y:h*y,w:w*ww,h:h*hh,rotation,radius});

function rr(ctx: CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number=12){const q=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+q,y);ctx.lineTo(x+w-q,y);ctx.quadraticCurveTo(x+w,y,x+w,y+q);ctx.lineTo(x+w,y+h-q);ctx.quadraticCurveTo(x+w,y+h,x+w-q,y+h);ctx.lineTo(x+q,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-q);ctx.lineTo(x,y+q);ctx.quadraticCurveTo(x,y,x+q,y);ctx.closePath();}
function fillRR(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,c:string){ctx.save();ctx.fillStyle=c;rr(ctx,x,y,w,h,r);ctx.fill();ctx.restore();}
function strokeRR(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,c:string,l=2){ctx.save();ctx.strokeStyle=c;ctx.lineWidth=l;rr(ctx,x,y,w,h,r);ctx.stroke();ctx.restore();}
function rect(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,c:string){ctx.save();ctx.fillStyle=c;ctx.fillRect(x,y,w,h);ctx.restore();}
function line(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,c:string,l=2){ctx.save();ctx.strokeStyle=c;ctx.lineWidth=l;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.restore();}
function circle(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,c:string){ctx.save();ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.restore();}
function ellipse(ctx:CanvasRenderingContext2D,x:number,y:number,rx:number,ry:number,c:string,rot=0){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.restore();}
function strokeCircle(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,c:string,l=2){ctx.save();ctx.strokeStyle=c;ctx.lineWidth=l;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();ctx.restore();}
function heart(ctx:CanvasRenderingContext2D,x:number,y:number,s:number,c:string){ctx.save();ctx.translate(x,y);ctx.scale(s/100,s/100);ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(0,78);ctx.bezierCurveTo(-92,18,-55,-35,0,5);ctx.bezierCurveTo(55,-35,92,18,0,78);ctx.fill();ctx.restore();}
function bow(ctx:CanvasRenderingContext2D,x:number,y:number,s:number,c:string){ctx.save();ctx.translate(x,y);ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(-s*.36,0,s*.42,s*.28,-.2,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(s*.36,0,s*.42,s*.28,.2,0,Math.PI*2);ctx.fill();circle(ctx,0,0,s*.14,c);ctx.restore();}
function star(ctx:CanvasRenderingContext2D,x:number,y:number,s:number,c:string){ctx.save();ctx.fillStyle=c;ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?s*.42:s;const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fill();ctx.restore();}
function flower(ctx:CanvasRenderingContext2D,x:number,y:number,s:number,p:string,center:string){for(let i=0;i<6;i++){const a=i*Math.PI/3;circle(ctx,x+Math.cos(a)*s*.38,y+Math.sin(a)*s*.38,s*.27,p);}circle(ctx,x,y,s*.2,center);}
function tape(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,c:string,r=0){ctx.save();ctx.translate(x,y);ctx.rotate(r);ctx.globalAlpha=.8;ctx.fillStyle=c;ctx.fillRect(-w/2,-h/2,w,h);ctx.restore();}
function leaf(ctx:CanvasRenderingContext2D,x:number,y:number,s:number,c:string,r=0){ctx.save();ctx.translate(x,y);ctx.rotate(r);ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(0,0,s*.22,s*.48,0,0,Math.PI*2);ctx.fill();ctx.restore();}
function doodle(ctx:CanvasRenderingContext2D,x:number,y:number,s:number,c:string){ctx.save();ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-s,y);ctx.quadraticCurveTo(x-s*.3,y-s,x,y);ctx.quadraticCurveTo(x+s*.3,y+s,x+s,y);ctx.stroke();ctx.restore();}
function scallop(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,c:string){ctx.save();ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(x,y);for(let px=x;px<=x+w;px+=h){ctx.arc(px+h/2,y,h/2,Math.PI,0);}ctx.lineTo(x+w,y+h);ctx.lineTo(x,y+h);ctx.closePath();ctx.fill();ctx.restore();}
function gingham(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,base:string,lineC:string){rect(ctx,x,y,w,h,base);ctx.save();ctx.globalAlpha=.22;ctx.strokeStyle=lineC;ctx.lineWidth=10;for(let px=x;px<=x+w;px+=28)line(ctx,px,y,px,y+h,lineC,10);for(let py=y;py<=y+h;py+=28)line(ctx,x,py,x+w,py,lineC,10);ctx.restore();}
function leopard(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,base:string,spot:string){rect(ctx,x,y,w,h,base);ctx.save();ctx.globalAlpha=.28;for(let yy=y;yy<y+h;yy+=34)for(let xx=x;xx<x+w;xx+=42){ellipse(ctx,xx+12,yy+12,10,6,spot,.2);ellipse(ctx,xx+24,yy+24,7,4,spot,-.5);}ctx.restore();}
function filmFrame(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,c:string){rect(ctx,x,y,w,h,c);for(let px=x+10;px<x+w-5;px+=24){fillRR(ctx,px,y+5,10,9,2,"#eee3d3");fillRR(ctx,px,y+h-14,10,9,2,"#eee3d3");}}
function camera(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,c:string,a:string){fillRR(ctx,x-w/2,y-w*.28,w,w*.56,w*.09,c);fillRR(ctx,x-w*.28,y-w*.40,w*.28,w*.13,w*.03,a);circle(ctx,x,y,w*.19,a);circle(ctx,x,y,w*.10,c);}
function cd(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,a:string,b:string){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,"#fff");g.addColorStop(.18,a);g.addColorStop(.48,b);g.addColorStop(.75,a);g.addColorStop(1,"#d9d0d6");ctx.save();ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.restore();circle(ctx,x,y,r*.16,"#f8efe8");}
function vinyl(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,c:string,a:string){circle(ctx,x,y,r,c);for(let i=1;i<5;i++)strokeCircle(ctx,x,y,r*i/5,a,1);circle(ctx,x,y,r*.12,a);}
function pin(ctx:CanvasRenderingContext2D,x:number,y:number,c:string){circle(ctx,x,y,8,c);circle(ctx,x-2,y-3,2.5,"#fff");}
function newspaper(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,rows:number,c:string){for(let i=0;i<rows;i++)line(ctx,x,y+i*10,x+w*(.65+((i*17)%30)/100),y+i*10,c,1);}
function label(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,size:number,c:string,weight="700",align:CanvasTextAlign="left",font="Arial"){ctx.save();ctx.fillStyle=c;ctx.font=`${weight} ${size}px ${font}`;ctx.textAlign=align;ctx.fillText(text,x,y);ctx.restore();}
function polaroidBorder(ctx:CanvasRenderingContext2D,r:GraphicRect,c:string="#fffaf0"){ctx.save();ctx.translate(r.x+r.w/2,r.y+r.h/2);ctx.rotate(r.rotation||0);ctx.fillStyle=c;ctx.shadowColor="rgba(0,0,0,.18)";ctx.shadowBlur=12;ctx.fillRect(-r.w/2-7,-r.h/2-7,r.w+14,r.h+28);ctx.restore();}

function layout(width:number,height:number,id:string,count:number):GraphicRect[]{
  const W=width,H=height;
  const layouts:Record<string,GraphicRect[]>={
    "classic-love-collage":[{x:W*.08,y:H*.23,w:W*.50,h:H*.52,radius:18},{x:W*.61,y:H*.18,w:W*.29,h:H*.27,radius:14,rotation:-.025},{x:W*.61,y:H*.53,w:W*.29,h:H*.28,radius:14,rotation:.025}],
    "pink-bow-memories":[{x:W*.12,y:H*.22,w:W*.25,h:H*.61,radius:6,rotation:-.025},{x:W*.38,y:H*.19,w:W*.25,h:H*.65,radius:6,rotation:.01},{x:W*.65,y:H*.22,w:W*.23,h:H*.61,radius:6,rotation:.025}],
    "red-love-note":[{x:W*.49,y:H*.18,w:W*.40,h:H*.22,radius:3},{x:W*.49,y:H*.43,w:W*.40,h:H*.22,radius:3},{x:W*.49,y:H*.68,w:W*.40,h:H*.18,radius:3}],
    "vintage-lace":[{x:W*.13,y:H*.22,w:W*.74,h:H*.17,radius:2},{x:W*.13,y:H*.43,w:W*.74,h:H*.17,radius:2},{x:W*.13,y:H*.64,w:W*.74,h:H*.17,radius:2}],
    "retro-polaroid":[{x:W*.13,y:H*.27,w:W*.38,h:H*.39,rotation:-.07,polaroid:true},{x:W*.47,y:H*.35,w:W*.38,h:H*.39,rotation:.06,polaroid:true},{x:W*.29,y:H*.55,w:W*.38,h:H*.29,rotation:-.015,polaroid:true}],
    "classic-red-polaroids":[{x:W*.10,y:H*.19,w:W*.24,h:H*.58,rotation:-.04,polaroid:true},{x:W*.38,y:H*.15,w:W*.24,h:H*.62,rotation:.01,polaroid:true},{x:W*.66,y:H*.19,w:W*.24,h:H*.58,rotation:.04,polaroid:true}],
    "blue-floral":[{x:W*.08,y:H*.20,w:W*.25,h:H*.24},{x:W*.38,y:H*.20,w:W*.25,h:H*.24},{x:W*.68,y:H*.20,w:W*.24,h:H*.24},{x:W*.08,y:H*.49,w:W*.25,h:H*.24},{x:W*.38,y:H*.49,w:W*.25,h:H*.24}],
    "pink-cd":[{x:W*.18,y:H*.21,w:W*.25,h:H*.62,radius:14,rotation:-.04},{x:W*.46,y:H*.17,w:W*.25,h:H*.68,radius:14},{x:W*.74,y:H*.21,w:W*.25,h:H*.62,radius:14,rotation:.04}],
    "black-white-stars":[{x:W*.13,y:H*.22,w:W*.38,h:H*.42,rotation:-.06,polaroid:true},{x:W*.49,y:H*.39,w:W*.38,h:H*.42,rotation:.06,polaroid:true},{x:W*.30,y:H*.26,w:W*.38,h:H*.42,rotation:.01,polaroid:true}],
    "vintage-film-strip":[{x:W*.14,y:H*.16,w:W*.72,h:H*.18},{x:W*.14,y:H*.38,w:W*.72,h:H*.18},{x:W*.14,y:H*.60,w:W*.72,h:H*.18},{x:W*.14,y:H*.82,w:W*.72,h:H*.10}],
    "blue-retro-camera":[{x:W*.14,y:H*.27,w:W*.72,h:H*.17,radius:12},{x:W*.14,y:H*.47,w:W*.72,h:H*.17,radius:12},{x:W*.14,y:H*.67,w:W*.72,h:H*.17,radius:12}],
    "green-memories":[{x:W*.10,y:H*.23,w:W*.34,h:H*.25,radius:18,rotation:-.02},{x:W*.55,y:H*.23,w:W*.34,h:H*.25,radius:18,rotation:.02},{x:W*.10,y:H*.54,w:W*.34,h:H*.25,radius:18,rotation:.02},{x:W*.55,y:H*.54,w:W*.34,h:H*.25,radius:18,rotation:-.02}],
    "picnic-memories":[{x:W*.12,y:H*.20,w:W*.76,h:H*.20,radius:18,rotation:-.02},{x:W*.12,y:H*.45,w:W*.36,h:H*.25,radius:18,rotation:.025},{x:W*.52,y:H*.45,w:W*.36,h:H*.25,radius:18,rotation:-.025}],
    "pink-green-childhood":[{x:W*.12,y:H*.20,w:W*.35,h:H*.25,radius:10,rotation:-.04},{x:W*.53,y:H*.20,w:W*.35,h:H*.25,radius:10,rotation:.04},{x:W*.12,y:H*.52,w:W*.35,h:H*.25,radius:10,rotation:.04},{x:W*.53,y:H*.52,w:W*.35,h:H*.25,radius:10,rotation:-.04}],
    "handmade-doodle":[{x:W*.12,y:H*.22,w:W*.34,h:H*.27,rotation:-.04},{x:W*.53,y:H*.20,w:W*.34,h:H*.27,rotation:.035},{x:W*.12,y:H*.55,w:W*.34,h:H*.27,rotation:.035},{x:W*.53,y:H*.53,w:W*.34,h:H*.27,rotation:-.04}],
    "simple-pink-frames":[{x:W*.14,y:H*.20,w:W*.72,h:H*.17,radius:4},{x:W*.14,y:H*.43,w:W*.72,h:H*.17,radius:4},{x:W*.14,y:H*.66,w:W*.72,h:H*.17,radius:4}],
    "retro-sun":[{x:W*.13,y:H*.25,w:W*.22,h:H*.55,radius:0,rotation:-.04},{x:W*.39,y:H*.20,w:W*.22,h:H*.60,radius:0},{x:W*.65,y:H*.25,w:W*.22,h:H*.55,radius:0,rotation:.04}],
    "travel-scrapbook":[{x:W*.10,y:H*.28,w:W*.36,h:H*.40,rotation:-.05},{x:W*.53,y:H*.23,w:W*.36,h:H*.30,rotation:.05},{x:W*.50,y:H*.57,w:W*.36,h:H*.28,rotation:-.03}],
    "leopard-lace":[{x:W*.10,y:H*.24,w:W*.36,h:H*.50,radius:5,rotation:-.025},{x:W*.54,y:H*.24,w:W*.36,h:H*.50,radius:5,rotation:.025},{x:W*.32,y:H*.42,w:W*.36,h:H*.36,radius:5}],
    "leopard-contact-sheet":[{x:W*.12,y:H*.20,w:W*.22,h:H*.58},{x:W*.39,y:H*.20,w:W*.22,h:H*.58},{x:W*.66,y:H*.20,w:W*.22,h:H*.58},{x:W*.25,y:H*.31,w:W*.22,h:H*.40},{x:W*.52,y:H*.31,w:W*.22,h:H*.40}],
    "red-record-player":[{x:W*.12,y:H*.24,w:W*.46,h:H*.22,radius:3},{x:W*.12,y:H*.51,w:W*.46,h:H*.22,radius:3},{x:W*.12,y:H*.78,w:W*.46,h:H*.13,radius:3}],
    "cherry-camera":[{x:W*.12,y:H*.23,w:W*.76,h:H*.19,radius:18,rotation:-.02},{x:W*.12,y:H*.46,w:W*.36,h:H*.25,radius:18,rotation:.03},{x:W*.52,y:H*.46,w:W*.36,h:H*.25,radius:18,rotation:-.03}],
    "black-music-collage":[{x:W*.10,y:H*.19,w:W*.42,h:H*.28,rotation:-.05},{x:W*.54,y:H*.25,w:W*.35,h:H*.22,rotation:.05},{x:W*.16,y:H*.54,w:W*.34,h:H*.25,rotation:.04},{x:W*.55,y:H*.58,w:W*.30,h:H*.25,rotation:-.04}],
    "pink-music-diary":[{x:W*.12,y:H*.22,w:W*.76,h:H*.18,radius:20},{x:W*.12,y:H*.45,w:W*.50,h:H*.27,radius:20,rotation:-.02},{x:W*.49,y:H*.61,w:W*.39,h:H*.23,radius:20,rotation:.04}],
    "swan-memories":[{x:W*.09,y:H*.20,w:W*.25,h:H*.55,rotation:-.04,polaroid:true},{x:W*.38,y:H*.18,w:W*.25,h:H*.59,rotation:.01,polaroid:true},{x:W*.67,y:H*.20,w:W*.25,h:H*.55,rotation:.04,polaroid:true}],
    "blue-camera-collage":[{x:W*.11,y:H*.21,w:W*.36,h:H*.28,rotation:-.03},{x:W*.53,y:H*.21,w:W*.36,h:H*.28,rotation:.03},{x:W*.21,y:H*.55,w:W*.58,h:H*.25,rotation:.01}],
    "pinboard-memories":[{x:W*.11,y:H*.22,w:W*.34,h:H*.25,rotation:-.05,polaroid:true},{x:W*.54,y:H*.20,w:W*.34,h:H*.25,rotation:.05,polaroid:true},{x:W*.20,y:H*.52,w:W*.34,h:H*.25,rotation:.04,polaroid:true},{x:W*.55,y:H*.55,w:W*.28,h:H*.23,rotation:-.04,polaroid:true}],
    "retro-tv-frames":[{x:W*.12,y:H*.25,w:W*.36,h:H*.25,radius:10},{x:W*.52,y:H*.25,w:W*.36,h:H*.25,radius:10},{x:W*.32,y:H*.56,w:W*.36,h:H*.25,radius:10}],
    "pastel-camera-roll":[{x:W*.10,y:H*.17,w:W*.80,h:H*.17,radius:5},{x:W*.10,y:H*.38,w:W*.80,h:H*.17,radius:5},{x:W*.10,y:H*.59,w:W*.80,h:H*.17,radius:5},{x:W*.10,y:H*.80,w:W*.80,h:H*.10,radius:5}],
    "floral-polaroid-stack":[{x:W*.18,y:H*.22,w:W*.30,h:H*.44,rotation:-.07,polaroid:true},{x:W*.42,y:H*.29,w:W*.30,h:H*.44,rotation:.05,polaroid:true},{x:W*.30,y:H*.51,w:W*.30,h:H*.30,rotation:-.01,polaroid:true}],
    "red-gingham-camera":[{x:W*.12,y:H*.22,w:W*.76,h:H*.18,radius:14},{x:W*.12,y:H*.46,w:W*.36,h:H*.26,radius:14,rotation:-.03},{x:W*.52,y:H*.46,w:W*.36,h:H*.26,radius:14,rotation:.03}],
    "cute-sticker-album":[{x:W*.11,y:H*.20,w:W*.34,h:H*.28,radius:16,rotation:-.04},{x:W*.54,y:H*.20,w:W*.34,h:H*.28,radius:16,rotation:.04},{x:W*.11,y:H*.55,w:W*.34,h:H*.28,radius:16,rotation:.04},{x:W*.54,y:H*.55,w:W*.34,h:H*.28,radius:16,rotation:-.04}],
    "love-story-editorial":[{x:W*.10,y:H*.22,w:W*.52,h:H*.50},{x:W*.68,y:H*.22,w:W*.22,h:H*.22},{x:W*.68,y:H*.50,w:W*.22,h:H*.22}],
    "about-you":[{x:W*.12,y:H*.21,w:W*.48,h:H*.27},{x:W*.12,y:H*.54,w:W*.48,h:H*.27},{x:W*.65,y:H*.21,w:W*.23,h:H*.60}],
    "retro-tv-stack":[{x:W*.13,y:H*.23,w:W*.74,h:H*.18,radius:14},{x:W*.13,y:H*.46,w:W*.74,h:H*.18,radius:14},{x:W*.13,y:H*.69,w:W*.74,h:H*.14,radius:14}],
    "japanese-retro-camera":[{x:W*.12,y:H*.21,w:W*.76,h:H*.22,radius:3},{x:W*.12,y:H*.48,w:W*.36,h:H*.27,radius:3},{x:W*.52,y:H*.48,w:W*.36,h:H*.27,radius:3}],
    "midnight-romance":[{x:W*.10,y:H*.20,w:W*.80,h:H*.22,radius:24},{x:W*.10,y:H*.48,w:W*.38,h:H*.27,radius:24},{x:W*.52,y:H*.48,w:W*.38,h:H*.27,radius:24}],
    "analog-music":[{x:W*.11,y:H*.20,w:W*.36,h:H*.28},{x:W*.53,y:H*.20,w:W*.36,h:H*.28},{x:W*.21,y:H*.56,w:W*.58,h:H*.24}],
    "dreamy-vinyl":[{x:W*.12,y:H*.22,w:W*.32,h:H*.52,rotation:-.06,polaroid:true},{x:W*.36,y:H*.28,w:W*.32,h:H*.52,rotation:.02,polaroid:true},{x:W*.60,y:H*.22,w:W*.32,h:H*.52,rotation:.06,polaroid:true}],
    "retro-pinboard":[{x:W*.10,y:H*.20,w:W*.36,h:H*.26,rotation:-.05,polaroid:true},{x:W*.54,y:H*.19,w:W*.36,h:H*.26,rotation:.04,polaroid:true},{x:W*.18,y:H*.52,w:W*.30,h:H*.25,rotation:.03,polaroid:true},{x:W*.53,y:H*.55,w:W*.30,h:H*.22,rotation:-.04,polaroid:true}],
    "y2k-pop-collage":[{x:W*.09,y:H*.20,w:W*.36,h:H*.28,radius:22,rotation:-.06},{x:W*.54,y:H*.19,w:W*.36,h:H*.28,radius:22,rotation:.06},{x:W*.20,y:H*.55,w:W*.28,h:H*.25,radius:22,rotation:.05},{x:W*.52,y:H*.55,w:W*.28,h:H*.25,radius:22,rotation:-.05}],
    "comic-pop":[{x:W*.10,y:H*.21,w:W*.35,h:H*.27,radius:0,rotation:-.06},{x:W*.55,y:H*.19,w:W*.35,h:H*.27,radius:0,rotation:.06},{x:W*.20,y:H*.55,w:W*.60,h:H*.25,radius:0}],
  };
  // Keep every template-defined photo hole in the artwork registry. The renderer
  // decides how many captures to place; the live preview still needs to see the
  // remaining empty holes so the complete reference composition is visible.
  return layouts[id] || [{x:W*.1,y:H*.2,w:W*.8,h:H*.6,radius:10}];
}

export function getTemplatePhotoSlots(
  templateId: string,
  width: number,
  height: number
): TemplatePhotoSlot[] {
  return layout(width, height, templateId, 1).map((slot) => ({
    shape: slot.radius ? "rounded" : "rect",
    objectPosition: "center",
    ...slot,
  }));
}

/**
 * The number of photo holes in the template. This is deliberately separate
 * from simultaneous participant count because SOLO can fill slots sequentially.
 */
export function getTemplatePhotoSlotCount(templateId: string): number {
  return getTemplatePhotoSlots(templateId, 698, 1230).length;
}

/**
 * Backwards-compatible alias. Prefer getTemplatePhotoSlotCount() in new code.
 * A template's number of photo slots is not the same thing as the number of
 * simultaneous participants: SOLO booths can fill several slots sequentially.
 */
export function getTemplateParticipantCount(templateId: string): number {
  return getTemplatePhotoSlotCount(templateId);
}

export function traceTemplatePhotoSlot(
  ctx: CanvasRenderingContext2D,
  slot: TemplatePhotoSlot
) {
  const radius = Math.min(slot.radius ?? 0, slot.w / 2, slot.h / 2);
  const shape = slot.shape ?? (radius ? "rounded" : "rect");

  ctx.beginPath();

  if (shape === "ellipse") {
    ctx.ellipse(
      slot.x + slot.w / 2,
      slot.y + slot.h / 2,
      slot.w / 2,
      slot.h / 2,
      slot.rotation ?? 0,
      0,
      Math.PI * 2
    );
    return;
  }

  ctx.save();
  ctx.translate(slot.x + slot.w / 2, slot.y + slot.h / 2);
  ctx.rotate(slot.rotation ?? 0);

  const x = -slot.w / 2;
  const y = -slot.h / 2;

  if (shape === "rounded" && radius > 0) {
    const r = radius;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + slot.w - r, y);
    ctx.quadraticCurveTo(x + slot.w, y, x + slot.w, y + r);
    ctx.lineTo(x + slot.w, y + slot.h - r);
    ctx.quadraticCurveTo(x + slot.w, y + slot.h, x + slot.w - r, y + slot.h);
    ctx.lineTo(x + r, y + slot.h);
    ctx.quadraticCurveTo(x, y + slot.h, x, y + slot.h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  } else {
    ctx.rect(x, y, slot.w, slot.h);
  }

  ctx.closePath();
  ctx.restore();
}

export function traceTemplatePhotoSlotLocal(
  ctx: CanvasRenderingContext2D,
  slot: TemplatePhotoSlot
) {
  const radius = Math.min(slot.radius ?? 0, slot.w / 2, slot.h / 2);
  const shape = slot.shape ?? (radius ? "rounded" : "rect");
  const x = -slot.w / 2;
  const y = -slot.h / 2;

  ctx.beginPath();
  if (shape === "ellipse") {
    ctx.ellipse(0, 0, slot.w / 2, slot.h / 2, 0, 0, Math.PI * 2);
    return;
  }

  if (shape === "rounded" && radius > 0) {
    const r = radius;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + slot.w - r, y);
    ctx.quadraticCurveTo(x + slot.w, y, x + slot.w, y + r);
    ctx.lineTo(x + slot.w, y + slot.h - r);
    ctx.quadraticCurveTo(x + slot.w, y + slot.h, x + slot.w - r, y + slot.h);
    ctx.lineTo(x + r, y + slot.h);
    ctx.quadraticCurveTo(x, y + slot.h, x, y + slot.h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  } else {
    ctx.rect(x, y, slot.w, slot.h);
  }
  ctx.closePath();
}

function bgBase(ctx:CanvasRenderingContext2D,w:number,h:number,c:string){rect(ctx,0,0,w,h,c);}
function border(ctx:CanvasRenderingContext2D,w:number,h:number,c:string,l=3,m=22){ctx.save();ctx.strokeStyle=c;ctx.lineWidth=l;ctx.strokeRect(m,m,w-m*2,h-m*2);ctx.restore();}

function decorate(id:string,ctx:CanvasRenderingContext2D,w:number,h:number){
  switch(id){
    case "classic-love-collage":
      heart(ctx,72,72,42,"#c72f4a");heart(ctx,w-70,h-68,34,"#e06b79");flower(ctx,w-72,72,28,"#f0b8ad","#d28b58");label(ctx,"OUR LITTLE STORY",42,h-38,12,"#8b3b48","700","left","Georgia");break;
    case "pink-bow-memories":
      bow(ctx,w*.5,65,76,"#d83e83");bow(ctx,58,h-58,42,"#ef6da0");bow(ctx,w-58,h-58,42,"#ef6da0");for(let i=0;i<6;i++)star(ctx,35+i*70,115+(i%2)*20,5,"#f7a7c0");break;
    case "red-love-note":
      rect(ctx,28,92,w*.34,h-130,"#fff2e7");label(ctx,"DEAR YOU,",48,125,18,"#9b2738","700","left","Georgia");label(ctx,"favorite",48,153,15,"#b43b49","400","left","Georgia");label(ctx,"person",48,174,15,"#b43b49","400","left","Georgia");heart(ctx,62,h-72,26,"#c52e42");tape(ctx,w*.46,70,90,18,"#d6a79e",-.08);break;
    case "vintage-lace":
      scallop(ctx,0,0,w,34,"#f7f0e7");scallop(ctx,0,h-34,w,34,"#f7f0e7");for(let x=25;x<w;x+=36){circle(ctx,x,50,3,"#c89d8a");circle(ctx,x,h-50,3,"#c89d8a");}flower(ctx,42,70,24,"#d7a08f","#a56b5b");flower(ctx,w-42,h-70,24,"#d7a08f","#a56b5b");break;
    case "retro-polaroid":
      camera(ctx,w-72,66,72,"#d0643e","#f5dfc7");label(ctx,"INSTANT",40,58,10,"#7e4937","800");label(ctx,"MEMORY",40,72,10,"#7e4937","800");tape(ctx,75,h-55,74,18,"#d4b28e",-.08);break;
    case "classic-red-polaroids":
      rect(ctx,0,0,w,20,"#a7192e");rect(ctx,0,h-20,w,20,"#a7192e");heart(ctx,w-52,60,25,"#a7192e");heart(ctx,52,h-62,22,"#a7192e");break;
    case "blue-floral":
      for(let i=0;i<12;i++){const x=30+(i*73)%Math.max(80,w-50),y=42+(i*97)%Math.max(80,h-80);flower(ctx,x,y,13,"#5f8fb4","#e6c66f");leaf(ctx,x+12,y+14,12,"#759f79",.6);}break;
    case "pink-cd":
      cd(ctx,w-78,74,50,"#e27fae","#a6c9d9");cd(ctx,70,h-72,34,"#f1a4c5","#a7bfd5");label(ctx,"PLAYLIST 01",38,55,9,"#9a3d72","800");break;
    case "black-white-stars":
      for(let i=0;i<12;i++)star(ctx,28+(i*61)%w,48+(i*83)%Math.max(80,h-70),7+(i%3)*3,i%2?"#f5f0e7":"#8f8881");label(ctx,"NIGHT / 01",w-42,38,9,"#e9e2d9","800","right","monospace");break;
    case "vintage-film-strip":
      filmFrame(ctx,0,0,w,36,"#171414");filmFrame(ctx,0,h-36,w,36,"#171414");label(ctx,"35 MM",w/2,27,10,"#e8d9c7","800","center","monospace");label(ctx,"ROLL 01",w/2,h-14,9,"#e8d9c7","800","center","monospace");break;
    case "blue-retro-camera":
      fillRR(ctx,w-120,42,85,65,8,"#527f99");fillRR(ctx,w-108,52,61,40,5,"#dbe9e8");circle(ctx,w-77,72,14,"#527f99");circle(ctx,w-77,72,7,"#dbe9e8");label(ctx,"CAPTURED",40,58,10,"#416478","800");break;
    case "green-memories":
      for(let i=0;i<8;i++){leaf(ctx,45+i*75,55+(i%2)*20,17,"#78985d",(i%2)?.5:-.5);flower(ctx,52+i*80,h-55,16,"#a8bd7f","#d6ad62");}break;
    case "picnic-memories":
      gingham(ctx,0,0,w,34,"#f4e1bd","#d76a61");gingham(ctx,0,h-34,w,34,"#f4e1bd","#d76a61");circle(ctx,55,70,18,"#d76a61");circle(ctx,55,70,9,"#f4e1bd");label(ctx,"GOOD DAYS",w-42,58,11,"#9b4d43","800","right");break;
    case "pink-green-childhood":
      for(let i=0;i<7;i++)flower(ctx,35+i*92,48+(i%2)*18,14,i%2?"#9fbc79":"#e78ca5","#e4c36d");heart(ctx,w-60,h-55,26,"#e27799");break;
    case "handmade-doodle":
      ctx.save();ctx.setLineDash([7,5]);ctx.strokeStyle="#4e7fb4";ctx.lineWidth=3;ctx.strokeRect(24,48,w-48,h-92);ctx.restore();for(let i=0;i<5;i++){doodle(ctx,60+i*100,h-38,22,"#4e7fb4");star(ctx,52+i*105,72,9,"#e66b64");}break;
    case "simple-pink-frames":
      border(ctx,w,h,"#d67a98",2,20);bow(ctx,w-56,58,42,"#d67a98");label(ctx,"SWEET MOMENTS",w/2,55,10,"#9e526c","800","center","Georgia");break;
    case "retro-sun":
      circle(ctx,w-72,72,30,"#e66f3d");circle(ctx,w-72,72,18,"#f3bd52");for(let i=0;i<12;i++){const a=i*Math.PI/6;line(ctx,w-72+Math.cos(a)*38,72+Math.sin(a)*38,w-72+Math.cos(a)*52,72+Math.sin(a)*52,"#e66f3d",4);}label(ctx,"SUNNY DAYS",38,55,10,"#a94e37","800");break;
    case "travel-scrapbook":
      tape(ctx,70,56,82,18,"#e9d2a5",-.1);tape(ctx,w-75,h-58,82,18,"#e9d2a5",.08);strokeRR(ctx,w-130,48,90,66,2,"#a75e4c",2);label(ctx,"PAR AVION",w-123,68,8,"#a75e4c","800");label(ctx,"✉",w-105,98,20,"#a75e4c","700");break;
    case "leopard-lace":
      leopard(ctx,0,0,w,36,"#d8b27e","#5d4635");leopard(ctx,0,h-36,w,36,"#d8b27e","#5d4635");scallop(ctx,18,40,w-36,18,"#f2e8d9");scallop(ctx,18,h-58,w-36,18,"#f2e8d9");break;
    case "leopard-contact-sheet":
      leopard(ctx,0,0,w,42,"#cba16e","#49382c");for(let y=44;y<h-40;y+=30)line(ctx,24,y,w-24,y,"#9b7858",1);label(ctx,"CONTACT 05",w-30,h-20,9,"#5d4638","800","right","monospace");break;
    case "red-record-player":
      vinyl(ctx,w-74,76,54,"#2b2729","#b94b4e");circle(ctx,w-74,76,7,"#e7c7b7");label(ctx,"PLAY IT AGAIN",38,58,10,"#9e3e43","800");rect(ctx,38,h-62,120,3,"#9e3e43");break;
    case "cherry-camera":
      camera(ctx,w-76,68,82,"#b73749","#f5dfcf");for(let i=0;i<5;i++){circle(ctx,42+i*22,h-42-(i%2)*10,9,"#c33b4b");}line(ctx,42,h-34,70,h-56,"#5e7b4d",3);break;
    case "black-music-collage":
      vinyl(ctx,74,72,42,"#2c2929","#8d8781");for(let i=0;i<5;i++)line(ctx,w-110,48+i*13,w-42-(i%2)*12,48+i*13,"#b6aea4",2);label(ctx,"SIDE A",w-42,h-42,9,"#d8d0c7","800","right","monospace");break;
    case "pink-music-diary":
      cd(ctx,w-78,72,46,"#e18db7","#b7c9df");heart(ctx,62,70,24,"#d66b9c");for(let i=0;i<4;i++)line(ctx,42,h-72+i*10,w-42-(i%2)*30,h-72+i*10,"#d66b9c",2);break;
    case "swan-memories":
      ellipse(ctx,w-78,74,62,20,"#fff",-.15);flower(ctx,58,h-58,22,"#cba49a","#a6756e");for(let i=0;i<4;i++)line(ctx,30+i*34,52,52+i*34,44,"#8da9a5",2);break;
    case "blue-camera-collage":
      camera(ctx,w-78,72,88,"#557f9b","#e8e0d5");cd(ctx,64,h-65,28,"#79a7bb","#d8c47e");star(ctx,w-52,h-52,13,"#5f8ea8");break;
    case "pinboard-memories":
      pin(ctx,52,58,"#d15b51");pin(ctx,w-52,58,"#6c8490");pin(ctx,52,h-58,"#d2a15d");pin(ctx,w-52,h-58,"#7b6b5d");line(ctx,52,58,w-52,h-58,"#a18d7d",2);line(ctx,w-52,58,52,h-58,"#a18d7d",2);break;
    case "retro-tv-frames":
      fillRR(ctx,w-128,38,94,70,12,"#c05a4e");fillRR(ctx,w-113,50,64,44,6,"#e8d9c8");circle(ctx,w-43,58,5,"#6d4a42");line(ctx,w-81,108,w-81,121,"#c05a4e",6);break;
    case "pastel-camera-roll":
      camera(ctx,w-76,70,78,"#9b88a9","#efe1d9");for(let i=0;i<5;i++){circle(ctx,38+i*25,h-48,7,["#f0a2b9","#9ec1c6","#e5c37c","#a9c68b","#9e8db7"][i]);}label(ctx,"CAMERA ROLL",w/2,54,9,"#6d6170","800","center","monospace");break;
    case "floral-polaroid-stack":
      flower(ctx,48,60,25,"#9bb47d","#d3a66d");flower(ctx,w-48,h-60,28,"#d18f9d","#d6b36c");tape(ctx,78,54,66,16,"#d9ceb9",-.1);break;
    case "red-gingham-camera":
      gingham(ctx,0,0,w,h,"#f0cfc9","#bb3f49");camera(ctx,w-78,68,84,"#9d2837","#f5e3d7");bow(ctx,55,66,42,"#a92f3c");break;
    case "cute-sticker-album":
      heart(ctx,58,62,25,"#e6819c");star(ctx,w-58,62,17,"#e4bc5f");flower(ctx,58,h-60,22,"#a7bd82","#e0ad68");circle(ctx,w-62,h-60,16,"#8fb6c7");label(ctx,"STICKER CLUB",w/2,55,9,"#6c7460","900","center","Arial");break;
    case "love-story-editorial":
      rect(ctx,34,42,w-68,3,"#8d3d50");rect(ctx,34,h-42,w-68,3,"#8d3d50");label(ctx,"A LOVE STORY",38,76,25,"#6e3544","500","left","Georgia");label(ctx,"ISSUE 01",w-38,76,8,"#8d3d50","800","right","monospace");heart(ctx,w-58,h-64,28,"#a94f64");break;
    case "about-you":
      label(ctx,"ABOUT",38,62,34,"#222","900","left","Georgia");label(ctx,"YOU",38,94,34,"#222","900","left","Georgia");newspaper(ctx,w-180,50,140,7,"#77716a");line(ctx,38,110,w-38,110,"#333",2);label(ctx,"SPECIAL EDITION",w-38,h-28,8,"#444","800","right","monospace");break;
    case "retro-tv-stack":
      fillRR(ctx,34,42,w-68,82,15,"#a84643");fillRR(ctx,49,56,w-98,54,8,"#e8d8c6");label(ctx,"CHANNEL 03",w-48,75,8,"#8f443e","800","right","monospace");star(ctx,58,h-58,15,"#a84643");break;
    case "japanese-retro-camera":
      camera(ctx,w-78,70,84,"#8c6650","#e8ddca");label(ctx,"TOKYO",38,56,12,"#775744","900","left","monospace");label(ctx,"MEMORY",38,72,12,"#775744","900","left","monospace");tape(ctx,72,h-52,80,18,"#d8c7aa",-.08);circle(ctx,w-55,h-50,12,"#d7a06d");break;
    case "midnight-romance":
      for(let i=0;i<10;i++)heart(ctx,35+(i*73)%w,42+(i*91)%Math.max(90,h-70),8+(i%3)*3,"#d45c78");label(ctx,"AFTER DARK",w/2,62,11,"#efd9d6","800","center","monospace");break;
    case "analog-music":
      vinyl(ctx,76,72,45,"#252525","#aaa39b");label(ctx,"ANALOG / PLAY",w-38,60,10,"#d8d0c5","800","right","monospace");for(let i=0;i<4;i++)line(ctx,w-145,82+i*13,w-42-(i%2)*16,82+i*13,"#8e8880",2);break;
    case "dreamy-vinyl":
      vinyl(ctx,w-76,72,50,"#303435","#b88c96");ellipse(ctx,70,65,52,16,"#fff",-.2);flower(ctx,60,h-58,24,"#c89ba0","#d8b779");label(ctx,"DREAM A LITTLE",42,48,9,"#71636c","700","left","Georgia");break;
    case "retro-pinboard":
      pin(ctx,52,58,"#b55d52");pin(ctx,w-52,58,"#7d7a68");pin(ctx,52,h-58,"#d19b5f");pin(ctx,w-52,h-58,"#68828c");for(let i=0;i<4;i++)line(ctx,52,58,w-52,h-58,"#a48e78",1);break;
    case "y2k-pop-collage":
      cd(ctx,w-72,70,45,"#ec65b2","#5fd2dd");star(ctx,54,62,18,"#ffd34d");star(ctx,w-52,h-55,14,"#6e70dc");camera(ctx,76,h-66,70,"#db5b9c","#f7dfec");label(ctx,"2000+",w/2,55,12,"#7e3f9e","900","center","monospace");break;
    case "comic-pop":
      for(let i=0;i<16;i++){const a=i*Math.PI/8;line(ctx,w/2+Math.cos(a)*55,h/2+Math.sin(a)*55,w/2+Math.cos(a)*130,h/2+Math.sin(a)*130,i%2?"#e3483f":"#2e68bd",5);}star(ctx,54,62,22,"#f0c431");label(ctx,"WOW!",w-48,70,20,"#d63f3f","900","right","Arial");break;
  }
}

export function drawTemplateDynamicText(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  templateId: string,
  names: string[]
) {
  const cleanNames = names.map((name) => name.trim()).filter(Boolean).slice(0, 5);
  if (!cleanNames.length) return;

  const artwork = getTemplateArtwork(templateId, width, height, cleanNames.length);
  const slot = artwork.textSlots?.find((item) => item.kind === "names");
  if (!slot) return;

  const relation = cleanNames.length >= 2
    ? cleanNames.slice(0, 2).join("  ♡  ")
    : cleanNames[0];

  ctx.save();

  // Mask the editable text region first. This prevents sample names from the
  // reference artwork from surviving underneath the live participant names.
  if (slot.mask !== false) {
    ctx.fillStyle = slot.background ?? artwork.background;
    ctx.globalAlpha = 0.98;
    if (slot.radius) {
      fillRR(ctx, slot.x, slot.y, slot.w, slot.h, slot.radius, slot.background ?? artwork.background);
    } else {
      ctx.fillRect(slot.x, slot.y, slot.w, slot.h);
    }
  }

  ctx.globalAlpha = 1;
  ctx.fillStyle = slot.color ?? artwork.foreground;
  ctx.font = slot.font ?? `600 ${Math.max(18, width * 0.018)}px Georgia, serif`;
  ctx.textAlign = slot.align ?? "center";
  ctx.textBaseline = "middle";
  ctx.fillText(relation, slot.x + slot.w / 2, slot.y + slot.h / 2);

  ctx.restore();
}

export function getTemplateArtwork(templateId:string,width:number,height:number,participantCount:number):TemplateArtwork{
  const photoRects=layout(width,height,templateId,participantCount);
  const palettes:Record<string,[string,string]>={
    "classic-love-collage":["#f7eee7","#7b3944"],"pink-bow-memories":["#f8dce7","#8b4560"],"red-love-note":["#ead0ca","#652f35"],"vintage-lace":["#e8dfd5","#674a40"],"retro-polaroid":["#e8d0b7","#68453b"],"classic-red-polaroids":["#f0ddd7","#642e35"],"blue-floral":["#dbe8eb","#38596d"],"pink-cd":["#ead0df","#633c58"],"black-white-stars":["#191919","#f2eee6"],"vintage-film-strip":["#24201d","#eee0d0"],"blue-retro-camera":["#d8e4e7","#3e6174"],"green-memories":["#dce6d0","#41583e"],"picnic-memories":["#f1e1c4","#7c4c43"],"pink-green-childhood":["#e7ead9","#59694c"],"handmade-doodle":["#f0eadc","#4d6790"],"simple-pink-frames":["#f0d9e0","#704754"],"retro-sun":["#f3d0a1","#713f31"],"travel-scrapbook":["#e7ddca","#61463b"],"leopard-lace":["#d8bc91","#4b392e"],"leopard-contact-sheet":["#cdb084","#4a372d"],"red-record-player":["#e8ccc5","#5b2e30"],"cherry-camera":["#efd0c7","#633733"],"black-music-collage":["#181818","#eee8df"],"pink-music-diary":["#25202c","#f0d8e5"],"swan-memories":["#dce6e4","#465653"],"blue-camera-collage":["#d7e4e8","#3c5f70"],"pinboard-memories":["#dfd5c8","#51463e"],"retro-tv-frames":["#e1d2c1","#563b36"],"pastel-camera-roll":["#e7e0e1","#5e5661"],"floral-polaroid-stack":["#ebe5d8","#53654a"],"red-gingham-camera":["#f0d2cc","#5c3034"],"cute-sticker-album":["#e5ead9","#5d674f"],"love-story-editorial":["#eee0d9","#4d333a"],"about-you":["#dedbd5","#242424"],"retro-tv-stack":["#ddc8bd","#4f302f"],"japanese-retro-camera":["#e7dccb","#59453a"],"midnight-romance":["#21171d","#f0d8d7"],"analog-music":["#1a1a19","#eee8df"],"dreamy-vinyl":["#d9dfd6","#514c50"],"retro-pinboard":["#ded3c1","#55463c"],"y2k-pop-collage":["#e8cde4","#563b66"],"comic-pop":["#f0df91","#282d42"]};
  const [background,foreground]=palettes[templateId]||palettes["classic-love-collage"];
  return {
    background,
    foreground,
    photoRects: photoRects.map((slot) => ({
      shape: slot.radius ? "rounded" : "rect",
      objectPosition: "center",
      ...slot,
    })),
    textSlots: [{
      id: "names",
      kind: "names",
      x: width * 0.10,
      y: height * 0.875,
      w: width * 0.80,
      h: height * 0.065,
      align: "center",
      font: "600 28px Georgia, serif",
      color: foreground,
      background,
      radius: 8,
      mask: true,
    }],
    drawBackground:(ctx)=>bgBase(ctx,width,height,background),
    drawForeground:(ctx)=>decorate(templateId,ctx,width,height)
  };
}

export function drawTemplateArtwork(ctx:CanvasRenderingContext2D,templateId:string,width:number,height:number,participantCount:number){const a=getTemplateArtwork(templateId,width,height,participantCount);a.drawBackground?.(ctx,width,height);return a;}
export function drawTemplateForeground(ctx:CanvasRenderingContext2D,templateId:string,width:number,height:number){decorate(templateId,ctx,width,height);}
