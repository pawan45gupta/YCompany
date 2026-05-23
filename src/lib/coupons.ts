import { getDictionary } from "@/i18n/dictionary";
import { translate } from "@/i18n/translate";

export type CouponResult =
  | {
      valid: true;
      discountCents: number;
      freeShipping: boolean;
      message: string;
    }
  | { valid: false; message: string };

type Rule = {
  code: string;
  percentOff?: number;
  maxDiscountCents?: number;
  fixedOffCents?: number;
  freeShipping?: boolean;
  minSubtotalCents?: number;
  expiresAt?: number;
  messageKey: string;
};

const RULES: Rule[] = [
  {
    code: "WELCOME10",
    percentOff: 10,
    minSubtotalCents: 5000,
    messageKey: "coupon.welcome10",
  },
  {
    code: "SAVE20",
    percentOff: 20,
    maxDiscountCents: 5000,
    minSubtotalCents: 10000,
    messageKey: "coupon.save20",
  },
  {
    code: "FREESHIP",
    freeShipping: true,
    minSubtotalCents: 7500,
    messageKey: "coupon.freeship",
  },
];

export function applyCoupon(code: string, subtotalCents: number): CouponResult {
  const dict = getDictionary();
  const t = (key: string, params?: Record<string, string | number>) =>
    translate(dict, key, params);

  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { valid: false, message: t("coupon.enterCode") };
  }

  const rule = RULES.find((r) => r.code === normalized);
  if (!rule) {
    return { valid: false, message: t("coupon.unknown") };
  }

  if (rule.expiresAt && Date.now() > rule.expiresAt) {
    return { valid: false, message: t("coupon.expired") };
  }

  if (rule.minSubtotalCents != null && subtotalCents < rule.minSubtotalCents) {
    return {
      valid: false,
      message: t("coupon.minOrder", {
        amount: (rule.minSubtotalCents / 100).toFixed(2),
      }),
    };
  }

  let discountCents = 0;

  if (rule.fixedOffCents) {
    discountCents = Math.min(rule.fixedOffCents, subtotalCents);
  } else if (rule.percentOff) {
    discountCents = Math.floor((subtotalCents * rule.percentOff) / 100);
    if (rule.maxDiscountCents != null) {
      discountCents = Math.min(discountCents, rule.maxDiscountCents);
    }
  }

  const freeShipping = Boolean(rule.freeShipping);

  if (discountCents === 0 && !freeShipping) {
    return { valid: false, message: t("coupon.couldNotApply") };
  }

  return {
    valid: true,
    discountCents,
    freeShipping,
    message: t(rule.messageKey),
  };
}
