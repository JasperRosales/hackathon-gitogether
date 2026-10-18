import ProjectLanding from "@/components/ProjectLanding"

type Props = {
  /** Open the outfit builder. */
  onStartBuilder: () => void
}

export default function HomePage({ onStartBuilder }: Props) {
  return <ProjectLanding onStartBuilder={onStartBuilder} />
}
