import { lazy, Suspense, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isTabBarHidden, OPEN_KOE_EVENT } from "@/components/layout/MobileTabBar";
import { cn } from "@/lib/utils";

const Chat = lazy(() => import("./CoezinhoChat").then((module) => ({ default: module.CoezinhoChat })));

/** Keep the visible launcher light; retain conversation state after first use. */
export function GuideLauncher({ initiallyOpen = false }: { initiallyOpen?: boolean }) {
  const [requested, setRequested] = useState(initiallyOpen);
  const { pathname } = useLocation();
  useEffect(() => { if (initiallyOpen) setRequested(true); }, [initiallyOpen]);
  useEffect(() => {
    const open = () => setRequested(true);
    window.addEventListener(OPEN_KOE_EVENT, open);
    return () => window.removeEventListener(OPEN_KOE_EVENT, open);
  }, []);
  const launcher = (
    <Button
      onClick={() => setRequested(true)}
      aria-label="Falar com o Guia do Coé"
      className={cn(
        "fixed bottom-6 right-4 z-50 items-center gap-2 rounded-full bg-primary px-4 py-3 font-semibold text-primary-foreground shadow-lg transition hover:scale-105",
        !isTabBarHidden(pathname) ? "hidden md:flex" : "flex",
      )}
    >
      <MessageCircle className="h-5 w-5" />
      <span className="text-sm">Guia do Coé</span>
    </Button>
  );
  return requested ? <Suspense fallback={launcher}><Chat initiallyOpen /></Suspense> : launcher;
}