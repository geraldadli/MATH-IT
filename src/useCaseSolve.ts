import { useState } from 'react'
import { useGame } from './GameContext'
import type { CaseId } from './types'
import { getLevel, xpForCases, type DetectiveLevel } from './levels'

// Records a solve and remembers what it earned for the celebration.
export function useCaseSolve(caseId: CaseId) {
  const { player, completeCase, playSound } = useGame()
  const [earnedPoints, setEarnedPoints] = useState(false)
  const [newLevel, setNewLevel] = useState<DetectiveLevel | null>(null)
  function solve() {
    const firstSolve = !player.completedCases.includes(caseId)
    const before = getLevel(xpForCases(player.completedCases.length))
    const after = getLevel(xpForCases(player.completedCases.length + (firstSolve ? 1 : 0)))
    setEarnedPoints(firstSolve)
    setNewLevel(after.level > before.level ? after : null)
    completeCase(caseId)
    playSound(after.level > before.level ? 'levelUp' : 'correct')
  }
  return { earnedPoints, newLevel, solve }
}
