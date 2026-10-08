import type { DayHours, OpeningHours } from './types'

export function dailyHours(open: string, close: string, closedDays: number[] = []): OpeningHours {
  const days: (keyof OpeningHours)[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  const entry: Partial<OpeningHours> = {}
  days.forEach((day, i) => {
    const h: DayHours = closedDays.includes(i) ? { open, close, closed: true } : { open, close }
    entry[day] = h
  })
  return entry as OpeningHours
}

export function isOpenNow(hours: OpeningHours): boolean {
  const now = new Date()
  const dayIndex = (now.getDay() + 6) % 7 // Monday = 0
  const days: (keyof OpeningHours)[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  const today = hours[days[dayIndex]]
  if (today.closed) return false
  const [openH, openM] = today.open.split(':').map(Number)
  const [closeH, closeM] = today.close.split(':').map(Number)
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const openMinutes = openH * 60 + openM
  let closeMinutes = closeH * 60 + closeM
  if (closeMinutes <= openMinutes) closeMinutes += 24 * 60
  return nowMinutes >= openMinutes && nowMinutes <= closeMinutes
}

export function todayHoursLabel(hours: OpeningHours): DayHours {
  const now = new Date()
  const dayIndex = (now.getDay() + 6) % 7
  const days: (keyof OpeningHours)[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  return hours[days[dayIndex]]
}
