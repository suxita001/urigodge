import { useEffect } from 'react'

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function useSeo(title: string, description?: string) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = title
    if (description) {
      setMeta('description', description)
      setMeta('og:title', title, 'property')
      setMeta('og:description', description, 'property')
    }
    return () => {
      document.title = prevTitle
    }
  }, [title, description])
}
