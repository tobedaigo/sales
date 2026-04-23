import { isOwnerEmail } from '../../../lib/owner'
import { deleteUser, updateUserRole } from './actions'

type User = {
  id: string
  email: string
  name: string
  role: string
  created_at: string
}

export default function UserRow({ user, isSelf }: { user: User; isSelf: boolean }) {
  const owner = isOwnerEmail(user.email)
  const locked = owner || isSelf

  return (
    <tr className="border-b border-zinc-100 last:border-0">
      <td className="px-4 py-2 font-medium text-zinc-900">
        {user.name}
        {owner && <span className="ml-2 rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-normal text-white">所有者</span>}
      </td>
      <td className="px-4 py-2 text-zinc-700">{user.email}</td>
      <td className="px-4 py-2 text-zinc-700">
        <form action={updateUserRole} className="flex items-center gap-2">
          <input type="hidden" name="id" value={user.id} />
          <select
            name="role"
            defaultValue={user.role}
            disabled={locked}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs disabled:bg-zinc-100 disabled:text-zinc-400"
          >
            <option value="sales">営業</option>
            <option value="admin">管理者</option>
          </select>
          {!locked && (
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
            >
              変更
            </button>
          )}
        </form>
      </td>
      <td className="px-4 py-2 text-zinc-700">
        {new Date(user.created_at).toLocaleString('ja-JP')}
      </td>
      <td className="px-4 py-2 text-right">
        {owner ? (
          <span className="text-xs text-zinc-400">保護</span>
        ) : isSelf ? (
          <span className="text-xs text-zinc-400">自分</span>
        ) : (
          <form action={deleteUser}>
            <input type="hidden" name="id" value={user.id} />
            <button
              type="submit"
              className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-700 hover:bg-red-50"
            >
              削除
            </button>
          </form>
        )}
      </td>
    </tr>
  )
}
