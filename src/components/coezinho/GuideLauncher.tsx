import { lazy, Suspense, useEffect, useState } from "react";
import { OPEN_KOE_EVENT } from "@/components/layout/MobileTabBar";
import { MascotLauncher } from "./MascotLauncher";

const Chat = lazy(() => import("./CoezinhoChat").then((module) => ({ default: module.CoezinhoChat })));

/** Keep the launcher light; the chat owns a fresh conversation per opening. */
export function GuideLauncher({ initiallyOpen = false }: { initiallyOpen?: boolean }) {
  const [requested, setRequested] = useState(initiallyOpen);
  useEffect(() => { if (initiallyOpen) setRequested(true); }, [initiallyOpen]);
  useEffect(() => {
    const open = () => setRequested(true);
    window.addEventListener(OPEN_KOE_EVENT, open);
    return () => window.removeEventListener(OPEN_KOE_EVENT, open);
  }, []);
  const launcher = <MascotLauncher onOpen={() => setRequested(true)} />;
  return requested ? <Suspense fallback={launcher}><Chat initiallyOpen /></Suspense> : launcher;
}