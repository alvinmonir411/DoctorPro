"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Search,
  Clock,
  UserCheck,
  Stethoscope,
  RefreshCw,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Phone,
  Flame,
  ArrowRight,
  User,
  Radio,
  Volume2,
} from "lucide-react";
import { appointments as appsApi, doctors as docsApi } from "@/lib/api";
import { getMediaUrl } from "@/lib/utils";
import { toast } from "sonner";
import { NotifyTurnButton } from "@/components/public/NotifyTurnButton";

function LiveQueueContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlAppId = searchParams.get("appointmentId") || "";
  const urlPhone = searchParams.get("phone") || "";
  const urlDoctorId = searchParams.get("doctorId") || "";

  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(urlDoctorId);
  const [phoneInput, setPhoneInput] = useState<string>(urlPhone);
  const [appointmentIdInput, setAppointmentIdInput] = useState<string>(urlAppId);

  const [queueData, setQueueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [errorMessage, setErrorMessage] = useState("");

  // Load doctors list
  useEffect(() => {
    async function loadDoctors() {
      try {
        const res = await docsApi.getAll("activeOnly=true");
        if (Array.isArray(res) && res.length > 0) {
          setDoctorsList(res);
          if (!selectedDoctorId) {
            setSelectedDoctorId(res[0].id);
          }
        }
      } catch (err: any) {
        console.error("Failed to load doctors", err);
        toast.error("Failed to Load Doctors", {
          description: err?.message || "Could not load active doctors list.",
        });
      }
    }
    loadDoctors();
  }, [selectedDoctorId]);

  // Fetch live queue data
  const fetchQueue = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    setErrorMessage("");
    try {
      const res = await appsApi.getLiveQueue({
        doctorId: selectedDoctorId || undefined,
        appointmentId: appointmentIdInput.trim() || undefined,
        phone: phoneInput.trim() || undefined,
      });
      setQueueData(res);
      setLastRefreshed(new Date());
      if (res?.doctor?.id && !selectedDoctorId) {
        setSelectedDoctorId(res.doctor.id);
      }
    } catch (err: any) {
      console.error("Live queue fetch error:", err);
      const exactMsg = err?.message || "Failed to load live chamber queue data";
      setErrorMessage(exactMsg);
      if (!isSilent) {
        toast.error("Live Queue Error", { description: exactMsg });
      }
    } finally {
      setLoading(false);
      if (!isSilent) setRefreshing(false);
    }
  }, [selectedDoctorId, appointmentIdInput, phoneInput]);

  // Initial fetch and dependency trigger
  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Auto-refresh polling every 8 seconds for real-time live chamber updates
  useEffect(() => {
    const timer = setInterval(() => {
      fetchQueue(true);
    }, 8000);
    return () => clearInterval(timer);
  }, [fetchQueue]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQueue(false);
  };

  const doctor = queueData?.doctor;
  const currentlyServing = queueData?.currentlyServing;
  const myQueue = queueData?.myQueueStatus;
  const stats = queueData?.stats;
  const queueList = queueData?.queueList || [];

  return (
    <div className="py-10 md:py-16 bg-gradient-to-b from-sky-50/50 via-background to-muted/20 min-h-screen">
      <div className="container max-w-5xl mx-auto px-4 space-y-8">
        {/* Top Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            LIVE CHAMBER SERIAL TRACKER
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            Live Patient Queue & Serial Status
          </h1>
          <p className="text-sm text-muted-foreground">
            Watch real-time token serials, current patient in chamber, and live estimated wait time without crowded waiting rooms.
          </p>
        </div>

        {/* Search & Doctor Selection Card */}
        <Card className="rounded-3xl border shadow-sm bg-card p-5 sm:p-6 space-y-4">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            {/* Select Doctor Chamber */}
            <div className="md:col-span-4 space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Stethoscope className="h-3.5 w-3.5 text-primary" /> Select Doctor Chamber
              </Label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full h-11 px-3 bg-background border rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {doctorsList.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.name} ({d.specialization})
                  </option>
                ))}
              </select>
            </div>

            {/* Enter Patient Phone */}
            <div className="md:col-span-4 space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-primary" /> Your Phone Number (To Track Your Serial)
              </Label>
              <Input
                placeholder="e.g. 01712345678"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="h-11 rounded-2xl text-xs sm:text-sm"
              />
            </div>

            {/* Track Button */}
            <div className="md:col-span-4 flex items-center gap-2">
              <Button
                type="submit"
                className="h-11 flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-bold text-xs shadow-xs"
              >
                <Search className="mr-1.5 h-4 w-4" /> Track My Serial
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => fetchQueue(false)}
                disabled={refreshing}
                className="h-11 w-11 p-0 rounded-2xl shrink-0"
                title="Refresh live data"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-primary" : ""}`} />
              </Button>
            </div>
          </form>

          {/* Live Sync Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-[11px] text-muted-foreground px-1">
            <span className="flex items-center gap-1.5">
              <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
              Auto-syncs live every 8 seconds
            </span>
            <span>
              Last updated: {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </div>
        </Card>

        {/* ─── Tracked Patient Hero Queue Display (If matched patient) ─── */}
        {myQueue && (
          <Card className="rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-teal-500/5 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4">
            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Alert Status Banner */}
              <div
                className={`p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-semibold shadow-xs ${
                  myQueue.isCurrentlyServing
                    ? "bg-emerald-500 text-white animate-pulse"
                    : myQueue.isNext
                    ? "bg-amber-500 text-white"
                    : myQueue.isCompleted
                    ? "bg-slate-800 text-white"
                    : "bg-teal-50 text-teal-900 border border-teal-200"
                }`}
              >
                {myQueue.isCurrentlyServing ? (
                  <Volume2 className="h-6 w-6 shrink-0" />
                ) : myQueue.isNext ? (
                  <Flame className="h-6 w-6 shrink-0" />
                ) : (
                  <Clock className="h-6 w-6 shrink-0 text-teal-600" />
                )}
                <div>
                  <p className="font-extrabold">{myQueue.message}</p>
                  <p className="text-[11px] font-normal opacity-90">
                    Patient: {myQueue.patientName} • Booked Slot: {myQueue.timeSlot}
                  </p>
                </div>
              </div>

              {/* 3 Metric Hero Tokens */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                {/* 1. Currently in Room */}
                <div className="p-5 rounded-2xl bg-white dark:bg-card border shadow-xs space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Now Serving In Chamber
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-emerald-600 flex items-center justify-center gap-2 py-1">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    #{currentlyServing?.serialNumber || doctor?.currentServingSerial || 0}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {doctor?.chamberStatus === "BREAK" ? "Chamber on Short Break" : "Currently Consulting"}
                  </span>
                </div>

                {/* 2. Your Serial */}
                <div className="p-5 rounded-2xl bg-primary text-primary-foreground shadow-md space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider block text-primary-foreground/80">
                    Your Serial Number
                  </span>
                  <div className="text-3xl sm:text-4xl font-black py-1">
                    #{myQueue.yourSerial}
                  </div>
                  <span className="text-[11px] text-primary-foreground/90">
                    {myQueue.isCurrentlyServing
                      ? "In Consultation Room"
                      : myQueue.isNext
                      ? "Next In Line"
                      : `${myQueue.patientsAhead} Patient(s) Ahead`}
                  </span>
                </div>

                {/* 3. Estimated Wait Time */}
                <div className="p-5 rounded-2xl bg-white dark:bg-card border shadow-xs space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Estimated Wait Time
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-foreground py-1">
                    {myQueue.isCurrentlyServing ? "0 min" : `~${myQueue.estimatedWaitMinutes} min`}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Based on {doctor?.slotDuration || 15}m slot duration
                  </span>
                </div>
              </div>

              <NotifyTurnButton
                appointmentId={myQueue.appointmentId}
                doctorId={doctor?.id}
                doctorName={doctor?.name}
                patientPhone={myQueue.patientPhone || phoneInput}
                serialNumber={myQueue.yourSerial}
              />
            </CardContent>
          </Card>
        )}

        {!myQueue && doctor && (
          <NotifyTurnButton
            doctorId={doctor.id}
            doctorName={doctor.name}
            patientPhone={phoneInput || undefined}
            allowSerialInput
          />
        )}

        {/* ─── Doctor & Chamber Information Card ─── */}
        {doctor && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 rounded-3xl border shadow-xs p-6 bg-card flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-muted border overflow-hidden shrink-0">
                    {doctor.image ? (
                      <img
                        src={getMediaUrl(doctor.image)}
                        alt={doctor.name}
                        className="h-full w-full object-cover object-top"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xl">
                        {doctor.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground leading-tight">
                      Dr. {doctor.name}
                    </h3>
                    <p className="text-xs text-primary font-medium">{doctor.specialization}</p>
                    <p className="text-[11px] text-muted-foreground">{doctor.title}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{doctor.chamberAddress || "DoctorPro Medical Center, New York, NY"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Slot Duration: <strong>{doctor.slotDuration || 15} minutes</strong></span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t flex items-center justify-between">
                <Badge
                  className={`text-[10px] font-bold ${
                    doctor.chamberStatus === "BREAK"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {doctor.chamberStatus === "BREAK" ? "Chamber on Break" : "Chamber Open & Consulting"}
                </Badge>
                <Button asChild size="sm" variant="outline" className="text-xs rounded-xl">
                  <Link href={`/doctors/${doctor.id}`}>Profile</Link>
                </Button>
              </div>
            </Card>

            {/* Chamber Live Queue Display (Waiting Room Table) */}
            <Card className="md:col-span-2 rounded-3xl border shadow-xs p-6 bg-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-foreground">
                    Chamber Queue Display Board
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Total: {stats?.totalPatientsToday || 0} Patients • Completed: {stats?.completedCount || 0} • Waiting: {stats?.waitingCount || 0}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
                    Now Inside
                  </span>
                  <span className="text-lg font-black text-emerald-600">
                    Serial #{currentlyServing?.serialNumber || doctor.currentServingSerial || 0}
                  </span>
                </div>
              </div>

              {queueList.length > 0 ? (
                <div className="overflow-x-auto max-h-72 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="border-b text-muted-foreground font-medium bg-muted/40 sticky top-0">
                      <tr>
                        <th className="p-2.5">Serial</th>
                        <th className="p-2.5">Time Slot</th>
                        <th className="p-2.5">Patient Token</th>
                        <th className="p-2.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {queueList.map((item: any) => {
                        const isMe = myQueue?.yourSerial === item.serialNumber;
                        return (
                          <tr
                            key={item.id}
                            className={`transition-colors ${
                              item.isServing
                                ? "bg-emerald-50 dark:bg-emerald-950/20 font-bold"
                                : isMe
                                ? "bg-primary/10 font-bold"
                                : "hover:bg-muted/20"
                            }`}
                          >
                            <td className="p-2.5">
                              <span
                                className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-black ${
                                  item.isServing
                                    ? "bg-emerald-600 text-white shadow-xs animate-pulse"
                                    : item.isCompleted
                                    ? "bg-muted text-muted-foreground"
                                    : "bg-slate-100 text-slate-800"
                                }`}
                              >
                                #{item.serialNumber}
                              </span>
                            </td>
                            <td className="p-2.5 text-muted-foreground font-mono">{item.timeSlot}</td>
                            <td className="p-2.5">
                              <span className="font-semibold text-foreground">
                                {isMe ? `${item.maskedName} (YOU)` : item.maskedName}
                              </span>
                            </td>
                            <td className="p-2.5 text-right">
                              {item.isServing ? (
                                <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] animate-pulse">
                                  ● Now Inside Room
                                </Badge>
                              ) : item.isCompleted ? (
                                <Badge variant="secondary" className="text-[10px] text-muted-foreground">
                                  ✓ Completed
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] text-slate-600">
                                  Waiting
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground text-xs space-y-2">
                  <Clock className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                  <p>No appointments booked for today yet.</p>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LiveQueuePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-muted-foreground">Loading Live Chamber Queue...</div>}>
      <LiveQueueContent />
    </Suspense>
  );
}
