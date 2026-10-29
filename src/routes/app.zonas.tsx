import { createFileRoute } from "@tanstack/react-router";
import { ZoneManager } from "@/components/admin/ZoneManager";

export const Route = createFileRoute("/app/zonas")({ component: ZoneManager });
