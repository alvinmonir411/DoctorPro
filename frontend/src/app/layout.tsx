import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/toast";
import { AIChatbot } from "@/components/public/AIChatbot";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DoctorPro — Modern Medical Practice & Doctor Website",
  description: "DoctorPro is a comprehensive medical practice website system with appointment booking, doctor profiles, and clinic management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <AuthProvider>
          {children}
          <AIChatbot />
          <Toaster position="top-center" richColors expand closeButton duration={5000} />
        </AuthProvider>
      </body>
    </html>
  );
}
