"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Calendar,
  Stethoscope,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Check,
  Save,
  Loader2,
  Volume2,
  ExternalLink,
  Radio,
} from "lucide-react";
import { dashboard as dashApi, appointments as appsApi, doctors as doctorsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { AppointmentStatusBadge } from "@/components/admin/appointment-status";
import { toast } from "sonner";

export default function AdminDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const userRole = (user?.role || "ADMIN").toUpperCase();
  const isDoctorScoped = userRole === "DOCTOR" || userRole === "DOCTOR_ASSISTANT";

  const [stats, setStats] = useState<any>(null);
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Doctor-specific settings states
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [slotDuration, setSlotDuration] = useState<number>(30);
  const [autoApprove, setAutoApprove] = useState<boolean>(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState("");
  const [advancingQueue, setAdvancingQueue] = useState(false);

  const loadDashboard = async () => {
    try {
      const [s, r] = await Promise.allSettled([
        dashApi.getStats(),
        dashApi.getRecentAppointments(15),
      ]);
      if (s.status === "fulfilled") setStats(s.value);
      if (r.status === "fulfilled" && Array.isArray(r.value)) {
        // If doctor or assistant, filter to linked doctor's appointments
        if ((userRole === "DOCTOR" || userRole === "DOCTOR_ASSISTANT") && user?.doctorId) {
          setRecentApps(r.value.filter((a) => a.doctorId === user.doctorId));
        } else {
          setRecentApps(r.value);
        }
      }

      // Fetch linked doctor profile
      const docIdToLoad = user?.doctorId || (userRole === "DOCTOR" ? doctorProfile?.id : null);
      if (docIdToLoad) {
        const doc = await doctorsApi.getById(docIdToLoad).catch(() => null);
        if (doc) {
          setDoctorProfile(doc);
          setSlotDuration(doc.slotDuration || 30);
          setAutoApprove(Boolean(doc.autoApprove));
        }
      }
    } catch (err: any) {
      console.error("Dashboard data load error", err);
      toast.error("Failed to Load Dashboard", {
        description: err?.message || "Could not load dashboard overview.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceQueue = async (action: string) => {
    const docId = doctorProfile?.id || user?.doctorId;
    if (!docId) return;
    setAdvancingQueue(true);
    try {
      await appsApi.advanceLiveQueue({ doctorId: docId, action });
      await loadDashboard();
      toast.success("Chamber Queue Updated", {
        description:
          action === "NEXT"
            ? "Called next patient in serial queue."
            : action === "PREV"
            ? "Moved back to previous serial."
            : doctorProfile?.chamberStatus === "BREAK"
            ? "Chamber resumed."
            : "Chamber paused for break.",
      });
    } catch (err: any) {
      console.error("Failed to advance queue", err);
      toast.error("Failed to Update Queue", {
        description: err?.message || "Failed to update live chamber queue.",
      });
    } finally {
      setAdvancingQueue(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadDashboard();
    }
  }, [authLoading, userRole, user?.doctorId]);

  const handleSaveDoctorSettings = async () => {
    if (!doctorProfile?.id) return;
    setSavingSettings(true);
    setSettingsSuccess("");
    try {
      await doctorsApi.update(doctorProfile.id, {
        slotDuration: Number(slotDuration),
        autoApprove: Boolean(autoApprove),
      });
      setSettingsSuccess("Practice settings updated successfully!");
      toast.success("Practice Settings Updated", {
        description: `Slot duration set to ${slotDuration} min (${
          autoApprove ? "Auto-Approve" : "Manual Review"
        }).`,
      });
      setTimeout(() => setSettingsSuccess(""), 4000);
      await loadDashboard();
    } catch (err: any) {
      console.error("Failed to save doctor practice settings", err);
      toast.error("Failed to Save Practice Settings", {
        description: err?.message || "Could not update doctor practice settings.",
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await appsApi.update(id, { status });
      await loadDashboard();
      toast.success("Appointment Updated", {
        description: `Appointment status changed to ${status}.`,
      });
    } catch (err: any) {
      console.error("Failed to update appointment status", err);
      toast.error("Failed to Update Appointment", {
        description: err?.message || "Could not update appointment status.",
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {userRole === "DOCTOR"
                ? `Welcome, Dr. ${user?.name || "Doctor"}`
                : userRole === "DOCTOR_ASSISTANT"
                ? `Welcome, ${user?.name || "Assistant"} (Assistant Desk)`
                : "Clinic Administration Overview"}
            </h1>
            <Badge
              variant="secondary"
              className={`text-[10px] font-semibold ${
                userRole === "DOCTOR"
                  ? "bg-teal-100 text-teal-800"
                  : userRole === "DOCTOR_ASSISTANT"
                  ? "bg-indigo-100 text-indigo-800"
                  : "bg-sky-100 text-sky-800"
              }`}
            >
              {userRole}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {userRole === "DOCTOR"
              ? "Manage your visiting slot duration, auto-approval settings, and patient appointments"
              : userRole === "DOCTOR_ASSISTANT"
              ? "Monitor appointment queue, approve patient requests, and manage clinic schedule"
              : "Real-time status of doctors, staff roles, appointments, and practice capacity"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {userRole === "ADMIN" && (
            <Button asChild size="sm" variant="outline" className="rounded-xl text-xs">
              <Link href="/admin/staff">
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5 text-primary" /> Staff & Roles
              </Link>
            </Button>
          )}
          <Button asChild size="sm" className="bg-primary hover:bg-primary/90 rounded-xl text-xs">
            <Link href="/admin/appointments">
              <Calendar className="mr-1.5 h-3.5 w-3.5" /> Appointments Queue
            </Link>
          </Button>
        </div>
      </div>

      {/* ─── LIVE CHAMBER QUEUE CONTROL DESK (Doctor & Assistant) ─── */}
      {(userRole === "DOCTOR" || userRole === "DOCTOR_ASSISTANT") && (
        <Card className="rounded-3xl border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 shadow-md">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-primary/20">
              <div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <h3 className="font-extrabold text-base text-foreground tracking-tight">
                    Live Clinic Queue Desk
                  </h3>
                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Active Queue Control
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Call next patient, advance serial, or pause clinic. Patients can track their queue position and estimated wait time live on their phone!
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 bg-background shadow-xs">
                  <Link href={`/live-queue?doctorId=${doctorProfile?.id || user?.doctorId || ""}`} target="_blank">
                    <ExternalLink className="h-3.5 w-3.5 text-primary" /> View Patient Live Screen
                  </Link>
                </Button>
                {userRole === "DOCTOR" && (
                  <Button asChild variant="outline" size="sm" className="rounded-xl text-xs">
                    <Link href="/admin/assistants">
                      <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 mr-1" /> Assistants
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              {/* Current Serial */}
              <div className="p-4 rounded-2xl bg-card border shadow-xs space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                  Current Serving Token
                </span>
                <p className="text-3xl sm:text-4xl font-black text-emerald-600">
                  #{doctorProfile?.currentServingSerial || 0}
                </p>
                <span className="text-[11px] text-muted-foreground block">
                  {doctorProfile?.chamberStatus === "BREAK" ? "Clinic Paused / Break" : "Inside Consultation Room"}
                </span>
              </div>

              {/* Next In Line */}
              <div className="p-4 rounded-2xl bg-card border shadow-xs space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                  Next In Line
                </span>
                <p className="text-3xl sm:text-4xl font-black text-primary">
                  #{(doctorProfile?.currentServingSerial || 0) + 1}
                </p>
                <span className="text-[11px] text-muted-foreground block">
                  Waiting outside chamber door
                </span>
              </div>

              {/* Quick Actions */}
              <div className="p-4 rounded-2xl bg-card border shadow-xs flex flex-col justify-center gap-2">
                <Button
                  onClick={() => handleAdvanceQueue("NEXT")}
                  disabled={advancingQueue}
                  className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  <Volume2 className="mr-1.5 h-4 w-4" /> Call Next Patient (Serial #{(doctorProfile?.currentServingSerial || 0) + 1})
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAdvanceQueue("PREV")}
                    disabled={advancingQueue || (doctorProfile?.currentServingSerial || 0) <= 0}
                    className="flex-1 text-xs rounded-xl"
                  >
                    ⏪ Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAdvanceQueue("BREAK")}
                    disabled={advancingQueue}
                    className={`flex-1 text-xs rounded-xl ${
                      doctorProfile?.chamberStatus === "BREAK" ? "bg-amber-100 text-amber-800 font-bold" : ""
                    }`}
                  >
                    {doctorProfile?.chamberStatus === "BREAK" ? "Resume Chamber" : "Take Break"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Doctor Slot Duration & Auto-Approve Settings Card (DOCTOR ONLY) */}
      {userRole === "DOCTOR" && doctorProfile && (
        <Card className="rounded-2xl border-primary/30 bg-primary/5 shadow-xs">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-primary/15 pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> My Practice & Booking Configuration
                </h3>
                <p className="text-xs text-muted-foreground">
                  Set how long each patient slot lasts and choose whether patient bookings are auto-approved
                </p>
              </div>

              {settingsSuccess && (
                <div className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{settingsSuccess}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Slot Duration */}
              <div className="space-y-2 p-4 rounded-xl bg-background border">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-primary" />
                  Slot Duration (Minutes per Patient)
                </label>
                <select
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(Number(e.target.value))}
                  className="w-full h-10 px-3 text-xs rounded-xl border bg-background font-semibold"
                >
                  <option value={10}>10 Minutes per patient</option>
                  <option value={15}>15 Minutes per patient</option>
                  <option value={20}>20 Minutes per patient</option>
                  <option value={30}>30 Minutes per patient (Standard)</option>
                  <option value={45}>45 Minutes per patient</option>
                  <option value={60}>60 Minutes per patient (1 Hour)</option>
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Patients booking on the public website will see time slots generated every <strong>{slotDuration} minutes</strong>.
                </p>
              </div>

              {/* Auto Approve Toggle */}
              <div className="space-y-2 p-4 rounded-xl bg-background border">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Appointment Approval Mode
                </label>
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">
                    {autoApprove ? "Auto-Approve (Immediate Confirmation)" : "Manual Review (Pending Confirmation)"}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoApprove}
                      onChange={(e) => setAutoApprove(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {autoApprove
                    ? "✓ Patients receive immediate CONFIRMED status right after submitting the booking form."
                    : "⏳ Patient bookings stay PENDING until you or your assistant review and approve them."}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSaveDoctorSettings}
                disabled={savingSettings}
                className="bg-primary hover:bg-primary/90 text-xs font-semibold rounded-xl"
              >
                {savingSettings ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-1.5 h-3.5 w-3.5" /> Save Practice Settings
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/80 shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Total Appointments</p>
              <p className="text-2xl font-bold text-foreground">{stats?.totalAppointments ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">
                <span className="text-emerald-600 font-semibold">{stats?.confirmedAppointments ?? 0}</span> confirmed
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Calendar className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Today&apos;s Schedule</p>
              <p className="text-2xl font-bold text-foreground">{stats?.todayAppointments ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">
                <span className="text-amber-600 font-semibold">{stats?.pendingAppointments ?? 0}</span> pending review
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">
                {isDoctorScoped ? "My Patients" : "Registered Patients"}
              </p>
              <p className="text-2xl font-bold text-foreground">{stats?.totalPatients ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">
                {isDoctorScoped ? "Booked with your practice" : "Patient records"}
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">
                {isDoctorScoped ? "Consultation Fee" : "Active Doctors"}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {isDoctorScoped
                  ? `$${doctorProfile?.consultationFee ?? 0}`
                  : (stats?.totalDoctors ?? 0)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {isDoctorScoped
                  ? `${doctorProfile?.slotDuration ?? 30} min per consultation slot`
                  : `Across ${stats?.totalDepartments ?? 0} departments`}
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Stethoscope className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointments Queue Table */}
      <Card className="rounded-2xl border-border/80 shadow-xs">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-foreground">
                {userRole === "DOCTOR"
                  ? "My Patient Appointments"
                  : userRole === "DOCTOR_ASSISTANT"
                  ? "Daily Queue & Pending Approvals"
                  : "Recent Clinic Appointments"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {userRole === "DOCTOR_ASSISTANT"
                  ? "Quickly confirm pending booking requests or mark visits completed"
                  : "Latest appointment bookings and consultation requests"}
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs text-primary">
              <Link href="/admin/appointments">
                View Full Queue <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="h-40 rounded-xl bg-muted/40 animate-pulse" />
          ) : recentApps.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b text-muted-foreground font-medium bg-muted/30">
                  <tr>
                    <th className="p-3">Patient</th>
                    <th className="p-3">Phone</th>
                    {!isDoctorScoped && <th className="p-3">Doctor</th>}
                    <th className="p-3">Date & Slot</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {recentApps.map((app) => (
                    <tr key={app.id} className="hover:bg-muted/20">
                      <td className="p-3 font-semibold text-foreground">
                        {app.patient?.name || "Patient"}
                      </td>
                      <td className="p-3 text-muted-foreground">{app.patient?.phone}</td>
                      {!isDoctorScoped && (
                        <td className="p-3 font-medium text-foreground">
                          {app.doctor?.name || "Doctor"}
                        </td>
                      )}
                      <td className="p-3">
                        <span className="font-medium">
                          {new Date(app.date).toISOString().split("T")[0]}
                        </span>{" "}
                        <span className="text-muted-foreground font-semibold">({app.timeSlot})</span>
                      </td>
                      <td className="p-3">
                        <AppointmentStatusBadge status={app.status} />
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {(app.status || "").toUpperCase() === "PENDING" && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(app.id, "CONFIRMED")}
                              className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                            >
                              Approve / Confirm
                            </Button>
                          )}
                          {["PENDING", "CONFIRMED", "SERVING"].includes((app.status || "").toUpperCase()) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(app.id, "COMPLETED")}
                              className="h-7 text-[11px] text-blue-600 border-blue-300 hover:bg-blue-50"
                            >
                              Complete
                            </Button>
                          )}
                          {!["CANCELLED", "COMPLETED"].includes((app.status || "").toUpperCase()) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUpdateStatus(app.id, "CANCELLED")}
                              className="h-7 text-[11px] text-rose-500 hover:bg-rose-50"
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl space-y-2">
              <Calendar className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="font-medium text-foreground">No Appointments Recorded Yet</p>
              <p>Appointments booked by patients will appear in this queue.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
