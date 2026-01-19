import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export interface LinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
}

const CustomLink = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, href, ...props }, ref) => {
    return (
      <Link
        href={href}
        className={cn(
          "text-primary underline",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
CustomLink.displayName = "Link"

export { CustomLink as Link }
