import { UtensilsCrossed, Coffee, Martini, Beef, Pizza, Wheat, Soup, CakeSlice, type LucideIcon } from 'lucide-react'
import type { CategoryDef } from '../data/categories'
import { useLanguage } from '../i18n/LanguageContext'

// Explicit map instead of `import * as Icons`: a namespace import drags every lucide icon into the main bundle.
const ICONS: Record<string, LucideIcon> = { UtensilsCrossed, Coffee, Martini, Beef, Pizza, Wheat, Soup, CakeSlice }

interface CategoryPillProps {
  category: CategoryDef
  active?: boolean
  onClick?: () => void
}

export default function CategoryPill({ category, active = false, onClick }: CategoryPillProps) {
  const { lang } = useLanguage()
  const Icon = ICONS[category.icon] ?? UtensilsCrossed

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-[14px] font-semibold whitespace-nowrap transition-all ${
        active
          ? 'bg-green border-green text-cream shadow-sm'
          : 'bg-white border-border text-ink-soft hover:border-green hover:text-green'
      }`}
    >
      <Icon size={16} />
      {category.label[lang]}
    </button>
  )
}
