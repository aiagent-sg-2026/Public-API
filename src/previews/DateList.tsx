import './dateList.css'
import type { ReactNode } from 'react'

export type DateListItem = {
  key: string
  dateText: string
  day: string
  month: string
  eyebrow: ReactNode
  title: ReactNode
  description: ReactNode
}

export function DateList({ items, className }: { items: DateListItem[]; className?: string }) {
  return <ol className={`calendar-preview${className ? ` ${className}` : ''}`}>{items.map((item) => <li key={item.key}><time dateTime={item.dateText}><strong>{item.day}</strong><span>{item.month}</span></time><div><small>{item.eyebrow}</small><h3>{item.title}</h3><p>{item.description}</p></div></li>)}</ol>
}
