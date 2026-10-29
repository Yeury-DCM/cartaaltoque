import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, Section } from "@/components/LegalPage";
import { APP_NAME, CONTACT_EMAIL } from "@/lib/brand";

export const Route = createFileRoute("/privacidad")({
  head: () => ({
    meta: [
      { title: `Política de privacidad — ${APP_NAME}` },
      {
        name: "description",
        content: `Cómo ${APP_NAME} trata los datos de los restaurantes y de sus clientes.`,
      },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <LegalPage title="Política de privacidad" updated="29 de octubre de 2026">
      <p>
        {APP_NAME} es una plataforma que permite a restaurantes y negocios de comida publicar su
        menú digital y recibir pedidos por WhatsApp. Esta política explica qué datos tratamos, para
        qué y con quién los compartimos.
      </p>

      <Section title="Quién es quién">
        <p>
          <strong>Los negocios</strong> (restaurantes, cafeterías, etc.) crean una cuenta para
          administrar su menú. <strong>Sus clientes</strong> usan el menú público para armar un
          pedido. Para los datos de los pedidos, el negocio es quien decide qué hacer con ellos;
          nosotros los guardamos y procesamos por cuenta suya.
        </p>
      </Section>

      <Section title="Datos de los negocios (usuarios de la plataforma)">
        <ul>
          <li>
            <strong>Cuenta:</strong> correo electrónico y contraseña. Si entras con Google,
            recibimos tu correo y tu nombre; nunca vemos tu contraseña de Google.
          </li>
          <li>
            <strong>Contenido del negocio:</strong> nombre, logo, portada, color, horario,
            dirección, WhatsApp, enlaces, platos, fotos, precios y zonas de entrega.
          </li>
          <li>
            <strong>Uso:</strong> cantidad de visitas al menú por día (sin identificar a quien
            visita) y pedidos enviados.
          </li>
        </ul>
      </Section>

      <Section title="Datos de los clientes del negocio">
        <p>Cuando un cliente envía un pedido desde un menú, guardamos:</p>
        <ul>
          <li>los platos, cantidades, notas y el total;</li>
          <li>si es para recoger o delivery, la zona y, si lo escribió, la dirección;</li>
          <li>el nombre, si lo escribió (es opcional).</li>
        </ul>
        <p>
          El cliente no crea cuenta. Tampoco usamos cookies de publicidad ni rastreamos a los
          visitantes entre sitios. El navegador del cliente guarda localmente su carrito y, para
          comodidad, su nombre y dirección; puede borrarlos limpiando los datos del sitio.
        </p>
        <p>
          El pedido se abre en WhatsApp con el texto ya escrito. Desde ahí la conversación ocurre en
          WhatsApp y se rige por las políticas de WhatsApp, no por esta.
        </p>
      </Section>

      <Section title="Para qué usamos los datos">
        <ul>
          <li>Mostrar el menú público y permitir enviar pedidos.</li>
          <li>
            Administrar tu cuenta y tu panel, y enviarte correos del servicio (confirmación,
            recuperar contraseña).
          </li>
          <li>Mostrar al negocio sus estadísticas (visitas y pedidos).</li>
          <li>Mantener la seguridad y prevenir abusos.</li>
        </ul>
        <p>No vendemos datos personales ni los usamos para publicidad.</p>
      </Section>

      <Section title="Con quién los compartimos">
        <p>Usamos proveedores que tratan datos para operar el servicio:</p>
        <ul>
          <li>
            <strong>Supabase</strong> — base de datos, cuentas y almacenamiento de imágenes.
          </li>
          <li>
            <strong>Cloudflare</strong> — alojamiento y entrega del sitio.
          </li>
          <li>
            <strong>Resend</strong> — envío de correos del servicio.
          </li>
          <li>
            <strong>Google</strong> — solo si eliges entrar con Google.
          </li>
        </ul>
        <p>
          Cada negocio solo puede ver los datos de su propio restaurante; esa separación está
          aplicada en la base de datos.
        </p>
      </Section>

      <Section title="Cuánto tiempo los conservamos">
        <p>
          Conservamos los datos mientras la cuenta esté activa. Si cierras tu cuenta, o nos lo
          pides, eliminamos tu restaurante y sus datos, salvo lo que debamos conservar por
          obligación legal.
        </p>
      </Section>

      <Section title="Tus derechos">
        <p>
          Puedes pedir acceso, corrección o eliminación de tus datos, y retirar tu consentimiento,
          escribiendo a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Si eres cliente de
          un negocio y quieres que borren tu pedido, también puedes pedírselo directamente al
          negocio. Atendemos estas solicitudes conforme a la normativa dominicana de protección de
          datos personales (Ley 172-13).
        </p>
      </Section>

      <Section title="Cambios y contacto">
        <p>
          Si cambiamos esta política, publicaremos la nueva versión aquí con su fecha. Para
          cualquier duda: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </Section>
    </LegalPage>
  );
}
