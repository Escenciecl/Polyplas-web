import type { Metadata } from "next";
import { Suspense } from "react";
import Buscador from "./Buscador";
import LegacyScripts from "@/components/LegacyScripts";
import { scriptsFor } from "@/lib/scripts";

export const metadata: Metadata = {
  title: { absolute: "Buscar | Polyplas" },
  robots: { index: false, follow: true },
  alternates: { canonical: "/buscar/" },
};

/** Reemplaza la búsqueda de WordPress (/?s=...). Lleva directo a la categoría que corresponde. */
export default function BuscarPage() {
  return (
    <>
      <Suspense fallback={<div className="pp-buscar" />}>
        <Buscador />
      </Suspense>
      <LegacyScripts scripts={scriptsFor()} />
    </>
  );
}
