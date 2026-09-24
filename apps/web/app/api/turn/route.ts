import { NextResponse } from "next/server";

export async function GET() {
  const turnKeyId = process.env.CLOUDFLARE_TURN_KEY_ID;
  const turnApiToken =
    process.env.CLOUDFLARE_TURN_API_TOKEN;

  if (!turnKeyId || !turnApiToken) {
    console.error(
      "Cloudflare TURN environment variables are missing."
    );

    return NextResponse.json(
      {
        error: "TURN service is not configured.",
      },
      {
        status: 500,
      }
    );
  }

  try {
    const response = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${turnKeyId}/credentials/generate-ice-servers`,
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${turnApiToken}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          // 1 hour
          ttl: 3600,
        }),

        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "Cloudflare TURN error:",
        data
      );

      return NextResponse.json(
        {
          error:
            "Unable to generate TURN credentials.",
        },
        {
          status: 502,
        }
      );
    }

    /*
     * Cloudflare returns:
     *
     * {
     *   iceServers: [...]
     * }
     *
     * We return the same structure to the browser.
     */
    return NextResponse.json(
      {
        iceServers: data.iceServers,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "TURN credential generation failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to connect to TURN service.",
      },
      {
        status: 500,
      }
    );
  }
}
