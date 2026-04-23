import Link from 'next/link'
import { logout } from './(auth)/login/actions'

export default function AppHeader({
  userName,
  role,
  active,
}: {
  userName: string
  role: 'admin' | 'sales'
  active?: 'generate' | 'history' | 'admin-users' | 'admin-logs'
}) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/"
            className={active === 'generate' ? 'font-medium text-zinc-900' : 'text-zinc-600 hover:text-zinc-900'}
          >
            生成
          </Link>
          <Link
            href="/history"
            className={active === 'history' ? 'font-medium text-zinc-900' : 'text-zinc-600 hover:text-zinc-900'}
          >
            履歴
          </Link>
          {role === 'admin' && (
            <>
              <Link
                href="/admin/users"
                className={active === 'admin-users' ? 'font-medium text-zinc-900' : 'text-zinc-600 hover:text-zinc-900'}
              >
                ユーザー管理
              </Link>
              <Link
                href="/admin/logs"
                className={active === 'admin-logs' ? 'font-medium text-zinc-900' : 'text-zinc-600 hover:text-zinc-900'}
              >
                全ログ
              </Link>
            </>
          )}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-zinc-600">
            {userName} <span className="text-zinc-400">（{role === 'admin' ? '管理者' : '営業'}）</span>
          </span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
            >
              ログアウト
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
