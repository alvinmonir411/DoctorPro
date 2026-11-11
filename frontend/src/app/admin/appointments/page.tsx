"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  FileText,
  User,
  Phone,
} from "lucide-react";
import { appointments as appsApi, doctors as doctorsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  AppointmentStatusBadge,
  APPOINTMENT_STATUS_FILTERS,
} from "@/components/admin/appointment-status";
import { toast } from "sonner";
import { confirmActionToast } from "@/components/ui/toast";

export default function AdminAppointmentsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const userRole = (user?.role || "").toUpperCase();
  const isDoctorScoped = userRole === "DOCTOR" || userRole === "DOCTOR_ASSISTANT";

  const [appointmentsList, setAppointmentsList] = useState<any[]>([]);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [doctorFilter, setDoctorFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const appQuery =
        isDoctorScoped && user?.doctorId
          ? `doctorId=${encodeURIComponent(user.doctorId)}`
          : undefined;

      const [apps, docs] = await Promise.allSettled([
        appsApi.getAll(appQuery),
        isDoctorScoped ? Promise.resolve([]) : doctorsApi.getAll(),
      ]);

      if (apps.status === "fulfilled" && Array.isArray(apps.value)) {
        const list =
          isDoctorScoped && user?.doctorId
            ? apps.value.filter((app) => app.doctorId === user.doctorId)
            : apps.value;
        setAppointmentsList(list);
      } else if (apps.status === "rejected") {
        toast.error("Failed to Load Appointments", {
          description: apps.reason?.message || "Could not fetch appointments.",
        });
      }
      if (!isDoctorScoped && docs.status === "fulfilled" && Array.isArray(docs.value)) {
        setDoctorsList(docs.value);
      } else if (!isDoctorScoped && docs.status === "rejected") {
        toast.error("Failed to Load Doctors", {
          description: docs.reason?.message || "Could not fetch doctors list.",
        });
      }
    } catch (err: any) {
      console.error("Failed to load appointments", err);
      toast.error("Failed to Load Appointments", {
        description: err?.message || "Unable to fetch appointments.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    }
  }, [authLoading, userRole, user?.doctorId]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await appsApi.update(id, { status });
      await loadData();
      toast.success("Appointment Status Updated", {
        description: `Appointment has been marked as ${status}.`,
      });
    } catch (err: any) {
      toast.error("Failed to Update Status", {
        description: err?.message || "Unable to update appointment status.",
      });
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmActionToast({
      title: "Delete Appointment?",
      description: "This appointment record will be permanently removed.",
      confirmLabel: "Delete",
    });
    if (!confirmed) return;
    try {
      await appsApi.delete(id);
      await loadData();
      toast.success("Appointment Deleted", {
        description: "The appointment record has been removed.",
      });
    } catch (err: any) {
      toast.error("Failed to Delete Appointment", {
        description: err?.message || "Failed to delete appointment",
      });
    }
  };

  const filtered = appointmentsList.filter((app) => {
    const appStatus = (app.status || "").toUpperCase();
    const matchesStatus = statusFilter === "ALL" || appStatus === statusFilter;
    const matchesDoc = doctorFilter === "ALL" || app.doctorId === doctorFilter;
    const matchesSearch =
      !search ||
      (app.patient?.name && app.patient.name.toLowerCase().includes(search.toLowerCase())) ||
      (app.patient?.phone && app.patient.phone.includes(search));
    return matchesStatus && matchesDoc && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {userRole === "DOCTOR"
              ? "My Appointments"
              : userRole === "DOCTOR_ASSISTANT"
              ? "Doctor's Appointments"
              : "Appointment Records"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {userRole === "DOCTOR"
              ? "View and manage patient appointments booked with you"
              : userRole === "DOCTOR_ASSISTANT"
              ? "View and manage consultation requests for your assigned doctor"
              : "Manage patient consultation requests and schedule appointments"}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-card border">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status buttons */}
          <div className="flex flex-wrap items-center gap-1 bg-muted p-1 rounded-xl text-xs">
            {APPOINTMENT_STATUS_FILTERS.map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  statusFilter === st
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Doctor filter (ADMIN only) */}
          {!isDoctorScoped && doctorsList.length > 0 && (
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="h-9 px-3 text-xs rounded-xl border bg-card"
            >
              <option value="ALL">All Doctors</option>
              {doctorsList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Appointments Table */}
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
                    <th className="p-3">Phone</th>
                    {!isDoctorScoped && <th className="p-3">Doctor</th>}
                    <th className="p-3">Consultation Date & Slot</th>
                    <th className="p-3">Symptoms / Notes</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filtered.map((app) => (
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
                        <span className="font-semibold text-foreground">
                          {new Date(app.date).toISOString().split("T")[0]}
                        </span>
                        <div className="text-[10px] text-primary font-medium">{app.timeSlot}</div>
                      </td>
                      <td className="p-3 text-muted-foreground max-w-xs truncate">
                        {app.notes || "—"}
                      </td>
                      <td className="p-3">
                        <AppointmentStatusBadge status={app.status} />
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {(app.status || "").toUpperCase() === "PENDING" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(app.id, "CONFIRMED")}
                              className="h-7 text-[11px] text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                            >
                              Confirm
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
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-rose-500"
                            onClick={() => handleDelete(app.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
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
              <p className="font-medium text-foreground">No Appointments Match Current Filters</p>
              <p>Try switching filter tabs or clearing search criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
