# Correos de la cuenta (Supabase Auth) en español

Se pegan en **Supabase → Authentication → Emails → Templates**. Cada plantilla tiene un asunto y un cuerpo (HTML).

| Plantilla en Supabase | Asunto | Archivo |
|---|---|---|
| Confirm signup | Confirma tu cuenta en Polyplas | `confirmar-cuenta.html` |
| Reset password | Crea tu nueva contraseña · Polyplas | `restablecer-contrasena.html` |
| Magic link | Tu enlace para ingresar a Polyplas | `enlace-ingreso.html` |
| Change email address | Confirma tu nuevo correo · Polyplas | `cambio-correo.html` |

Todas usan `{{ .ConfirmationURL }}` (el enlace que arma Supabase). No llevan imágenes ni promociones, para que no caigan en spam.

## Remitente (SMTP propio)

Supabase → Authentication → Emails → **SMTP Settings** → Enable custom SMTP:

- Sender email: `ventas@polyplas.cl` · Sender name: `Polyplas`
- Host: `mail.polyplas.cl` · Port: `465`
- Username: `ventas@polyplas.cl` · Password: la del correo (la escribe la jefa; nunca va en el repositorio)

Después, en **Authentication → Rate Limits**, subir el límite de correos por hora (Supabase lo deja en 30 al activar SMTP propio).

Sin SMTP propio, los correos salen de "Supabase Auth" en inglés, con un límite de pocos correos por hora y sin garantía de entrega.
