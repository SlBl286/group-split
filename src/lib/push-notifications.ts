import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export interface SendPushParams {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Dispatch push notifications to all active registered devices of a user.
 */
export async function sendPushNotificationToUser({
  userId,
  title,
  body,
  data = {},
}: SendPushParams) {
  try {
    // 1. Fetch active devices with push tokens
    const devices = await prisma.userDevice.findMany({
      where: {
        userId,
        isActive: true,
        pushToken: { not: null },
      },
      select: {
        id: true,
        pushToken: true,
        platform: true,
        deviceName: true,
      },
    });

    if (!devices || devices.length === 0) {
      return { success: true, sentCount: 0, message: "No registered mobile devices found" };
    }

    const pushTokens = devices
      .map((d) => d.pushToken)
      .filter((t): t is string => Boolean(t && t.trim().length > 0));

    if (pushTokens.length === 0) {
      return { success: true, sentCount: 0, message: "No active push tokens" };
    }

    // Check Firebase configuration from ENV or firebase-service-account.json
    let firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
    let firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    // 1. Support full JSON or Base64 string from ENV (very convenient in Portainer / Docker)
    const saEnvRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const saBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if ((!firebaseProjectId || !firebaseClientEmail || !firebasePrivateKey) && (saEnvRaw || saBase64)) {
      try {
        const rawJson = saBase64 ? Buffer.from(saBase64, "base64").toString("utf-8") : saEnvRaw!;
        const sa = JSON.parse(rawJson);
        firebaseProjectId = sa.project_id || firebaseProjectId;
        firebaseClientEmail = sa.client_email || firebaseClientEmail;
        firebasePrivateKey = (sa.private_key || firebasePrivateKey)?.replace(/\\n/g, "\n");
      } catch (e) {
        console.error("[FCM Push] Error parsing Firebase service account from ENV:", e);
      }
    }

    // 2. Fallback to file search in common directories
    if (!firebaseProjectId || !firebaseClientEmail || !firebasePrivateKey) {
      const candidatePaths = [
        path.join(process.cwd(), "firebase-service-account.json"),
        "/app/firebase-service-account.json",
        path.join(__dirname, "../../../firebase-service-account.json"),
      ];
      for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
          try {
            const sa = JSON.parse(fs.readFileSync(p, "utf-8"));
            firebaseProjectId = sa.project_id;
            firebaseClientEmail = sa.client_email;
            firebasePrivateKey = sa.private_key?.replace(/\\n/g, "\n");
            if (firebaseProjectId && firebaseClientEmail && firebasePrivateKey) {
              break;
            }
          } catch (e) {
            console.error(`[FCM Push] Error reading ${p}:`, e);
          }
        }
      }
    }

    if (!firebaseProjectId || !firebaseClientEmail || !firebasePrivateKey) {
      console.log(
        `[FCM Push] Queued for ${pushTokens.length} device(s) of user ${userId}: "${title}" - "${body}". (Note: Set FIREBASE_* env keys or add firebase-service-account.json to send live APNs/FCM pushes).`
      );
      return {
        success: true,
        sentCount: pushTokens.length,
        simulated: true,
        tokens: pushTokens,
      };
    }

    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: firebaseProjectId,
          clientEmail: firebaseClientEmail,
          privateKey: firebasePrivateKey,
        }),
      });
    }

    const response = await getMessaging().sendEachForMulticast({
      tokens: pushTokens,
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
    });

    console.log(
      `[FCM Push] Sent ${response.successCount}/${pushTokens.length} messages for user ${userId}.`
    );

    return {
      success: true,
      sentCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error("[FCM Push] Unexpected error in sendPushNotificationToUser:", error);
    return { success: false, error: String(error) };
  }
}
