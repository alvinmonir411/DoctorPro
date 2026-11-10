"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Search,
  AlertCircle,
  Loader2,
  UserCheck,
  Stethoscope,
  Key,
  FileCheck,
  Award,
} from "lucide-react";
import { staff as staffApi, doctors as doctorsApi, auth as authApi } from "@/lib/api";
import { getMediaUrl } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export default function AdminStaffPage() {
  const { user: currentUser } = useAuth();
  const [staffList, setStaffList] = useState<any[]>([]);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("DOCTOR");
  const [doctorId, setDoctorId] = useState("");

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadData = async () => {
    try {
      const [staffRes, docsRes] = await Promise.allSettled([
        staffApi.getAll(),
        doctorsApi.getAll(),
      ]);
      if (staffRes.status === "fulfilled" && Array.isArray(staffRes.value)) {
        setStaffList(staffRes.value);
      }
      if (docsRes.status === "fulfilled" && Array.isArray(docsRes.value)) {
        setDoctorsList(docsRes.value);
      }
    } catch (err) {
      console.error("Failed to load staff", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingStaff(null);
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setRole("DOCTOR");
    setDoctorId(doctorsList[0]?.id || "");
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (st: any) => {
    setEditingStaff(st);
    setName(st.name);
    setEmail(st.email);
    setPhone(st.phone || "");
    setPassword(""); // Leave blank if not changing
    setRole(st.role);
    setDoctorId(st.doctorId || "");
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Staff name is required.");
      return;
    }
    if (!email.trim()) {
      setFormError("Email address is required.");
      return;
    }
    if (!editingStaff && (!password || password.length < 6)) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    setSaving(true);

    try {
      const payload: any = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        role,
        doctorId: (role === "DOCTOR" || role === "DOCTOR_ASSISTANT") ? doctorId || undefined : undefined,
      };

      if (password && password.length >= 6) {
        payload.password = password;
      }

      if (editingStaff) {
        await staffApi.update(editingStaff.id, payload);
        setSuccessMsg("Staff account updated successfully!");
      } else {
        await staffApi.create(payload);
        setSuccessMsg("New staff account created successfully!");
      }

      setModalOpen(false);
      await loadData();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      console.error("Failed to save staff:", err);
      setFormError(err.message || "Failed to save staff account.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (st: any) => {
    if (st.email === "admin@doctorpro.com") {
      alert("The primary administrator cannot be deleted.");
      return;
    }
    if (!confirm(`Are you sure you want to delete ${st.name}'s account?`)) return;

    try {
      await staffApi.delete(st.id);
      await loadData();
      setSuccessMsg("Staff account deleted.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to delete account");
    }
  };

  const handleApproveDoctor = async (st: any) => {
    try {
      const docId = st.doctorId || st.doctor?.id;
      if (!docId) {
        alert("No doctor profile ID linked to this account.");
        return;
      }
      await authApi.approveDoctor(docId);
      setSuccessMsg(`Dr. ${st.name} approved successfully! Their account is now active.`);
      setTimeout(() => setSuccessMsg(""), 4000);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to approve doctor.");
    }
  };

  const handleRejectDoctor = async (st: any) => {
    if (!confirm(`Are you sure you want to decline Dr. ${st.name}'s registration?`)) return;
    try {
      const docId = st.doctorId || st.doctor?.id;
      if (!docId) return;
      await authApi.rejectDoctor(docId);
      setSuccessMsg(`Dr. ${st.name}'s registration was declined.`);
      setTimeout(() => setSuccessMsg(""), 4000);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to reject doctor.");
    }
  };

  const pendingDoctors = staffList.filter(
    (s) => s.role === "DOCTOR" && s.status === "PENDING_APPROVAL"
  );

  const filtered = staffList.filter((s) => {
    return (
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.role.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Staff & Role Management</h1>
          <p className="text-xs text-muted-foreground">
            Manage system access accounts for Administrators, Doctors, and Doctor Assistants
          </p>
        </div>

        <Button onClick={openAddModal} className="bg-primary hover:bg-primary/90 rounded-xl text-xs shadow-sm">
          <Plus className="mr-1.5 h-4 w-4" /> Add Staff Account
        </Button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Pending Doctor Applications Alert Banner */}
      {pendingDoctors.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <span className="font-bold text-xs uppercase tracking-wider">
                {pendingDoctors.length} New Doctor Registration(s) Awaiting Admin Approval
              </span>
            </div>
            <Badge className="bg-amber-200 text-amber-900 text-[10px] font-bold">Action Required</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {pendingDoctors.map((pDoc) => (
              <div
                key={pDoc.id}
                className="p-3 bg-white rounded-xl border border-amber-200/80 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-bold text-xs text-slate-800">Dr. {pDoc.name}</p>
                  <p className="text-[11px] text-muted-foreground">{pDoc.email}</p>
                  {pDoc.doctor?.certificate && (
                    <a
                      href={getMediaUrl(pDoc.doctor.certificate)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-emerald-700 hover:underline font-semibold mt-1"
                    >
                      <FileCheck className="h-3 w-3" /> Inspect BMDC Certificate
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleApproveDoctor(pDoc)}
                    className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
                  >
                    ✓ Approve Doctor
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRejectDoctor(pDoc)}
                    className="h-8 px-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Filter Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter staff by name, email, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 rounded-xl bg-card"
        />
      </div>

      {/* Staff Table */}
      <Card className="rounded-2xl border-border/80 shadow-xs">
        <CardContent className="p-6">
          {loading ? (
            <div className="h-36 rounded-xl bg-muted/40 animate-pulse" />
          ) : filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b text-muted-foreground font-medium bg-muted/30">
                  <tr>
                    <th className="p-3">Staff Member</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Assigned Role</th>
                    <th className="p-3">Linked Doctor Profile</th>
                    <th className="p-3">Account Status</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filtered.map((st) => (
                    <tr key={st.id} className="hover:bg-muted/20">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                            {st.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{st.name}</p>
                            {st.status === "PENDING_APPROVAL" && (
                              <span className="text-[10px] text-amber-600 font-semibold">● New Application</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground font-mono text-[11px]">{st.email}</td>
                      <td className="p-3">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-semibold ${
                            st.role === "ADMIN"
                              ? "bg-sky-100 text-sky-800 border-sky-200"
                              : st.role === "DOCTOR"
                              ? "bg-teal-100 text-teal-800 border-teal-200"
                              : "bg-indigo-100 text-indigo-800 border-indigo-200"
                          }`}
                        >
                          {st.role}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {st.doctor ? (
                          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                            <Stethoscope className="h-3 w-3 text-primary" /> {st.doctor.name}
                          </span>
                        ) : st.role === "ADMIN" ? (
                          <span className="text-muted-foreground text-[10px]">All Practice Facilities</span>
                        ) : (
                          <span className="text-muted-foreground/60 text-[10px]">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        {st.status === "PENDING_APPROVAL" ? (
                          <div className="space-y-1">
                            <Badge className="bg-amber-100 text-amber-800 text-[10px] font-semibold hover:bg-amber-100">
                              Pending Approval
                            </Badge>
                            <div className="flex items-center gap-1 pt-0.5">
                              <Button
                                size="sm"
                                onClick={() => handleApproveDoctor(st)}
                                className="h-6 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRejectDoctor(st)}
                                className="h-6 px-1.5 text-[10px] text-rose-600 hover:bg-rose-50 rounded"
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                        ) : st.status === "REJECTED" ? (
                          <Badge variant="destructive" className="text-[10px]">
                            Declined
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-800 text-[10px] hover:bg-emerald-100">
                            Active
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">{st.phone || "—"}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => openEditModal(st)}
                            title="Edit Account"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {st.email !== "admin@doctorpro.com" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-rose-500 hover:bg-rose-50"
                              onClick={() => handleDelete(st)}
                              title="Delete Account"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
            <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
              <ShieldCheck className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p>No staff accounts found.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Staff Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              {editingStaff ? "Edit Staff Account" : "Add New Staff Account"}
            </DialogTitle>
          </DialogHeader>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs">Full Name *</Label>
              <Input
                placeholder="e.g. Dr. Alexander Wright or Assistant Rahim"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-xl h-10"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Email Address *</Label>
                <Input
                  type="email"
                  placeholder="staff@doctorpro.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-xl h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">
                  {editingStaff ? "Password (Leave blank to keep)" : "Password *"}
                </Label>
                <Input
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!editingStaff}
                  className="rounded-xl h-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Assigned Role *</Label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border bg-background font-medium"
                >
                  <option value="DOCTOR">DOCTOR (Doctor Portal)</option>
                  <option value="DOCTOR_ASSISTANT">DOCTOR ASSISTANT (Desk & Queue)</option>
                  <option value="ADMIN">ADMIN (Full Control)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Contact Phone</Label>
                <Input
                  placeholder="01700000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>
            </div>

            {/* If DOCTOR or DOCTOR_ASSISTANT, show doctor selector */}
            {(role === "DOCTOR" || role === "DOCTOR_ASSISTANT") && (
              <div className="space-y-1.5 p-3 rounded-xl bg-muted/40 border">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Stethoscope className="h-3.5 w-3.5 text-primary" />
                  {role === "DOCTOR" ? "Link to Doctor Profile *" : "Assigned Doctor (Optional)"}
                </Label>
                {doctorsList.length > 0 ? (
                  <select
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                    className="w-full h-10 px-3 text-xs rounded-xl border bg-background font-medium"
                  >
                    {role === "DOCTOR_ASSISTANT" && (
                      <option value="">All Practice Doctors</option>
                    )}
                    {doctorsList.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.specialization})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[11px] text-amber-600">
                    No doctor profile registered yet. Please create a doctor first in the Doctors tab.
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  {role === "DOCTOR"
                    ? "Links this login directly to the doctor's bookings, hours, and slot duration"
                    : "Allows the assistant to manage this doctor's appointments queue"}
                </p>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 border-t">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 min-w-28">
                {saving ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                  </span>
                ) : editingStaff ? (
                  "Save Changes"
                ) : (
                  "Create Account"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
