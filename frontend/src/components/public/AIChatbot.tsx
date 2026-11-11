"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ai as aiApi } from "@/lib/api";
import { getMediaUrl } from "@/lib/utils";
import { toast } from "sonner";
import {
  Bot,
  Send,
  X,
  Sparkles,
  Calendar,
  Clock,
  Stethoscope,
  RotateCcw,
  AlertTriangle,
  MessageSquareHeart,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecommendedDoctor {
  id: string;
  name: string;
  title: string;
  slug: string;
  specialization: string;
  department: string;
  consultationFee: number;
  image?: string | null;
  appointmentStartTime?: string;
  appointmentEndTime?: string;
  slotDuration?: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  recommendedDoctors?: RecommendedDoctor[];
  recommendedDepartment?: string | null;
  urgencyLevel?: "NORMAL" | "MODERATE" | "URGENT";
}

const QUICK_SYMPTOMS = [
  "👁️ Blurry vision or eye pain",
  "🌡️ Persistent fever, headache & cough",
  "❤️ Chest discomfort or heart palpitations",
  "🌿 Skin rash, itching or allergies",
];

const INITIAL_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "model",
  text: "Hello! I'm your DoctorPro AI Health Assistant. Describe your symptoms or ask a health question—I'll provide initial guidance and recommend the right specialist doctor in our clinic to book with.",
};

export function AIChatbot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, isOpen]);

  // Hide floating public assistant inside admin panel
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const sendMessage = async (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: query,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const historyPayload = nextMessages
        .filter((m) => m.id !== "welcome")
        .slice(0, -1)
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const res = await aiApi.chat({
        message: query,
        history: historyPayload,
      });

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        text: res.reply,
        recommendedDoctors: res.recommendedDoctors || [],
        recommendedDepartment: res.recommendedDepartment,
        urgencyLevel: res.urgencyLevel,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const exactProblem = err?.message || "Failed to contact AI assistant";
      toast.error("AI Assistant Error", {
        description: exactProblem,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "model",
          text: `Sorry, unable to reach the AI assistant right now: ${exactProblem}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setInput("");
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">
      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="mb-3 w-[93vw] sm:w-[420px] h-[560px] max-h-[82vh] bg-background border border-border/90 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0c1e38] to-[#0f2f4f] text-white px-4 py-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 relative">
                <Bot className="h-5 w-5" />
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0c1e38]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold tracking-tight">DoctorPro AI Guide</h3>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-500/25 text-emerald-200 border border-emerald-400/30 flex items-center gap-0.5">
                    <Sparkles className="h-2.5 w-2.5" /> Gemini
                  </span>
                </div>
                <p className="text-[10px] text-slate-300">
                  Symptom check & instant doctor suggestion
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={resetChat}
                title="Start New Chat"
                className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close Assistant"
                className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-background border border-border/80 text-foreground rounded-tl-sm"
                  }`}
                >
                  {m.urgencyLevel === "URGENT" && (
                    <div className="mb-2 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[11px] flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>URGENT ALERT: Please call 911 or visit the nearest Emergency Room immediately!</span>
                    </div>
                  )}

                  <p className="whitespace-pre-line">{m.text}</p>

                  {/* Recommended Doctors Cards */}
                  {m.recommendedDoctors && m.recommendedDoctors.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                        <Stethoscope className="h-3 w-3" /> Suggested Specialist Doctor(s):
                      </p>

                      {m.recommendedDoctors.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 space-y-2"
                        >
                          <div className="flex items-start gap-2.5">
                            {doc.image ? (
                              <img
                                src={getMediaUrl(doc.image)}
                                alt={doc.name}
                                className="h-10 w-10 rounded-xl object-cover object-top border shrink-0"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary font-bold flex items-center justify-center shrink-0 text-sm">
                                {doc.name.charAt(0)}
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-foreground text-xs truncate">
                                {doc.name}
                              </p>
                              <p className="text-[10px] text-primary font-semibold truncate">
                                {doc.specialization} • {doc.department}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                                <span className="font-bold text-foreground">
                                  ${doc.consultationFee} USD
                                </span>
                                <span className="flex items-center gap-0.5">
                                  <Clock className="h-2.5 w-2.5" />
                                  {doc.appointmentStartTime || "09:00"}–{doc.appointmentEndTime || "17:00"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Button
                              asChild
                              size="sm"
                              className="w-full h-7 text-[11px] font-bold rounded-lg bg-primary hover:bg-primary/90"
                              onClick={() => setIsOpen(false)}
                            >
                              <Link href={`/appointment?doctorId=${doc.id}`}>
                                <Calendar className="h-3 w-3 mr-1" /> Book Appointment
                                <ArrowRight className="h-3 w-3 ml-1" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Quick Suggestion Chips on First Screen */}
            {messages.length === 1 && !loading && (
              <div className="pt-1 space-y-1.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                  Quick Symptoms & Questions:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_SYMPTOMS.map((sym) => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => sendMessage(sym)}
                      className="text-left text-[11px] font-medium px-2.5 py-1.5 rounded-xl bg-background border border-border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer shadow-2xs"
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading Typing Indicator */}
            {loading && (
              <div className="flex items-start">
                <div className="bg-background border rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-xs text-muted-foreground flex items-center gap-2 shadow-xs">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span>Finding the best specialist & preparing guidance...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="p-3 bg-background border-t flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder="Describe your symptoms or ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 h-10 px-3.5 rounded-xl bg-muted/40 border border-border/80 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || !input.trim()}
              className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 shrink-0 shadow-sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}

      {/* Floating Toggle Pill */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[#0c1e38] to-primary text-white shadow-xl hover:shadow-2xl hover:scale-[1.03] active:scale-[0.98] transition-all border border-white/15 cursor-pointer"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
        </span>
        {isOpen ? (
          <>
            <X className="h-4 w-4" />
            <span className="text-xs font-bold">Close AI Chat</span>
          </>
        ) : (
          <>
            <MessageSquareHeart className="h-4 w-4 text-emerald-300" />
            <span className="text-xs font-bold tracking-tight">
              AI Doctor Assistant
            </span>
          </>
        )}
      </button>
    </div>
  );
}
