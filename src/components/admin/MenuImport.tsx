import { useRef, useState } from 'react'
import { FileText, ImagePlus, Sparkles, X } from 'lucide-react'
import type { MenuCategoryData } from '../../data/types'
import { MenuImportError, importMenuFile, mergeImportedMenus } from '../../services/aiService'
import { menuStats } from '../../services/menuService'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

const MAX_FILES = 8
const ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf'

const ERRORS: Record<MenuImportError['code'], string> = {
  too_large: 'ფაილი ძალიან დიდია. PDF უნდა იყოს 3 MB-მდე; ფოტო გადაიღე უფრო ახლოდან ან გაჭერი.',
  forbidden: 'ამ ფუნქციის გამოყენება მხოლოდ ადმინისტრატორსა და მენეჯერს შეუძლია. სცადე ხელახლა შესვლა.',
  rate_limited: 'AI-ის ლიმიტი ამოიწურა. სცადე ერთ წუთში.',
  not_configured: 'AI ჯერ არ არის ჩართული.',
  failed: 'ამოცნობა ვერ მოხერხდა. სცადე ხელახლა ან ატვირთე უფრო მკაფიო ფოტო.',
}

type Phase = { step: 'pick' } | { step: 'working'; done: number } | { step: 'review'; menu: MenuCategoryData[]; failed: number }

/**
 * "Menu from a photo": the admin drops photos or a PDF of a printed menu, AI turns them into
 * categories and bilingual items, and the result lands in the editor as an unsaved draft to review.
 */
export default function MenuImport({ current, onImport }: { current: MenuCategoryData[]; onImport: (menu: MenuCategoryData[]) => void }) {
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [phase, setPhase] = useState<Phase>({ step: 'pick' })
  const [error, setError] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const cancelled = useRef(false)

  function reset() {
    setFiles([])
    setPhase({ step: 'pick' })
    setError(null)
  }

  function close() {
    cancelled.current = true
    setOpen(false)
    reset()
  }

  function addFiles(list: FileList | null) {
    if (!list) return
    setError(null)
    setFiles((prev) => [...prev, ...Array.from(list)].slice(0, MAX_FILES))
  }

  async function recognise() {
    cancelled.current = false
    setError(null)
    setPhase({ step: 'working', done: 0 })
    const parts: MenuCategoryData[][] = []
    let failed = 0
    let lastError: MenuImportError['code'] | null = null
    for (let i = 0; i < files.length; i++) {
      try {
        parts.push(await importMenuFile(files[i]))
      } catch (e) {
        failed++
        lastError = e instanceof MenuImportError ? e.code : 'failed'
        // No point sending the remaining pages if the caller is not allowed or AI is off.
        if (lastError === 'forbidden' || lastError === 'not_configured') break
      }
      if (cancelled.current) return
      setPhase({ step: 'working', done: i + 1 })
    }
    const menu = mergeImportedMenus(parts)
    if (menu.length === 0) {
      setPhase({ step: 'pick' })
      setError(lastError ? ERRORS[lastError] : 'ფაილებში მენიუ ვერ ვიპოვე. ატვირთე მენიუს მკაფიო ფოტო.')
      return
    }
    setPhase({ step: 'review', menu, failed })
  }

  function apply(mode: 'append' | 'replace') {
    if (phase.step !== 'review') return
    onImport(mode === 'replace' ? phase.menu : mergeImportedMenus([current, phase.menu]))
    close()
  }

  const stats = phase.step === 'review' ? menuStats(phase.menu) : null

  return (
    <>
      <Button variant="secondary" icon={<Sparkles size={16} />} onClick={() => setOpen(true)}>
        ფოტოდან ატვირთვა
      </Button>

      <Modal
        open={open}
        onClose={close}
        title="მენიუს ატვირთვა ფოტოდან"
        description="ატვირთე მენიუს ფოტოები ან PDF — AI ამოიცნობს კატეგორიებს, კერძებსა და ფასებს და თარგმნის ქართულ-ინგლისურად."
        footer={
          phase.step === 'pick' ? (
            <>
              <Button variant="secondary" onClick={close}>
                გაუქმება
              </Button>
              <Button icon={<Sparkles size={16} />} onClick={recognise} disabled={files.length === 0}>
                ამოცნობა
              </Button>
            </>
          ) : phase.step === 'review' ? (
            <>
              {current.length > 0 && (
                <Button variant="secondary" onClick={() => apply('replace')}>
                  არსებულის ჩანაცვლება
                </Button>
              )}
              <Button onClick={() => apply('append')}>{current.length > 0 ? 'არსებულზე დამატება' : 'მენიუში ჩასმა'}</Button>
            </>
          ) : undefined
        }
      >
        {phase.step === 'pick' && (
          <div>
            <input ref={input} type="file" accept={ACCEPT} multiple hidden onChange={(e) => (addFiles(e.target.files), (e.target.value = ''))} />
            <button
              type="button"
              onClick={() => input.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                addFiles(e.dataTransfer.files)
              }}
              className="w-full rounded-2xl border-2 border-dashed border-border bg-white hover:border-green hover:bg-green-light/40 transition-colors px-5 py-9 flex flex-col items-center gap-2 text-ink-faint"
            >
              <ImagePlus size={26} />
              <span className="text-[14px] font-bold text-ink">აირჩიე ფაილები ან ჩააგდე აქ</span>
              <span className="text-[12.5px]">JPG, PNG ან PDF · მაქს. {MAX_FILES} ფაილი · თითო გვერდი ცალკე ფოტოდ</span>
            </button>

            {files.length > 0 && (
              <ul className="mt-4 flex flex-col gap-2">
                {files.map((file, i) => (
                  <li key={`${file.name}-${i}`} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-white">
                    <FileText size={17} className="text-ink-faint shrink-0" />
                    <span className="flex-1 min-w-0 truncate text-[13.5px] font-semibold text-ink">{file.name}</span>
                    <span className="text-[12px] text-ink-faint tabular-nums">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                    <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label="წაშლა" className="w-8 h-8 rounded-full hover:bg-cream-2 flex items-center justify-center text-ink-soft">
                      <X size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {error && <p className="mt-4 px-4 py-3 rounded-xl bg-terracotta-light text-terracotta text-[13.5px] font-semibold">{error}</p>}
          </div>
        )}

        {phase.step === 'working' && (
          <div className="py-8 flex flex-col items-center text-center">
            <Sparkles size={28} className="text-green animate-pulse" />
            <p className="mt-4 text-[15px] font-bold text-ink">AI კითხულობს მენიუს…</p>
            <p className="mt-1 text-[13.5px] text-ink-soft">
              {phase.done} / {files.length} ფაილი · თითო გვერდს 10–40 წამი სჭირდება
            </p>
            <div className="mt-5 w-full max-w-xs h-2 rounded-full bg-cream-2 overflow-hidden">
              <div className="h-full bg-green transition-all duration-500" style={{ width: `${Math.max(6, (phase.done / files.length) * 100)}%` }} />
            </div>
          </div>
        )}

        {phase.step === 'review' && stats && (
          <div>
            <p className="text-[14.5px] text-ink">
              ამოვიცანი <b>{stats.categories}</b> კატეგორია და <b>{stats.items}</b> კერძი.
              {phase.failed > 0 && <span className="text-terracotta"> {phase.failed} ფაილი ვერ წავიკითხე.</span>}
            </p>
            <ul className="mt-4 max-h-[46vh] overflow-y-auto flex flex-col gap-3 pr-1">
              {phase.menu.map((category) => (
                <li key={category.id} className="rounded-xl border border-border bg-white p-3.5">
                  <p className="font-bold text-[14px] text-ink">
                    {category.name.ka} <span className="font-medium text-ink-faint">· {category.name.en}</span>
                  </p>
                  <ul className="mt-2 flex flex-col gap-1">
                    {category.items.map((item) => (
                      <li key={item.id} className="flex items-baseline justify-between gap-3 text-[13.5px]">
                        <span className="min-w-0 truncate text-ink-soft">
                          {item.name.ka} <span className="text-ink-faint">/ {item.name.en}</span>
                        </span>
                        <span className={`font-bold tabular-nums whitespace-nowrap ${item.price > 0 ? 'text-green' : 'text-terracotta'}`}>{item.price > 0 ? `${item.price} ₾` : 'ფასი?'}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[12.5px] text-ink-faint">შედეგი ჩაჯდება რედაქტორში შეუნახავ ცვლილებად — გადახედე, შეასწორე და მერე დააჭირე „შენახვას“.</p>
          </div>
        )}
      </Modal>
    </>
  )
}
