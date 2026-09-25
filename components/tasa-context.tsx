"use client";

import { createContext, useContext, useState } from "react";

export type TasaMode = "bcv" | "paralelo";

type TasaContextValue = {
  tasa: TasaMode;
  setTasa: (t: TasaMode) => void;
};

const TasaContext = createContext<TasaContextValue | null>(null);

export function TasaProvider({ children }: { children: React.ReactNode }) {
  const [tasa, setTasa] = useState<TasaMode>("bcv");
  return (
    <TasaContext.Provider value={{ tasa, setTasa }}>
      {children}
    </TasaContext.Provider>
  );
}

export function useTasa() {
  const ctx = useContext(TasaContext);
  if (!ctx) throw new Error("useTasa debe usarse dentro de TasaProvider");
  return ctx;
}
