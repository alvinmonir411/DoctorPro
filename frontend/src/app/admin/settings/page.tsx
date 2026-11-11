"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, Save, CheckCircle2 } from "lucide-react";
import { settings as settingsApi } from "@/lib/api";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [clinicName, setClinicName] = useState("DoctorPro Medical Practice");
  const [tagline, setTagline] = useState("Quality Healthcare You Can Trust");
  const [phone, setPhone] = useState("+1 (555) 234-5678");
  const [emergency, setEmergency] = useState("+1 (555) 911-0000");
  const [email, setEmail] = useState("contact@doctorpro.com");
  const [address, setAddress] = useState("450 Lexington Ave, Suite 1400, New York, NY 10017");
  const [workingHours, setWorkingHours] = useState("Mon - Sat: 8:00 AM - 8:00 PM, Sunday: On-Call");

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res: any = await settingsApi.getAll();
        if (res && res.map) {
          if (res.map.clinic_name) setClinicName(res.map.clinic_name);
          if (res.map.clinic_tagline) setTagline(res.map.clinic_tagline);
          if (res.map.clinic_phone) setPhone(res.map.clinic_phone);
          if (res.map.clinic_emergency) setEmergency(res.map.clinic_emergency);
          if (res.map.clinic_email) setEmail(res.map.clinic_email);
          if (res.map.clinic_address) setAddress(res.map.clinic_address);
          if (res.map.working_hours) setWorkingHours(res.map.working_hours);
        }
      } catch (err: any) {
        console.error("Failed to load settings", err);
        toast.error("Failed to Load Settings", {
          description: err?.message || "Could not fetch clinic settings.",
        });
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await settingsApi.updateBulk([
        { key: "clinic_name", value: clinicName, group: "general" },
        { key: "clinic_tagline", value: tagline, group: "general" },
        { key: "clinic_phone", value: phone, group: "contact" },
        { key: "clinic_emergency", value: emergency, group: "contact" },
        { key: "clinic_email", value: email, group: "contact" },
        { key: "clinic_address", value: address, group: "contact" },
        { key: "working_hours", value: workingHours, group: "general" },
      ]);
      setSavedSuccess(true);
      toast.success("Settings Saved", {
        description: "Clinic practice details updated successfully.",
      });
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      toast.error("Failed to Save Settings", {
        description: err?.message || "Failed to update settings",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Clinic Practice Settings</h1>
        <p className="text-xs text-muted-foreground">Configure clinic branding, contact phone numbers, addresses, and hours</p>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>Clinic settings updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Practice Branding */}
        <Card className="rounded-2xl border-border/80 shadow-xs">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-bold text-sm text-foreground">Clinic Branding</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Practice / Clinic Name</Label>
                <Input
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  required
                  className="rounded-xl h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Tagline / Motto</Label>
                <Input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Consultation & Working Hours</Label>
              <Input
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
                className="rounded-xl h-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact & Chamber Info */}
        <Card className="rounded-2xl border-border/80 shadow-xs">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-bold text-sm text-foreground">Contact & Chamber Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Reception Phone Number</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="rounded-xl h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Emergency Hotline</Label>
                <Input
                  value={emergency}
                  onChange={(e) => setEmergency(e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Official Email Address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-xl h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Chamber Address</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="rounded-xl h-10"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 rounded-xl px-6">
            <Save className="mr-1.5 h-4 w-4" /> {saving ? "Saving Changes..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
