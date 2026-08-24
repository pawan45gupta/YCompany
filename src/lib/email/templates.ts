import { formatMoney } from "@/lib/cart-totals";
import { getTranslations } from "@/i18n/server";
import { resolveSiteUrl } from "@/lib/site-url";
import type { Order } from "@/types/order";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function emailShell(title: string, bodyHtml: string, ctaHref: string, ctaLabel: string): string {
  const safeTitle = escapeHtml(title);
  const siteUrl = resolveSiteUrl();
  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f6f4f1;font-family:system-ui,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f4f1;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;padding:32px;">
            <tr>
              <td>
                <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#8b2942;">YCompany</p>
                <h1 style="margin:0 0 20px;font-size:24px;line-height:1.3;">${safeTitle}</h1>
                ${bodyHtml}
                <p style="margin:28px 0 0;">
                  <a href="${escapeHtml(ctaHref)}" style="display:inline-block;background:#1a1a1a;color:#fafafa;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600;">
                    ${escapeHtml(ctaLabel)}
                  </a>
                </p>
                <p style="margin:28px 0 0;font-size:13px;color:#666;line-height:1.6;">
                  ${escapeHtml(siteUrl)}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function formatOrderLines(order: Order): { text: string; html: string } {
  const currency = order.currency.toUpperCase();
  const lines = order.lines.map((line) => {
    const lineTotal = line.unitPriceCents * line.quantity;
    const label = `${line.quantity} × ${line.name} — ${formatMoney(lineTotal, currency)}`;
    return { label, html: `<li style="margin:0 0 8px;">${escapeHtml(label)}</li>` };
  });

  return {
    text: lines.map((line) => line.label).join("\n"),
    html: `<ul style="margin:0 0 20px;padding-left:20px;">${lines.map((line) => line.html).join("")}</ul>`,
  };
}

function orderTotals(order: Order): { text: string; html: string } {
  const currency = order.currency.toUpperCase();
  const { t } = getTranslations();
  const rows = [
    [t("common.subtotal"), formatMoney(order.subtotalCents, currency)],
    ...(order.discountCents > 0
      ? [[t("common.discount"), `−${formatMoney(order.discountCents, currency)}`]]
      : []),
    [t("common.shipping"), formatMoney(order.shippingCents, currency)],
    [t("common.estimatedTotal"), formatMoney(order.totalCents, currency)],
  ] as const;

  return {
    text: rows.map(([label, value]) => `${label}: ${value}`).join("\n"),
    html: rows
      .map(
        ([label, value]) =>
          `<tr><td style="padding:4px 0;color:#666;">${escapeHtml(label)}</td>` +
          `<td align="right" style="padding:4px 0;font-weight:600;">${escapeHtml(value)}</td></tr>`,
      )
      .join(""),
  };
}

export function buildWelcomeEmail(input: { email: string; name?: string | null }) {
  const { t } = getTranslations();
  const siteUrl = resolveSiteUrl();
  const namePart = input.name?.trim()
    ? `, ${input.name.trim()}`
    : "";
  const subject = t("email.welcome.subject");
  const title = t("email.welcome.title", { namePart });
  const intro = t("email.welcome.intro");
  const body = t("email.welcome.body");
  const cta = t("email.welcome.cta");

  const text = `${title}\n\n${intro}\n\n${body}\n\n${cta}: ${siteUrl}/products\n`;

  const html = emailShell(
    title,
    `<p style="margin:0 0 12px;line-height:1.7;">${escapeHtml(intro)}</p>
     <p style="margin:0;line-height:1.7;">${escapeHtml(body)}</p>`,
    `${siteUrl}/products`,
    cta,
  );

  return { to: input.email, subject, text, html };
}

export function buildOrderConfirmationEmail(order: Order) {
  const { t } = getTranslations();
  const siteUrl = resolveSiteUrl();
  const currency = order.currency.toUpperCase();
  const lines = formatOrderLines(order);
  const totals = orderTotals(order);
  const subject = t("email.orderConfirmation.subject", { orderId: order.id });
  const title = t("email.orderConfirmation.title");
  const intro = t("email.orderConfirmation.intro", {
    orderId: order.id,
    total: formatMoney(order.totalCents, currency),
  });
  const cta = t("email.orderConfirmation.cta");

  const text =
    `${title}\n\n${intro}\n\n${lines.text}\n\n${totals.text}\n\n${cta}: ${siteUrl}/account\n`;

  const html = emailShell(
    title,
    `<p style="margin:0 0 20px;line-height:1.7;">${escapeHtml(intro)}</p>
     ${lines.html}
     <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 8px;">
       ${totals.html}
     </table>`,
    `${siteUrl}/account`,
    cta,
  );

  return { to: order.customerEmail, subject, text, html };
}

export function buildOrderCancellationEmail(order: Order) {
  const { t } = getTranslations();
  const siteUrl = resolveSiteUrl();
  const currency = order.currency.toUpperCase();
  const subject = t("email.orderCancellation.subject", { orderId: order.id });
  const title = t("email.orderCancellation.title");
  const intro = t("email.orderCancellation.intro", {
    orderId: order.id,
    total: formatMoney(order.totalCents, currency),
  });
  const body = t("email.orderCancellation.body");
  const cta = t("email.orderCancellation.cta");

  const text = `${title}\n\n${intro}\n\n${body}\n\n${cta}: ${siteUrl}/products\n`;

  const html = emailShell(
    title,
    `<p style="margin:0 0 12px;line-height:1.7;">${escapeHtml(intro)}</p>
     <p style="margin:0;line-height:1.7;">${escapeHtml(body)}</p>`,
    `${siteUrl}/products`,
    cta,
  );

  return { to: order.customerEmail, subject, text, html };
}
