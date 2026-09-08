import { useCallback, useEffect, useRef, type Dispatch, type RefObject, type SetStateAction } from 'react'

const FOCUSABLE_SELECTOR = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

type ModalFocusTrapOptions = {
  active: boolean
  containerRef: RefObject<HTMLElement | null>
  initialFocusRef: RefObject<HTMLElement | null>
  returnFocusRef: RefObject<HTMLElement | null>
  setOpen: Dispatch<SetStateAction<boolean>>
}

export function useModalFocusTrap({
  active,
  containerRef,
  initialFocusRef,
  returnFocusRef,
  setOpen,
}: ModalFocusTrapOptions) {
  const restoreFocusRef = useRef(false)

  const close = useCallback((restoreFocus = true) => {
    restoreFocusRef.current = restoreFocus
    setOpen(false)
  }, [setOpen])

  const cancelRestore = useCallback(() => {
    restoreFocusRef.current = false
  }, [])

  useEffect(() => {
    if (!active) {
      if (restoreFocusRef.current) {
        restoreFocusRef.current = false
        const target = returnFocusRef.current
        if (target?.isConnected) target.focus({ preventScroll: true })
      }
      return
    }

    restoreFocusRef.current = false
    const previousOverflow = document.body.style.overflow
    const focusableItems = () => Array.from(containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [])
      .filter((element) => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true')

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close(true)
        return
      }
      if (event.key !== 'Tab') return

      const items = focusableItems()
      const first = items[0]
      const last = items.at(-1)
      if (!first || !last) return

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.body.style.overflow = 'hidden'
    initialFocusRef.current?.focus({ preventScroll: true })
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [active, close, containerRef, initialFocusRef, returnFocusRef])

  return { close, cancelRestore }
}
