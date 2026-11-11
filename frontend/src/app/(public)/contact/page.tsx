"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Message Received", {
      description: "Thank you for contacting DoctorPro. Our medical desk will respond shortly.",
    });
  };

  return (
    <div className="py-12 md:py-16">
      <div className="container mx-auto px-4 max-w-5xl space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="outline" className="text-primary border-primary/20">Get In Touch</Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            Contact DoctorPro Clinic
          </h1>
          <p className="text-sm text-muted-foreground">
            Have questions about our doctors, diagnostic services, or chamber timings? Reach out anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Contact Details */}
          <div className="md:col-span-5 space-y-6">
            <Card className="rounded-2xl border-border/80">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-lg text-foreground">Clinic Information</h3>

                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">Clinic Address</p>
                      <p className="text-xs text-muted-foreground">450 Lexington Ave, Suite 1400, New York, NY 10017</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-sm">
                    <Phone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">Phone & Hotline</p>
                      <p className="text-xs text-muted-foreground">Reception: +1 (555) 234-5678</p>
                      <p className="text-xs text-muted-foreground">Emergency: +1 (555) 911-0000</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-sm">
                    <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">Email Support</p>
                      <p className="text-xs text-muted-foreground">contact@doctorpro.com</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-sm">
                    <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">Consultation Hours</p>
                      <p className="text-xs text-muted-foreground">Mon - Sat: 8:00 AM - 8:00 PM</p>
                      <p className="text-xs text-muted-foreground">Sunday: Closed / Emergency On-Call</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-7">
            <Card className="rounded-2xl border-border/80">
              <CardContent className="p-6 md:p-8 space-y-6">
                <h3 className="font-bold text-lg text-foreground">Send Us a Message</h3>

                {submitted ? (
                  <div className="p-8 text-center space-y-4 bg-primary/5 rounded-2xl border border-primary/20">
                    <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
                    <h4 className="font-bold text-lg">Message Received!</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Thank you for contacting DoctorPro. Our medical desk will respond to your inquiry shortly.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
                      Send Another Inquiry
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Your Name *</Label>
                        <Input placeholder="John Doe" required className="rounded-xl h-10" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Phone Number *</Label>
                        <Input placeholder="+1 (555) 234-5678" required className="rounded-xl h-10" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Email Address</Label>
                      <Input type="email" placeholder="john@example.com" className="rounded-xl h-10" />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Subject / Department</Label>
                      <Input placeholder="e.g. Appointment Inquiry, Test Pricing" required className="rounded-xl h-10" />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Your Message *</Label>
                      <Textarea placeholder="Type your message or inquiry here..." rows={4} required className="rounded-xl resize-none text-xs" />
                    </div>

                    <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 rounded-xl font-semibold text-sm">
                      <Send className="mr-2 h-4 w-4" /> Send Message
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
