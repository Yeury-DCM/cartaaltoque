import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, Section } from "@/components/LegalPage";
import { APP_NAME, CONTACT_EMAIL, TRIAL_DAYS } from "@/lib/brand";

export const Route = createFileRoute("/terminos")({
  head: () => ({
    meta: [
      { title: `Términos del servicio — ${APP_NAME}` },
      { name: "description", content: `Condiciones de uso de ${APP_NAME}.` },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <LegalPage title="Términos del servicio" updated="29 de octubre de 2026">
      <p>
        Al crear una cuenta o usar {APP_NAME} aceptas estos términos. Si no estás de acuerdo, no
        uses el servicio.
      </p>

      <Section title="Qué es el servicio">
        <p>
          {APP_NAME} permite a un negocio de comida publicar un menú digital con un código QR y
          recibir pedidos armados por WhatsApp. No procesamos pagos, no entregamos pedidos ni somos
          parte de la venta entre el negocio y su cliente.
        </p>
      </Section>

      <Section title="Tu cuenta">
        <ul>
          <li>
            Debes dar información verdadera y mantener segura tu contraseña o tu cuenta de Google.
          </li>
          <li>Eres responsable de lo que ocurra desde tu cuenta.</li>
          <li>
            Una cuenta corresponde a un negocio. Debes tener derecho a usar el nombre, logo y fotos
            que publiques.
          </li>
        </ul>
      </Section>

      <Section title="Prueba gratis y planes">
        <p>
          Empiezas con {TRIAL_DAYS} días de prueba. Al terminar, tu menú se pausa hasta que actives
          un plan; tus datos se conservan. Los precios y condiciones de los planes se informarán
          antes de cobrar y podrán cambiar con aviso previo.
        </p>
      </Section>

      <Section title="Uso aceptable">
        <p>No puedes usar el servicio para:</p>
        <ul>
          <li>
            publicar contenido ilegal, engañoso, ofensivo o que infrinja derechos de terceros;
          </li>
          <li>vender productos prohibidos o regulados sin la autorización correspondiente;</li>
          <li>
            enviar spam, intentar acceder a datos de otros negocios o interferir con el servicio.
          </li>
        </ul>
        <p>Podemos suspender o eliminar cuentas que incumplan estas reglas.</p>
      </Section>

      <Section title="Tu contenido">
        <p>
          El contenido que subes sigue siendo tuyo. Nos autorizas a almacenarlo y mostrarlo para
          prestar el servicio (por ejemplo, en tu menú público).
        </p>
      </Section>

      <Section title="Pedidos y responsabilidad del negocio">
        <p>
          El negocio es responsable de la exactitud de su menú y precios, de atender los pedidos que
          recibe por WhatsApp, de la calidad y entrega de sus productos y de cumplir las normas
          fiscales y sanitarias que le apliquen. El total que ve el cliente es una referencia; el
          negocio lo confirma por el chat.
        </p>
      </Section>

      <Section title="Disponibilidad y límites">
        <p>
          Hacemos lo posible por mantener el servicio disponible, pero se ofrece “tal cual”, sin
          garantía de funcionamiento ininterrumpido. En la medida permitida por la ley, no somos
          responsables de pérdidas indirectas, como ventas no realizadas por una interrupción.
        </p>
      </Section>

      <Section title="Terminar el servicio">
        <p>
          Puedes dejar de usar el servicio y pedir la eliminación de tu cuenta cuando quieras.
          También podemos suspenderlo por incumplimiento de estos términos.
        </p>
      </Section>

      <Section title="Cambios y contacto">
        <p>
          Podemos actualizar estos términos y publicaremos la nueva versión aquí. Si sigues usando
          el servicio después del cambio, lo aceptas. Dudas:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </Section>
    </LegalPage>
  );
}
