"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import SideNavbar from "@/components/SideNavbar";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useCallback, useState, useRef } from "react";
import { checkAuthState, getAuditInfoRealtime, AuditData } from "@/app/firebase"; // Adjust the import path as needed
import { metadata } from "./metadata"; // Import metadata from the new file
import { ThemeProvider } from "@/components/ui/theme-provider";
import { toast, Toaster } from 'sonner'; // Import toast and Toaster from sonner
import { X } from 'lucide-react'; // Import an icon from lucide-react

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname.startsWith("/auth");

  // State to track the latest audit log
  const [latestAuditTime, setLatestAuditTime] = useState<number | null>(null);
  const listenerAddedRef = useRef(false);

  // Helper function to ensure title and description are strings
  const getString = (value: unknown): string => (typeof value === 'string' ? value : '');

  const title: string = getString(metadata.title);
  const description: string = getString(metadata.description);

  const showAuditUpdateToast = useCallback((audit: AuditData) => {
    toast(
      `Audit log updated: ${audit.action} ${audit.object}`,
      {
        duration: 2000, // Set the duration in milliseconds
        action: {
          label: <X size={12} />,
          onClick: () => toast.dismiss(),
        },
      }
    );
  }, []);

  useEffect(() => {
    const unsubscribeAuth = checkAuthState((user) => {
      if (!user && !isAuthPage) {
        router.push("/auth");
      } else if (user && isAuthPage) {
        router.push("/");
      }
    });

    if (!listenerAddedRef.current) {
      listenerAddedRef.current = true;

      getAuditInfoRealtime((audits: AuditData[]) => {
        if (audits.length > 0) {
          const mostRecentAudit = audits[0];
          const auditTime = new Date(mostRecentAudit.time).getTime();
          if (!latestAuditTime || auditTime > latestAuditTime) {
            setLatestAuditTime(auditTime);
            showAuditUpdateToast(mostRecentAudit);
          }
        }
      });
    }

    return () => {
      if (unsubscribeAuth) {
        unsubscribeAuth();
      }
    };
  }, [router, isAuthPage, showAuditUpdateToast, latestAuditTime]);

  return (
    <html lang="en">
      <head>
        <title>{title}</title>
        <meta name="description" content={description} />
      </head>
      <body className={cn("min-h-screen w-full flex", inter.className, { "debug-screens": process.env.NODE_ENV === "development" })}>
        {isAuthPage ? (
          <div className="w-full">{children}</div>
        ) : (
          <ThemeProvider attribute="class">
            {!isAuthPage && <SideNavbar />}
            <div className="w-full py-10 px-12">{children}</div>
            <Toaster />
          </ThemeProvider>
        )}
      </body>
    </html>
  );
}
