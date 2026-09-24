type SendPasswordResetEmailInput = {
  to: string;
  resetUrl: string;
};

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: SendPasswordResetEmailInput) {
  const apiKey =
    process.env.RESEND_API_KEY;

  const from =
    process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error(
      "RESEND_API_KEY and RESEND_FROM_EMAIL must be configured."
    );
  }

  const response = await fetch(
    "https://api.resend.com/emails",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },

      body: JSON.stringify({
        from,

        to: [to],

        subject:
          "Reset your UsBooth password",

        html: `
          <div
            style="
              margin:0;
              background:#17100e;
              padding:40px 20px;
              font-family:Arial,sans-serif;
              color:#f2e2d1;
            "
          >

            <div
              style="
                max-width:560px;
                margin:0 auto;
                background:#2b1b17;
                border:1px solid rgba(239,215,194,.16);
                border-radius:18px;
                padding:36px;
              "
            >

              <div
                style="
                  font-size:22px;
                  letter-spacing:.08em;
                  font-weight:700;
                "
              >
                USBOOTH
                <span style="color:#c86d69">
                  ♥
                </span>
              </div>

              <h1
                style="
                  font-family:Georgia,serif;
                  font-size:38px;
                  font-weight:500;
                  line-height:1.05;
                  margin:34px 0 16px;
                "
              >
                Forgot your<br>
                <em style="color:#c86d69">
                  password?
                </em>
              </h1>

              <p
                style="
                  color:#c5aea0;
                  line-height:1.7;
                "
              >
                We received a request to reset
                the password for your UsBooth
                account.
              </p>

              <p
                style="
                  color:#c5aea0;
                  line-height:1.7;
                "
              >
                This link expires in 60 minutes.
              </p>

              <p style="margin:30px 0">

                <a
                  href="${resetUrl}"
                  style="
                    display:inline-block;
                    background:#a95b5d;
                    color:#fff6ee;
                    text-decoration:none;
                    padding:14px 22px;
                    border-radius:8px;
                    font-weight:700;
                    letter-spacing:.08em;
                  "
                >
                  RESET PASSWORD ↗
                </a>

              </p>

              <p
                style="
                  color:#806f65;
                  font-size:13px;
                  line-height:1.6;
                "
              >
                If you didn't request this,
                you can safely ignore this email.
              </p>

            </div>

          </div>
        `,
      }),
    }
  );

  if (!response.ok) {
    const details =
      await response.text();

    console.error(
      "Password reset email failed:",
      details
    );

    throw new Error(
      "Unable to send password reset email."
    );
  }
}
