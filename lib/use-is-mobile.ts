"use client"

import { useEffect, useState } from "react"

/** true cuando el viewport es de teléfono (≤640px); ajusta ejes y alturas de gráficos */
export function useIsMobile() {
  const [movil, setMovil] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)")
    const actualizar = () => setMovil(mq.matches)
    actualizar()
    mq.addEventListener("change", actualizar)
    return () => mq.removeEventListener("change", actualizar)
  }, [])
  return movil
}
