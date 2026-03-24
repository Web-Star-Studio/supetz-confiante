import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface AuditEntry {
  action: "create" | "update" | "delete" | "export" | "view" | "send";
  entity_type: string;
  entity_id?: string;
  details?: Record<string, unknown>;
}

export function useAuditLog() {
  const { user } = useAuth();

  const log = useCallback(
    async ({ action, entity_type, entity_id, details }: AuditEntry) => {
      if (!user) return;
      try {
        await supabase.from("audit_logs" as any).insert({
          admin_id: user.id,
          action,
          entity_type,
          entity_id: entity_id || null,
          details: details || {},
        } as any);
      } catch {
        // silent — audit should never block operations
      }
    },
    [user],
  );

  return { log };
}
