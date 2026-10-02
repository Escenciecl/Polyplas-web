import type { Metadata, Viewport } from "next";
import Script from "next/script";
import LegacyHtml from "@/components/LegacyHtml";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import JsonLd from "@/components/JsonLd";
import { readHtml, site, SITE_URL } from "@/lib/content";

// Tipografías autoalojadas. Solo el subconjunto latino (español) y solo las familias que el sitio usa:
// así el CSS que bloquea el primer pintado pesa mucho menos.
import "./fonts.css"; // Inter y Montserrat (variables)
import "@fontsource/roboto/latin-400.css";
import "@fontsource/roboto/latin-500.css";
import "@fontsource/roboto/latin-700.css";
import "@fontsource/roboto-slab/latin-400.css";
import "@fontsource/archivo-narrow/latin-400.css";
import "@fontsource/archivo-narrow/latin-600.css";
import "@fontsource/archivo-narrow/latin-700.css";
import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/cormorant-garamond/latin-600.css";

// Estilos heredados del tema + Elementor (limpiados de lo que no se usa) y los del sitio
// (se importan las versiones recortadas que genera scripts/css.mjs en cada build)
import "./legacy/_generado/vendor.css";
import "./legacy/_generado/global-inline.css";
import "./globals.css";
import "./site.css";
import "./modulos.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "Polyplas",
  icons: {
    icon: [
      { url: "/wp-content/uploads/2022/07/favicon-polyplas-1-100x100.webp", sizes: "32x32" },
      { url: "/wp-content/uploads/2022/07/favicon-polyplas-1-300x300.webp", sizes: "192x192" },
    ],
    apple: "/wp-content/uploads/2022/07/favicon-polyplas-1-300x300.webp",
  },
  // Verificación de Google Search Console (mismo código que tenía WordPress)
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "7Nik4IJlZ_Oy3ZCWabbakndDA5IvebGoRZ31BNOTO-Y" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const widgets = readHtml("_widgets");

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL">
      <head>
        <Script src="/legacy/shim.js" strategy="beforeInteractive" />
        {site.businessJsonLd && <JsonLd data={site.businessJsonLd} />}
      </head>
      <body className="elementor-default elementor-kit-8">
        {site.gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${site.gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        <LegacyHtml html={widgets} />
        <a className="pp-skip" href="#contenido">Saltar al contenido</a>
        <Header />
        <main id="contenido">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
