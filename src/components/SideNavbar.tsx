"use client";

import React, { useState, useEffect } from "react";
import { Nav } from "./ui/nav";
import { LayoutDashboard, LineChart, Users2, ChevronRight, ChevronLeft, Settings, FileClock } from "lucide-react";
import { Button } from "./ui/button";
import { useWindowWidth } from '@react-hook/window-size';

type Props = {};

export default function SideNavbar({}: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileWidth, setMobileWidth] = useState(false);

  // Update mobileWidth based on window width
  const onlyWidth = useWindowWidth();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMobileWidth(onlyWidth < 768);
    }
  }, [onlyWidth]);

  function toggleSidebar() {
    setIsCollapsed(!isCollapsed);
  }

  return (
    <div className="relative min-w-[80px] border-r px-3 pb-10 pt-24">
      {!mobileWidth && (
        <div className="absolute right-[-20px] top-7">
          <Button onClick={toggleSidebar} variant="secondary" className="rounded-xl p-2">
            {isCollapsed ? <ChevronRight className="bg-transparent" /> : <ChevronLeft className="bg-transparent" />}
          </Button>
        </div>
      )}

      <Nav
        isCollapsed={mobileWidth ? true : isCollapsed}
        links={[
          {
            title: "Dashboard",
            href: "/",
            icon: LayoutDashboard,
            variant: "default",
          },
          {
            title: "Data",
            href: "/data",
            icon: LineChart,
            variant: "ghost",
          },
          {
            title: "Audit Log",
            href: "/auditLog",
            icon: FileClock,
            variant: "ghost",
          },
          {
            title: "Users",
            href: "/users",
            icon: Users2,
            variant: "ghost",
          },
          {
            title: "Settings",
            href: "/settings",
            icon: Settings,
            variant: "ghost",
          },
        ]}
      />
    </div>
  );
}
