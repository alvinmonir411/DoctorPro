"use client";

import React, { useEffect, useState } from "react";
import { Bell, BellRing, BellOff, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  isPushSupported,
  getCurrentPushSubscriptionStatus,
  enablePushTurnAlert,
  disablePushTurnAlert,
} from "@/lib/push-notifications";

interface NotifyTurnButtonProps {
  appointmentId?: string;
  doctorId?: string;
  doctorName?: string;
  patientPhone?: string;
  serialNumber?: number;
  allowSerialInput?: boolean;
  compact?: boolean;
}

export function NotifyTurnButton({
  appointmentId,
  doctorId,
  doctorName,
  patientPhone,
  serialNumber,
  allowSerialInput = false,
  compact = false,
}: NotifyTurnButtonProps) {
  const [supported, setSupported] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualSerial, setManualSerial] = useState<string>(
    serialNumber ? String(serialNumber) : ""
  );

  const effectiveSerial = serialNumber ?? (manualSerial ? Number(manualSerial) : undefined);

  useEffect(() => {
    setSupported(isPushSupported());
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function syncStatus() {
      const active = await getCurrentPushSubscriptionStatus({
        appointmentId,
        doctorId,
        serialNumber: effectiveSerial,
      });
      if (!cancelled) setEnabled(active);
    }
    syncStatus();
    return () => {
      cancelled = true;
    };
  }, [appointmentId, doctorId, effectiveSerial]);

  const handleToggle = async () => {
    if (loading) return;

    if (enabled) {
      setLoading(true);
      try {
        await disablePushTurnAlert(appointmentId);
        setEnabled(false);
        toast.info("Turn Alerts Paused", {
          description: "Browser push alerts turned off for this device.",
        });
      } catch (err: any) {
        toast.error("Failed to Turn Off Alerts", {
          description: err?.message || "Could not disable notifications.",
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    if (allowSerialInput && (!effectiveSerial || effectiveSerial <= 0)) {
      toast.error("Serial Number Required", {
        description: "Enter your serial number (e.g. 6) so we know when to alert you.",
      });
      return;
    }

    setLoading(true);
    try {
      const res: any = await enablePushTurnAlert({
        appointmentId,
        doctorId,
        patientPhone,
        serialNumber: effectiveSerial,
      });
      setEnabled(true);
      toast.success("Notify My Turn Enabled!", {
        description: res?.testPushSent
          ? `Free browser push alert sent! We'll notify you before Serial #${effectiveSerial || "your turn"} is called — even if you close this tab.`
          : `Enabled for Serial #${effectiveSerial || "your booking"}. You will get notified automatically as the queue advances.`,
      });
    } catch (err: any) {
      toast.error("Could Not Enable Push Alerts", {
        description: err?.message || "Failed to enable browser notifications.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!supported) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {allowSerialInput && !serialNumber && (
          <Input
            type="number"
            min={1}
            placeholder="Serial #"
            value={manualSerial}
            onChange={(e) => setManualSerial(e.target.value)}
            className="w-24 h-10 rounded-xl text-xs"
          />
        )}
        <Button
          type="button"
          onClick={handleToggle}
          disabled={loading}
          variant={enabled ? "outline" : "default"}
          className={`h-10 rounded-xl text-xs font-bold ${
            enabled
              ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              : "bg-sky-600 hover:bg-sky-700 text-white"
          }`}
        >
          {loading ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : enabled ? (
            <BellRing className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <Bell className="mr-1.5 h-3.5 w-3.5" />
          )}
          {enabled ? "Turn Alerts ON" : "Notify My Turn"}
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border p-4 text-left transition-all ${
        enabled
          ? "bg-emerald-50/90 border-emerald-200 dark:bg-emerald-950/30"
          : "bg-sky-50/80 border-sky-200 dark:bg-sky-950/20"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
              enabled
                ? "bg-emerald-600 text-white"
                : "bg-sky-600 text-white"
            }`}
          >
            {enabled ? (
              <BellRing className="h-5 w-5 animate-pulse" />
            ) : (
              <Bell className="h-5 w-5" />
            )}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-xs sm:text-sm text-foreground">
                {enabled ? "Notify My Turn Is Active" : "Notify My Turn (Free Browser Alert)"}
              </p>
              {enabled && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="h-3 w-3" /> Subscribed
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {enabled
                ? `We'll send an instant push notification to this device as ${
                    doctorName ? `Dr. ${doctorName}'s` : "the"
                  } queue approaches Serial #${effectiveSerial || 1} — even if you close this tab.`
                : `Get an instant notification before your turn${
                    effectiveSerial ? ` (Serial #${effectiveSerial})` : ""
                  } — works even when your browser tab is closed.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {allowSerialInput && !serialNumber && !enabled && (
            <Input
              type="number"
              min={1}
              placeholder="Serial #"
              value={manualSerial}
              onChange={(e) => setManualSerial(e.target.value)}
              className="w-24 h-10 rounded-xl text-xs bg-background"
            />
          )}
          <Button
            type="button"
            onClick={handleToggle}
            disabled={loading}
            variant={enabled ? "outline" : "default"}
            className={`h-10 px-4 rounded-xl text-xs font-bold whitespace-nowrap ${
              enabled
                ? "border-emerald-300 text-emerald-800 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                : "bg-sky-600 hover:bg-sky-700 text-white shadow-xs"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Connecting...
              </>
            ) : enabled ? (
              <>
                <BellOff className="mr-1.5 h-3.5 w-3.5" />
                Turn Off
              </>
            ) : (
              <>
                <Bell className="mr-1.5 h-3.5 w-3.5" />
                Turn On Alerts
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
