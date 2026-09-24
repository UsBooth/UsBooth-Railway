export type SignalType = "offer" | "answer" | "candidate" | "capture";
export type Signal = { id:string; type:SignalType; payload:Record<string,unknown>; createdAt:string };
export type TurnResponse = { iceServers?: RTCIceServer[] };
export type SessionResponse = { initiatorId?:string|null; booth?:{id:string;name:string;roomCode:string;type:string}; session?:{id:string;status:string}; template?:string|null; participant?:{id:string;sessionId:string;status:string}; error?:string };
export const POLL_INTERVAL=1000; export const COUNTDOWN_SECONDS=3;
