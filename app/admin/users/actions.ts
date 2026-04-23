'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '../../../lib/supabase-server'
import { createSupabaseAdminClient } from '../../../lib/supabase-admin'
import { isOwnerEmail } from '../../../lib/owner'

async function ensureAdmin() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('認証が必要です')
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') throw new Error('管理者権限が必要です')
}

export type CreateUserState = { ok?: boolean; error?: string } | undefined

export async function createUser(
  _prev: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  try {
    await ensureAdmin()
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')
    const name = String(formData.get('name') ?? '').trim()
    const role = String(formData.get('role') ?? 'sales')

    if (!email || !password || !name) {
      return { error: 'メール・パスワード・氏名すべて必須です' }
    }
    if (password.length < 8) {
      return { error: 'パスワードは 8 文字以上にしてください' }
    }
    if (role !== 'admin' && role !== 'sales') {
      return { error: '権限の指定が不正です' }
    }

    const admin = createSupabaseAdminClient()
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    })
    if (error) return { error: `作成に失敗しました: ${error.message}` }

    revalidatePath('/admin/users')
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : '不明なエラー'
    return { error: msg }
  }
}

export async function deleteUser(formData: FormData) {
  await ensureAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) return
  const admin = createSupabaseAdminClient()
  const { data: target } = await admin.from('users').select('email').eq('id', id).maybeSingle()
  if (isOwnerEmail(target?.email)) {
    throw new Error('このアカウントは保護されているため削除できません')
  }
  await admin.auth.admin.deleteUser(id)
  revalidatePath('/admin/users')
}

export async function updateUserRole(formData: FormData) {
  await ensureAdmin()
  const id = String(formData.get('id') ?? '')
  const role = String(formData.get('role') ?? '')
  if (!id || (role !== 'admin' && role !== 'sales')) return
  const admin = createSupabaseAdminClient()
  const { data: target } = await admin.from('users').select('email').eq('id', id).maybeSingle()
  if (isOwnerEmail(target?.email)) {
    throw new Error('このアカウントは保護されているため変更できません')
  }
  await admin.from('users').update({ role }).eq('id', id)
  revalidatePath('/admin/users')
}
