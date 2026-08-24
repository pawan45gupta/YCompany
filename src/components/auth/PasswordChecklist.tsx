"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { Box, Stack, Typography } from "@mui/material";
import { evaluatePassword, type PasswordCheckId } from "@/lib/auth/password-policy";
import { useTranslation } from "@/i18n/client";

type Props = {
  /** The candidate password from the form. */
  password: string;
};

const LABEL_KEY: Record<PasswordCheckId, string> = {
  length: "passwordPolicy.length",
  letter: "passwordPolicy.letter",
  digit: "passwordPolicy.digit",
};

/**
 * Live, accessible password-strength checklist. The same predicate runs on
 * the server via Zod (`passwordSchema`) so the user never gets a UI green
 * tick that the API would reject.
 */
export function PasswordChecklist({ password }: Props) {
  const { t } = useTranslation();
  const { checks } = evaluatePassword(password);
  return (
    <Box
      sx={{ width: "100%" }}
      // role="status" so screen readers announce the live state updates as
      // the user types, without being noisy with each keystroke.
      role="status"
      aria-live="polite"
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mb: 0.5 }}
      >
        {t("passwordPolicy.title")}
      </Typography>
      <Stack spacing={0.25}>
        {checks.map((c) => {
          const Icon = c.passed ? CheckCircleIcon : RadioButtonUncheckedIcon;
          return (
            <Stack
              key={c.id}
              direction="row"
              spacing={1}
              sx={{ alignItems: "center" }}
            >
              <Icon
                fontSize="small"
                sx={{
                  color: c.passed ? "success.main" : "text.disabled",
                  fontSize: "1rem",
                }}
              />
              <Typography
                variant="caption"
                color={c.passed ? "text.primary" : "text.secondary"}
              >
                {t(LABEL_KEY[c.id])}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
}
