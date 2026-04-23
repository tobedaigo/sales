import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../../lib/supabase-server'
import { createSupabaseAdminClient } from '../../../lib/supabase-admin'
import { OWNER_EMAIL, isOwnerEmail } from '../../../lib/owner'
import AppHeader from '../../app-header'
import CreateUserForm from './create-user-form'
import UserRow from './user-row'

export default async function AdminUsersPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase
    .from('users')
    .select('name, role')
    .eq('id', user.id)
    .single()
  if (me?.role !== 'admin') redirect('/')

  const viewerIsOwner = isOwnerEmail(user.email)
  const admin = createSupabaseAdminClient()
  let query = admin
    .from('users')
    .select('id, email, name, role, created_at')
    .order('created_at', { ascending: true })
  if (!viewerIsOwner) query = query.neq('email', OWNER_EMAIL)
  const { data: users } = await query

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <AppHeader userName={me.name} role="admin" active="admin-users" />
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-900">ユーザー管理</h1>
          <p className="mt-2 text-sm text-zinc-600">アカウントの発行・権限変更・削除ができます。</p>
        </header>

        <section className="mb-8 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-medium text-zinc-700">新規ユーザー発行</h2>
          <CreateUserForm />
        </section>

        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs text-zinc-600">
              <tr>
                <th className="px-4 py-2 font-medium">氏名</th>
                <th className="px-4 py-2 font-medium">メール</th>
                <th className="px-4 py-2 font-medium">権限</th>
                <th className="px-4 py-2 font-medium">作成日時</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {(users ?? []).map((u) => (
                <UserRow key={u.id} user={u} isSelf={u.id === user.id} />
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  )
}
