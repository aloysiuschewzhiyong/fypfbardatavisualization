"use client";
import React, { ReactNode, useEffect, useState, useRef, useCallback } from 'react';
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import SideNavbar from "@/components/SideNavbar";
import { usePathname, useRouter } from "next/navigation";
import { checkAuthState, getAuditInfoRealtime, AuditData } from "@/app/firebase";
import { metadata } from "./metadata";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { toast, Toaster } from 'sonner';
import { X } from 'lucide-react';
import { AuditAlertProvider, useAuditAlert } from "@/components/ui/AuditContext";

const inter = Inter({ subsets: ["latin"] });

interface RootLayoutProps {
  children: ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname.startsWith("/auth");

  const { auditEnabled } = useAuditAlert();
  const [latestAuditTime, setLatestAuditTime] = useState<number | null>(null);
  const lastAuditRef = useRef<AuditData | null>(null); // Track the last shown audit

  const getString = (value: unknown): string => (typeof value === 'string' ? value : '');

  const title: string = getString(metadata.title);
  const description: string = getString(metadata.description);

  const showAuditUpdateToast = useCallback((audit: AuditData) => {
    if (auditEnabled) {
      console.log("Showing toast for audit:", audit);
      toast(
        `Audit log updated: ${audit.action} ${audit.object}`,
        {
          duration: 3000,
          action: {
            label: <X size={12} />,
            onClick: () => toast.dismiss(),
          },
        }
      );
    }
  }, [auditEnabled]);

  useEffect(() => {
    const unsubscribeAuth = checkAuthState((user) => {
      if (!user && !isAuthPage) {
        router.push("/auth");
      } else if (user && isAuthPage) {
        router.push("/");
      }
    });

    return () => {
      if (unsubscribeAuth) {
        unsubscribeAuth();
      }
    };
  }, [router, isAuthPage]);

  useEffect(() => {
    console.log("useEffect triggered for audit listener setup");

    let unsubscribe: (() => void) | null = null;

    if (auditEnabled) {
      unsubscribe = getAuditInfoRealtime((audits: AuditData[]) => {
        console.log("Received audits:", audits);
        if (audits.length > 0) {
          const mostRecentAudit = audits[0];
          const auditTime = new Date(mostRecentAudit.time).getTime();

          if (!latestAuditTime || auditTime > latestAuditTime) {
            if (!lastAuditRef.current || lastAuditRef.current.time !== mostRecentAudit.time) {
              console.log("New audit time detected:", auditTime);
              setLatestAuditTime(auditTime);
              lastAuditRef.current = mostRecentAudit;
              showAuditUpdateToast(mostRecentAudit);
            }
          }
        }
      });
    }

    return () => {
      console.log("Cleaning up audit listeners");
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [showAuditUpdateToast, latestAuditTime, auditEnabled]);

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
            <div className="w-full p-4 py-6 sm:p-4 md:p-6 lg:p-10 xl:p-12">{children}</div>
            <Toaster />
          </ThemeProvider>
        )}
      </body>
    </html>
  );
};

const WrappedRootLayout = ({ children }: RootLayoutProps) => (
  <AuditAlertProvider>
    <RootLayout>{children}</RootLayout>
  </AuditAlertProvider>
);

export default WrappedRootLayout;
