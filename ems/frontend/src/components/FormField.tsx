import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import clsx from 'clsx'

export function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return <span className="mb-1.5 block text-xs font-bold text-slate-600">{children}{required && <span className="ml-1 text-rose-500">*</span>}</span>
}

const baseClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-50 disabled:bg-slate-50'

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx(baseClass, className)} {...props} />
}

export function SelectInput({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={clsx(baseClass, className)} {...props}>{children}</select>
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={clsx(baseClass, 'min-h-24 resize-y', className)} {...props} />
}
