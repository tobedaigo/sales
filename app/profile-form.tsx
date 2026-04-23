'use client'

import { useState, useMemo, FormEvent } from 'react'
import type { ProfileInput } from '../types'

function stripCodeFence(text: string): string {
  return text.replace(/^\s*```[^\n]*\n?/, '').replace(/\n?```\s*$/, '').trim()
}

const ERAS: { pattern: RegExp; base: number }[] = [
  { pattern: /^(明治|[Mm])/, base: 1867 },
  { pattern: /^(大正|[Tt])/, base: 1911 },
  { pattern: /^(昭和|[Ss])/, base: 1925 },
  { pattern: /^(平成|[Hh])/, base: 1988 },
  { pattern: /^(令和|[Rr])/, base: 2018 },
]

function parseBirthDate(raw: string): string | null {
  const s = raw.replace(/[\s　]/g, '')
  if (!s) return null

  const compact = s.match(/^(\d{4})(\d{2})(\d{2})$/)
  if (compact) return normalizeYMD(+compact[1], +compact[2], +compact[3])

  let rest = s
  let year: number | null = null

  for (const e of ERAS) {
    const m = rest.match(e.pattern)
    if (m) {
      rest = rest.slice(m[0].length)
      const yMatch = rest.match(/^(元|\d{1,2})/)
      if (!yMatch) return null
      const y = yMatch[1] === '元' ? 1 : parseInt(yMatch[1], 10)
      year = e.base + y
      rest = rest.slice(yMatch[0].length)
      break
    }
  }

  if (year === null) {
    const m = rest.match(/^(\d{4})/)
    if (!m) return null
    year = parseInt(m[1], 10)
    rest = rest.slice(m[0].length)
  }

  rest = rest.replace(/^[年\-./]/, '')
  const mMatch = rest.match(/^(\d{1,2})/)
  if (!mMatch) return null
  const month = parseInt(mMatch[1], 10)
  rest = rest.slice(mMatch[0].length).replace(/^[月\-./]/, '')
  const dMatch = rest.match(/^(\d{1,2})/)
  if (!dMatch) return null
  const day = parseInt(dMatch[1], 10)
  rest = rest.slice(dMatch[0].length).replace(/^日?/, '')

  if (rest.length > 0) return null
  return normalizeYMD(year, month, day)
}

function normalizeYMD(y: number, m: number, d: number): string | null {
  if (y < 1868 || y > 2100) return null
  if (m < 1 || m > 12) return null
  const lastDay = new Date(y, m, 0).getDate()
  if (d < 1 || d > lastDay) return null
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function ProfileForm() {
  const [form, setForm] = useState<ProfileInput>({
    surname: '',
    given_name: '',
    birth_date: '',
    gender: '男',
    birth_date_unknown: false,
  })
  const [birthInput, setBirthInput] = useState<string>('')
  const [profile, setProfile] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const parsedBirth = useMemo(() => parseBirthDate(birthInput), [birthInput])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setProfile('')

    if (!form.surname.trim()) {
      setError('苗字を入力してください')
      return
    }
    if (!form.given_name.trim()) {
      setError('名前を入力してください')
      return
    }
    if (!form.birth_date_unknown) {
      if (!birthInput.trim()) {
        setError('生年月日を入力してください（不明な場合はチェックボックスを入れてください）')
        return
      }
      if (!parsedBirth) {
        setError('生年月日の形式を認識できません。例: 1990/5/15、昭和56年1月2日、s56/1/2')
        return
      }
    }

    setLoading(true)
    try {
      const payload = { ...form, birth_date: parsedBirth ?? '' }
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '生成に失敗しました')
      } else {
        setProfile(data.profile ?? '')
      }
    } catch {
      setError('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  function update<K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <>
      <form
        onSubmit={onSubmit}
        className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700">苗字</span>
            <input
              type="text"
              value={form.surname}
              onChange={(e) => update('surname', e.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 text-base text-zinc-900 outline-none focus:border-zinc-900"
              placeholder="山田"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700">名前</span>
            <input
              type="text"
              value={form.given_name}
              onChange={(e) => update('given_name', e.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 text-base text-zinc-900 outline-none focus:border-zinc-900"
              placeholder="太郎"
            />
          </label>
          <div className="flex flex-col gap-1">
            <label htmlFor="birth-input" className="text-sm font-medium text-zinc-700">生年月日</label>
            <input
              id="birth-input"
              type="text"
              inputMode="text"
              placeholder="1990/5/15、昭和56年1月2日、s56/1/2 など"
              disabled={form.birth_date_unknown}
              value={birthInput}
              onChange={(e) => setBirthInput(e.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 text-base text-zinc-900 outline-none focus:border-zinc-900 disabled:bg-zinc-100 disabled:text-zinc-400"
            />
            {!form.birth_date_unknown && birthInput && (
              <p className={`text-xs ${parsedBirth ? 'text-emerald-600' : 'text-red-600'}`}>
                {parsedBirth ? `→ ${parsedBirth}` : '形式を認識できません'}
              </p>
            )}
            <label className="mt-1 flex cursor-pointer items-center gap-2 text-sm text-zinc-600">
              <input
                type="checkbox"
                checked={form.birth_date_unknown ?? false}
                onChange={(e) => update('birth_date_unknown', e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
              />
              生年月日不明（姓名判断のみで生成）
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700">性別</span>
            <select
              required
              value={form.gender}
              onChange={(e) => update('gender', e.target.value as '男' | '女')}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 outline-none focus:border-zinc-900"
            >
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-md bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {loading ? '生成中…' : 'プロファイルを生成'}
        </button>
      </form>

      {loading && (
        <div className="mt-6 flex items-center gap-3 rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
          プロファイルを生成しています…
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {profile && (
        <section className="mt-6 rounded-lg border border-zinc-200 bg-white shadow-sm">
          <h2 className="border-b border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700">
            生成結果
          </h2>
          <pre className="whitespace-pre-wrap break-words px-4 py-4 font-mono text-sm leading-6 text-zinc-900">
            {`営業プロファイル\n\n${stripCodeFence(profile)}`}
          </pre>
        </section>
      )}
    </>
  )
}
