import { cookies } from "next/headers";
import { getSessionUserId } from "./auth";

export const GUEST_PARTICIPANT_COOKIE = "usbooth_guest_participant";

export async function getParticipantIdentity() {
  const userId = await getSessionUserId();
  const store = await cookies();

  return {
    userId,
    guestParticipantId:
      userId ? null : store.get(GUEST_PARTICIPANT_COOKIE)?.value ?? null,
  };
}

export async function setGuestParticipantCookie(
  participantId: string
) {
  const store = await cookies();

  store.set({
    name: GUEST_PARTICIPANT_COOKIE,
    value: participantId,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60,
  });
}

export async function clearGuestParticipantCookie() {
  const store = await cookies();

  store.set({
    name: GUEST_PARTICIPANT_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
