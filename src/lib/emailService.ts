import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";
import { decryptSecret } from "@/lib/security";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password?: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string | null;
}

export async function getSmtpSettings(): Promise<SmtpConfig | null> {
  try {
    const setting = await prisma.smtpSetting.findUnique({
      where: { id: "default" },
    });

    if (setting && setting.host && setting.user) {
      return {
        host: setting.host,
        port: setting.port || 587,
        secure: setting.secure,
        user: setting.user,
        password: setting.password ? decryptSecret(setting.password) : undefined,
        fromEmail: setting.fromEmail || setting.user,
        fromName: setting.fromName || "Event Coordination Team",
        replyTo: setting.replyTo,
      };
    }

    // Fallback to environment variables if database setting not configured yet
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      return {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        secure: process.env.SMTP_SECURE === "true",
        user: process.env.SMTP_USER,
        password: process.env.SMTP_PASSWORD,
        fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
        fromName: process.env.SMTP_FROM_NAME || "Event Coordination Team",
        replyTo: process.env.SMTP_REPLY_TO,
      };
    }

    return null;
  } catch (error) {
    console.error("Error retrieving SMTP settings:", error);
    return null;
  }
}

export async function createTransporter() {
  const config = await getSmtpSettings();
  if (!config) {
    throw new Error(
      "SMTP server is not configured. Please configure SMTP in the Admin Panel or in your .env file."
    );
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure, // true for 465, false for 587/other
    auth: {
      user: config.user,
      pass: config.password,
    },
  });

  return { transporter, config };
}

export async function testSmtpConnection(testRecipient: string): Promise<{ success: boolean; message: string }> {
  try {
    const { transporter, config } = await createTransporter();

    // Verify SMTP connection
    await transporter.verify();

    // Send a test verification email
    await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: testRecipient,
      subject: `[Test] SMTP Configuration Verified — Event Management System`,
      text: `Hello,\n\nThis is a confirmation that your SMTP configuration is successfully connected and verified.\n\nSent at: ${new Date().toLocaleString()}`,
      html: `
        <div style="font-family: sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #FF6B1A; margin-top: 0;">SMTP Test Successful!</h2>
          <p style="color: #334155; font-size: 15px; line-height: 1.5;">
            Your email dispatch server is active and verified to send announcements and updates to registered delegates.
          </p>
          <div style="background: #f8fafc; padding: 12px 16px; border-radius: 8px; font-size: 13px; color: #64748b; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Host:</strong> ${config.host}:${config.port}</p>
            <p style="margin: 4px 0;"><strong>Sender:</strong> ${config.fromName} (${config.fromEmail})</p>
            <p style="margin: 4px 0;"><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">
            This was an automated test triggered from the Admin Console.
          </p>
        </div>
      `,
    });

    return { success: true, message: `SMTP connection verified and test email sent to ${testRecipient}` };
  } catch (error: any) {
    console.error("SMTP Test Error:", error);
    return { success: false, message: error.message || "Failed to connect to SMTP server" };
  }
}

export async function sendBroadcastEmail({
  recipients,
  subject,
  message,
  eventName = "Event Fest",
  institutionName = "College Campus",
}: {
  recipients: { email: string; name: string }[];
  subject: string;
  message: string;
  eventName?: string;
  institutionName?: string;
}) {
  const { transporter, config } = await createTransporter();

  // Convert plaintext newlines into HTML paragraphs/breaks
  const formattedHtmlContent = message
    .split("\n\n")
    .map((paragraph) => `<p style="margin: 0 0 14px 0; line-height: 1.6;">${paragraph.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  const emailResults = [];

  for (const recipient of recipients) {
    try {
      const personalizedHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAF8F5; padding: 32px 20px;">
          <div style="background-color: #ffffff; border-radius: 16px; border: 1px solid #E7E5E4; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.04);">
            <!-- Branded Header -->
            <div style="background: linear-gradient(135deg, #1C1917 0%, #292524 100%); padding: 28px 32px; border-bottom: 3px solid #FF6B1A;">
              <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.15em; color: #D9A441; text-transform: uppercase; margin-bottom: 6px;">
                ${institutionName}
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">
                ${eventName}
              </h1>
            </div>

            <!-- Email Body -->
            <div style="padding: 32px; color: #292524; font-size: 15px;">
              <p style="font-weight: 600; color: #1C1917; margin-top: 0; margin-bottom: 18px;">
                Dear ${recipient.name || "Participant"},
              </p>

              <div style="color: #44403C;">
                ${formattedHtmlContent}
              </div>

              <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #F5F5F4; font-size: 13px; color: #78716C;">
                <p style="margin: 0 0 4px 0; font-weight: 600; color: #1C1917;">Coordination & Organizing Committee</p>
                <p style="margin: 0;">${institutionName}</p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #F5F5F4; padding: 16px 32px; font-size: 11px; color: #A8A29E; text-align: center; border-top: 1px solid #E7E5E4;">
              <p style="margin: 0;">You received this announcement because you are registered for ${eventName}.</p>
            </div>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to: recipient.email,
        replyTo: config.replyTo || undefined,
        subject: subject,
        text: `Dear ${recipient.name},\n\n${message}\n\n---\n${eventName} Organizing Committee\n${institutionName}`,
        html: personalizedHtml,
      });

      emailResults.push({ email: recipient.email, success: true });
    } catch (err: any) {
      console.error(`Failed to send email to ${recipient.email}:`, err);
      emailResults.push({ email: recipient.email, success: false, error: err.message });
    }
  }

  return emailResults;
}

export interface DelegateRegistrationEmailPayload {
  toEmail: string;
  delegateName: string;
  collegeName: string;
  teamName?: string | null;
  badgeCode: string;
  foodTokenCode: string;
  badgeUrl: string;
  events: Array<{
    name: string;
    category: string;
    venue?: string | null;
    time?: string | null;
    staffCoordinator?: string | null;
    studentCoordinator?: string | null;
  }>;
}

/**
 * Sends a personalized registration confirmation email to each registered student delegate.
 * Includes badge pass link, scannable food token, and full event schedule.
 */
export async function sendDelegateRegistrationEmail(payload: DelegateRegistrationEmailPayload): Promise<boolean> {
  try {
    const config = await getSmtpSettings();
    if (!config) {
      console.log(`[SMTP Not Configured] Registration email skipped for delegate ${payload.toEmail}`);
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password || "",
      },
    });

    const activeEdition = await prisma.eventEdition.findFirst({ where: { isActive: true } });
    const eventName = activeEdition?.name || "SHINE";
    const editionYear = activeEdition?.edition || "2027";
    const institutionName = activeEdition?.institutionName || "Sacred Heart College (Autonomous)";

    const eventsListHtml = payload.events.length > 0
      ? payload.events.map((ev) => `
          <div style="background-color: #FAF8F5; border: 1px solid #E7E5E4; border-radius: 12px; padding: 14px 16px; margin-bottom: 10px;">
            <div style="font-weight: 700; color: #1C1917; font-size: 14px;">${ev.name}</div>
            <div style="font-size: 11px; color: #78716C; margin-top: 2px;">
              <span>${ev.category === "ON_STAGE" ? "On-Stage Arena" : "Off-Stage Challenge"}</span>
              ${ev.venue ? ` • Venue: <b>${ev.venue}</b>` : ""}
              ${ev.time ? ` • Time: <b>${ev.time}</b>` : ""}
            </div>
            ${(ev.staffCoordinator || ev.studentCoordinator) ? `
              <div style="font-size: 11px; color: #57534E; margin-top: 6px; padding-top: 6px; border-top: 1px dashed #E7E5E4;">
                ${ev.staffCoordinator ? `Staff Incharge: <b>${ev.staffCoordinator}</b> ` : ""}
                ${ev.studentCoordinator ? ` • Student Incharge: <b>${ev.studentCoordinator}</b>` : ""}
              </div>
            ` : ""}
          </div>
        `).join("")
      : `<p style="color: #78716C; font-size: 13px;">General Fest Attendee</p>`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAF8F5; padding: 32px 20px;">
        <div style="background-color: #ffffff; border-radius: 20px; border: 1px solid #E7E5E4; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1C1917 0%, #292524 100%); padding: 28px 32px; border-bottom: 3px solid #FF6B1A;">
            <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.15em; color: #D9A441; text-transform: uppercase; margin-bottom: 4px;">
              ${institutionName}
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">
              ${eventName} ${editionYear} — Delegate Pass
            </h1>
          </div>

          <!-- Body -->
          <div style="padding: 32px; color: #292524;">
            <p style="font-size: 16px; font-weight: 700; color: #1C1917; margin-top: 0;">
              Welcome, ${payload.delegateName}!
            </p>
            <p style="font-size: 14px; color: #57534E; line-height: 1.6;">
              Your registration as part of the <b>${payload.collegeName}</b> contingent has been received. Please present your Digital ID Card at the registration counter on symposium day.
            </p>

            <!-- Pass & Food Token Card -->
            <div style="background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%); border: 1.5px solid #FCD34D; border-radius: 16px; padding: 20px; margin: 24px 0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <div>
                  <div style="font-size: 10px; font-weight: 800; color: #92400E; text-transform: uppercase; letter-spacing: 0.1em;">Delegate Badge ID</div>
                  <div style="font-size: 18px; font-weight: 900; color: #78350F; font-family: monospace; letter-spacing: 0.05em; margin-top: 2px;">
                    ${payload.badgeCode}
                  </div>
                </div>
              </div>

              <div style="padding-top: 12px; border-top: 1px dashed #F59E0B;">
                <div style="font-size: 10px; font-weight: 800; color: #065F46; text-transform: uppercase; letter-spacing: 0.1em;">Food & Lunch Token</div>
                <div style="font-size: 16px; font-weight: 800; color: #047857; font-family: monospace; margin-top: 2px;">
                  ${payload.foodTokenCode}
                </div>
                <div style="font-size: 11px; color: #065F46; margin-top: 4px;">Valid for official fest meal & refreshments at the dining hall.</div>
              </div>
            </div>

            <!-- View Pass Button -->
            <div style="text-align: center; margin: 28px 0;">
              <a href="${payload.badgeUrl}" style="background-color: #FF6B1A; color: #ffffff; padding: 14px 28px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 12px; display: inline-block; box-shadow: 0 4px 12px rgba(255,107,26,0.25);">
                Open Digital ID Card & QR Pass →
              </a>
            </div>

            <!-- Event Schedule Section -->
            <div style="margin-top: 28px;">
              <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #FF6B1A; letter-spacing: 0.1em; margin-bottom: 12px;">
                Your Competitions & Arena Schedule
              </div>
              ${eventsListHtml}
            </div>

            <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #F5F5F4; font-size: 12px; color: #78716C;">
              <p style="margin: 0 0 4px 0; font-weight: 700; color: #1C1917;">Symposium Executive Committee</p>
              <p style="margin: 0;">${institutionName}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: payload.toEmail,
      replyTo: config.replyTo || undefined,
      subject: `Registration Confirmed: ${payload.delegateName} — ${eventName} ${editionYear} Badge Pass`,
      html,
    });

    return true;
  } catch (err) {
    console.error(`Failed to send delegate email to ${payload.toEmail}:`, err);
    return false;
  }
}

export interface CoordinatorAlertPayload {
  coordinatorEmail: string;
  coordinatorName: string;
  roleType: "Staff Incharge" | "Student Incharge";
  eventName: string;
  collegeName: string;
  teamName?: string | null;
  participants: Array<{
    name: string;
    email: string;
    phone: string;
    badgeCode: string;
  }>;
  staffIncharge?: {
    name: string;
    email?: string | null;
    phone?: string | null;
  } | null;
  coordinatorPortalUrl: string;
}

/**
 * Sends an immediate alert to the host Staff Coordinator and Student Coordinator
 * when an outer college delegation registers participants for their specific event.
 */
export async function sendCoordinatorRegistrationAlert(payload: CoordinatorAlertPayload): Promise<boolean> {
  try {
    const config = await getSmtpSettings();
    if (!config) {
      console.log(`[SMTP Not Configured] Coordinator alert email skipped for ${payload.coordinatorEmail}`);
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password || "",
      },
    });

    const activeEdition = await prisma.eventEdition.findFirst({ where: { isActive: true } });
    const eventName = activeEdition?.name || "SHINE";
    const editionYear = activeEdition?.edition || "2027";

    const participantRows = payload.participants.map((p) => `
      <tr style="border-bottom: 1px solid #E7E5E4;">
        <td style="padding: 10px 12px; font-weight: 600; color: #1C1917; font-size: 13px;">${p.name}</td>
        <td style="padding: 10px 12px; font-size: 12px; color: #57534E;">${p.email}</td>
        <td style="padding: 10px 12px; font-size: 12px; color: #57534E; font-family: monospace;">${p.phone}</td>
        <td style="padding: 10px 12px; font-size: 11px; font-family: monospace; font-weight: 700; color: #B45309;">${p.badgeCode}</td>
      </tr>
    `).join("");

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; background-color: #FAF8F5; padding: 32px 20px;">
        <div style="background-color: #ffffff; border-radius: 20px; border: 1px solid #E7E5E4; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1C1917 0%, #292524 100%); padding: 24px 30px; border-bottom: 3px solid #FF6B1A;">
            <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.15em; color: #D9A441; text-transform: uppercase; margin-bottom: 4px;">
              ${eventName} ${editionYear} — Coordinator Alert
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800;">
              New Delegation Entered: ${payload.eventName}
            </h1>
          </div>

          <!-- Content -->
          <div style="padding: 28px 30px; color: #292524;">
            <p style="font-size: 15px; font-weight: 700; color: #1C1917; margin-top: 0;">
              Dear ${payload.coordinatorName} (${payload.roleType}),
            </p>
            <p style="font-size: 13.5px; color: #57534E; line-height: 1.6;">
              A new college delegation has registered delegates for your competition <b>"${payload.eventName}"</b>.
            </p>

            <!-- Delegation Summary Box -->
            <div style="background-color: #FAF8F5; border: 1px solid #E7E5E4; border-radius: 14px; padding: 16px; margin: 18px 0;">
              <div style="font-size: 11px; font-weight: 700; color: #78716C; text-transform: uppercase;">Participating Institution</div>
              <div style="font-size: 15px; font-weight: 800; color: #1C1917; margin-top: 2px;">
                ${payload.collegeName}
              </div>
              ${payload.teamName ? `<div style="font-size: 12px; color: #FF6B1A; font-weight: 600; margin-top: 2px;">Team: ${payload.teamName}</div>` : ""}

              ${payload.staffIncharge && payload.staffIncharge.name ? `
                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #E7E5E4; font-size: 12px; color: #57534E;">
                  <b>Accompanying Outer College Staff:</b> ${payload.staffIncharge.name}
                  ${payload.staffIncharge.phone ? ` (${payload.staffIncharge.phone})` : ""}
                  ${payload.staffIncharge.email ? ` • ${payload.staffIncharge.email}` : ""}
                </div>
              ` : ""}
            </div>

            <!-- Delegates Table -->
            <div style="margin: 20px 0; overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 12px;">
                <thead>
                  <tr style="background-color: #FAF8F5; border-bottom: 2px solid #E7E5E4; color: #78716C; font-size: 11px; text-transform: uppercase;">
                    <th style="padding: 8px 12px;">Student Name</th>
                    <th style="padding: 8px 12px;">Email</th>
                    <th style="padding: 8px 12px;">Mobile</th>
                    <th style="padding: 8px 12px;">Badge ID</th>
                  </tr>
                </thead>
                <tbody>
                  ${participantRows}
                </tbody>
              </table>
            </div>

            <!-- Coordinator CTA -->
            <div style="text-align: center; margin-top: 28px;">
              <a href="${payload.coordinatorPortalUrl}" style="background-color: #1C1917; color: #ffffff; padding: 12px 24px; font-size: 13px; font-weight: 700; text-decoration: none; border-radius: 10px; display: inline-block;">
                Access Coordinator Console →
              </a>
            </div>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: payload.coordinatorEmail,
      replyTo: config.replyTo || undefined,
      subject: `[New Registration Alert] ${payload.eventName} — ${payload.collegeName}`,
      html,
    });

    return true;
  } catch (err) {
    console.error(`Failed to send coordinator alert to ${payload.coordinatorEmail}:`, err);
    return false;
  }
}

/**
 * Sends official approved ID Card and Food Voucher pass email to an individual delegate.
 * Triggered when Registration Desk collects payment and approves delegation.
 */
export async function sendApprovedDelegatePassEmail(payload: DelegateRegistrationEmailPayload): Promise<boolean> {
  try {
    const config = await getSmtpSettings();
    if (!config) {
      console.log(`[SMTP Not Configured] Approved pass email skipped for ${payload.toEmail}`);
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password || "",
      },
    });

    const activeEdition = await prisma.eventEdition.findFirst({ where: { isActive: true } });
    const eventName = activeEdition?.name || "SHINE";
    const editionYear = activeEdition?.edition || "2027";
    const institutionName = activeEdition?.institutionName || "Sacred Heart College (Autonomous)";

    const eventsListHtml = payload.events.length > 0
      ? payload.events.map((ev) => `
          <div style="background-color: #FAF8F5; border: 1px solid #E7E5E4; border-radius: 12px; padding: 12px 14px; margin-bottom: 8px;">
            <div style="font-weight: 700; color: #1C1917; font-size: 13.5px;">${ev.name}</div>
            <div style="font-size: 11px; color: #78716C; margin-top: 2px;">
              <span>${ev.category === "ON_STAGE" ? "On-Stage Arena" : "Off-Stage Challenge"}</span>
              ${ev.venue ? ` • Venue: <b>${ev.venue}</b>` : ""}
              ${ev.time ? ` • Time: <b>${ev.time}</b>` : ""}
            </div>
          </div>
        `).join("")
      : `<p style="color: #78716C; font-size: 13px;">General Fest Attendee</p>`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAF8F5; padding: 32px 20px;">
        <div style="background-color: #ffffff; border-radius: 20px; border: 1px solid #E7E5E4; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #065F46 0%, #047857 100%); padding: 26px 32px; border-bottom: 3px solid #10B981;">
            <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.15em; color: #A7F3D0; text-transform: uppercase; margin-bottom: 4px;">
              ${institutionName}
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">
              Registration Approved & Passes Ready
            </h1>
            <div style="color: #D1FAE5; font-size: 13px; margin-top: 4px;">${eventName} ${editionYear} • Official Digital ID & Food Token</div>
          </div>

          <!-- Body -->
          <div style="padding: 30px; color: #292524;">
            <p style="font-size: 16px; font-weight: 700; color: #1C1917; margin-top: 0;">
              Congratulations, ${payload.delegateName}!
            </p>
            <p style="font-size: 14px; color: #57534E; line-height: 1.6;">
              Your spot registration fee has been collected and verified by the Registration Desk. Your <b>Official Digital ID Pass (with Event Check-In QR and Food Token QR)</b> is now officially activated.
            </p>

            <!-- Dual Pass Summary -->
            <div style="background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%); border: 1.5px solid #FCD34D; border-radius: 16px; padding: 18px; margin: 20px 0;">
              <div style="margin-bottom: 12px;">
                <div style="font-size: 10px; font-weight: 800; color: #92400E; text-transform: uppercase; letter-spacing: 0.1em;">1. Event Gate Pass Code</div>
                <div style="font-size: 18px; font-weight: 900; color: #78350F; font-family: monospace; letter-spacing: 0.05em; margin-top: 2px;">
                  ${payload.badgeCode}
                </div>
                <div style="font-size: 11px; color: #92400E; margin-top: 2px;">Valid for venue entry across all your registered competitions.</div>
              </div>

              <div style="padding-top: 12px; border-top: 1px dashed #F59E0B;">
                <div style="font-size: 10px; font-weight: 800; color: #065F46; text-transform: uppercase; letter-spacing: 0.1em;">2. Meal & Refreshment Token Code</div>
                <div style="font-size: 16px; font-weight: 800; color: #047857; font-family: monospace; margin-top: 2px;">
                  ${payload.foodTokenCode}
                </div>
                <div style="font-size: 11px; color: #065F46; margin-top: 2px;">Present at dining hall for 1x meal allocation.</div>
              </div>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 26px 0;">
              <a href="${payload.badgeUrl}" style="background-color: #047857; color: #ffffff; padding: 14px 28px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 12px; display: inline-block; box-shadow: 0 4px 12px rgba(4,120,87,0.3);">
                View Approved Digital Pass & QRs →
              </a>
            </div>

            <!-- Registered Competitions -->
            <div style="margin-top: 26px;">
              <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #047857; letter-spacing: 0.08em; margin-bottom: 10px;">
                Your Registered Competitions
              </div>
              ${eventsListHtml}
            </div>

            <div style="margin-top: 30px; padding-top: 18px; border-top: 1px solid #F5F5F4; font-size: 12px; color: #78716C;">
              <p style="margin: 0 0 4px 0; font-weight: 700; color: #1C1917;">Symposium Executive Committee</p>
              <p style="margin: 0;">${institutionName}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: payload.toEmail,
      replyTo: config.replyTo || undefined,
      subject: `Approved ID Pass: ${payload.delegateName} — ${eventName} ${editionYear}`,
      html,
    });

    return true;
  } catch (err) {
    console.error(`Failed to send approved delegate email to ${payload.toEmail}:`, err);
    return false;
  }
}

export interface TeamMemberRosterItem {
  name: string;
  email: string;
  phone: string;
  isTeamLead: boolean;
  badgeCode: string;
  foodTokenCode: string;
  badgeUrl: string;
  events: Array<{ name: string; category: string; venue?: string | null; time?: string | null }>;
}

export interface TeamLeadConsolidatedEmailPayload {
  teamLeadEmail: string;
  teamLeadName: string;
  collegeName: string;
  teamName?: string | null;
  totalFee: number;
  members: TeamMemberRosterItem[];
}

/**
 * Sends a consolidated team pass dossier to the Team Lead upon Desk payment & approval.
 * Contains the team lead's own pass plus every team member's badge, food token, and pass link.
 */
export async function sendTeamLeadConsolidatedPassEmail(payload: TeamLeadConsolidatedEmailPayload): Promise<boolean> {
  try {
    const config = await getSmtpSettings();
    if (!config) {
      console.log(`[SMTP Not Configured] Team lead consolidated email skipped for ${payload.teamLeadEmail}`);
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password || "",
      },
    });

    const activeEdition = await prisma.eventEdition.findFirst({ where: { isActive: true } });
    const eventName = activeEdition?.name || "SHINE";
    const editionYear = activeEdition?.edition || "2027";
    const institutionName = activeEdition?.institutionName || "Sacred Heart College (Autonomous)";

    const memberCardsHtml = payload.members.map((m, idx) => `
      <div style="background-color: #FAF8F5; border: 1.5px solid #E7E5E4; border-radius: 14px; padding: 16px; margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E7E5E4; padding-bottom: 10px; margin-bottom: 10px;">
          <div>
            <span style="font-weight: 800; font-size: 14px; color: #1C1917;">${idx + 1}. ${m.name}</span>
            ${m.isTeamLead ? `<span style="background-color: #FEF3C7; color: #92400E; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 6px; margin-left: 6px;">TEAM LEAD</span>` : ""}
            <div style="font-size: 12px; color: #78716C; margin-top: 2px;">${m.email} • ${m.phone}</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; margin-bottom: 10px;">
          <div style="background-color: #FFFBEB; border: 1px solid #FCD34D; border-radius: 8px; padding: 8px 10px;">
            <div style="font-size: 9px; font-weight: 800; color: #92400E; text-transform: uppercase;">Event Pass Code</div>
            <div style="font-family: monospace; font-weight: 800; color: #78350F; font-size: 13px;">${m.badgeCode}</div>
          </div>
          <div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; padding: 8px 10px;">
            <div style="font-size: 9px; font-weight: 800; color: #065F46; text-transform: uppercase;">Food Token Code</div>
            <div style="font-family: monospace; font-weight: 800; color: #047857; font-size: 13px;">${m.foodTokenCode}</div>
          </div>
        </div>

        <div style="font-size: 11px; color: #57534E; margin-bottom: 10px;">
          <b>Competitions:</b> ${m.events.map((e) => e.name).join(", ") || "General Participant"}
        </div>

        <div style="text-align: right;">
          <a href="${m.badgeUrl}" style="background-color: #FF6B1A; color: #ffffff; padding: 8px 16px; font-size: 11px; font-weight: 700; text-decoration: none; border-radius: 8px; display: inline-block;">
            Open ${m.name.split(" ")[0]}'s Pass (2 QRs) →
          </a>
        </div>
      </div>
    `).join("");

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 650px; margin: 0 auto; background-color: #FAF8F5; padding: 32px 20px;">
        <div style="background-color: #ffffff; border-radius: 20px; border: 1px solid #E7E5E4; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1C1917 0%, #292524 100%); padding: 28px 32px; border-bottom: 3px solid #FF6B1A;">
            <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.15em; color: #D9A441; text-transform: uppercase; margin-bottom: 4px;">
              ${institutionName}
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">
              Team Dossier: All Member ID Passes & Food Tokens
            </h1>
            <div style="color: #A8A29E; font-size: 13px; margin-top: 4px;">${eventName} ${editionYear} • Team Lead Consolidated Roster</div>
          </div>

          <!-- Body -->
          <div style="padding: 30px; color: #292524;">
            <p style="font-size: 16px; font-weight: 700; color: #1C1917; margin-top: 0;">
              Hello ${payload.teamLeadName} (Contingent Team Lead),
            </p>
            <p style="font-size: 14px; color: #57534E; line-height: 1.6;">
              Payment has been verified at the Registration Desk for your college contingent <b>${payload.collegeName}</b>${payload.teamName ? ` (${payload.teamName})` : ""}.
            </p>
            <p style="font-size: 13.5px; color: #57534E; line-height: 1.6;">
              Below is the complete dossier of <b>all ${payload.members.length} team members</b>, including their unique <b>Badge Codes</b>, <b>Food Tokens</b>, and direct links to each member's digital pass containing both their <b>Event Registration QR</b> and <b>Food Token QR</b>.
            </p>

            <!-- Members List -->
            <div style="margin: 24px 0;">
              ${memberCardsHtml}
            </div>

            <div style="margin-top: 30px; padding-top: 18px; border-top: 1px solid #F5F5F4; font-size: 12px; color: #78716C;">
              <p style="margin: 0 0 4px 0; font-weight: 700; color: #1C1917;">Registration & Helpdesk Team</p>
              <p style="margin: 0;">${institutionName}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: payload.teamLeadEmail,
      replyTo: config.replyTo || undefined,
      subject: `[Team Dossier] All Member ID Passes & Food Tokens — ${payload.collegeName}`,
      html,
    });

    return true;
  } catch (err) {
    console.error(`Failed to send team lead consolidated email to ${payload.teamLeadEmail}:`, err);
    return false;
  }
}

