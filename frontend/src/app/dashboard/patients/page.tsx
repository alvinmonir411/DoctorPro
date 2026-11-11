"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Trash2,
  UserX,
  CheckCircle2,
  X,
  Clock,
} from "lucide-react";
import { patients as patientsApi, appointments as appsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { AppointmentStatusBadge } from "@/components/admin/appointment-status";
import { toast } from "sonner";
import { confirmActionToast } from "@/components/ui/toast";

const PATIENT_STATUS_TABS = [
  { key: "ALL", label: "All Visits" },
  { key: "COMPLETED", label: "Seen (Completed)" },
  { key: "ABSENT", label: "Absent" },
  { key: "ACTIVE", label: "Active Queue" },
  { key: "CANCELLED", label: "Cancelled" },
] as const;

function formatLocalYmd(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function AdminPatientsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const userRole = (user?.role || "").toUpperCase();
  const isDoctorScoped = userRole === "DOCTOR" || userRole === "DOCTOR_ASSISTANT";

  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);
  const [expandedPatients, setExpandedPatients] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const loadPatients = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await patientsApi.getAll({
        search: debouncedSearch.trim() || undefined,
        date: selectedDate || undefined,
        status: statusFilter,
      });
      if (Array.isArray(res)) {
        setPatientsList(res);
      }
    } catch (err: any) {
      console.error("Failed to load patients", err);
      toast.error("Failed to Load Patients", {
        description: err?.message || "Could not fetch patient records.",
      });
    } finally {
      setLoading(false);
    }
  }, [user, debouncedSearch, selectedDate, statusFilter]);

  useEffect(() => {
    if (!authLoading && user) {
      loadPatients();
    }
  }, [authLoading, userRole, user?.doctorId, loadPatients]);

  const handleDelete = async (id: string) => {
    const confirmed = await confirmActionToast({
      title: "Delete Patient Record",
      description: "Are you sure you want to delete this patient record?",
      confirmLabel: "Delete",
    });
    if (!confirmed) return;
    try {
      await patientsApi.delete(id);
      await loadPatients();
      toast.success("Patient Record Deleted", {
        description: "The patient record has been removed.",
      });
    } catch (err: any) {
      toast.error("Failed to Delete Patient", {
        description: err?.message || "Failed to delete patient",
      });
    }
  };

  const handleUpdateAppointmentStatus = async (appId: string, status: string) => {
    setUpdatingAppId(appId);
    try {
      await appsApi.update(appId, { status });
      await loadPatients();
      toast.success("Visit Status Updated", {
        description: `Appointment marked as ${status}.`,
      });
    } catch (err: any) {
      toast.error("Failed to Update Visit", {
        description: err?.message || "Unable to update appointment status.",
      });
    } finally {
      setUpdatingAppId(null);
    }
  };

  // Instant client-side cross-field match on top of server query
  const q = search.trim().toLowerCase();
  const filtered = patientsList.filter((pt) => {
    if (!q) return true;
    const directMatch =
      (pt.id && pt.id.toLowerCase().includes(q)) ||
      (pt.name && pt.name.toLowerCase().includes(q)) ||
      (pt.phone && pt.phone.toLowerCase().includes(q)) ||
      (pt.email && pt.email.toLowerCase().includes(q)) ||
      (pt.address && pt.address.toLowerCase().includes(q)) ||
      (pt.gender && pt.gender.toLowerCase().includes(q)) ||
      (pt.bloodGroup && pt.bloodGroup.toLowerCase().includes(q));

    if (directMatch) return true;

    const appts = Array.isArray(pt.appointments) ? pt.appointments : [];
    return appts.some((app: any) => {
      const dateStr = app.date ? new Date(app.date).toISOString().split("T")[0] : "";
      const serialStr = app.serialNumber ? `#${app.serialNumber}` : "";
      return (
        (app.id && app.id.toLowerCase().includes(q)) ||
        (app.notes && app.notes.toLowerCase().includes(q)) ||
        (app.timeSlot && app.timeSlot.toLowerCase().includes(q)) ||
        (app.status && app.status.toLowerCase().includes(q)) ||
        (app.type && app.type.toLowerCase().includes(q)) ||
        dateStr.includes(q) ||
        serialStr.toLowerCase().includes(q) ||
        (app.serialNumber !== null &&
          app.serialNumber !== undefined &&
          String(app.serialNumber) === q.replace(/^#/, "")) ||
        (app.doctor?.name && app.doctor.name.toLowerCase().includes(q)) ||
        (app.doctor?.specialization && app.doctor.specialization.toLowerCase().includes(q))
      );
    });
  });

  const totals = filtered.reduce(
    (acc, pt) => {
      const appts = Array.isArray(pt.appointments) ? pt.appointments : [];
      acc.patients += 1;
      for (const a of appts) {
        const st = (a.status || "").toUpperCase();
        acc.visits += 1;
        if (st === "COMPLETED") acc.completed += 1;
        else if (st === "ABSENT") acc.absent += 1;
        else if (st !== "CANCELLED") acc.active += 1;
      }
      return acc;
    },
    { patients: 0, visits: 0, completed: 0, absent: 0, active: 0 },
  );

  const todayStr = formatLocalYmd();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {userRole === "DOCTOR"
              ? "My Patients"
              : userRole === "DOCTOR_ASSISTANT"
              ? "Doctor's Patients"
              : "Patient Records"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isDoctorScoped
              ? "Search any patient detail (name, phone, email, address, blood group, serial #, symptoms/notes) or filter by consultation date"
              : "Search patient records by any field and filter consultations by date"}
          </p>
        </div>
      </div>

      {/* Search + Date + Status Filter Bar */}
      <div className="p-4 rounded-2xl bg-card border space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Universal Patient Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search anything: name, phone, email, address, blood group, serial #5, notes, slot..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 h-10 rounded-xl"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Date Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex items-center">
              <Calendar className="h-4 w-4 text-muted-foreground absolute left-3 pointer-events-none" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-9 h-10 rounded-xl w-44 text-xs"
                aria-label="Filter patients by consultation date"
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant={selectedDate === todayStr ? "default" : "outline"}
              onClick={() => setSelectedDate(selectedDate === todayStr ? "" : todayStr)}
              className="h-10 rounded-xl text-xs"
            >
              Today
            </Button>
            {selectedDate && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setSelectedDate("")}
                className="h-10 rounded-xl text-xs text-muted-foreground"
              >
                Clear Date
              </Button>
            )}
          </div>
        </div>

        {/* Status Filter Pills + Quick Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-border/60">
          <div className="flex flex-wrap items-center gap-1 bg-muted p-1 rounded-xl text-xs w-fit">
            {PATIENT_STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  statusFilter === tab.key
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            {selectedDate && (
              <Badge variant="outline" className="text-[11px] font-semibold bg-primary/5 text-primary border-primary/20">
                Date: {selectedDate}
              </Badge>
            )}
            <span>
              <strong className="text-foreground">{totals.patients}</strong> Patients
            </span>
            <span>•</span>
            <span>
              <strong className="text-blue-600">{totals.completed}</strong> Seen
            </span>
            <span>•</span>
            <span>
              <strong className="text-orange-600">{totals.absent}</strong> Absent
            </span>
            {totals.active > 0 && (
              <>
                <span>•</span>
                <span>
                  <strong className="text-emerald-600">{totals.active}</strong> Active
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <Card className="rounded-2xl border-border/80 shadow-xs">
        <CardContent className="p-6">
          {loading ? (
            <div className="h-40 rounded-xl bg-muted/40 animate-pulse" />
          ) : filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b text-muted-foreground font-medium bg-muted/30">
                  <tr>
                    <th className="p-3">Patient</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">
                      {selectedDate ? `Visits on ${selectedDate}` : "Visits & Notes"}
                    </th>
                    <th className="p-3">Summary</th>
                    <th className="p-3">Registered</th>
                    {!isDoctorScoped && <th className="p-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 align-top">
                  {filtered.map((pt) => {
                    const appts = Array.isArray(pt.appointments) ? pt.appointments : [];
                    const isExpanded = Boolean(expandedPatients[pt.id]);
                    const visibleAppts =
                      selectedDate || isExpanded ? appts : appts.slice(0, 2);
                    const hiddenCount = appts.length - visibleAppts.length;
                    const completedCount =
                      pt.visitSummary?.completed ??
                      appts.filter((a: any) => (a.status || "").toUpperCase() === "COMPLETED").length;
                    const absentCount =
                      pt.visitSummary?.absent ??
                      appts.filter((a: any) => (a.status || "").toUpperCase() === "ABSENT").length;

                    return (
                      <tr key={pt.id} className="hover:bg-muted/20">
                        <td className="p-3 space-y-1 min-w-[170px]">
                          <p className="font-semibold text-foreground">{pt.name}</p>
                          <div className="flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
                            {pt.gender && (
                              <span className="px-1.5 py-0.5 rounded bg-muted">{pt.gender}</span>
                            )}
                            {pt.bloodGroup && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold">
                                {pt.bloodGroup}
                              </span>
                            )}
                            {pt.address && (
                              <span className="inline-flex items-center gap-0.5">
                                <MapPin className="h-3 w-3" /> {pt.address}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-3 space-y-1 text-muted-foreground min-w-[150px]">
                          <div className="inline-flex items-center gap-1 text-foreground font-medium">
                            <Phone className="h-3 w-3 text-muted-foreground" /> {pt.phone}
                          </div>
                          {pt.email && (
                            <div className="flex items-center gap-1 text-[11px]">
                              <Mail className="h-3 w-3" /> {pt.email}
                            </div>
                          )}
                        </td>

                        <td className="p-3 min-w-[290px] space-y-1.5">
                          {visibleAppts.length > 0 ? (
                            <div className="space-y-1.5">
                              {visibleAppts.map((app: any) => {
                                const st = (app.status || "PENDING").toUpperCase();
                                const appDateStr = app.date
                                  ? new Date(app.date).toISOString().split("T")[0]
                                  : "—";
                                const canQuickUpdate = ["PENDING", "CONFIRMED", "SERVING"].includes(st);
                                const isAbsent = st === "ABSENT";

                                return (
                                  <div
                                    key={app.id}
                                    className="p-2 rounded-xl border bg-muted/20 flex flex-col gap-1"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                        {app.serialNumber && (
                                          <span className="font-bold text-primary">
                                            #{app.serialNumber}
                                          </span>
                                        )}
                                        <span className="font-semibold text-foreground">
                                          {appDateStr}
                                        </span>
                                        <span className="text-muted-foreground inline-flex items-center gap-0.5">
                                          <Clock className="h-3 w-3" /> {app.timeSlot}
                                        </span>
                                        {!isDoctorScoped && app.doctor?.name && (
                                          <span className="text-[10px] text-muted-foreground">
                                            • {app.doctor.name}
                                          </span>
                                        )}
                                      </div>
                                      <AppointmentStatusBadge status={st} />
                                    </div>

                                    {app.notes && (
                                      <p className="text-[11px] text-muted-foreground">
                                        Notes: {app.notes}
                                      </p>
                                    )}

                                    {(canQuickUpdate || isAbsent) && (
                                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                        {canQuickUpdate && (
                                          <>
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="outline"
                                              disabled={updatingAppId === app.id}
                                              onClick={() =>
                                                handleUpdateAppointmentStatus(app.id, "COMPLETED")
                                              }
                                              className="h-6 px-2 text-[10px] text-blue-600 border-blue-200 hover:bg-blue-50"
                                            >
                                              <CheckCircle2 className="mr-1 h-3 w-3" /> Complete
                                            </Button>
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="outline"
                                              disabled={updatingAppId === app.id}
                                              onClick={() =>
                                                handleUpdateAppointmentStatus(app.id, "ABSENT")
                                              }
                                              className="h-6 px-2 text-[10px] text-orange-700 border-orange-200 hover:bg-orange-50"
                                            >
                                              <UserX className="mr-1 h-3 w-3" /> Absent
                                            </Button>
                                          </>
                                        )}
                                        {isAbsent && (
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            disabled={updatingAppId === app.id}
                                            onClick={() =>
                                              handleUpdateAppointmentStatus(app.id, "CONFIRMED")
                                            }
                                            className="h-6 px-2 text-[10px] text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                          >
                                            Re-Confirm
                                          </Button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              {hiddenCount > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedPatients((prev) => ({
                                      ...prev,
                                      [pt.id]: true,
                                    }))
                                  }
                                  className="text-[11px] font-semibold text-primary hover:underline"
                                >
                                  + Show {hiddenCount} more visit(s)
                                </button>
                              )}
                              {isExpanded && appts.length > 2 && !selectedDate && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedPatients((prev) => ({
                                      ...prev,
                                      [pt.id]: false,
                                    }))
                                  }
                                  className="text-[11px] text-muted-foreground hover:underline"
                                >
                                  Show fewer visits
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>

                        <td className="p-3 space-y-1">
                          <Badge variant="secondary" className="text-[10px]">
                            {pt._count?.appointments ?? appts.length} Total
                          </Badge>
                          <div className="flex flex-wrap gap-1 text-[10px]">
                            {completedCount > 0 && (
                              <span className="text-blue-600 font-semibold">
                                {completedCount} Seen
                              </span>
                            )}
                            {absentCount > 0 && (
                              <span className="text-orange-600 font-semibold">
                                • {absentCount} Absent
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-3 text-muted-foreground whitespace-nowrap">
                          {new Date(pt.createdAt).toISOString().split("T")[0]}
                        </td>

                        {!isDoctorScoped && (
                          <td className="p-3 text-right">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-rose-500 hover:bg-rose-50"
                              onClick={() => handleDelete(pt.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl space-y-2">
              <Users className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="font-medium text-foreground">
                {selectedDate || debouncedSearch || statusFilter !== "ALL"
                  ? "No Patients Match Current Search / Date Filter"
                  : "No Patients In Database"}
              </p>
              <p>
                {selectedDate
                  ? `No patient consultations matched ${selectedDate}. Try another date or click Clear Date.`
                  : "Patients are automatically created whenever an appointment is booked."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
