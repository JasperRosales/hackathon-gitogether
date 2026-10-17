import type { ReactNode } from "react"
import { Heading } from "./ui"

export default function PanelTitle({
  title,
  trailing,
}: {
  title: string
  trailing?: ReactNode
}) {
  return (
    <div className="panel-header">
      <div>
        <Heading level={2}>{title}</Heading>
      </div>
      {trailing}
    </div>
  )
}
