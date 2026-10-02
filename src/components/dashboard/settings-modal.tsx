"use client";

import Link from "next/link";
import { ArrowRight, ListChecks, NavigationArrow, User } from "@phosphor-icons/react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const links = [
  { href: "/profile", icon: User, title: "Profile", text: "Update your name and password." },
  { href: "/master/menus", icon: NavigationArrow, title: "Navigation", text: "Organize the links shown in the sidebar." },
  { href: "/master/statuses", icon: ListChecks, title: "Statuses", text: "Manage workflow columns used on the board." },
];

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex h-full w-full flex-col border-l border-border bg-white p-0 sm:max-w-md">
        <div className="border-b border-border px-6 py-5">
          <SheetHeader className="p-0">
            <SheetTitle className="text-lg font-semibold tracking-tight">Settings</SheetTitle>
            <SheetDescription className="mt-1 text-xs">Account and workspace configuration.</SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <section>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Manage</p>
            <div className="divide-y divide-border border-y border-border">
              {links.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => onOpenChange(false)} className="flex items-center gap-3 py-4 hover:text-primary">
                  <item.icon size={17} className="shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.text}</p>
                  </div>
                  <ArrowRight size={14} className="shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
