// Correos de Supabase Auth en español y con la marca.
//   node scripts/auth-emails.mjs          → genera los HTML en supabase/templates/ para revisarlos
//   node scripts/auth-emails.mjs --push   → además los sube al proyecto (usa .env.deploy.local)
//
// Cuando exista el logo, poner su URL pública (PNG, ~240 px de ancho) en LOGO_URL:
// el encabezado lo usa en lugar del nombre escrito.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PROJECT_REF = "ghptqhnhhazaufcchzsw";
const LOGO_URL = "https://cartaaltoque.com/logo-oscuro.png";
const BRAND = "#FF7101";
const INK = "#0D0D0D";

const root = join(import.meta.dirname, "..");

const header = LOGO_URL
  ? `<img src="${LOGO_URL}" alt="Carta al Toque" width="220" style="display:block;margin:0 auto;border:0;max-width:220px;height:auto;">`
  : `<div style="font-family:'Bebas Neue',Impact,'Arial Narrow Bold',sans-serif;font-size:34px;line-height:1;letter-spacing:1px;color:#ffffff;text-transform:uppercase;">Carta al <span style="color:${BRAND};">Toque</span></div>`;

/** Esqueleto con tablas: es lo que mejor se ve en Gmail, Outlook y el correo del celular. */
function layout({ preheader, title, body, button, url, footnote }) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f3f1ee;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f1ee;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;">
      <tr><td align="center" style="background:${INK};padding:28px 24px;border-bottom:4px solid ${BRAND};">${header}</td></tr>
      <tr><td style="padding:36px 32px 8px;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
        <h1 style="margin:0 0 14px;font-family:'Bebas Neue',Impact,'Arial Narrow Bold',sans-serif;font-size:30px;line-height:1.1;letter-spacing:.5px;text-transform:uppercase;font-weight:normal;color:${INK};">${title}</h1>
        <div style="font-size:16px;line-height:1.6;color:#3a3a3a;">${body}</div>
      </td></tr>
      <tr><td align="center" style="padding:24px 32px 8px;">
        <a href="${url}" style="display:inline-block;background:${BRAND};color:${INK};font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;padding:15px 30px;border-radius:8px;">${button}</a>
      </td></tr>
      <tr><td style="padding:20px 32px 32px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#777777;">
        ${footnote}<br><br>
        Si el botón no funciona, copia este enlace en tu navegador:<br>
        <a href="${url}" style="color:#777777;word-break:break-all;">${url}</a>
      </td></tr>
    </table>
    <p style="margin:18px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9a9a9a;">Carta al Toque · Tu menú digital con pedidos por WhatsApp</p>
  </td></tr>
</table>
</body>
</html>
`;
}

const NOT_YOU = "Si no fuiste tú, puedes ignorar este correo.";

/** Clave = nombre en la configuración de Supabase (mailer_subjects_X / mailer_templates_X_content). */
const EMAILS = {
  confirmation: {
    subject: "Confirma tu correo · Carta al Toque",
    preheader: "Un toque y tu cuenta queda lista.",
    title: "¡Bienvenido a Carta al Toque!",
    body: "Gracias por registrarte. Confirma tu correo y empieza a armar tu menú digital: platos, fotos, tu QR y pedidos directo a tu WhatsApp.",
    button: "Confirmar mi correo",
    url: "{{ .ConfirmationURL }}",
    footnote: `Si no creaste una cuenta, puedes ignorar este correo.`,
  },
  recovery: {
    subject: "Crea una contraseña nueva · Carta al Toque",
    preheader: "Recupera el acceso a tu panel.",
    title: "Recupera tu acceso",
    body: "Recibimos una solicitud para cambiar la contraseña de tu cuenta. Toca el botón para crear una nueva.",
    button: "Crear contraseña nueva",
    url: "{{ .ConfirmationURL }}",
    footnote: `El enlace vence pronto y solo sirve una vez. ${NOT_YOU} Tu contraseña actual no cambia.`,
  },
  magic_link: {
    subject: "Tu enlace para entrar · Carta al Toque",
    preheader: "Entra a tu panel sin contraseña.",
    title: "Entra a tu panel",
    body: "Toca el botón para entrar a tu cuenta de Carta al Toque.",
    button: "Entrar",
    url: "{{ .ConfirmationURL }}",
    footnote: `El enlace vence pronto y solo sirve una vez. ${NOT_YOU}`,
  },
  email_change: {
    subject: "Confirma tu nuevo correo · Carta al Toque",
    preheader: "Confirma el cambio de correo de tu cuenta.",
    title: "Confirma tu nuevo correo",
    body: "Pediste cambiar el correo de tu cuenta de <b>{{ .Email }}</b> a <b>{{ .NewEmail }}</b>. Confírmalo con el botón.",
    button: "Confirmar cambio",
    url: "{{ .ConfirmationURL }}",
    footnote: NOT_YOU,
  },
  invite: {
    subject: "Te invitaron a Carta al Toque",
    preheader: "Acepta la invitación y entra al panel.",
    title: "Te invitaron a un equipo",
    body: "Te invitaron a ayudar a administrar un menú en Carta al Toque. Acepta la invitación para crear tu acceso.",
    button: "Aceptar invitación",
    url: "{{ .ConfirmationURL }}",
    footnote: NOT_YOU,
  },
};

const dir = join(root, "supabase", "templates");
mkdirSync(dir, { recursive: true });
const config = {};
for (const [key, e] of Object.entries(EMAILS)) {
  const html = layout(e);
  writeFileSync(join(dir, `${key}.html`), html);
  config[`mailer_subjects_${key}`] = e.subject;
  config[`mailer_templates_${key}_content`] = html;
}
console.log(`✓ ${Object.keys(EMAILS).length} plantillas en supabase/templates/`);

if (process.argv.includes("--push")) {
  const env = Object.fromEntries(
    readFileSync(join(root, ".env.deploy.local"), "utf8")
      .split(/\r?\n/)
      .filter((l) => l.includes("=") && !l.startsWith("#"))
      .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
  );
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    console.error("✗", res.status, (await res.text()).slice(0, 400));
    process.exit(1);
  }
  const saved = await res.json();
  console.log("✓ subidas a Supabase:", saved.mailer_subjects_confirmation);
}
