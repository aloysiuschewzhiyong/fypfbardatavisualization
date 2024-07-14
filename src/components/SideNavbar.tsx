"use client";

import React, { useState } from "react";
import { Nav } from "./ui/nav";
import { LayoutDashboard, LineChart, Users2, ChevronRight , ChevronLeft, Settings , FileClock} from "lucide-react";
type Props = {};
import { Button } from "./ui/button";
import {
  useWindowWidth,
} from '@react-hook/window-size'

export default function SideNavbar({}: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const onlyWidth = useWindowWidth()
  const mobileWidth = onlyWidth < 768;

  function toggleSidebar(){
    setIsCollapsed(!isCollapsed);
  }

  return (
    <div className="relative min-w-[80px] border-r px-3  pb-10 pt-24 ">
      {!mobileWidth && (
      <div className="absolute right-[-20px] top-7">
        <Button onClick={toggleSidebar} variant="secondary" className="rounded-xl p-2">
        {isCollapsed ? <ChevronRight className="bg-transparent"/> : <ChevronLeft className="bg-transparent"/>}
        </Button>
      </div>
  )}

      <Nav
        isCollapsed={ mobileWidth? true : isCollapsed}
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
