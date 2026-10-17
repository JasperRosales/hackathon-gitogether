import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-neutral-900 text-white hover:bg-neutral-700",
        secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 border border-transparent",
        outline: "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100",
        ghost: "text-neutral-900 hover:bg-neutral-100",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 px-4 text-[13px]",
        lg: "h-11 px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
)
Button.displayName = "Button"

export { Button, buttonVariants }
