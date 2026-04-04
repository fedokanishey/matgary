import webPush from "web-push";

/**
 * Configure Web Push with VAPID keys.
 * VAPID keys authenticate your server to send push notifications.
 */
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@matgary.com";

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  data?: Record<string, unknown>;
}

/**
 * Send a push notification to a single subscription.
 */
export async function sendPushNotification(
  subscription: {
    endpoint: string;
    p256dh: string;
    auth: string;
  },
  payload: PushPayload
) {
  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  return webPush.sendNotification(
    pushSubscription,
    JSON.stringify(payload),
    {
      TTL: 60 * 60, // 1 hour
      urgency: "high",
    }
  );
}

/**
 * Send push notifications to multiple subscriptions.
 * Silently handles expired subscriptions.
 */
export async function sendPushToAll(
  subscriptions: Array<{
    endpoint: string;
    p256dh: string;
    auth: string;
  }>,
  payload: PushPayload
) {
  const results = await Promise.allSettled(
    subscriptions.map((sub) => sendPushNotification(sub, payload))
  );

  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    console.warn(`[Push] ${failed.length}/${results.length} notifications failed`);
  }

  return results;
}
