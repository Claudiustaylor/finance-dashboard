"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)]",
          description: "text-slate-500",
          actionButton:
            "bg-[#0071c5] text-white hover:bg-[#005fa6]",
          cancelButton:
            "bg-slate-100 text-slate-700 hover:bg-slate-200",
        },
      }}
      {...props}
    />
  );
}
