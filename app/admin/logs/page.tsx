import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../../lib/supabase-server'
import { createSupabaseAdminClient } from '../../../lib/supabase-admin'
import { OWNER_EMAIL, isOwnerEmail } from '../../../lib/owner'
import AppHeader from '../../app-header'
import { deleteLog } from '../../history/actions'

export default async function AdminLogsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase
    .from('users')
    .select('name, role')
    .eq('id', user.id)
    .single()
  if (me?.role !== 'admin') redirect('/')

  let query = supabase
    .from('profile_logs')
    .select('id, user_name, target_name, birth_date, gender, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(500)
  if (!isOwnerEmail(user.email)) {
    const admin = createSupabaseAdminClient()
    const { data: owner } = await admin
      .from('users')
      .select('id')
      .eq('email', OWNER_EMAIL)
      .maybeSingle()
    if (owner?.id) query = query.neq('user_id', owner.id)
  }
  const { data: logs } = await query

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <AppHeader userName={me.name} role="admin" active="admin-logs" />
      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-900">全生成ログ</h1>
          <p className="mt-2 text-sm text-zinc-600">全ユーザーの生成履歴（直近 500 件）。</p>
        </header>

        {!logs || logs.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600">
            まだログはありません。
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs text-zinc-600">
                <tr>
                  <th className="px-4 py-2 font-medium">生成日時</th>
                  <th className="px-4 py-2 font-medium">生成者</th>
                  <th className="px-4 py-2 font-medium">対象者</th>
                  <th className="px-4 py-2 font-medium">生年月日</th>
                  <th className="px-4 py-2 font-medium">性別</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-2 text-zinc-700">
                      {new Date(log.created_at).toLocaleString('ja-JP')}
                    </td>
                    <td className="px-4 py-2 text-zinc-700">{log.user_name}</td>
                    <td className="px-4 py-2 font-medium text-zinc-900">{log.target_name}</td>
                    <td className="px-4 py-2 text-zinc-700">{log.birth_date ?? '—'}</td>
                    <td className="px-4 py-2 text-zinc-700">{log.gender}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/history/${log.id}`}
                          className="rounded-md border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
                        >
                          詳細
                        </Link>
                        {isOwnerEmail(user.email) && (
                          <form action={deleteLog}>
                            <input type="hidden" name="id" value={log.id} />
                            <button
                              type="submit"
                              className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-700 hover:bg-red-50"
                            >
                              削除
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
