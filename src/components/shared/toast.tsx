import * as React from 'react'

type ToastProps = { title?: string; description?: string }

// Minimal toast placeholder. The project doesn't have a toast system yet,
// so we implement an extremely small, non-styled toast using DOM API.
// Replace with a proper toast library if desired.
export function toast({ title, description }: ToastProps) {
  const id = `toast-${Math.random().toString(36).slice(2, 8)}`
  const el = document.createElement('div')
  el.id = id
  el.setAttribute('role', 'status')
  el.className = 'fixed right-4 bottom-4 z-50 bg-gray-800 text-white p-3 rounded shadow'
  el.innerHTML = `<strong class="block">${title || ''}</strong><div class="text-sm">${description || ''}</div>`
  document.body.appendChild(el)
  setTimeout(() => {
    const e = document.getElementById(id)
    if (e) e.remove()
  }, 4000)
}

export default toast
