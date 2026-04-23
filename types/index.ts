export type UserRole = 'admin' | 'sales'

export interface AppUser {
  id: string
  email: string
  name: string
  role: UserRole
  created_at: string
}

export interface ProfileInput {
  surname: string
  given_name: string
  birth_date: string
  gender: '男' | '女'
  birth_date_unknown?: boolean
}

export interface FortuneResult {
  name: string
  gender: string
  seimei: {
    tenku: number
    jinku: number
    chiku: number
    gaikaku: number
    soukaku: number
    shakaiun: number
    kateun: number
  }
  shukuyo: string
  animal: string
  animalFull: string
  hex: string
}

export interface ProfileLog {
  id: string
  user_id: string
  user_name: string
  target_name: string
  birth_date: string
  gender: string
  fortune_result: FortuneResult
  profile_output: string
  created_at: string
}
