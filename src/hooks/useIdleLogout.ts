import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../lib/supabaseClient";

const IDLE_MS = 28 * 60 * 1000;
const WARN_MS = 2 * 60 * 1000;
const EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];

export function useIdleLogout() {
  const navigate = useNavigate();
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isWarning = useRef(false);
  const [warningVisible, setWarningVisible] = useState(false);

  const doLogout = useCallback(async () => {
    isWarning.current = false;
    setWarningVisible(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) await supabase.auth.signOut();
    sessionStorage.setItem("logout_reason", "idle");
    navigate("/login");
  }, [navigate]);

  const extendSession = useCallback(() => {
    isWarning.current = false;
    setWarningVisible(false);
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      isWarning.current = true;
      setWarningVisible(true);
      logoutTimer.current = setTimeout(doLogout, WARN_MS);
    }, IDLE_MS);
  }, [doLogout]);

  useEffect(() => {
    const reset = () => {
      if (isWarning.current) return;
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        isWarning.current = true;
        setWarningVisible(true);
        logoutTimer.current = setTimeout(doLogout, WARN_MS);
      }, IDLE_MS);
    };

    reset();
    EVENTS.forEach(e => window.addEventListener(e, reset, { passive: true }));

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
      EVENTS.forEach(e => window.removeEventListener(e, reset));
    };
  }, [doLogout]);

  return { warningVisible, extendSession, logout: doLogout };
}
