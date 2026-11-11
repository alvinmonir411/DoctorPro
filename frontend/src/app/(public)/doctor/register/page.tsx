"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Stethoscope,
  Camera,
  Upload,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Trash2,
  Loader2,
  Lock,
  Mail,
  User,
  Phone,
  Building2,
  Award,
} from "lucide-react";
import { auth as authApi, departments as deptsApi, upload as uploadApi } from "@/lib/api";
import { toast } from "sonner";
import { getMediaUrl } from "@/lib/utils";

const SLOT_OPTIONS = [
  { value: 10, label: "10 Min", desc: "Quick Visit" },
  { value: 15, label: "15 Min", desc: "Short Consultation" },
  { value: 20, label: "20 Min", desc: "Recommended" },
  { value: 30, label: "30 Min", desc: "Default Standard" },
  { value: 45, label: "45 Min", desc: "Detailed" },
  { value: 60, label: "60 Min", desc: "1 Hour Intensive" },
];

export default function DoctorRegisterPage() {
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");

  const [title, setTitle] = useState("MBBS, FCPS");
  const [specialization, setSpecialization] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [customDeptName, setCustomDeptName] = useState("");
  const [consultationFee, setConsultationFee] = useState<number>(1000);
  const [experienceYears, setExperienceYears] = useState<number>(5);
  const [chamberAddress, setChamberAddress] = useState("DoctorPro Clinic, Dhaka");
  const [bio, setBio] = useState("");

  // Practice preferences
  const [slotDuration, setSlotDuration] = useState<number>(30);
  const [autoApprove, setAutoApprove] = useState<boolean>(false);
  const [appointmentStartTime, setAppointmentStartTime] = useState<string>("09:00");
  const [appointmentEndTime, setAppointmentEndTime] = useState<string>("17:00");
  const [maxDailyPatients, setMaxDailyPatients] = useState<number>(20);

  // File Upload states
  const [image, setImage] = useState("");
  const [certificate, setCertificate] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);

  // Submission states
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);

  useEffect(() => {
    async function loadDepts() {
      try {
        const res = await deptsApi.getAll("activeOnly=true");
        if (Array.isArray(res) && res.length > 0) {
          setDepartmentsList(res);
          setDepartmentId(res[0].id);
        }
      } catch (err) {
        console.error("Failed to load departments", err);
      }
    }
    loadDepts();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const res = await uploadApi.publicFile(file);
      if (res?.url) {
        setImage(res.url);
        toast.success("Doctor portrait uploaded successfully!");
      }
    } catch (err: any) {
      toast.error("Image Upload Failed", {
        description: err?.message || "Could not upload profile photo.",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCert(true);
    try {
      const res = await uploadApi.publicFile(file);
      if (res?.url) {
        setCertificate(res.url);
        toast.success("BMDC Certificate uploaded successfully!");
      }
    } catch (err: any) {
      toast.error("Certificate Upload Failed", {
        description: err?.message || "Could not upload BMDC certificate.",
      });
    } finally {
      setUploadingCert(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (password !== confirmPassword) {
      const msg = "Passwords do not match. Please re-enter.";
      setErrorMessage(msg);
      toast.error("Validation Error", { description: msg });
      return;
    }
    if (password.length < 6) {
      const msg = "Password must be at least 6 characters.";
      setErrorMessage(msg);
      toast.error("Validation Error", { description: msg });
      return;
    }
    if (!name.trim()) {
      const msg = "Doctor's full name is required.";
      setErrorMessage(msg);
      toast.error("Validation Error", { description: msg });
      return;
    }
    if (!specialization.trim()) {
      const msg = "Specialization is required (e.g. Cardiologist).";
      setErrorMessage(msg);
      toast.error("Validation Error", { description: msg });
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || undefined,
        title: title.trim(),
        specialization: specialization.trim(),
        departmentId: departmentId === "custom" ? customDeptName.trim() : departmentId,
        consultationFee: Number(consultationFee) || 1000,
        experienceYears: Number(experienceYears) || 0,
        chamberAddress: chamberAddress.trim() || undefined,
        bio: bio.trim() || undefined,
        image: image || undefined,
        certificate: certificate || undefined,
        slotDuration: Number(slotDuration),
        autoApprove: Boolean(autoApprove),
        appointmentStartTime: appointmentStartTime || "09:00",
        appointmentEndTime: appointmentEndTime || "17:00",
        maxDailyPatients: Number(maxDailyPatients) || 20,
      };

      const res = await authApi.doctorRegister(payload);
      setSubmittedData({
        name,
        email,
        specialization,
        slotDuration,
      });
      toast.success("Doctor Application Submitted!", {
        description: "Your profile is pending admin verification.",
      });
      setIsSuccess(true);
    } catch (err: any) {
      const exactProblem = err?.message || "Failed to register doctor. Please check your inputs.";
      setErrorMessage(exactProblem);
      toast.error("Registration Failed", { description: exactProblem });
    } finally {
      setSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-muted/20">
        <Card className="max-w-xl w-full p-8 rounded-3xl border shadow-lg text-center space-y-6 bg-card">
          <div className="h-20 w-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-xs px-3 py-1 font-semibold">
              Application Submitted Successfully
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Registration Under Review
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Thank you, <strong>Dr. {submittedData?.name}</strong>. Your profile, degrees, and BMDC credentials have been submitted to the clinic administration.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/80 text-amber-900 dark:text-amber-200 text-xs leading-relaxed text-left space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-4 w-4 text-amber-700" />
              <span>Admin Verification Process:</span>
            </div>
            <p>
              Clinic administrators review and approve newly registered practitioners before granting portal access and publishing chamber booking slots to public patients.
            </p>
            <p className="font-mono text-[11px] text-amber-800 dark:text-amber-300">
              Account Email: {submittedData?.email}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild className="w-full sm:w-auto bg-[#0a1e3b] hover:bg-[#07162c] text-white rounded-full">
              <Link href="/admin/login">Go to Staff Login</Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto rounded-full">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-12 md:py-16 bg-gradient-to-b from-primary/5 via-background to-muted/20">
      <div className="container max-w-4xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Stethoscope className="h-3.5 w-3.5" /> Doctor & Specialist Registration
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            Register Your Medical Practice
          </h1>
          <p className="text-sm text-muted-foreground">
            Create your practitioner account with qualifications, fees, slot duration, and certificates.
            Once approved by the clinic administration, you can sign in and manage your patients.
          </p>
        </div>

        {/* Registration Form Card */}
        <Card className="rounded-3xl border shadow-xl bg-card overflow-hidden">
          <CardContent className="p-6 md:p-10 space-y-8">
            {errorMessage && (
              <div className="flex items-start gap-2.5 p-4 text-xs rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* ─── 1. Credentials & Login Setup ─── */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Lock className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">
                    1. Account Credentials (Login Details)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Doctor Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        required
                        placeholder="e.g. Dr. Sabrina Rahman"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-9 h-11 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Email Address (Login Username) *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        required
                        placeholder="doctor@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9 h-11 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Password (Minimum 6 characters) *</Label>
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
                    <Label className="text-xs font-semibold">Confirm Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-9 h-11 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-semibold">Chamber / Contact Phone Number *</Label>
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
                </div>
              </div>

              {/* ─── 2. Photo & BMDC Certificate Upload ─── */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Award className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">
                    2. Doctor Picture & BMDC Verification Certificate
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Photo Upload Card */}
                  <div className="p-4 rounded-2xl border bg-muted/20 space-y-3">
                    <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                      <Camera className="h-4 w-4 text-primary" /> Doctor Profile Picture
                    </Label>
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 rounded-2xl bg-muted border-2 border-dashed border-primary/30 flex items-center justify-center overflow-hidden shrink-0">
                        {image ? (
                          <img
                            src={getMediaUrl(image)}
                            alt="Doctor preview"
                            className="h-full w-full object-cover object-top"
                          />
                        ) : (
                          <Camera className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold cursor-pointer hover:bg-primary/90 transition-colors">
                          <Upload className="h-3.5 w-3.5" />
                          {uploadingImage ? "Uploading..." : image ? "Change Photo" : "Upload Photo"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                          />
                        </label>
                        <p className="text-[10px] text-muted-foreground">
                          JPG, PNG, WEBP (Max 5MB). Professional formal picture recommended.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Certificate Upload Card */}
                  <div className="p-4 rounded-2xl border bg-muted/20 space-y-3">
                    <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                      <FileCheck className="h-4 w-4 text-primary" /> BMDC License / Degree Certificate
                    </Label>
                    <div className="space-y-2">
                      <label className="w-full flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-primary/30 rounded-2xl hover:bg-muted/50 cursor-pointer transition-colors text-center">
                        <Upload className="h-5 w-5 text-primary mb-1" />
                        <span className="text-xs font-semibold text-foreground">
                          {uploadingCert ? "Uploading..." : certificate ? "Replace Certificate Document" : "Upload Certificate (PDF / Image)"}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                          BMDC license or postgraduate degree (Max 10MB)
                        </span>
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          className="hidden"
                          onChange={handleCertUpload}
                          disabled={uploadingCert}
                        />
                      </label>
                      {certificate && (
                        <div className="flex items-center justify-between text-xs px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span className="truncate">✓ Certificate uploaded successfully</span>
                          <button
                            type="button"
                            onClick={() => setCertificate("")}
                            className="text-rose-500 hover:text-rose-700 font-bold ml-2 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── 3. Professional Medical Details ─── */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Building2 className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">
                    3. Professional Qualifications & Chamber
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Qualifications / Degrees *</Label>
                    <Input
                      required
                      placeholder="e.g. MBBS, FCPS, MD, MRCP"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Specialization *</Label>
                    <Input
                      required
                      placeholder="e.g. Consultant Cardiologist"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Medical Department *</Label>
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="w-full h-11 px-3 bg-background border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {departmentsList.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                      <option value="custom">+ Other / New Department</option>
                    </select>
                    {departmentId === "custom" && (
                      <Input
                        placeholder="Enter department name..."
                        value={customDeptName}
                        onChange={(e) => setCustomDeptName(e.target.value)}
                        className="mt-2 h-10 rounded-xl"
                        required
                      />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Consultation Fee (৳ BDT) *</Label>
                    <Input
                      type="number"
                      required
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(Number(e.target.value) || 0)}
                      className="h-11 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Experience (Years) *</Label>
                    <Input
                      type="number"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(Number(e.target.value) || 0)}
                      className="h-11 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Chamber Room & Location</Label>
                    <Input
                      placeholder="e.g. Room 204, DoctorPro Clinic, Dhaka"
                      value={chamberAddress}
                      onChange={(e) => setChamberAddress(e.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-semibold">Professional Bio & Experience</Label>
                    <Textarea
                      rows={3}
                      placeholder="Previous hospital attachments, areas of clinical interest, and patient care approach..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* ─── 4. Slot Duration & Appointment Window ─── */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Clock className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">
                    4. Practice Consultation Hours & Slot Settings (অ্যাপয়েন্টমেন্ট নেওয়ার সময়)
                  </h3>
                </div>

                {/* Appointment Taking Hours (কয়টা থেকে কয়টা অ্যাপয়েন্টমেন্ট নিবেন) */}
                <div className="p-4 rounded-2xl border bg-muted/10 space-y-3">
                  <div>
                    <Label className="text-xs font-bold text-foreground">
                      Appointment Taking Hours (কয়টা থেকে কয়টা অ্যাপয়েন্টমেন্ট নিবেন) *
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      প্রতিদিন কখন থেকে কখন রোগী দেখবেন তা নির্ধারণ করুন।
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Start Time (কয়টা থেকে) *</Label>
                      <Input
                        type="time"
                        value={appointmentStartTime}
                        onChange={(e) => setAppointmentStartTime(e.target.value)}
                        required
                        className="h-11 rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">End Time (কয়টা পর্যন্ত) *</Label>
                      <Input
                        type="time"
                        value={appointmentEndTime}
                        onChange={(e) => setAppointmentEndTime(e.target.value)}
                        required
                        className="h-11 rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Max Daily Patients (দৈনিক রোগী সীমা)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="200"
                        value={maxDailyPatients}
                        onChange={(e) => setMaxDailyPatients(Number(e.target.value) || 20)}
                        className="h-11 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Patient Consultation Slot Duration *</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {SLOT_OPTIONS.map((opt) => {
                      const selected = slotDuration === opt.value;
                      return (
                        <button
                          type="button"
                          key={opt.value}
                          onClick={() => setSlotDuration(opt.value)}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            selected
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-muted/20 hover:bg-muted/40 border-border text-foreground"
                          }`}
                        >
                          <p className="font-extrabold text-sm">{opt.label}</p>
                          <p className={`text-[10px] mt-0.5 ${selected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                            {opt.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 rounded-2xl border bg-muted/20 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-foreground">Auto-Approve Online Appointments?</p>
                    <p className="text-[11px] text-muted-foreground">
                      If enabled, patient appointments are instantly confirmed. If disabled, they remain pending until approved by you or your assistant.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoApprove}
                    onChange={(e) => setAutoApprove(e.target.checked)}
                    className="h-5 w-5 rounded text-primary accent-primary cursor-pointer"
                  />
                </div>
              </div>

              {/* Notice */}
              <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/20 border border-sky-200 text-sky-900 dark:text-sky-200 text-xs flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-sky-600 shrink-0" />
                <span>
                  Admin Verification Notice: Upon submission, clinic administrators will review your profile and BMDC registration. Once verified, you will be able to log in to your Doctor Portal and add your clinic assistant.
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t">
                <Button
                  asChild
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto rounded-xl"
                >
                  <Link href="/admin/login">Already Registered? Sign In</Link>
                </Button>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto h-11 px-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold shadow-md"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting Registration...
                    </>
                  ) : (
                    <>
                      Complete Doctor Registration <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
