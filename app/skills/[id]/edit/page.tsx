// app/skills/[id]/edit/page.tsx

import SkillForm from '@/app/components/SkillForm'
import { PrismaClient } from '@/app/generated/prisma'

interface SkillEditPageProps {
  params: { id: string }
}

const prisma = new PrismaClient()

export default async function SkillEditPage({ params }: SkillEditPageProps) {
  const skill = await prisma.skill.findUnique({
    where: { id: params.id },
  })

  if (!skill) {
    return <p>Skill not found</p>
  }

  // Convert hourlyRate from Decimal (if Prisma uses Decimal) to number if needed
  const skillData = {
    category: skill.category,
    experience: skill.experience,
    natureOfWork: skill.natureOfWork,
    hourlyRate: Number(skill.hourlyRate),
  }

  return <SkillForm type="update" skillId={params.id} initialData={skillData} />
}
