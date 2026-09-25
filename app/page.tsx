import { AppShell } from "@/components/app-shell";
import Contenido from "@/components/dashboard";
import { SeccionProvider } from "@/components/seccion-context";
import { TasaProvider } from "@/components/tasa-context";

export default function Home() {
  return (
    <SeccionProvider>
      <TasaProvider>
        <AppShell>
          <Contenido />
        </AppShell>
      </TasaProvider>
    </SeccionProvider>
  );
}
