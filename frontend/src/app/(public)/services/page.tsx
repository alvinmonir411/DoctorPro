"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Calendar, ArrowRight, Activity, CheckCircle2 } from "lucide-react";
import { services as servicesApi, departments as deptsApi } from "@/lib/api";

export default function ServicesPage() {
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadServices() {
      try {
        const [servs, depts] = await Promise.allSettled([
          servicesApi.getAll("activeOnly=true"),
          deptsApi.getAll("activeOnly=true"),
        ]);
        if (servs.status === "fulfilled" && Array.isArray(servs.value)) {
          setServicesList(servs.value);
        }
        if (depts.status === "fulfilled" && Array.isArray(depts.value)) {
          setDepartmentsList(depts.value);
        }
      } catch (err) {
        console.error("Failed to load services", err);
      } finally {
        setLoading(false);
      }
    }
    loadServices();
  }, []);

  const filteredServices = servicesList.filter((s) => {
    return selectedDept === "all" || s.departmentId === selectedDept;
  });

  return (
    <div className="py-12 md:py-16">
      <div className="container mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="outline" className="text-primary border-primary/20">Our Medical Services</Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            Healthcare Services & Treatments
          </h1>
          <p className="text-sm text-muted-foreground">
            High quality outpatient care, clinical tests, consultations, and modern diagnostics tailored for your family.
          </p>
        </div>

        {/* Department Filter tabs */}
        {departmentsList.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
            <Button
              variant={selectedDept === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDept("all")}
              className="rounded-full text-xs"
            >
              All Services
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
        )}

        {/* Services Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : filteredServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {filteredServices.map((srv) => (
              <Card key={srv.id} className="hover:shadow-md transition-all border-border/80 hover:border-primary/40">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Stethoscope className="h-6 w-6" />
                    </div>
                    {srv.department && (
                      <Badge variant="secondary" className="text-xs">
                        {srv.department.name}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="font-bold text-lg text-foreground">{srv.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {srv.description || "Expert medical attention with standard clinical protocol and patient-centric care."}
                    </p>
                  </div>

                  <div className="pt-3 border-t flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-muted-foreground">Standard Fee</span>
                      <p className="font-bold text-base text-foreground">
                        {srv.price > 0 ? `$${srv.price}` : "Free / Included"}
                      </p>
                    </div>
                    <Button asChild size="sm" className="bg-primary hover:bg-primary/90 rounded-lg text-xs">
                      <Link href="/appointment">
                        Book Consultation
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-12 text-center max-w-md mx-auto space-y-3">
            <Activity className="h-12 w-12 text-muted-foreground/40 mx-auto" />
            <h3 className="font-bold text-base text-foreground">Medical Services</h3>
            <p className="text-xs text-muted-foreground">
              Services will appear here once configured by the clinic administration.
            </p>
            <Button asChild className="bg-primary rounded-full" size="sm">
              <Link href="/appointment">Book Appointment</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
