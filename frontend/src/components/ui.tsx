import { forwardRef } from "react"
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  HTMLAttributes,
  FormHTMLAttributes,
} from "react"

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} />
}
export function Form(props: FormHTMLAttributes<HTMLFormElement>) {
  return <form {...props} />
}
export const Input =
  forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
    (props, ref) => <input {...props} ref={ref} />,
  )
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} />
}
export function Heading({
  level,
  ...props
}: HTMLAttributes<HTMLHeadingElement> & { level: 1 | 2 | 3 }) {
  const Tag = `h${level}` as "h1" | "h2" | "h3"
  return <Tag {...props} />
}
