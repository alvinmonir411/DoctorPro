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
import {
  Stethoscope,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Search,
  AlertCircle,
  Loader2,
  Camera,
  Upload,
  FileText,
  ExternalLink,
  X,
  FileCheck,
  Clock,
  Sparkles,
  Maximize2,
  User,
  GraduationCap,
  MapPin,
  Phone,
  Eye,
} from "lucide-react";
import { doctors as doctorsApi, departments as deptsApi, upload as uploadApi } from "@/lib/api";
import { getMediaUrl } from "@/lib/utils";

const SLOT_OPTIONS = [
  { value: 10, label: "10 Min", desc: "Quick Visit" },
  { value: 15, label: "15 Min", desc: "Standard Short" },
  { value: 20, label: "20 Min", desc: "Recommended" },
  { value: 30, label: "30 Min", desc: "Default" },
  { value: 45, label: "45 Min", desc: "Detailed" },
  { value: 60, label: "60 Min", desc: "1 Hour" },
];

export default function AdminDoctorsPage() {
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<any>(null);

  // Full picture preview lightbox state
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [title, setTitle] = useState("MBBS, FCPS");
  const [specialization, setSpecialization] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [customDeptName, setCustomDeptName] = useState("");
  const [consultationFee, setConsultationFee] = useState<number>(1000);
  const [experienceYears, setExperienceYears] = useState<number>(5);
  const [chamberAddress, setChamberAddress] = useState("DoctorPro Clinic, Dhaka");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");

  // Slot duration & Auto approve
  const [slotDuration, setSlotDuration] = useState<number>(30);
  const [autoApprove, setAutoApprove] = useState<boolean>(false);

  // Photo & Certificate states
  const [image, setImage] = useState("");
  const [certificate, setCertificate] = useState("");
  const [certificateName, setCertificateName] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadData = async () => {
    try {
      const [docs, depts] = await Promise.allSettled([
        doctorsApi.getAll(),
        deptsApi.getAll(),
      ]);
      if (docs.status === "fulfilled" && Array.isArray(docs.value)) {
        setDoctorsList(docs.value);
      }
      if (depts.status === "fulfilled" && Array.isArray(depts.value)) {
        setDepartmentsList(depts.value);
        if (depts.value.length > 0 && !departmentId) {
          setDepartmentId(depts.value[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load doctor management data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingDoctor(null);
    setName("");
    setTitle("MBBS, FCPS");
    setSpecialization("");
    setDepartmentId(departmentsList[0]?.id || "");
    setCustomDeptName("");
    setConsultationFee(1000);
    setExperienceYears(5);
    setChamberAddress("DoctorPro Clinic, Dhaka");
    setPhone("");
    setEmail("");
    setBio("");
    setSlotDuration(30);
    setAutoApprove(false);
    setImage("");
    setCertificate("");
    setCertificateName("");
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (doc: any) => {
    setEditingDoctor(doc);
    setName(doc.name);
    setTitle(doc.title || "MBBS");
    setSpecialization(doc.specialization);
    setDepartmentId(doc.departmentId || "");
    setCustomDeptName("");
    setConsultationFee(doc.consultationFee ?? 1000);
    setExperienceYears(doc.experienceYears ?? 5);
    setChamberAddress(doc.chamberAddress || "");
    setPhone(doc.phone || "");
    setEmail(doc.email || "");
    setBio(doc.bio || "");
    setSlotDuration(doc.slotDuration || 30);
    setAutoApprove(Boolean(doc.autoApprove));
    setImage(doc.image || "");
    setCertificate(doc.certificate || "");
    setCertificateName(
      doc.certificate
        ? doc.certificate.split("/").pop() || "Medical Certificate"
        : ""
    );
    setFormError("");
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Please select a valid image file (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError("Profile picture must be under 5MB.");
      return;
    }

    setUploadingImage(true);
    setFormError("");
    try {
      const res = await uploadApi.file(file);
      setImage(res.url);
    } catch (err: any) {
      console.error("Image upload failed:", err);
      setFormError(err.message || "Failed to upload doctor picture.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/(pdf|image)/i)) {
      setFormError("Please upload a PDF or image file (PDF, JPG, PNG).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFormError("Certificate file must be under 10MB.");
      return;
    }

    setUploadingCert(true);
    setFormError("");
    try {
      const res = await uploadApi.file(file);
      setCertificate(res.url);
      setCertificateName(file.name);
    } catch (err: any) {
      console.error("Certificate upload failed:", err);
      setFormError(err.message || "Failed to upload certificate.");
    } finally {
      setUploadingCert(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Doctor full name is required.");
      return;
    }
    if (!specialization.trim()) {
      setFormError("Specialization is required (e.g. Cardiologist, General Physician).");
      return;
    }

    // Resolve department
    let finalDeptId = departmentId;
    if (customDeptName.trim()) {
      finalDeptId = customDeptName.trim();
    } else if (!finalDeptId && departmentsList.length > 0) {
      finalDeptId = departmentsList[0].id;
    }

    setSaving(true);

    try {
      const payload: any = {
        name: name.trim(),
        title: title.trim(),
        specialization: specialization.trim(),
        departmentId: finalDeptId || undefined,
        consultationFee: Number(consultationFee) || 0,
        experienceYears: Number(experienceYears) || 0,
        chamberAddress: chamberAddress.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        bio: bio.trim(),
        slotDuration: Number(slotDuration) || 30,
        autoApprove: Boolean(autoApprove),
        image: image.trim() || undefined,
        certificate: certificate.trim() || undefined,
      };

      if (editingDoctor) {
        await doctorsApi.update(editingDoctor.id, payload);
        setSuccessMsg("Doctor profile updated successfully!");
      } else {
        await doctorsApi.create({
          ...payload,
          schedules: [
            { dayOfWeek: 0, startTime: "09:00", endTime: "14:00" },
            { dayOfWeek: 1, startTime: "09:00", endTime: "14:00" },
            { dayOfWeek: 2, startTime: "09:00", endTime: "14:00" },
            { dayOfWeek: 3, startTime: "09:00", endTime: "14:00" },
            { dayOfWeek: 4, startTime: "09:00", endTime: "14:00" },
            { dayOfWeek: 6, startTime: "09:00", endTime: "14:00" },
          ],
        });
        setSuccessMsg("New doctor added successfully!");
      }

      setModalOpen(false);
      await loadData();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      console.error("Save doctor error:", err);
      setFormError(err.message || "Failed to save doctor. Please check all required fields.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this doctor?")) return;
    try {
      await doctorsApi.delete(id);
      await loadData();
      setSuccessMsg("Doctor deleted successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to delete doctor");
    }
  };

  const handleToggleActive = async (doc: any) => {
    try {
      await doctorsApi.update(doc.id, { isActive: !doc.isActive });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleAutoApprove = async (doc: any) => {
    try {
      await doctorsApi.update(doc.id, { autoApprove: !doc.autoApprove });
      await loadData();
      setSuccessMsg(`Approval mode updated for ${doc.name}`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = doctorsList.filter((d) => {
    return (
      !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialization.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Doctor Management</h1>
          <p className="text-xs text-muted-foreground">
            Manage doctor profiles, portrait photos, BMDC certificates, slot intervals (10–60 min), and auto-approval
          </p>
        </div>

        <Button onClick={openAddModal} className="bg-primary hover:bg-primary/90 rounded-xl text-xs shadow-sm">
          <Plus className="mr-1.5 h-4 w-4" /> Add New Doctor
        </Button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search Filter Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter doctors by name or specialty..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 rounded-xl bg-card"
        />
      </div>

      {/* Doctors Table */}
      <Card className="rounded-2xl border-border/80 shadow-xs">
        <CardContent className="p-6">
          {loading ? (
            <div className="h-40 rounded-xl bg-muted/40 animate-pulse" />
          ) : filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b text-muted-foreground font-medium bg-muted/30">
                  <tr>
                    <th className="p-3">Doctor</th>
                    <th className="p-3">Specialization</th>
                    <th className="p-3">Slot Duration</th>
                    <th className="p-3">Booking Approval</th>
                    <th className="p-3">Fee</th>
                    <th className="p-3">Certificate</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filtered.map((doc) => (
                    <tr key={doc.id} className="hover:bg-muted/20">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {doc.image ? (
                            <div
                              className="relative h-11 w-11 rounded-full overflow-hidden border border-border shrink-0 bg-muted cursor-pointer group"
                              onClick={() => setPreviewImage({ url: getMediaUrl(doc.image), name: doc.name })}
                              title="Click to view full picture"
                            >
                              <img
                                src={getMediaUrl(doc.image)}
                                alt={doc.name}
                                className="h-full w-full object-cover object-top"
                              />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Eye className="h-3.5 w-3.5 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="h-11 w-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0 border border-primary/20">
                              {doc.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-foreground">{doc.name}</div>
                            <div className="text-[10px] text-muted-foreground">{doc.title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-medium text-foreground">{doc.specialization}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                          <Clock className="h-3 w-3 text-primary" /> {doc.slotDuration || 30} min
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => handleToggleAutoApprove(doc)}
                          title="Click to toggle Auto-Approve vs Manual Review"
                          className="cursor-pointer"
                        >
                          {doc.autoApprove ? (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200 text-[10px] font-semibold">
                              Auto-Approved
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-300 hover:bg-amber-100 text-[10px] font-semibold">
                              Manual Review
                            </Badge>
                          )}
                        </button>
                      </td>
                      <td className="p-3 font-bold text-foreground">৳{doc.consultationFee}</td>
                      <td className="p-3">
                        {doc.certificate ? (
                          <a
                            href={getMediaUrl(doc.certificate)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold hover:bg-emerald-100 transition-colors"
                          >
                            <FileCheck className="h-3 w-3 text-emerald-600" /> View Document
                          </a>
                        ) : (
                          <span className="text-muted-foreground/60 text-[10px]">Not uploaded</span>
                        )}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleToggleActive(doc)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer transition-all ${
                            doc.isActive
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-muted text-muted-foreground hover:bg-slate-200"
                          }`}
                        >
                          {doc.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => openEditModal(doc)}
                            title="Edit Doctor"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-rose-500 hover:bg-rose-50"
                            onClick={() => handleDelete(doc.id)}
                            title="Delete Doctor"
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
            <div className="p-10 text-center text-xs text-muted-foreground border border-dashed rounded-xl space-y-3">
              <Stethoscope className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="font-semibold text-sm text-foreground">No Doctors Registered Yet</p>
              <p className="max-w-sm mx-auto">
                Click below to add your practice doctors with profile photo, BMDC certificate, slot duration, and visiting hours.
              </p>
              <Button onClick={openAddModal} size="sm" className="bg-primary hover:bg-primary/90 rounded-xl text-xs">
                <Plus className="mr-1 h-3.5 w-3.5" /> Add Doctor Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Doctor Modal - Redesigned to be highly user-friendly */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-6 sm:p-8">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              {editingDoctor ? `Edit Profile: ${editingDoctor.name}` : "Add New Doctor to Practice"}
            </DialogTitle>
          </DialogHeader>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2 mt-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6 pt-2">
            {/* 1. Photo & Certificate Section */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-4">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-primary" /> 1. Doctor Picture & Verification Document
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Doctor Picture Upload with Large Clear Portrait Frame */}
                <div className="p-3.5 rounded-xl bg-background border flex flex-col justify-between space-y-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="relative h-28 w-24 rounded-2xl border-2 border-dashed border-primary/40 bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-xs cursor-pointer group"
                      onClick={() => image && setPreviewImage({ url: getMediaUrl(image), name: name || "Doctor Picture" })}
                      title={image ? "Click to view full uncropped photo" : "No photo uploaded"}
                    >
                      {image ? (
                        <>
                          <img
                            src={getMediaUrl(image)}
                            alt="Doctor preview"
                            className="h-full w-full object-cover object-top"
                          />
                          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Maximize2 className="h-4 w-4 text-white" />
                          </div>
                        </>
                      ) : (
                        <Camera className="h-8 w-8 text-muted-foreground/40" />
                      )}
                      {uploadingImage && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <Label className="text-xs font-bold text-foreground">Doctor Portrait Photo</Label>
                      <p className="text-[10px] text-muted-foreground leading-tight">
                        Face is automatically framed from the top. Click thumbnail to inspect full picture.
                      </p>
                      <div className="pt-1 flex flex-wrap items-center gap-1.5">
                        <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs">
                          <Upload className="h-3 w-3" />
                          <span>{image ? "Change Photo" : "Upload Photo"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                          />
                        </label>
                        {image && (
                          <button
                            type="button"
                            onClick={() => setImage("")}
                            className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-all"
                            title="Remove picture"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Doctor Certificate / License */}
                <div className="p-3.5 rounded-xl bg-background border flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <FileCheck className="h-4 w-4 text-primary" /> Medical License / BMDC Certificate
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      Upload registration or degree credentials (PDF, PNG, JPG, max 10MB)
                    </p>
                  </div>

                  {certificate ? (
                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                        <div className="truncate">
                          <p className="font-semibold text-emerald-950 text-xs truncate">
                            {certificateName || "Doctor_Certificate"}
                          </p>
                          <a
                            href={getMediaUrl(certificate)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-emerald-700 font-semibold hover:underline inline-flex items-center gap-0.5"
                          >
                            Open Document <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCertificate("");
                          setCertificateName("");
                        }}
                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-100 shrink-0"
                        title="Remove certificate"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="cursor-pointer w-full inline-flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-border hover:border-primary/50 bg-muted/20 text-xs text-muted-foreground hover:text-foreground transition-all">
                        {uploadingCert ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span>Uploading certificate...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 text-primary" />
                            <span>Browse Certificate (PDF / Image)</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          className="hidden"
                          onChange={handleCertUpload}
                          disabled={uploadingCert}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Slot Duration & Auto-Approval Settings */}
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-4">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" /> 2. Consultation Slots & Booking Rules
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Slot Duration Interactive Pills */}
                <div className="space-y-2 p-3.5 rounded-xl bg-background border">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                    Slot Duration: <span className="text-primary font-extrabold">{slotDuration} Minutes</span>
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Click to select how much time is reserved per patient:
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {SLOT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSlotDuration(opt.value)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                          slotDuration === opt.value
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-muted/30 text-foreground border-border hover:bg-muted"
                        }`}
                      >
                        <div>{opt.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto Approve Toggle Card */}
                <div className="p-3.5 rounded-xl bg-background border flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-bold text-foreground">Auto-Approve Bookings</Label>
                      <p className="text-[10px] text-muted-foreground">
                        {autoApprove ? "Instant Confirmed status" : "Requires manual confirmation"}
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoApprove}
                        onChange={(e) => setAutoApprove(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div className={`p-2 rounded-xl text-[11px] leading-tight font-medium ${autoApprove ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-amber-50 text-amber-800 border border-amber-200"}`}>
                    {autoApprove
                      ? "✓ Patient bookings are automatically CONFIRMED right away."
                      : "⏳ Patient bookings stay PENDING until confirmed by doctor or assistant."}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Doctor Information */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-4 w-4 text-primary" /> 3. Doctor Details
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Doctor Full Name *</Label>
                  <Input
                    placeholder="e.g. Dr. Alexander Wright"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="rounded-xl h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Qualifications / Degrees</Label>
                  <Input
                    placeholder="e.g. MBBS, FCPS, MD"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="rounded-xl h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Specialization *</Label>
                  <Input
                    placeholder="e.g. Cardiologist, General Physician"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    required
                    className="rounded-xl h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Medical Department</Label>
                  {departmentsList.length > 0 ? (
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="w-full h-10 px-3 text-xs rounded-xl border bg-background font-medium"
                    >
                      {departmentsList.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      placeholder="e.g. General Medicine, Cardiology"
                      value={customDeptName}
                      onChange={(e) => setCustomDeptName(e.target.value)}
                      className="rounded-xl h-10"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Consultation Fee (৳) *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(Number(e.target.value))}
                    required
                    className="rounded-xl h-10 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Experience (Years)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    className="rounded-xl h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Chamber Phone</Label>
                  <Input
                    placeholder="01700112233"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="rounded-xl h-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Chamber Room & Location</Label>
                <Input
                  placeholder="e.g. Room 101, DoctorPro Clinic"
                  value={chamberAddress}
                  onChange={(e) => setChamberAddress(e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Professional Bio & Experience</Label>
                <Textarea
                  placeholder="Specialist background, previous hospital affiliations, and medical expertise..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="rounded-xl resize-none text-xs"
                />
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="pt-3 flex items-center justify-end gap-2 border-t">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || uploadingImage || uploadingCert}
                className="bg-primary hover:bg-primary/90 min-w-32 rounded-xl text-xs font-semibold shadow-xs"
              >
                {saving ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                  </span>
                ) : editingDoctor ? (
                  "Save Changes"
                ) : (
                  "Create Doctor"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lightbox Dialog to View 100% Full Uncropped Image */}
      <Dialog open={Boolean(previewImage)} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-2xl p-4 bg-background/95 backdrop-blur-md">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-sm font-bold">
              {previewImage?.name || "Doctor Picture (Full View)"}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[80vh] flex items-center justify-center overflow-hidden rounded-2xl bg-black/5 p-2">
            {previewImage?.url && (
              <img
                src={previewImage.url}
                alt={previewImage.name}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
