import clsx from 'clsx'
import { initials } from '../utils/format'

const colors = ['bg-blue-100 text-blue-700', 'bg-violet-100 text-violet-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700']

export function Avatar({ name, image, size = 'md', className }: { name: string; image?: string | null; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const color = colors[(name.charCodeAt(0) || 0) % colors.length]
  return (
    <span className={clsx('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold', { 'h-8 w-8 text-[10px]': size === 'sm', 'h-10 w-10 text-xs': size === 'md', 'h-14 w-14 text-sm': size === 'lg' }, !image && color, className)}>
      {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : initials(name)}
    </span>
  )
}
