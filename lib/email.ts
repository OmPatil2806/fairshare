import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Resend's shared test domain — swap for a verified sending domain once one
// is configured for this project.
const FROM_ADDRESS = "FairShare <onboarding@resend.dev>";

export async function sendReminderEmail({
  toEmail,
  toName,
  fromName,
  amount,
  currencySymbol,
  groupName,
}: {
  toEmail: string;
  toName: string;
  fromName: string;
  amount: string;
  currencySymbol: string;
  groupName: string;
}) {
  return resend.emails.send({
    from: FROM_ADDRESS,
    to: toEmail,
    subject: `Reminder: you owe ${currencySymbol}${amount} in ${groupName}`,
    html: `
      <p>Hi ${toName},</p>
      <p>Just a friendly reminder from FairShare: you owe <strong>${currencySymbol}${amount}</strong> to ${fromName} in the group <strong>${groupName}</strong>.</p>
      <p>Whenever you get a chance, settle up in the app.</p>
      <p>— FairShare</p>
    `,
  });
}
