import LoginForm from './login-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 px-4 py-10">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-zinc-900">ログイン</h1>
        <p className="mb-6 text-sm text-zinc-600">営業プロファイリングツール</p>
        <LoginForm next={next ?? '/'} />
      </div>
    </div>
  )
}
