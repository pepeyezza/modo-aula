import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { getSiteSettings } from "@/data/site-settings";
import { HomeSettingsForm } from "./home-settings-form";

export default async function AdminInicioPage() {
  const settings = await getSiteSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Inicio del sitio</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Configurá los textos y la imagen de fondo del home público (la página que ven las
          visitas antes de ingresar a la plataforma).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Primer bloque (portada)</CardTitle>
          <CardDescription>
            Título, subtítulo, botones e imagen de fondo del primer bloque del home.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HomeSettingsForm settings={settings} />
        </CardContent>
      </Card>
    </div>
  );
}
