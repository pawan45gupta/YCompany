export type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type SendEmailResult = { ok: true } | { ok: false; error: string };

function getFromAddress(): string {
  return (
    process.env.EMAIL_FROM?.trim() ||
    "YCompany <onboarding@resend.dev>"
  );
}

function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

async function sendViaResend(payload: EmailPayload): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: "Resend not configured" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getFromAddress(),
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 200)}` };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Resend request failed",
    };
  }
}

function logEmailToConsole(payload: EmailPayload): void {
  console.info(
    `[email] (no transport) To: ${payload.to}\nSubject: ${payload.subject}\n\n${payload.text}`,
  );
}

/** Sends email via Resend when configured; otherwise logs to the server console. */
export async function sendEmail(payload: EmailPayload): Promise<SendEmailResult> {
  if (isEmailConfigured()) {
    return sendViaResend(payload);
  }

  logEmailToConsole(payload);
  return { ok: true };
}

export function __isEmailConfiguredForTests(): boolean {
  return isEmailConfigured();
}
