"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ModeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <Select onValueChange={(value) => setTheme(value)} defaultValue={theme}>
      <SelectTrigger>
        <SelectValue placeholder="Select theme" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">
          <div className="flex items-center">
            <Sun className="mr-2 h-[1.2rem] w-[1.2rem]" />
            Light
          </div>
        </SelectItem>
        <SelectItem value="dark">
          <div className="flex items-center">
            <Moon className="mr-2 h-[1.2rem] w-[1.2rem]" />
            Dark
          </div>
        </SelectItem>
        <SelectItem value="system">
          <div className="flex items-center">
            <Laptop className="mr-2 h-[1.2rem] w-[1.2rem]" />
            System
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
