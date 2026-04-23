'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../lib/supabase-server'
import { createSupabaseAdminClient } from '../../lib/supabase-admin'
import { isOwnerEmail } from '../../lib/owner'

async function ensureOwner() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isOwnerEmail(user?.email)) {
    throw new Error('所有者のみ削除できます')
  }
}

export async function deleteLog(formData: FormData) {
  await ensureOwner()
  const id = String(formData.get('id') ?? '')
  if (!id) return
  const admin = createSupabaseAdminClient()
  await admin.from('profile_logs').delete().eq('id', id)
  revalidatePath('/history')
  revalidatePath('/admin/logs')
}

export async function deleteLogAndRedirect(formData: FormData) {
  await ensureOwner()
  const id = String(formData.get('id') ?? '')
  const back = String(formData.get('back') ?? '/history')
  if (id) {
    const admin = createSupabaseAdminClient()
    await admin.from('profile_logs').delete().eq('id', id)
  }
  revalidatePath('/history')
  revalidatePath('/admin/logs')
  redirect(back)
}
