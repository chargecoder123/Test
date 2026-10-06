import { LoaderCircle } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  busy?: boolean
  icon?: ReactNode
}

export function Button({ children, className, variant = 'primary', size = 'md', busy, icon, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100 disabled:pointer-events-none disabled:opacity-55',
        {
          'bg-brand-600 text-white shadow-sm hover:bg-brand-700': variant === 'primary',
          'bg-white text-ink shadow-sm ring-1 ring-slate-200 hover:bg-slate-50': variant === 'secondary',
          'text-slate-600 hover:bg-slate-100 hover:text-ink': variant === 'ghost',
          'bg-rose-600 text-white hover:bg-rose-700': variant === 'danger',
          'bg-transparent text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50': variant === 'outline',
          'px-3 py-2 text-xs': size === 'sm',
          'px-4 py-2.5 text-sm': size === 'md',
          'px-5 py-3 text-sm': size === 'lg',
        },
        className,
      )}
      disabled={disabled || busy}
      {...props}
    >
      {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  )
}
