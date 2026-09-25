"use client";

import { createContext, useContext, useState } from "react";

export type SeccionId =
  | "resumen"
  | "conceptos"
  | "partidas"
  | "fondos"
  | "devoluciones"
  | "facturas"
  | "recurrentes"
  | "metodologia";

type SeccionContextValue = {
  seccion: SeccionId;
  setSeccion: (s: SeccionId) => void;
};

const SeccionContext = createContext<SeccionContextValue | null>(null);

export function SeccionProvider({ children }: { children: React.ReactNode }) {
  const [seccion, setSeccion] = useState<SeccionId>("resumen");
  return (
    <SeccionContext.Provider value={{ seccion, setSeccion }}>
      {children}
    </SeccionContext.Provider>
  );
}

export function useSeccion() {
  const ctx = useContext(SeccionContext);
  if (!ctx) throw new Error("useSeccion debe usarse dentro de SeccionProvider");
  return ctx;
}
