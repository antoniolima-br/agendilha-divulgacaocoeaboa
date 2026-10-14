import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { SidebarMenu } from "@/components/SidebarMenu";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { SiteFooter } from "@/components/layout/SiteFooter";

let desktopSidebarVisible = true;

interface AppShellProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
}

export function AppShell({ 
  children, 
  showSidebar = false,
  maxWidth = "lg" 
}: AppShellProps) {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { isAdmin, isMaster, isPromoter } = useAppPermissions();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(desktopSidebarVisible);
  const setDesktopSidebar = (open: boolean) => { desktopSidebarVisible = open; setDesktopMenuOpen(open); };
  const location = useLocation();

  // Automatically show sidebar for admins/masters if not explicitly false
  const effectiveShowSidebar = showSidebar || (isAdmin || isMaster || isPromoter);
  const hasSidebar = Boolean(effectiveShowSidebar && user);
  
  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search, isMobile]);

  const maxWidthClasses = {
    sm: "max-w-3xl",
    md: "max-w-5xl",
    lg: "max-w-7xl",
    xl: "max-w-[1400px]",
    full: "max-w-none"
  };

  return (
    <div className="flex min-h-dvh bg-background text-foreground selection:bg-primary/10 overflow-x-hidden relative">
      {/* Sidebar for Desktop */}
      {hasSidebar && (isMobile || desktopMenuOpen) && (
        <aside aria-label="Menu principal" className="fixed inset-y-0 left-0 z-40 hidden w-72 overflow-y-auto border-r border-border bg-sidebar shadow-sm md:block">
          <SidebarMenu onClose={() => setDesktopSidebar(false)} />
        </aside>
      )}

      {/* Main Container */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300 w-full",
        hasSidebar && desktopMenuOpen ? "md:pl-72" : "pl-0"
      )}>
        {/* Unified Header */}
        <Header onMobileMenuToggle={() => {
          if (!isMobile && hasSidebar) setDesktopSidebar(true);
          else setMobileMenuOpen(true);
        }} />

        {hasSidebar && !desktopMenuOpen && <div className="hidden px-4 pt-3 md:block"><Button variant="outline" aria-label="Abrir menu lateral" onClick={() => setDesktopSidebar(true)}><Menu className="h-4 w-4" />Menu</Button></div>}

        {/* Page Content */}
        <main className={cn(
          "mx-auto w-full min-w-0 flex-1 overflow-x-hidden px-3 py-4 sm:px-4 md:p-8",
          maxWidthClasses[maxWidth]
        )}>
          <AppErrorBoundary context="AppShellContent">
            {children}
          </AppErrorBoundary>
        </main>

        {/* Footer */}
        <SiteFooter variant="muted" className="mt-auto" />
      </div>

      {/* Mobile Menu Drawer */}
      <Sheet open={mobileMenuOpen && (isMobile || !hasSidebar)} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[min(20rem,calc(100vw-1rem))] border-r border-border bg-sidebar p-0">
          <SheetTitle className="sr-only">Menu principal</SheetTitle>
          <SidebarMenu onClose={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

    </div>
  );
}
