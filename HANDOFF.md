# 営業用プロファイリングツール — Claude Code 引き継ぎ指示書

## プロダクト概要
営業担当者が顧客の名前・生年月日を入力すると、
占いロジックを使ってプロファイルを自動生成するWebツール。
- ロジックはサーバー側に閉じており、ユーザーには結果のみ表示
- 誰が・いつ・誰のプロファイルを生成したかログで管理
- アカウント管理（adminがsalesアカウントを発行）

---

## フォルダ構成（現在の状態）

```
profiling-tool/
├── .env.local.example      ✅ 環境変数テンプレート
├── schema.sql              ✅ SupabaseのDBスキーマ（Phase2で使う）
├── package.json            ✅ Next.js + Supabase + Anthropic SDK インストール済み
├── types/index.ts          ✅ 全型定義
├── lib/
│   ├── fortune.ts          ✅ 占い計算エンジン（移植済み・触らない）
│   ├── prompt.ts           ✅ 営業用プロファイリングプロンプト（触らない）
│   └── supabase.ts         ✅ Supabaseクライアント（Phase2で使う）
└── app/api/profile/route.ts ✅ メインAPI（Phase2で認証追加）
```

---

## 開発フェーズ

### Phase 1（最初に作る・Supabaseなし）
コア機能だけ動かす。認証・ログは後回し。

**目標：** `npm run dev` で起動し、名前＋生年月日を入れるとプロファイルが出てくる

実装するもの：
1. `.env.local` に `ANTHROPIC_API_KEY` だけ設定すれば動く状態にする
2. `app/api/profile/route.ts` — 認証チェックをスキップしたシンプル版に修正
3. `app/page.tsx` — 入力フォーム（苗字・名前・生年月日・性別）
4. プロファイル結果の表示（プレーンテキスト、コードブロック風）

**Phase 1 で触るファイル：**
- `app/api/profile/route.ts`（認証部分をコメントアウト）
- `app/page.tsx`（入力フォーム＋結果表示）
- `.env.local`（ANTHROPIC_API_KEY のみ）

### Phase 2（Supabaseを追加）
Phase 1が動いてから実装する。

実装するもの：
1. Supabase プロジェクト作成 → `schema.sql` を実行
2. `.env.local` に Supabase の環境変数を追加
3. ログイン画面（メール＋パスワード）
4. `route.ts` に認証チェック・ログ保存を追加
5. 過去の生成履歴一覧
6. 管理者画面（全ログ閲覧・アカウント発行）

---

## Phase 1 の実装詳細

### app/api/profile/route.ts（シンプル版）
認証なし・ログなしで動く最小構成にする：

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { calcAllFortune } from '../../../lib/fortune'
import { SYSTEM_PROMPT, buildUserMessage } from '../../../lib/prompt'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  const { surname, given_name, birth_date, gender } = await req.json()
  const [year, month, day] = birth_date.split('-').map(Number)
  const fortune = calcAllFortune(surname, given_name, year, month, day, gender)
  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserMessage(fortune) }],
  })
  const profile = (message.content[0] as { text: string }).text
  return NextResponse.json({ profile })
}
```

### app/page.tsx（入力フォーム＋結果表示）
- 苗字・名前・生年月日・性別（男/女）の入力フォーム
- 送信ボタン → POST /api/profile
- ローディング中はスピナー表示
- 結果はプレーンテキストをそのまま表示（白背景・等幅フォント）
- スマホ対応（Tailwind）

### デザイン方針
- シンプル・プロフェッショナル（占い感を出さない）
- 白ベース・清潔感のあるデザイン
- スマホで使いやすいフォームサイズ

---

## 環境変数（Phase 1）

`.env.local.example` を `.env.local` にコピーして、
`ANTHROPIC_API_KEY` だけ設定すれば Phase 1 は動く。

```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
```

---

## 注意事項
- `lib/fortune.ts` と `lib/prompt.ts` は **絶対に触らない**
- `fortune.ts` はサーバー側（API Route）のみで使用。クライアントに送らない
- プロファイル結果に占術名・格の数字が出ないのは正しい動作（プロンプトで制御済み）
- `calcAllFortune` の戻り値の `animalFull` は「〇〇色の〇〇」形式になる
