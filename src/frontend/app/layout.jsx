import { Suspense } from "react";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { CourseProvider } from "@/components/CourseProvider";

export const metadata = {
  title: "Aita MVP",
  description: "A voice-first AI teaching aid prototype for Cert I Construction learners."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body><AuthProvider><Suspense fallback={<p role="status">Loading course material...</p>}><CourseProvider>{children}</CourseProvider></Suspense></AuthProvider></body>
    </html>
  );
}
