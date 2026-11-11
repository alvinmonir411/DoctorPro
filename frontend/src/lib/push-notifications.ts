import { notifications as notificationsApi } from "@/lib/api";

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function getReadyRegistration(): Promise<ServiceWorkerRegistration> {
  await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  return navigator.serviceWorker.ready;
}

export async function getCurrentPushSubscriptionStatus(params: {
  appointmentId?: string;
  doctorId?: string;
  serialNumber?: number;
}): Promise<boolean> {
  if (!isPushSupported() || Notification.permission !== "granted") {
    return false;
  }
  try {
    const registration = await navigator.serviceWorker.getRegistration("/");
    if (!registration) return false;
    const sub = await registration.pushManager.getSubscription();
    if (!sub) return false;
    const res = await notificationsApi.getPushStatus({
      endpoint: sub.endpoint,
      appointmentId: params.appointmentId,
      doctorId: params.doctorId,
      serialNumber: params.serialNumber,
    });
    return Boolean(res?.subscribed);
  } catch {
    return false;
  }
}

export async function enablePushTurnAlert(params: {
  appointmentId?: string;
  doctorId?: string;
  patientPhone?: string;
  serialNumber?: number;
}) {
  if (!isPushSupported()) {
    throw new Error(
      "Your browser does not support Web Push notifications. Please use Chrome, Edge, or Firefox."
    );
  }

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") {
    throw new Error(
      "Notification permission is blocked. Allow notifications in browser site settings to receive turn alerts."
    );
  }

  const vapid = await notificationsApi.getVapidPublicKey();
  if (!vapid?.enabled || !vapid.publicKey) {
    throw new Error("Push notification server key is not configured.");
  }

  const registration = await getReadyRegistration();
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid.publicKey),
    });
  }

  return notificationsApi.subscribePush({
    subscription: subscription.toJSON(),
    appointmentId: params.appointmentId,
    doctorId: params.doctorId,
    patientPhone: params.patientPhone,
    serialNumber: params.serialNumber,
    userAgent: navigator.userAgent,
  });
}

export async function disablePushTurnAlert(appointmentId?: string) {
  if (!isPushSupported()) return { subscribed: false };
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return { subscribed: false };

  return notificationsApi.unsubscribePush({
    endpoint: subscription.endpoint,
    appointmentId,
  });
}
