import { LucideIcon } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";
import { Card as ShadcnCard, CardContent as ShadcnCardContent } from "@/components/ui/Card";

export type CardProps = {
  label: string;
  icon: LucideIcon;
  amount: string;
  description: string | JSX.Element;
};

export default function Card(props: CardProps) {
  return (
    <ShadcnCard className="rounded-xl">
      <ShadcnCardContent className="rounded-xl p-6 shadow">
        <section className="flex flex-row font-semibold justify-between gap-2">
          {/* label */}
          <p>{props.label}</p>
          {/* icon */}
          <props.icon className="h-4 w-4 text-gray-400" />
        </section>

        <section className="flex flex-col gap-1">
          {/* amount */}
          <h2 className="text-2xl font-bold">{props.amount}</h2>
          {/* description */}
          <p className="text-xs text-gray-400">{props.description}</p>
        </section>
      </ShadcnCardContent>
    </ShadcnCard>
  );
}

export function CardContent(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <ShadcnCardContent
      {...props}
      className={cn(
        "flex w-full flex-col gap-3 rounded-xl border p-6 shadow",
        props.className
      )}
    />
  );
}
