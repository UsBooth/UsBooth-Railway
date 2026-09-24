export const CAPTURE_CHANNEL = "usbooth-capture-v2";
export const FRAME_CHUNK_SIZE = 16 * 1024;

export type FrameStart = { type:"frame-start"; captureId:string; mimeType:string; size:number };
export type FrameEnd = { type:"frame-end"; captureId:string };
export type FrameMessage = FrameStart | FrameEnd;

export function dataUrlToBytes(dataUrl:string) {
  const match=dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if(!match) throw new Error("Invalid image data.");
  const binary=atob(match[2]); const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
  return { mimeType:match[1], bytes };
}
export function bytesToDataUrl(bytes:Uint8Array,mimeType:string) {
  let binary=""; const step=0x8000; for(let i=0;i<bytes.length;i+=step) binary += String.fromCharCode(...bytes.subarray(i,Math.min(i+step,bytes.length)));
  return `data:${mimeType};base64,${btoa(binary)}`;
}
