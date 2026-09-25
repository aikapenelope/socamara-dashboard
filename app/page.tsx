import { AppShell } from "@/components/app-shell";
import Contenido from "@/components/dashboard";
import { SeccionProvider } from "@/components/seccion-context";

export default function Home() {
  return (
    <SeccionProvider>
      <AppShell>
        <Contenido />
      </AppShell>
    </SeccionProvider>
  );
}
