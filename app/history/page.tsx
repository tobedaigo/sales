import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../lib/supabase-server'
import { isOwnerEmail } from '../../lib/owner'
import AppHeader from '../app-header'
import { deleteLog } from './actions'

export default async function HistoryPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, role')
    .eq('id', user.id)
    .single()

  const { data: logs } = await supabase
    .from('profile_logs')
    .select('id, target_name, birth_date, gender, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <AppHeader
        userName={profile?.name ?? user.email ?? ''}
        role={(profile?.role as 'admin' | 'sales') ?? 'sales'}
        active="history"
      />
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-900">生成履歴</h1>
          <p className="mt-2 text-sm text-zinc-600">自分が生成したプロファイルの一覧です。</p>
        </header>

        {!logs || logs.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600">
            まだ生成履歴はありません。
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs text-zinc-600">
                <tr>
                  <th className="px-4 py-2 font-medium">生成日時</th>
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
