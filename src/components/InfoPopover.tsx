'use client'

import React, { useEffect, useRef, useState } from 'react'
import { HelpCircle } from 'lucide-react'

interface InfoPopoverProps {
  ariaLabel?: string
  className?: string
  children: React.ReactNode
}

const InfoPopover: React.FC<InfoPopoverProps> = ({
  ariaLabel = '도움말 열기',
  className,
  children,
}) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeydown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeydown)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex ${className ?? ''}`}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center rounded-md p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <HelpCircle className="h-4 w-4" />
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal={false}
          className="absolute z-50 mt-2 w-80 max-w-[80vw] left-0 rounded-md border border-gray-200 bg-white shadow-lg p-3 text-sm text-gray-700"
        >
          {children}
        </div>
      )}
    </div>
  )
}

export default InfoPopover
