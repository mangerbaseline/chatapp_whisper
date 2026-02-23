import axios from "axios";

function sanitizeNumber(number: string): string {
  const digits = number.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  return digits.slice(-10);
}

export async function sendSms(
  mobileNo: string,
  message: string,
): Promise<void> {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    console.warn("[SMS] FAST2SMS_API_KEY not set — skipping SMS.");
    return;
  }

  if (!mobileNo) {
    console.warn("[SMS] No mobile number provided — skipping SMS.");
    return;
  }

  const number = sanitizeNumber(mobileNo);

  if (number.length !== 10) {
    console.warn(
      `[SMS] Invalid mobile number after sanitisation: "${number}" — skipping SMS.`,
    );
    return;
  }

  try {
    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "q",
        message,
        numbers: number,
        flash: "0",
      },
      {
        headers: {
          authorization: apiKey,
          "Content-Type": "application/json",
        },
      },
    );

    if (response.data?.return === true) {
      console.log(`[SMS] Sent to ${number}:`, response.data);
    } else {
      console.warn(`[SMS] Fast2sms returned non-success:`, response.data);
    }
  } catch (error: any) {
    console.error(
      "[SMS] Failed to send SMS via Fast2sms:",
      error?.response?.data || error.message,
    );
  }
}
