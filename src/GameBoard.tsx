import { useState, type ReactNode } from 'react'
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor,
  useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import { useGame } from './GameContext'
import { translations } from './i18n'
import { createBoard, getBoardCase, getCase, getReviewZones, isSolved, moveToken } from './gameLogic'
import type { BoardState, CaseId, ZoneId } from './types'
import { Biscuit, Icon, ShapeArt, type ShapeName } from './Illustrations'
import InteractionDemo from './InteractionDemo'
import EvidenceChart from './EvidenceChart'
import DashboardBoard from './DashboardBoard'
import { CaseBriefing, HintFooter, SolvedFeedback } from './CaseParts'
import { useCaseSolve } from './useCaseSolve'

type Selection = { token: number; zone: ZoneId }

function TokenFace({ sharing, notebook, label }: { sharing: boolean; notebook: boolean; label: string }) {
  if (sharing) return <Biscuit className="biscuit-art" />
  if (notebook) {
    // The suspect's own answer is written in their pen, so it reads as work to check.
    const [work, answer] = label.split(' = ')
    return <span className="notebook-entry"><span>{work}</span><span className="suspect-answer">= {answer}</span></span>
  }
  if (label.startsWith('shape:')) return <ShapeArt shape={label.slice(6) as ShapeName} />
  // Long equations, prices, and weights break before "=", "+" or "−", and after "×".
  const lineBreak = label.includes(' = ') ? / (?== )/ : /Rp|\bk?g\b/.test(label) && /[+−×]/.test(label) ? / (?=[+−] )|(?<=×) / : null
  if (lineBreak)
    return <span className="stacked-token">{label.split(lineBreak).map((part) => <span key={part}>
      {part.split('□').flatMap((piece, index) => index ? [<span className="blank-box" key={index} />, piece] : [piece])}
    </span>)}</span>
  if (label.includes('→')) {
    const [start, end] = label.split('→')
    return <span className="time-token"><span>{start.trim()}</span><span>→</span><span>{end.trim()}</span></span>
  }
  if (/^[■□]+$/.test(label)) return <span className="fraction-strip" aria-hidden="true">{[...label].map((part, index) => <span className={`fraction-part${part === '■' ? ' is-filled' : ''}`} key={index} />)}</span>
  const fractions: Record<string, string> = { '¼': '1/4', '½': '1/2', '¾': '3/4' }
  const fraction = /^(\d+)\/(\d+)$/.exec(fractions[label] ?? label)
  return fraction
    ? <span className="fraction-token"><span>{fraction[1]}</span><span>{fraction[2]}</span></span>
    : <span>{label}</span>
}

function EvidenceToken({ token, zone, label, className, selected, clone, disabled, onSelect, children }: {
  token: number; zone: ZoneId; label: string; className: string; selected: boolean;
  clone: boolean; disabled: boolean; onSelect: () => void; children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${zone}-${token}`, data: { token, zone }, disabled,
  })
  return <button
    ref={setNodeRef} type="button" {...attributes} {...listeners}
    aria-label={label} aria-pressed={selected} disabled={disabled} data-token={token} data-sound="custom"
    className={`evidence-token ${className}${selected ? ' is-selected' : ''}${isDragging ? ' is-dragging' : ''}${clone ? ' is-copy' : ''}`}
    onClick={(event) => { event.stopPropagation(); if (!isDragging) onSelect() }}
  >{children}{clone && <span className="copy-mark" aria-hidden="true">+</span>}</button>
}

function DropArea({ id, children, className, label, placeLabel, selected, disabled, reviewLabel, onPlace }: {
  id: ZoneId; children: ReactNode; className: string; label: string; placeLabel: string;
  selected: boolean; disabled: boolean; reviewLabel?: string; onPlace: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled })
  return <section ref={setNodeRef} aria-label={label} data-zone={id}
    aria-describedby={reviewLabel ? `review-${id}` : undefined}
    className={`${className}${isOver ? ' is-over' : ''}${selected ? ' can-place' : ''}${reviewLabel ? ' needs-review' : ''}`}
    onClick={onPlace}>
    {reviewLabel && <span id={`review-${id}`} className="zone-review"><Icon name="search" size={14} />{reviewLabel}</span>}
    {children}
    {selected && <button className="zone-drop-button" type="button" data-sound="custom" aria-label={`${placeLabel}: ${label}`}
      onClick={(event) => { event.stopPropagation(); onPlace() }}>
      {placeLabel}<span aria-hidden="true"> ↵</span>
    </button>}
  </section>
}

export default function GameBoard({ caseId, onNext }: { caseId: CaseId; onNext: () => void }) {
  return getCase(caseId).kind === 'dashboard'
    ? <DashboardBoard caseId={caseId} onNext={onNext} />
    : <ClueBoard caseId={caseId} onNext={onNext} />
}

function ClueBoard({ caseId, onNext }: { caseId: CaseId; onNext: () => void }) {
  const { player, playSound } = useGame()
  const language = player.language
  const t = translations[language].board
  const level = getBoardCase(caseId)
  const sharing = level.kind === 'sharing'
  const notebook = level.cardStyle === 'notebook'
  const tokenClass = sharing ? 'biscuit-token' : notebook ? 'number-token expression-token notebook-token'
    : level.tokenLabels ? 'number-token expression-token' : level.tokenWords ? 'story-token' : 'number-token'
  const [board, setBoard] = useState<BoardState>(() => createBoard(caseId))
  const [history, setHistory] = useState<BoardState[]>([])
  const [selected, setSelected] = useState<Selection | null>(null)
  const [dragging, setDragging] = useState<Selection | null>(null)
  const [feedback, setFeedback] = useState<'retry' | 'solved' | null>(null)
  const { earnedPoints, newLevel, solve } = useCaseSolve(caseId)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space'] } }),
  )
  const solved = feedback === 'solved'
  const reviewZones = feedback === 'retry' ? getReviewZones(caseId, board) : []
  const reviewTray = feedback === 'retry' && board.tray.length > 0
  const tokenLabel = (token: number) => level.tokenLabels?.[token] ?? level.tokenWords?.[token][language] ?? String(token)
  const tokenText = (token: number) => level.tokenWords?.[token][language] ?? tokenLabel(token)
  const tokenName = (token: number) => {
    const label = tokenText(token)
    const readable = /^[■□]+$/.test(label)
      ? `${[...label].filter((part) => part === '■').length} ${t.of} ${label.length} ${t.partsShaded}`
      : label.replaceAll('¼', t.quarter).replaceAll('½', t.half).replaceAll('¾', t.threeQuarters).replace('/', ` ${t.fractionOver} `).replaceAll('□', t.missingNumber)
    return `${sharing ? t.biscuit : t.clue} ${readable}`
  }
  const zoneName = (id: string | number) => id === 'tray' ? t.tray : level.dropZones.find((zone) => zone.id === id)?.label[language] ?? ''
  const isCopy = (token: number) => (level.copies?.[token] ?? 1) > 1 && level.dropZones.some(({ id }) => board[id].includes(token))
  const availableCopies = board.tray.filter(isCopy)

  function place(selection: Selection | null, zone: ZoneId) {
    if (!selection || solved) return
    const next = moveToken(board, selection.token, selection.zone, zone, caseId)
    if (next !== board) {
      setHistory((previous) => [...previous, board])
      setBoard(next)
      setFeedback(null)
      playSound('drop')
    }
    setSelected(null)
  }

  function finishDrag({ active, over }: DragEndEvent) {
    if (over && active.data.current) place(active.data.current as Selection, over.id as ZoneId)
    setDragging(null)
  }

  function reset() {
    setBoard(createBoard(caseId))
    setHistory([])
    setSelected(null)
    setFeedback(null)
  }

  function checkEvidence() {
    setSelected(null)
    if (isSolved(caseId, board)) {
      solve()
      setFeedback('solved')
    } else { setFeedback('retry'); playSound('click') }
  }

  function renderToken(token: number, zone: ZoneId) {
    const clone = zone === 'tray' && isCopy(token)
    return <EvidenceToken key={`${zone}-${token}`} token={token} zone={zone} className={tokenClass}
      label={`${tokenName(token)}, ${zoneName(zone)}. ${t.selectToken}${clone ? `. ${t.copyAvailable}` : ''}`}
      selected={selected?.token === token && selected.zone === zone} clone={clone} disabled={solved}
      onSelect={() => {
        setSelected(selected?.token === token && selected.zone === zone ? null : { token, zone })
        playSound('drag')
      }}><TokenFace sharing={sharing} notebook={notebook} label={tokenLabel(token)} /></EvidenceToken>
  }

  return <article className={`game-board${solved ? ' is-solved' : ''}`}>
    <CaseBriefing caseId={caseId} />

    <DndContext sensors={sensors} onDragStart={({ active }) => {
      setDragging(active.data.current as Selection)
      setSelected(null)
      playSound('drag')
    }} onDragEnd={finishDrag} onDragCancel={() => setDragging(null)} accessibility={{
      screenReaderInstructions: { draggable: t.keyboardHelp },
      announcements: {
        onDragStart: ({ active }) => `${t.dragStart} ${tokenName(Number(active.data.current?.token))}.`,
        onDragOver: ({ over }) => over ? `${t.dragOver} ${zoneName(over.id)}.` : undefined,
        onDragEnd: ({ over }) => over ? `${t.dragEnd} ${zoneName(over.id)}.` : t.dragCancel,
        onDragCancel: () => t.dragCancel,
      },
    }}>
      <div className="board-workspace">
        <div className="workspace-intro"><Icon name="hand" size={18} /><p aria-live="polite">{selected ? `${tokenName(selected.token)} · ${t.selectedHelp}` : t.dragHelp}</p><InteractionDemo autoShow={!player.completedCases.length} language={language} /></div>

        {level.chart && <EvidenceChart chart={level.chart} language={language} />}

        <DropArea id="tray" className="evidence-tray" label={t.tray} placeLabel={t.placeHere}
          reviewLabel={reviewTray ? t.cluesWaiting : undefined}
          selected={!!selected && selected.zone !== 'tray'} disabled={solved} onPlace={() => place(selected, 'tray')}>
          <div className="tray-heading"><span>{t.tray}</span><span className="tray-count">{board.tray.length} {t.left}</span></div>
          <div className="tray-tokens">{board.tray.map((token) => renderToken(token, 'tray'))}{!board.tray.length && <span className="tray-empty" aria-hidden="true">✓</span>}</div>
          {!!availableCopies.length && <p className="copy-note">{availableCopies.map(tokenText).join(', ')} · {t.copyAvailable}</p>}
        </DropArea>

        <div className="dropzones">
          {level.dropZones.map(({ id, label }) => <DropArea key={id} id={id}
            className={`evidence-zone zone-${id}${sharing ? '' : ' number-zone'}`}
            label={label[language]} placeLabel={t.placeHere} selected={!!selected && selected.zone !== id}
            reviewLabel={reviewZones.includes(id) ? t.lookAgain : undefined}
            disabled={solved} onPlace={() => place(selected, id)}>
            <div className="zone-heading"><h3 className="zone-label">{label[language]}</h3>
              {solved && <span className="zone-success" aria-hidden="true">✓</span>}
              {sharing && <span className="zone-count tokens-in-zone" role="status" aria-label={`${label[language]}: ${board[id].length} ${t.cluesInZone}`}>{board[id].length}</span>}
            </div>
            <div className="zone-tokens">{board[id].map((token) => renderToken(token, id))}
              {!board[id].length && <div className="zone-placeholder" aria-hidden="true"><Icon name="book" size={32} /></div>}
            </div>
          </DropArea>)}
        </div>

        {feedback && <div className={`feedback-panel feedback-${feedback}`} role="status" aria-live="polite">
          {feedback === 'retry' ? <><Icon name="search" /><p>
            {reviewZones.length > 0 && <span>{t.reviewGroups} {reviewZones.map(zoneName).join(', ')}. </span>}
            {reviewTray && <span>{t.finishTray}</span>}
            {!reviewZones.length && !reviewTray && t.feedbackSorting}
          </p></> : <SolvedFeedback caseId={caseId} earnedPoints={earnedPoints} newLevel={newLevel} onNext={onNext} />}
        </div>}

        <div className="board-toolbar"><div className="history-actions">
          <button className="subtle-button" disabled={!history.length || solved} onClick={() => {
            setBoard(history[history.length - 1]); setHistory(history.slice(0, -1)); setSelected(null); setFeedback(null)
          }}><Icon name="undo" size={18} />{t.undo}</button>
          <button className="subtle-button" onClick={reset}><Icon name="reset" size={18} />{solved ? t.playAgain : t.reset}</button>
        </div><button className="primary-button check-button" data-sound="custom" onClick={checkEvidence} disabled={solved}><Icon name="check" size={18} />{t.checkEvidence}</button></div>
      </div>
      <DragOverlay>{dragging && <div className={`evidence-token drag-overlay ${tokenClass}`}><TokenFace sharing={sharing} notebook={notebook} label={tokenLabel(dragging.token)} /></div>}</DragOverlay>
    </DndContext>

    <HintFooter caseId={caseId} />
  </article>
}
