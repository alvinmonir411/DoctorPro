"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Phone, Mail, MapPin, Calendar, Trash2 } from "lucide-react";
import { patients as patientsApi } from "@/lib/api";

export default function AdminPatientsPage() {
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadPatients = async () => {
    try {
      const res = await patientsApi.getAll();
      if (Array.isArray(res)) {
        setPatientsList(res);
      }
    } catch (err) {
      console.error("Failed to load patients", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this patient record?")) return;
    try {
      await patientsApi.delete(id);
      await loadPatients();
    } catch (err: any) {
      alert(err.message || "Failed to delete patient");
    }
  };

  const filtered = patientsList.filter((p) => {
    return (
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search) ||
      (p.email && p.email.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Patient Records</h1>
          <p className="text-xs text-muted-foreground">List of patients with contact details and consultation histories</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter by name, phone, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 rounded-xl"
        />
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
                    <th className="p-3">Patient Name</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Total Appointments</th>
                    <th className="p-3">Registered Since</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filtered.map((pt) => (
                    <tr key={pt.id} className="hover:bg-muted/20">
                      <td className="p-3 font-semibold text-foreground">{pt.name}</td>
                      <td className="p-3 text-muted-foreground">{pt.phone}</td>
                      <td className="p-3 text-muted-foreground">{pt.email || "—"}</td>
                      <td className="p-3">
                        <Badge variant="secondary" className="text-[10px]">
                          {pt._count?.appointments ?? pt.appointments?.length ?? 0} Visits
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(pt.createdAt).toISOString().split("T")[0]}
                      </td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl space-y-2">
              <Users className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="font-medium text-foreground">No Patients In Database</p>
              <p>Patients are automatically created whenever an appointment is booked.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
