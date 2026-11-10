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
  Trash2,
  CheckCircle2,
  Search,
  AlertCircle,
  Loader2,
  Lock,
  Mail,
  User,
  Phone,
  UserCheck,
  Stethoscope,
} from "lucide-react";
import { auth as authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function DoctorAssistantsPage() {
  const { user } = useAuth();
  const [assistants, setAssistants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadAssistants = async () => {
    try {
      const res = await authApi.getMyAssistants();
      if (Array.isArray(res)) {
        setAssistants(res);
      }
    } catch (err) {
      console.error("Failed to load doctor assistants", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssistants();
  }, []);

  const openAddModal = () => {
    setName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setFormError("");
    setModalOpen(true);
  };

  const handleCreateAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);

    try {
      if (password.length < 6) {
        setFormError("Password must be at least 6 characters.");
        setSaving(false);
        return;
      }

      await authApi.createMyAssistant({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || undefined,
      });

      setSuccessMsg(`Assistant ${name} added successfully! They can now log in.`);
      setTimeout(() => setSuccessMsg(""), 4000);
      setModalOpen(false);
      await loadAssistants();
    } catch (err: any) {
      setFormError(err.message || "Failed to create assistant account.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (assistant: any) => {
    if (!confirm(`Are you sure you want to remove assistant ${assistant.name}?`)) return;

    try {
      await authApi.deleteMyAssistant(assistant.id);
      await loadAssistants();
      setSuccessMsg("Assistant account removed.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to delete assistant.");
    }
  };

  const filtered = assistants.filter((a) => {
    return (
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              My Practice Assistants
            </h1>
            <Badge className="bg-indigo-100 text-indigo-800 text-[10px] font-semibold">
              Assistant Desk
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add and manage assistant staff who can monitor your patient queue and confirm chamber appointments
          </p>
        </div>

        <Button
          onClick={openAddModal}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs shadow-sm font-semibold"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add Assistant Account
        </Button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* Info card */}
      <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/20 border border-sky-200 text-xs text-sky-900 dark:text-sky-200 flex items-start gap-3">
        <UserCheck className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-100">
            How Assistant Accounts Work:
          </p>
          <p className="leading-relaxed">
            Assistants you add here will log in at the Staff Portal using their email and password. They are directly linked to your chamber and will only see your patient appointments, serial queues, and booking confirmations.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search assistant by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 rounded-xl bg-card"
        />
      </div>

      {/* Table */}
      <Card className="rounded-2xl border shadow-xs">
        <CardContent className="p-6">
          {loading ? (
            <div className="h-32 rounded-xl bg-muted/40 animate-pulse" />
          ) : filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b text-muted-foreground font-medium bg-muted/30">
                  <tr>
                    <th className="p-3">Assistant Name</th>
                    <th className="p-3">Login Email</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Account Status</th>
                    <th className="p-3">Added Date</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filtered.map((ast) => (
                    <tr key={ast.id} className="hover:bg-muted/20">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-xs">
                            {ast.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{ast.name}</p>
                            <p className="text-[10px] text-muted-foreground">Doctor Assistant</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-muted-foreground">{ast.email}</td>
                      <td className="p-3 text-muted-foreground">{ast.phone || "—"}</td>
                      <td className="p-3">
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px]">
                          Active & Ready
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground text-[11px]">
                        {new Date(ast.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-rose-500 hover:bg-rose-50 cursor-pointer"
                          onClick={() => handleDelete(ast)}
                          title="Remove Assistant"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 space-y-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <UserCheck className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-foreground text-sm">No Assistants Added Yet</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Click the button below to create an assistant login for your clinic receptionist or chamber assistant.
                </p>
              </div>
              <Button
                onClick={openAddModal}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add First Assistant
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Assistant Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" /> Add Assistant Account
            </DialogTitle>
          </DialogHeader>

          {formError && (
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs border border-destructive/20 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleCreateAssistant} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Assistant Full Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  required
                  placeholder="e.g. Mehedi Hasan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9 h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Login Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  required
                  placeholder="assistant@clinic.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Password * (Min 6 chars)</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="01700-000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-9 h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border text-[11px] text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Permissions Granted:</p>
              <p>• View appointment requests for your chamber</p>
              <p>• 1-click confirm or reschedule patient bookings</p>
              <p>• Check patient details and serial numbers</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                  </>
                ) : (
                  "Create Assistant Account"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
