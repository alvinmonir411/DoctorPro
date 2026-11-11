"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, Save, CheckCircle2, Mail, Send, KeyRound } from "lucide-react";
import { settings as settingsApi, notifications as notificationsApi } from "@/lib/api";
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

  // Email notification configuration (Resend / Gmail SMTP)
  const [emailProvider, setEmailProvider] = useState<"auto" | "resend" | "smtp">("auto");
  const [activeEmailProvider, setActiveEmailProvider] = useState<string>("none");
  const [resendApiKey, setResendApiKey] = useState("");
  const [resendKeyPreview, setResendKeyPreview] = useState("");
  const [resendFrom, setResendFrom] = useState("DoctorPro Clinic <onboarding@resend.dev>");
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState("465");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [hasSmtpPass, setHasSmtpPass] = useState(false);
  const [smtpFrom, setSmtpFrom] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [testEmailTo, setTestEmailTo] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

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

      try {
        const emailCfg: any = await notificationsApi.getEmailConfig();
        if (emailCfg) {
          setEmailProvider((emailCfg.configuredMode as any) || "auto");
          setActiveEmailProvider(emailCfg.activeProvider || "none");
          setResendKeyPreview(emailCfg.resendKeyPreview || "");
          if (emailCfg.resendFrom) setResendFrom(emailCfg.resendFrom);
          if (emailCfg.smtpHost) setSmtpHost(emailCfg.smtpHost);
          if (emailCfg.smtpPort) setSmtpPort(emailCfg.smtpPort);
          if (emailCfg.smtpUser) setSmtpUser(emailCfg.smtpUser);
          setHasSmtpPass(Boolean(emailCfg.hasSmtpPass));
          if (emailCfg.smtpFrom) setSmtpFrom(emailCfg.smtpFrom);
        }
      } catch (err) {
        console.error("Failed to load email config", err);
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

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEmail(true);
    try {
      const updated: any = await notificationsApi.updateEmailConfig({
        provider: emailProvider,
        resendApiKey: resendApiKey.trim() || undefined,
        resendFrom: resendFrom.trim() || undefined,
        smtpHost: smtpHost.trim() || undefined,
        smtpPort: smtpPort.trim() || undefined,
        smtpUser: smtpUser.trim() || undefined,
        smtpPass: smtpPass.trim() || undefined,
        smtpFrom: smtpFrom.trim() || undefined,
      });
      setActiveEmailProvider(updated?.activeProvider || "none");
      setResendKeyPreview(updated?.resendKeyPreview || "");
      setHasSmtpPass(Boolean(updated?.hasSmtpPass));
      setResendApiKey("");
      setSmtpPass("");
      toast.success("Email Configuration Saved", {
        description:
          updated?.activeProvider && updated.activeProvider !== "none"
            ? `Active mailer: ${String(updated.activeProvider).toUpperCase()}`
            : "Configuration saved. Provide a Resend API Key or Gmail App Password to activate sending.",
      });
    } catch (err: any) {
      toast.error("Failed to Save Email Config", {
        description: err?.message || "Could not update email settings.",
      });
    } finally {
      setSavingEmail(false);
    }
  };

  const handleTestEmail = async () => {
    const recipient = (testEmailTo || email).trim();
    if (!recipient) {
      toast.error("Validation Error", {
        description: "Enter a recipient email address to send a test email.",
      });
      return;
    }
    setSendingTest(true);
    try {
      const res: any = await notificationsApi.sendTestEmail(recipient);
      toast.success("Test Email Delivered!", {
        description: `Sent via ${String(res?.provider || "mailer").toUpperCase()} to ${recipient}.`,
      });
    } catch (err: any) {
      toast.error("Test Email Failed", {
        description: err?.message || "Email delivery test failed.",
      });
    } finally {
      setSendingTest(false);
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

      {/* Automated Email Notifications (Resend API / Gmail SMTP) */}
      <form onSubmit={handleSaveEmail} className="space-y-4">
        <Card className="rounded-2xl border-border/80 shadow-xs">
          <CardContent className="p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-foreground">
                    Automated Email Notifications &amp; 24h/2h Reminders
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    Free mailer supporting Resend (3,000/mo free) or Gmail SMTP App Password
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  activeEmailProvider !== "none"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                <KeyRound className="h-3 w-3" />
                {activeEmailProvider === "none"
                  ? "Not Configured"
                  : `Active: ${activeEmailProvider.toUpperCase()}`}
              </span>
            </div>

            <div className="rounded-xl bg-sky-50/80 border border-sky-200/80 p-3.5 text-[11px] text-slate-700 space-y-1 leading-relaxed">
              <p>
                <strong>Note on Resend vs Gmail:</strong> Without a verified custom domain on Resend,{" "}
                <code>onboarding@resend.dev</code> only sends to your own Resend account email. To email{" "}
                <em>any</em> patient for free without owning a domain, choose <strong>Gmail / SMTP</strong> with your Gmail address and a 16-digit Google App Password.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Preferred Email Mode</Label>
              <select
                value={emailProvider}
                onChange={(e) => setEmailProvider(e.target.value as any)}
                className="w-full sm:w-64 h-10 px-3 rounded-xl border bg-background text-xs font-medium"
              >
                <option value="auto">Auto (Use Configured Provider)</option>
                <option value="resend">Resend API</option>
                <option value="smtp">Gmail / Custom SMTP</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
              <div className="space-y-3">
                <p className="text-xs font-bold text-foreground">Option A: Resend API</p>
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Resend API Key {resendKeyPreview ? `(Saved: ${resendKeyPreview})` : ""}
                  </Label>
                  <Input
                    type="password"
                    placeholder={resendKeyPreview ? "Leave blank to keep saved key" : "re_xxxxxxxxxxxxxxxxx"}
                    value={resendApiKey}
                    onChange={(e) => setResendApiKey(e.target.value)}
                    className="rounded-xl h-10 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Resend From Address</Label>
                  <Input
                    placeholder="DoctorPro Clinic <onboarding@resend.dev>"
                    value={resendFrom}
                    onChange={(e) => setResendFrom(e.target.value)}
                    className="rounded-xl h-10 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-foreground">Option B: Gmail / Custom SMTP</p>
                <div className="space-y-1.5">
                  <Label className="text-xs">Gmail / SMTP Username</Label>
                  <Input
                    type="email"
                    placeholder="yourmail@gmail.com"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    className="rounded-xl h-10 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    App Password / SMTP Password {hasSmtpPass ? "(Saved)" : ""}
                  </Label>
                  <Input
                    type="password"
                    placeholder={hasSmtpPass ? "Leave blank to keep saved password" : "16-character Google App Password"}
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    className="rounded-xl h-10 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">SMTP Host</Label>
                    <Input
                      placeholder="smtp.gmail.com"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Port</Label>
                    <Input
                      placeholder="465"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Input
                  type="email"
                  placeholder={email || "recipient@example.com"}
                  value={testEmailTo}
                  onChange={(e) => setTestEmailTo(e.target.value)}
                  className="rounded-xl h-10 text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={sendingTest}
                  onClick={handleTestEmail}
                  className="rounded-xl h-10 text-xs shrink-0"
                >
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  {sendingTest ? "Sending..." : "Send Test Email"}
                </Button>
              </div>

              <Button type="submit" disabled={savingEmail} className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl h-10 px-5 text-xs">
                <Save className="mr-1.5 h-3.5 w-3.5" />
                {savingEmail ? "Saving..." : "Save Email Settings"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
