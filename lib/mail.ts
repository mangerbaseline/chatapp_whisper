import { google } from "googleapis";

interface BaseEmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI,
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: BaseEmailOptions) => {
  try {
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    const str = [
      'Content-Type: text/html; charset="UTF-8"',
      "MIME-Version: 1.0",
      "Content-Transfer-Encoding: 7bit",
      `to: ${to}`,
      `from: "Chat App" <${process.env.GMAIL_USER}>`,
      `subject: ${subject}`,
      "",
      html,
    ].join("\n");

    const encodedMessage = Buffer.from(str)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const info = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log("Message sent via Gmail API: %s", info.data.id);
  } catch (error) {
    console.error("Error sending email via Gmail API:", error);
  }
};
