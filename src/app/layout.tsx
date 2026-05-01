export const runtime = "edge";
import type { Metadata } from "next";
import { NavBar } from "@/components/nav-bar";
import { getCurrentProfile } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Videos",
  description: "Personal video site",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans bg-bg text-neutral-100 antialiased">
        <NavBar profile={profile} />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
