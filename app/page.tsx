import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../lib/supabase-server'
import AppHeader from './app-header'
import ProfileForm from './profile-form'

export default async function Home() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, role')
    .eq('id', user.id)
    .single()

  const userName = profile?.name ?? user.email ?? ''
  const role = (profile?.role as 'admin' | 'sales') ?? 'sales'

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <AppHeader userName={userName} role={role} active="generate" />
      <main className="mx-auto w-full max-w-2xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900">営業プロファイリング</h1>
          <p className="mt-2 text-sm text-zinc-600">
            顧客の氏名と生年月日を入力すると、プロファイルを生成します。
          </p>
        </header>
        <ProfileForm />
      </main>
    </div>
  )
}
