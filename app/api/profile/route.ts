import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { calcAllFortune } from '../../../lib/fortune'
import { SYSTEM_PROMPT, buildUserMessage } from '../../../lib/prompt'
import { createSupabaseServerClient } from '../../../lib/supabase-server'
import type { ProfileInput, FortuneResult } from '../../../types'

const apiKey = process.env.ANTHROPIC_API_KEY
const isMock = !apiKey || apiKey === 'sk-ant-xxxxxxxxxxxxxxxx'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const body: ProfileInput = await req.json()
    const { surname, given_name, birth_date, gender, birth_date_unknown } = body

    if (!surname || !given_name || !gender) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 })
    }
    if (!birth_date_unknown && !birth_date) {
      return NextResponse.json({ error: '生年月日を入力してください' }, { status: 400 })
    }

    const [year, month, day] = birth_date_unknown
      ? [2000, 1, 1]
      : birth_date.split('-').map(Number)
    const fortune = calcAllFortune(surname, given_name, year, month, day, gender)

    if (birth_date_unknown) {
      fortune.shukuyo = '不明'
      fortune.animal = '不明'
      fortune.animalFull = '不明'
      fortune.hex = '不明'
    }

    const profileOutput = isMock
      ? buildMockProfile(fortune)
      : await callAnthropic(fortune)

    const { data: userRow } = await supabase
      .from('users')
      .select('name')
      .eq('id', user.id)
      .single()

    await supabase.from('profile_logs').insert({
      user_id: user.id,
      user_name: userRow?.name ?? user.email ?? '',
      target_name: fortune.name,
      birth_date: birth_date_unknown ? null : birth_date,
      gender,
      fortune_result: fortune,
      profile_output: profileOutput,
    })

    return NextResponse.json({ profile: profileOutput })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

async function callAnthropic(fortune: FortuneResult): Promise<string> {
  const anthropic = new Anthropic({ apiKey })
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserMessage(fortune) }],
  })
  return (message.content[0] as { type: string; text: string }).text
}

function buildMockProfile(fortune: FortuneResult): string {
  const s = fortune.seimei
  return `[MOCKモード — ANTHROPIC_API_KEY 未設定のため、サンプル応答を返しています]

【基本情報】
氏名：${fortune.name} さん（${fortune.gender}）

1. この人物の基本傾向
主な特徴：誠実・分析的・慎重
詳細解説：落ち着いた判断力と、物事を多角的に見る視点を持つタイプ。派手さより堅実さを重視し、長期的な関係性の中で真価を発揮します。

10. まとめ
このタイプは、誠実さと継続性を何より重視する顧客です。

---
[デバッグ情報]
天格:${s.tenku} 人格:${s.jinku} 地格:${s.chiku} 総画:${s.soukaku} 外格:${s.gaikaku} 社会運:${s.shakaiun} 家庭運:${s.kateun}
宿曜:${fortune.shukuyo} / 動物:${fortune.animalFull} / 易:${fortune.hex}
`
}
