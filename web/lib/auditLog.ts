/**
 * Audit logging helper for admin actions
 */

import { createServiceClient } from './supabase/server';
import { logger } from './logger';

export interface AuditLogEntry {
  actor_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details?: Record<string, unknown>;
}

export async function logAuditAction(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        actor_id: entry.actor_id,
        action: entry.action,
        resource_type: entry.resource_type,
        resource_id: entry.resource_id,
        details: entry.details || {},
      });

    if (error) {
      logger.error('Failed to write audit log', { error, entry });
    }
  } catch (err) {
    logger.error('Exception writing audit log', { err, entry });
  }
}
