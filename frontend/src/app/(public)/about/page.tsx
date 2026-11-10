import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Award,
  HeartPulse,
  Users,
  Target,
  Eye,
  CheckCircle2,
  Calendar,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="py-12 md:py-20 space-y-16">
      {/* Hero Section */}
      <section className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <Badge variant="outline" className="text-primary border-primary/20">About DoctorPro</Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Dedicated to Better Healthcare & Healthier Lives
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            DoctorPro was founded with a singular vision: to bring patient-centric, transparent, and high-quality clinical healthcare to individual practices and multi-doctor clinics.
          </p>
        </div>
      </section>

      {/* Mission & Vision Cards */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="rounded-3xl border-border/80 shadow-xs">
            <CardContent className="p-8 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Target className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Our Mission</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                To deliver personalized, empathetic, and evidence-based clinical treatments while reducing waiting times and streamlining the patient consultation journey.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/80 shadow-xs">
            <CardContent className="p-8 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Eye className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Our Vision</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                To be the most trusted and reliable neighborhood medical practice known for clinical excellence, ethical medicine, and modern diagnostic standards.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-muted/30 py-16 border-y">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-xl mx-auto space-y-2 mb-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Our Core Values</h2>
            <p className="text-xs text-muted-foreground">The foundational pillars that guide our medical decisions daily.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="p-6 rounded-2xl bg-card border text-center space-y-3">
              <HeartPulse className="h-8 w-8 text-rose-500 mx-auto" />
              <h3 className="font-bold text-base">Patient First</h3>
              <p className="text-xs text-muted-foreground">We prioritize patient well-being, comfort, and informed consent in every treatment.</p>
            </div>

            <div className="p-6 rounded-2xl bg-card border text-center space-y-3">
              <ShieldCheck className="h-8 w-8 text-primary mx-auto" />
              <h3 className="font-bold text-base">Integrity & Ethics</h3>
              <p className="text-xs text-muted-foreground">Uncompromising ethical standards with completely transparent medical fees.</p>
            </div>

            <div className="p-6 rounded-2xl bg-card border text-center space-y-3">
              <Award className="h-8 w-8 text-amber-500 mx-auto" />
              <h3 className="font-bold text-base">Clinical Quality</h3>
              <p className="text-xs text-muted-foreground">Practicing modern medicine with continuous professional skill enhancement.</p>
            </div>

            <div className="p-6 rounded-2xl bg-card border text-center space-y-3">
              <Users className="h-8 w-8 text-teal-600 mx-auto" />
              <h3 className="font-bold text-base">Accessibility</h3>
              <p className="text-xs text-muted-foreground">Fast, easy appointments with responsive staff always ready to assist you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight">
            Ready to Consult with Our Specialists?
          </h2>
          <p className="text-sm text-muted-foreground">
            Schedule an in-person consultation or routine check-up today.
          </p>
          <Button asChild size="lg" className="rounded-full bg-primary hover:bg-primary/90 px-8 shadow-md">
            <Link href="/appointment">
              <Calendar className="mr-2 h-4 w-4" /> Book Appointment
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
