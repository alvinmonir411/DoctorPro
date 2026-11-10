"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Activity, Plus, Pencil, Trash2 } from "lucide-react";
import { services as servicesApi, departments as deptsApi } from "@/lib/api";

export default function AdminServicesPage() {
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState(500);
  const [departmentId, setDepartmentId] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const [servs, depts] = await Promise.allSettled([
        servicesApi.getAll(),
        deptsApi.getAll(),
      ]);
      if (servs.status === "fulfilled" && Array.isArray(servs.value)) setServicesList(servs.value);
      if (depts.status === "fulfilled" && Array.isArray(depts.value)) setDepartmentsList(depts.value);
    } catch (err) {
      console.error("Failed to load services data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAdd = () => {
    setEditingService(null);
    setName("");
    setPrice(500);
    setDepartmentId(departmentsList[0]?.id || "");
    setDescription("");
    setModalOpen(true);
  };

  const openEdit = (s: any) => {
    setEditingService(s);
    setName(s.name);
    setPrice(s.price || 0);
    setDepartmentId(s.departmentId || "");
    setDescription(s.description || "");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingService) {
        await servicesApi.update(editingService.id, {
          name,
          price: Number(price),
          departmentId: departmentId || undefined,
          description,
        });
      } else {
        await servicesApi.create({
          name,
          price: Number(price),
          departmentId: departmentId || undefined,
          description,
        });
      }
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    try {
      await servicesApi.delete(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete service");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Medical Services</h1>
          <p className="text-xs text-muted-foreground">Configure clinical tests, outpatient procedures, and fees</p>
        </div>

        <Button onClick={openAdd} className="bg-primary hover:bg-primary/90 rounded-xl text-xs">
          <Plus className="mr-1.5 h-4 w-4" /> Add Service
        </Button>
      </div>

      <Card className="rounded-2xl border-border/80 shadow-xs">
        <CardContent className="p-6">
          {loading ? (
            <div className="h-40 rounded-xl bg-muted/40 animate-pulse" />
          ) : servicesList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b text-muted-foreground font-medium bg-muted/30">
                  <tr>
                    <th className="p-3">Service Name</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Fee</th>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {servicesList.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/20">
                      <td className="p-3 font-semibold text-foreground">{s.name}</td>
                      <td className="p-3">
                        <Badge variant="secondary" className="text-[10px]">
                          {s.department?.name || "General"}
                        </Badge>
                      </td>
                      <td className="p-3 font-bold text-foreground">৳{s.price}</td>
                      <td className="p-3 text-muted-foreground max-w-sm truncate">{s.description || "—"}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(s)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500" onClick={() => handleDelete(s.id)}>
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
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl space-y-3">
              <Activity className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="font-medium text-foreground">No Services Defined</p>
              <p>Add clinical consultation or test offerings to display on your public site.</p>
              <Button onClick={openAdd} size="sm" className="bg-primary rounded-xl text-xs">
                Add Service Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingService ? "Edit Service" : "Add New Medical Service"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Service Name *</Label>
              <Input
                placeholder="e.g. ECG, Blood Test, Consultation"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-xl h-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Standard Fee (৳)</Label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  required
                  className="rounded-xl h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Department</Label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border bg-background"
                >
                  <option value="">None / General</option>
                  {departmentsList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Service Description</Label>
              <Textarea
                placeholder="Brief summary of service coverage and requirements..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="rounded-xl resize-none text-xs"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">
                {saving ? "Saving..." : editingService ? "Save Changes" : "Create Service"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
