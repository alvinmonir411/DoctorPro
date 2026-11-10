"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle2,
  Stethoscope,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { doctors as doctorsApi, appointments as appsApi } from "@/lib/api";

function AppointmentContent() {
  const searchParams = useSearchParams();
  const preselectedDoctorId = searchParams.get("doctorId");

  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(preselectedDoctorId || "");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [availableSlots, setAvailableSlots] = useState<{ slot: string; isBooked: boolean }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [slotMessage, setSlotMessage] = useState<string>("");

  // Patient Info Form
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successBooking, setSuccessBooking] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch doctors on mount
  useEffect(() => {
    async function loadDoctors() {
      try {
        const res = await doctorsApi.getAll("activeOnly=true");
        if (Array.isArray(res)) {
          setDoctorsList(res);
          if (!selectedDoctorId && res.length > 0) {
            setSelectedDoctorId(res[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load doctors", err);
      }
    }
    loadDoctors();
  }, [selectedDoctorId]);

  // Load available slots when doctor or date changes
  useEffect(() => {
    async function loadSlots() {
      if (!selectedDoctorId || !selectedDate) return;
      setLoadingSlots(true);
      setSlotMessage("");
      setSelectedSlot("");

      try {
        const res: any = await appsApi.getAvailableSlots(selectedDoctorId, selectedDate);
        if (res && res.available && Array.isArray(res.slots)) {
          setAvailableSlots(res.slots);
          if (res.slots.length === 0) {
            setSlotMessage("No slots scheduled for this day.");
          }
        } else {
          setAvailableSlots([]);
          setSlotMessage(res?.message || "Doctor is not available on this day. Please pick another date.");
        }
      } catch (err: any) {
        console.error("Failed to load slots", err);
        setAvailableSlots([]);
        setSlotMessage("Unable to load slots. You may pick a standard time slot.");
      } finally {
        setLoadingSlots(false);
      }
    }
    loadSlots();
  }, [selectedDoctorId, selectedDate]);

  const selectedDoctor = doctorsList.find((d) => d.id === selectedDoctorId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!selectedDoctorId) {
      setErrorMessage("Please select a doctor.");
      return;
    }
    if (!selectedDate) {
      setErrorMessage("Please pick an appointment date.");
      return;
    }
    if (!selectedSlot) {
      setErrorMessage("Please select a time slot.");
      return;
    }
    if (!patientName.trim()) {
      setErrorMessage("Please enter patient full name.");
      return;
    }
    if (!patientPhone.trim()) {
      setErrorMessage("Please provide a valid phone number.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await appsApi.bookPublic({
        doctorId: selectedDoctorId,
        date: selectedDate,
        timeSlot: selectedSlot,
        patientName,
        patientPhone,
        patientEmail: patientEmail || undefined,
        notes: notes || undefined,
      });
      setSuccessBooking(res);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to book appointment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // If successfully booked:
  if (successBooking) {
    const isConfirmed = successBooking.status === "CONFIRMED";

    return (
      <div className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-lg">
          <Card
            className={`text-center p-8 rounded-3xl shadow-lg border transition-all ${
              isConfirmed
                ? "border-emerald-200 bg-emerald-50/40"
                : "border-amber-200 bg-amber-50/40"
            }`}
          >
            <CardContent className="space-y-6 pt-4">
              <div
                className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto shadow-xs ${
                  isConfirmed
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-amber-100 text-amber-600"
                }`}
              >
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-foreground">
                  {isConfirmed ? "Appointment Confirmed!" : "Appointment Request Recorded!"}
                </h2>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  {isConfirmed
                    ? "Your appointment is confirmed automatically. Please arrive 10 minutes prior to your time slot."
                    : "Your appointment request has been recorded. Our desk will confirm your appointment shortly."}
                </p>
              </div>

              <div className="bg-background rounded-2xl p-5 border text-left text-xs space-y-2.5">
                <div className="flex justify-between border-b pb-2 items-center">
                  <span className="text-muted-foreground font-medium">Your Serial Number:</span>
                  <span className="font-black text-lg text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-0.5 rounded-xl border border-emerald-200">
                    #{successBooking?.serialNumber || 1}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Patient:</span>
                  <span className="font-semibold text-foreground">{patientName}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-semibold text-foreground">{patientPhone}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Doctor:</span>
                  <span className="font-semibold text-foreground">{selectedDoctor?.name}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-semibold text-foreground">{selectedDate}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Time Slot:</span>
                  <span className="font-semibold text-primary">{selectedSlot}</span>
                </div>
                <div className="flex justify-between pt-1 items-center">
                  <span className="text-muted-foreground">Status:</span>
                  {isConfirmed ? (
                    <Badge className="font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300">
                      CONFIRMED
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300">
                      PENDING CONFIRMATION
                    </Badge>
                  )}
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <Button asChild className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-sm text-xs">
                  <Link href={`/live-queue?appointmentId=${successBooking?.id || ""}&phone=${patientPhone}`}>
                    <span className="relative flex h-2.5 w-2.5 mr-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                    </span>
                    Track Live Chamber Queue & Wait Time →
                  </Link>
                </Button>

                <Button asChild variant="outline" className="w-full rounded-xl">
                  <Link href="/">Back to Home</Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full rounded-xl text-xs text-muted-foreground"
                  onClick={() => {
                    setSuccessBooking(null);
                    setPatientName("");
                    setPatientPhone("");
                    setPatientEmail("");
                    setNotes("");
                    setSelectedSlot("");
                  }}
                >
                  Book Another Appointment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 md:py-16">
      <div className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="outline" className="text-primary border-primary/20">Online Booking</Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            Schedule a Consultation
          </h1>
          <p className="text-sm text-muted-foreground">
            Quick, reliable booking without registration. Select your doctor, choose a date & slot, and confirm.
          </p>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column: Doctor, Date, Slots */}
          <div className="md:col-span-7 space-y-6">
            {/* Step 1: Doctor Selection */}
            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
                    1
                  </div>
                  <h3 className="font-bold text-base text-foreground">Select Specialist</h3>
                </div>

                {doctorsList.length > 0 ? (
                  <div className="space-y-2">
                    <Label className="text-xs">Choose Doctor</Label>
                    <select
                      value={selectedDoctorId}
                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                      className="w-full h-11 px-3 text-sm rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {doctorsList.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.name} — {doc.specialization} ({doc.department?.name || "General"})
                        </option>
                      ))}
                    </select>

                    {selectedDoctor && (
                      <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs flex items-center justify-between mt-2">
                        <div>
                          <span className="font-semibold text-foreground">{selectedDoctor.name}</span>
                          <p className="text-muted-foreground">{selectedDoctor.title}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-muted-foreground">Consultation Fee</span>
                          <p className="font-bold text-sm text-foreground">৳{selectedDoctor.consultationFee}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed text-xs text-muted-foreground text-center">
                    No doctors available in directory at this moment. You can still submit details for reception assistance.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 2: Date & Slots */}
            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
                    2
                  </div>
                  <h3 className="font-bold text-base text-foreground">Select Date & Time Slot</h3>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Consultation Date</Label>
                  <Input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>

                {/* Slots section */}
                <div className="space-y-2 pt-2">
                  <Label className="text-xs">Available 30-Min Time Slots</Label>
                  {loadingSlots ? (
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
                      ))}
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {availableSlots.map(({ slot, isBooked }) => (
                        <button
                          key={slot}
                          type="button"
                          disabled={isBooked}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2.5 text-xs font-semibold rounded-xl border transition-all text-center ${
                            isBooked
                              ? "bg-muted text-muted-foreground/60 cursor-not-allowed border-transparent"
                              : selectedSlot === slot
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-background hover:bg-primary/5 hover:border-primary/50 text-foreground"
                          }`}
                        >
                          {slot}
                          {isBooked && <span className="block text-[10px] font-normal text-rose-500">Booked</span>}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200">
                        {slotMessage || "No doctor schedule found for this date. You can choose a standard slot below:"}
                      </p>
                      {/* Fallback default slots */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {["09:00 - 09:30", "10:00 - 10:30", "11:00 - 11:30", "15:00 - 15:30", "17:00 - 17:30", "19:00 - 19:30"].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSelectedSlot(s)}
                            className={`p-2.5 text-xs font-semibold rounded-xl border transition-all ${
                              selectedSlot === s
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "bg-background hover:bg-primary/5 hover:border-primary/50 text-foreground"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Patient Information */}
          <div className="md:col-span-5 space-y-6">
            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
                    3
                  </div>
                  <h3 className="font-bold text-base text-foreground">Patient Information</h3>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Patient Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="e.g. John Doe"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        required
                        className="pl-9 h-11 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="e.g. 01700000000"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        required
                        className="pl-9 h-11 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Email Address (Optional)</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="e.g. patient@example.com"
                        value={patientEmail}
                        onChange={(e) => setPatientEmail(e.target.value)}
                        className="pl-9 h-11 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Problem / Symptoms / Notes</Label>
                    <Textarea
                      placeholder="Briefly describe health concern or symptoms..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="rounded-xl resize-none text-xs"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Selected Slot:</span>
                    <span className="font-bold text-primary">{selectedSlot || "None"}</span>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl font-semibold text-sm shadow-md"
                  >
                    {submitting ? "Booking Appointment..." : "Confirm & Book Slot"}
                  </Button>

                  <p className="text-[11px] text-muted-foreground text-center">
                    By confirming, you agree to receive consultation updates via phone call/SMS.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AppointmentPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-12 text-center text-sm">Loading appointment form...</div>}>
      <AppointmentContent />
    </Suspense>
  );
}
