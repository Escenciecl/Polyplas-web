import type { Metadata, Viewport } from "next";
import Script from "next/script";
import LegacyHtml from "@/components/LegacyHtml";
import JsonLd from "@/components/JsonLd";
import { readHtml, site, SITE_URL } from "@/lib/content";

// Tipografías autoalojadas (antes las servía el plugin OMGF desde WordPress)
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "@fontsource/roboto-slab/400.css";
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/archivo-narrow/400.css";
import "@fontsource/archivo-narrow/600.css";
import "@fontsource/archivo-narrow/700.css";
import "@fontsource/barlow/400.css";
import "@fontsource/barlow/600.css";
import "@fontsource/barlow/700.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/600.css";

// Estilos heredados del tema + Elementor (limpiados de lo que no se usa) y los del sitio
import "./legacy/vendor.css";
import "./legacy/global-inline.css";
import "./globals.css";

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
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const header = readHtml("_header");
const footer = readHtml("_footer");
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
        <LegacyHtml html={header} />
        <main id="contenido">{children}</main>
        <LegacyHtml html={footer} />
      </body>
    </html>
  );
}
