import type { Metadata } from "next";
import PanelCuenta from "./PanelCuenta";
import LegacyScripts from "@/components/LegacyScripts";
import { scriptsFor } from "@/lib/scripts";

export const metadata: Metadata = {
  title: { absolute: "Mi cuenta | Polyplas" },
  robots: { index: false, follow: true },
  alternates: { canonical: "/cuenta/" },
};

/** Cuenta del cliente: ingreso / registro, sus datos y sus compras. */
export default function CuentaPage() {
  return (
    <>
      <PanelCuenta />
      <LegacyScripts scripts={scriptsFor()} />
    </>
  );
}
