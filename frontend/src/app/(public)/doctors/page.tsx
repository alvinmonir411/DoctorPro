"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Stethoscope,
  Calendar,
  ArrowRight,
  UserCheck,
  MapPin,
  FileCheck,
  Maximize2,
  Clock,
  X,
} from "lucide-react";
import { doctors as doctorsApi, departments as deptsApi } from "@/lib/api";
import { getMediaUrl } from "@/lib/utils";

export default function DoctorsPage() {
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Full-size image lightbox state
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string; title?: string } | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [docs, depts] = await Promise.allSettled([
          doctorsApi.getAll("activeOnly=true"),
          deptsApi.getAll("activeOnly=true"),
        ]);
        if (docs.status === "fulfilled" && Array.isArray(docs.value)) {
          setDoctorsList(docs.value);
        }
        if (depts.status === "fulfilled" && Array.isArray(depts.value)) {
          setDepartmentsList(depts.value);
        }
      } catch (err) {
        console.error("Error fetching doctors", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredDoctors = doctorsList.filter((doc) => {
    const matchesDept = selectedDept === "all" || doc.departmentId === selectedDept;
    const matchesSearch =
      !searchQuery ||
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div className="py-12 md:py-16">
      <div className="container mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="outline" className="text-primary border-primary/20">Specialists Directory</Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            Our Qualified Doctors
          </h1>
          <p className="text-sm text-muted-foreground">
            Find and consult with our experienced practitioners across various medical departments.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-muted/30 border max-w-4xl mx-auto">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by doctor or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background rounded-xl"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <Button
              variant={selectedDept === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDept("all")}
              className="rounded-full text-xs"
            >
              All Departments
            </Button>
            {departmentsList.map((d) => (
              <Button
                key={d.id}
                variant={selectedDept === d.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDept(d.id)}
                className="rounded-full text-xs"
              >
                {d.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Doctors Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 rounded-2xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : filteredDoctors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {filteredDoctors.map((doc) => (
              <Card key={doc.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-border/80 group flex flex-col justify-between">
                <div>
                  {/* Photo Frame (Full face framing with object-top and click-to-enlarge) */}
                  <div
                    className="h-64 sm:h-72 bg-gradient-to-br from-slate-100 via-sky-50/50 to-slate-50 flex items-center justify-center overflow-hidden relative cursor-pointer"
                    onClick={() => {
                      if (doc.image) {
                        setLightboxImage({
                          url: getMediaUrl(doc.image),
                          name: doc.name,
                          title: doc.title,
                        });
                      }
                    }}
                  >
                    {doc.image ? (
                      <img
                        src={getMediaUrl(doc.image)}
                        alt={doc.name}
                        className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-24 w-24 rounded-full bg-background/90 shadow-md flex items-center justify-center text-primary font-bold text-3xl border border-primary/20">
                        {doc.name.charAt(0)}
                      </div>
                    )}

                    {/* View Full Image Overlay Pill */}
                    {doc.image && (
                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-xs text-white text-xs font-semibold flex items-center gap-1.5 shadow-md">
                          <Maximize2 className="h-3.5 w-3.5" /> View Full Picture
                        </span>
                      </div>
                    )}

                    {/* Certificate Verified Badge */}
                    {doc.certificate && (
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs text-emerald-700 border border-emerald-200/80 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                        <FileCheck className="h-3.5 w-3.5 text-emerald-600" /> Verified BMDC
                      </div>
                    )}

                    {/* Slot interval badge */}
                    <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs text-slate-800 text-[10px] font-bold px-2.5 py-0.5 rounded-md shadow-xs border flex items-center gap-1">
                      <Clock className="h-3 w-3 text-primary" /> {doc.slotDuration || 30} min slot
                    </div>
                  </div>

                  <CardContent className="p-6 space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg text-foreground">{doc.name}</h3>
                        {doc.department && (
                          <Badge variant="secondary" className="text-xs">
                            {doc.department.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-primary mt-0.5">{doc.specialization}</p>
                      <p className="text-xs text-muted-foreground">{doc.title}</p>
                    </div>

                    {doc.experienceYears > 0 && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-primary" /> {doc.experienceYears}+ years experience
                      </p>
                    )}

                    {doc.chamberAddress && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 line-clamp-1">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" /> {doc.chamberAddress}
                      </p>
                    )}

                    <div className="pt-2 border-t flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Consultation Fee</span>
                      <span className="font-bold text-base text-foreground">৳{doc.consultationFee}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button asChild variant="outline" size="sm" className="w-full text-xs rounded-xl">
                        <Link href={`/doctors/${doc.slug || doc.id}`}>
                          View Profile
                        </Link>
                      </Button>
                      <Button asChild size="sm" className="w-full text-xs rounded-xl bg-primary hover:bg-primary/90 shadow-xs">
                        <Link href={`/appointment?doctorId=${doc.id}`}>
                          <Calendar className="mr-1.5 h-3.5 w-3.5" /> Book Slot
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-12 text-center max-w-md mx-auto space-y-4">
            <Stethoscope className="h-12 w-12 text-muted-foreground/40 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-bold text-base text-foreground">No Doctors Listed Yet</h3>
              <p className="text-xs text-muted-foreground">
                Doctors will appear here as soon as they are registered by the clinic administration.
              </p>
            </div>
            <Button asChild className="bg-primary rounded-full" size="sm">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Lightbox Modal to View 100% Full Uncropped Image */}
      <Dialog open={Boolean(lightboxImage)} onOpenChange={(open) => !open && setLightboxImage(null)}>
        <DialogContent className="max-w-2xl p-4 bg-background/95 backdrop-blur-md">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-sm font-bold flex items-center justify-between">
              <span>{lightboxImage?.name}</span>
              {lightboxImage?.title && (
                <span className="text-xs text-muted-foreground font-normal">{lightboxImage.title}</span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[80vh] flex items-center justify-center overflow-hidden rounded-2xl bg-black/5 p-2">
            {lightboxImage?.url && (
              <img
                src={lightboxImage.url}
                alt={lightboxImage.name}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
