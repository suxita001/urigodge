import { Crown, KeyRound, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useSeo } from '../../hooks/useSeo'
import { SUPER_ADMIN_EMAIL } from '../../utils/roles'
import { usingEmulators } from '../../lib/firebase'
import { Card, PageHeader, StatusBadge } from '../../components/admin/AdminUI'

export default function Settings() {
  useSeo('პარამეტრები | მართვის პანელი')
  const { isSuperAdmin, currentUser, emailVerified } = useAuth()
  return (
    <div>
      <PageHeader title="პარამეტრები" description={isSuperAdmin ? 'სისტემის პარამეტრები.' : 'სისტემის პარამეტრებს ცვლის მხოლოდ Super Admin.'} />

      <div className="grid lg:grid-cols-2 gap-4 md:gap-5">
        <Card className="p-5 md:p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-10 rounded-xl bg-ink text-cream flex items-center justify-center">
              <ShieldCheck size={19} />
            </span>
            <h2 className="text-[16px] font-extrabold text-ink">უსაფრთხოება</h2>
          </div>
          <dl className="grid sm:grid-cols-2 gap-3 text-[13.5px]">
            <div className="rounded-xl border border-border p-3.5">
              <dt className="text-ink-faint font-semibold flex items-center gap-1.5">
                <Crown size={13} /> Super Admin
              </dt>
              <dd className="mt-1 font-bold text-ink break-all">{SUPER_ADMIN_EMAIL}</dd>
              <dd className="mt-1 text-[12px] text-ink-faint">განისაზღვრება Security Rules-ში დადასტურებული ელფოსტით — კლიენტიდან შეცვლა შეუძლებელია.</dd>
            </div>
            <div className="rounded-xl border border-border p-3.5">
              <dt className="text-ink-faint font-semibold flex items-center gap-1.5">
                <KeyRound size={13} /> შენი ანგარიში
              </dt>
              <dd className="mt-1 font-bold text-ink break-all">{currentUser?.email}</dd>
              <dd className="mt-1">{emailVerified ? <StatusBadge tone="green">ელფოსტა დადასტურებულია</StatusBadge> : <StatusBadge tone="amber">ელფოსტა არ არის დადასტურებული</StatusBadge>}</dd>
            </div>
          </dl>
          {usingEmulators && <p className="mt-4 text-[12.5px] font-semibold text-terracotta">⚠ აპლიკაცია მუშაობს Firebase Emulator-ზე (ლოკალური ტესტირება).</p>}
        </Card>
      </div>
    </div>
  )
}
