'use client'

import { useActionState, useEffect, useRef } from 'react'
import { createUser, type CreateUserState } from './actions'

export default function CreateUserForm() {
  const [state, action, pending] = useActionState<CreateUserState, FormData>(createUser, undefined)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.ok) formRef.current?.reset()
  }, [state])

  return (
    <form ref={formRef} action={action} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-zinc-700">氏名</span>
        <input
          name="name"
          type="text"
          required
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-zinc-700">メールアドレス</span>
        <input
          name="email"
          type="email"
          required
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-zinc-700">初期パスワード（8文字以上）</span>
        <input
          name="password"
          type="text"
          minLength={8}
          required
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-zinc-700">権限</span>
        <select
          name="role"
          defaultValue="sales"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900"
        >
          <option value="sales">営業</option>
          <option value="admin">管理者</option>
        </select>
      </label>

      <div className="sm:col-span-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {pending ? '作成中…' : 'アカウント発行'}
        </button>
        {state?.ok && (
          <span className="text-sm text-emerald-700">発行しました</span>
        )}
        {state?.error && (
          <span className="text-sm text-red-700">{state.error}</span>
        )}
      </div>
    </form>
  )
}
