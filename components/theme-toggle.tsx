"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"

const sinSuscripcion = () => () => {}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const montado = useSyncExternalStore(sinSuscripcion, () => true, () => false)

  if (!montado) {
    return <Button variant="ghost" size="icon" aria-label="Cambiar tema" />
  }

  const oscuro = resolvedTheme === "dark"
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      onClick={() => setTheme(oscuro ? "light" : "dark")}
    >
      {oscuro ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
    </Button>
  )
}
