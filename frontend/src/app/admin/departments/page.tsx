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
import { Building2, Plus, Pencil, Trash2 } from "lucide-react";
import { departments as deptsApi } from "@/lib/api";
import { toast } from "sonner";

export default function AdminDepartmentsPage() {
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const loadDepartments = async () => {
    try {
      const res = await deptsApi.getAll();
      if (Array.isArray(res)) setDepartmentsList(res);
    } catch (err: any) {
      console.error("Failed to load departments", err);
      toast.error("Failed to Load Departments", {
        description: err?.message || "Could not fetch medical departments.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const openAdd = () => {
    setEditingDept(null);
    setName("");
    setDescription("");
    setModalOpen(true);
  };

  const openEdit = (d: any) => {
    setEditingDept(d);
    setName(d.name);
    setDescription(d.description || "");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingDept) {
        await deptsApi.update(editingDept.id, { name, description });
        toast.success("Department Updated", { description: `${name} was updated successfully.` });
      } else {
        await deptsApi.create({ name, description });
        toast.success("Department Created", { description: `${name} was added.` });
      }
      setModalOpen(false);
      await loadDepartments();
    } catch (err: any) {
      toast.error("Failed to Save Department", {
        description: err?.message || "Failed to save department",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    try {
      await deptsApi.delete(id);
      await loadDepartments();
      toast.success("Department Deleted");
    } catch (err: any) {
      toast.error("Failed to Delete Department", {
        description: err?.message || "Failed to delete department",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Medical Departments</h1>
          <p className="text-xs text-muted-foreground">Manage clinic departments such as Medicine, Surgery, Pediatrics, etc.</p>
        </div>

        <Button onClick={openAdd} className="bg-primary hover:bg-primary/90 rounded-xl text-xs">
          <Plus className="mr-1.5 h-4 w-4" /> Add Department
        </Button>
      </div>

      <Card className="rounded-2xl border-border/80 shadow-xs">
        <CardContent className="p-6">
          {loading ? (
            <div className="h-40 rounded-xl bg-muted/40 animate-pulse" />
          ) : departmentsList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b text-muted-foreground font-medium bg-muted/30">
                  <tr>
                    <th className="p-3">Department Name</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Associated Doctors</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {departmentsList.map((d) => (
                    <tr key={d.id} className="hover:bg-muted/20">
                      <td className="p-3 font-semibold text-foreground">{d.name}</td>
                      <td className="p-3 text-muted-foreground max-w-sm truncate">{d.description || "—"}</td>
                      <td className="p-3">
                        <Badge variant="secondary" className="text-[10px]">
                          {d._count?.doctors ?? d.doctors?.length ?? 0} Doctors
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(d)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500" onClick={() => handleDelete(d.id)}>
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
              <Building2 className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="font-medium text-foreground">No Departments Configured</p>
              <p>Add departments to organize your doctors and services.</p>
              <Button onClick={openAdd} size="sm" className="bg-primary rounded-xl text-xs">
                Add Department Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingDept ? "Edit Department" : "Add Medical Department"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Department Name *</Label>
              <Input
                placeholder="e.g. Medicine, Surgery, Gynecology"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-xl h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea
                placeholder="Department overview and clinical focus..."
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
                {saving ? "Saving..." : editingDept ? "Save Changes" : "Create Department"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
