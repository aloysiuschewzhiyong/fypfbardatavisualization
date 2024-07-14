"use client"

import Link from "next/link"
import { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { TooltipProvider } from "@radix-ui/react-tooltip"
import { usePathname } from "next/navigation"

interface NavProps {
  isCollapsed: boolean
  links: {
    title: string
    label?: string
    icon: LucideIcon
    variant: "default" | "ghost"
    href: string;
  }[]
}

export function Nav({ links, isCollapsed }: NavProps) {
  const pathName = usePathname();
  return (
    <TooltipProvider>
      <div
        data-collapsed={isCollapsed}
        className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2"
      >
        <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
          {links.map((link, index) => (
            <Tooltip key={index} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={link.href}
                  className={cn(
                    buttonVariants({ variant: link.href === pathName ? 'default' : 'ghost', size: isCollapsed ? "icon" : "sm" }),
                    isCollapsed ? "h-9 w-9" : "justify-start",
                    link.href === pathName ? "text-white dark:text-black" : "text-black dark:text-gray-300"
                  )}
                >
                  <link.icon className="h-4 w-4 text-current" />
                  {!isCollapsed && (
                    <>
                      <span className="ml-2 text-current">{link.title}</span>
                      {link.label && (
                        <span className="ml-auto text-muted-foreground text-current">
                          {link.label}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" className="flex items-center gap-4">
                  {link.title}
                  {link.label && (
                    <span className="ml-auto text-muted-foreground">
                      {link.label}
                    </span>
                  )}
                </TooltipContent>
              )}
            </Tooltip>
          ))}
        </nav>
      </div>
    </TooltipProvider>
  )
}
