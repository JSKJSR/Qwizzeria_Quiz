import { getSupabase } from './index.js';

/**
 * Log an admin action to the audit log table.
 * Fire-and-forget — never throws or blocks the caller.
 *
 * @param {object} params
 * @param {string} params.action - e.g. 'create_question', 'update_pack'
 * @param {string} params.tableName - e.g. 'questions_master', 'quiz_packs'
 * @param {string|null} [params.recordId] - PK of affected record (null for bulk ops)
 * @param {object|null} [params.payload] - mutation data
 */
export async function logAdminAction({ action, tableName, recordId = null, payload = null }) {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('admin_audit_log').insert({
      user_id: user.id,
      action,
      table_name: tableName,
      record_id: recordId ? String(recordId) : null,
      payload,
    });
  } catch {
    // Silent — audit logging must never block the primary operation
  }
}
