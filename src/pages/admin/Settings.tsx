import { useState } from 'react'
import { Crown, Database, DatabaseZap, Globe, KeyRound, ShieldCheck, Upload } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useSiteSettings } from '../../hooks/useAdmin'
import { useRestaurants } from '../../hooks/useRestaurants'
import { useSeo } from '../../hooks/useSeo'
import { useToast } from '../../hooks/useToast'
import { updateSettings } from '../../services/adminService'
import { importDemoRestaurants } from '../../services/restaurantService'
import { getFirebaseErrorMessage, SAVE_FAILED } from '../../utils/firebaseErrors'
import { SUPER_ADMIN_EMAIL } from '../../utils/roles'
import { usingEmulators } from '../../lib/firebase'
import { Card, PageHeader, StatusBadge } from '../../components/admin/AdminUI'
import { Toggle } from '../../components/ui/Inputs'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

export default function Settings() {
  useSeo('პარამეტრები | მართვის პანელი')
  const toast = useToast()
  const { isSuperAdmin, currentUser, emailVerified } = useAuth()
  const { settings, loading } = useSiteSettings()
  const { source } = useRestaurants()
  const [importOpen, setImportOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  async function toggleDemo(value: boolean) {
    setSaving(true)
    try {
      await updateSettings({ demoFallback: value })
      toast.success('პარამეტრები შენახულია.')
    } catch (e) {
      toast.error(getFirebaseErrorMessage(e, 'ka', SAVE_FAILED))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="პარამეტრები" description={isSuperAdmin ? 'სისტემის პარამეტრები.' : 'სისტემის პარამეტრებს ცვლის მხოლოდ Super Admin.'} />

      <div className="grid lg:grid-cols-2 gap-4 md:gap-5">
        <Card className="p-5 md:p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-10 rounded-xl bg-green-light text-green flex items-center justify-center">
              <Globe size={19} />
            </span>
            <h2 className="text-[16px] font-extrabold text-ink">საჯარო საიტი</h2>
          </div>
          <div className="flex items-center gap-2 mb-5 text-[13.5px] text-ink-soft">
            მონაცემების წყარო:
            {source === 'firestore' ? <StatusBadge tone="green">Firestore</StatusBadge> : <StatusBadge tone="amber">დემო მონაცემები</StatusBadge>}
          </div>
          <Toggle
            checked={settings.demoFallback}
            onChange={toggleDemo}
            disabled={!isSuperAdmin || loading || saving}
            label="დემო მონაცემების ჩვენება, როცა Firestore ცარიელია"
            description="გამორთე, როცა ყველა რეალური რესტორანი დაემატება."
          />
        </Card>

        <Card className="p-5 md:p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-10 rounded-xl bg-terracotta-light text-terracotta flex items-center justify-center">
              {source === 'firestore' ? <DatabaseZap size={19} /> : <Database size={19} />}
            </span>
            <h2 className="text-[16px] font-extrabold text-ink">მონაცემების მიგრაცია</h2>
          </div>
          <p className="text-[13.5px] text-ink-soft leading-relaxed mb-5">
            კოდში არსებული დემო რესტორნების ერთჯერადი იმპორტი Firestore-ში. ამის შემდეგ რესტორნები იმართება მხოლოდ ამ პანელიდან — კოდის რედაქტირება აღარ არის საჭირო.
          </p>
          <Button variant="secondary" icon={<Upload size={16} />} onClick={() => setImportOpen(true)}>
            დემო რესტორნების იმპორტი
          </Button>
        </Card>

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

      <ConfirmDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        danger={false}
        title="დემო რესტორნების იმპორტი"
        message="დემო რესტორნები ჩაიწერება Firestore-ში. თუ იგივე slug-ით რესტორანი უკვე არსებობს, ის გადაიწერება."
        confirmLabel="იმპორტი"
        onConfirm={async () => {
          try {
            const n = await importDemoRestaurants()
            toast.success(`${n} რესტორანი დაემატა Firestore-ში.`)
          } catch (e) {
            toast.error(getFirebaseErrorMessage(e, 'ka', SAVE_FAILED))
            throw e
          }
        }}
      />
    </div>
  )
}
