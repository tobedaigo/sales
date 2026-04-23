import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../../lib/supabase-server'
import { createSupabaseAdminClient } from '../../../lib/supabase-admin'
import { OWNER_EMAIL, isOwnerEmail } from '../../../lib/owner'
import AppHeader from '../../app-header'
import { deleteLogAndRedirect } from '../actions'

function stripCodeFence(text: string): string {
  return text.replace(/^\s*```[^\n]*\n?/, '').replace(/\n?```\s*$/, '').trim()
}

export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, role')
    .eq('id', user.id)
    .single()

  const { data: log } = await supabase
    .from('profile_logs')
    .select('id, user_id, user_name, target_name, birth_date, gender, profile_output, created_at')
    .eq('id', id)
    .single()

  if (!log) notFound()

  if (!isOwnerEmail(user.email)) {
    const admin = createSupabaseAdminClient()
    const { data: owner } = await admin
      .from('users')
      .select('id')
      .eq('email', OWNER_EMAIL)
      .maybeSingle()
    if (owner?.id && log.user_id === owner.id) notFound()
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <AppHeader
        userName={profile?.name ?? user.email ?? ''}
        role={(profile?.role as 'admin' | 'sales') ?? 'sales'}
        active="history"
      />
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="flex items-center justify-between">
          <Link
            href="/history"
            className="text-sm text-zinc-600 hover:text-zinc-900"
          >
            ← 履歴一覧に戻る
          </Link>
          {isOwnerEmail(user.email) && (
            <form action={deleteLogAndRedirect}>
              <input type="hidden" name="id" value={log.id} />
              <input type="hidden" name="back" value="/history" />
              <button
                type="submit"
                className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-700 hover:bg-red-50"
              >
                このログを削除
              </button>
            </form>
          )}
        </div>
        <header className="mt-3 mb-6">
          <h1 className="text-2xl font-semibold text-zinc-900">{log.target_name}</h1>
          <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-zinc-600">
            <div><dt className="inline text-zinc-500">生成日時:</dt> <dd className="inline">{new Date(log.created_at).toLocaleString('ja-JP')}</dd></div>
            <div><dt className="inline text-zinc-500">生年月日:</dt> <dd className="inline">{log.birth_date ?? '不明'}</dd></div>
            <div><dt className="inline text-zinc-500">性別:</dt> <dd className="inline">{log.gender}</dd></div>
            <div><dt className="inline text-zinc-500">生成者:</dt> <dd className="inline">{log.user_name}</dd></div>
          </dl>
        </header>

        <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
          <h2 className="border-b border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700">
            生成結果
          </h2>
          <pre className="whitespace-pre-wrap break-words px-4 py-4 font-mono text-sm leading-6 text-zinc-900">
            {`営業プロファイル\n\n${stripCodeFence(log.profile_output)}`}
          </pre>
        </section>
      </main>
    </div>
  )
}
