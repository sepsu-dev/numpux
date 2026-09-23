"use client";

import { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Bell, Shield, Palette, Layout, Moon, Sun, Monitor, Check } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SettingsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
    const { theme, setTheme } = useTheme();

    const [emailNotif, setEmailNotif] = useState(true);
    const [taskReminders, setTaskReminders] = useState(true);
    const [compactView, setCompactView] = useState(false);
    const [telemetry, setTelemetry] = useState(false);

    const handleSave = () => {
        toast.success("Preferences saved successfully!");
        onOpenChange(false);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-md w-full p-0 flex flex-col h-full bg-card border-l border-border shadow-2xl">
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-border/60">
                        <SheetHeader className="p-0">
                            <SheetTitle className="text-lg font-bold text-foreground tracking-tight">
                                Workspace Settings
                            </SheetTitle>
                            <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                                Customize your theme, notification alerts, and interface preferences.
                            </SheetDescription>
                        </SheetHeader>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-5 flex-1 overflow-y-auto">
                        {/* Theme Section */}
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-2">
                                <Palette size={14} className="text-primary" />
                                <span className="text-xs font-semibold text-foreground">Theme & Appearance</span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 pt-1">
                                {[
                                    { id: "light", label: "Light", icon: Sun },
                                    { id: "dark", label: "Dark", icon: Moon },
                                    { id: "system", label: "System", icon: Monitor },
                                ].map((t) => {
                                    const Icon = t.icon;
                                    const isSelected = theme === t.id;
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => setTheme(t.id)}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer shadow-2xs gap-1.5",
                                                isSelected
                                                    ? "bg-foreground text-background font-semibold border-foreground"
                                                    : "bg-background/50 text-muted-foreground border-border hover:text-foreground hover:bg-muted/50"
                                            )}
                                        >
                                            <Icon size={16} />
                                            <span className="text-[11px]">{t.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Notifications Section */}
                        <div className="space-y-2.5 pt-3 border-t border-border/50">
                            <div className="flex items-center gap-2">
                                <Bell size={14} className="text-primary" />
                                <span className="text-xs font-semibold text-foreground">Notifications</span>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-background/50 hover:bg-background cursor-pointer transition-colors shadow-2xs">
                                    <div className="pr-3">
                                        <p className="text-xs font-semibold text-foreground">Email Notifications</p>
                                        <p className="text-[11px] text-muted-foreground">Receive daily digests of sprint velocity & updates</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={emailNotif}
                                        onChange={(e) => setEmailNotif(e.target.checked)}
                                        className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer shrink-0"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-background/50 hover:bg-background cursor-pointer transition-colors shadow-2xs">
                                    <div className="pr-3">
                                        <p className="text-xs font-semibold text-foreground">Task Due Reminders</p>
                                        <p className="text-[11px] text-muted-foreground">Get alerted when deadlines are approaching</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={taskReminders}
                                        onChange={(e) => setTaskReminders(e.target.checked)}
                                        className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer shrink-0"
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Workspace & Layout */}
                        <div className="space-y-2.5 pt-3 border-t border-border/50">
                            <div className="flex items-center gap-2">
                                <Layout size={14} className="text-primary" />
                                <span className="text-xs font-semibold text-foreground">Layout & System</span>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-background/50 hover:bg-background cursor-pointer transition-colors shadow-2xs">
                                    <div className="pr-3">
                                        <p className="text-xs font-semibold text-foreground">Compact Density Mode</p>
                                        <p className="text-[11px] text-muted-foreground">Display more items on screen with tighter padding</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={compactView}
                                        onChange={(e) => setCompactView(e.target.checked)}
                                        className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer shrink-0"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-background/50 hover:bg-background cursor-pointer transition-colors shadow-2xs">
                                    <div className="pr-3">
                                        <p className="text-xs font-semibold text-foreground">Anonymous Telemetry</p>
                                        <p className="text-[11px] text-muted-foreground">Send crash reports to help improve Numpux</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={telemetry}
                                        onChange={(e) => setTelemetry(e.target.checked)}
                                        className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer shrink-0"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-border/60 bg-muted/20 flex items-center justify-end gap-2.5">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl text-xs h-9 px-4 border-border cursor-pointer hover:bg-muted"
                        >
                            Close
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleSave}
                            className="rounded-xl text-xs h-9 px-5 bg-primary text-primary-foreground font-semibold hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-xs"
                        >
                            Save Preferences
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
