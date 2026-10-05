import { useRef, useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useGame } from "./GameContext";
import { translations } from "./i18n";
import { createBoard, isSolved, moveToken } from "./gameLogic";
import type { BoardState, CaseId, ZoneId } from "./types";
import { useAudio } from "./useAudio";
import { Biscuit, Icon } from "./Illustrations";

type Selection = { token: number; zone: ZoneId };

function EvidenceToken({
  token,
  zone,
  caseId,
  label,
  selected,
  clone,
  disabled,
  onSelect,
}: {
  token: number;
  zone: ZoneId;
  caseId: CaseId;
  label: string;
  selected: boolean;
  clone: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${zone}-${token}`,
    data: { token, zone },
    disabled,
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      aria-label={label}
      aria-pressed={selected}
      disabled={disabled}
      data-token={token}
      className={`evidence-token ${caseId === 1 ? "biscuit-token" : "number-token"}${selected ? " is-selected" : ""}${isDragging ? " is-dragging" : ""}${clone ? " is-copy" : ""}`}
      onClick={(event) => {
        event.stopPropagation();
        if (!isDragging) onSelect();
      }}
    >
      {caseId === 1 ? (
        <Biscuit className="biscuit-art" />
      ) : (
        <>
          <span>{token}</span>
          {clone && (
            <span className="copy-mark" aria-hidden="true">
              +
            </span>
          )}
        </>
      )}
    </button>
  );
}

function DropArea({
  id,
  children,
  className,
  label,
  selected,
  disabled,
  onPlace,
}: {
  id: ZoneId;
  children: ReactNode;
  className: string;
  label: string;
  selected: boolean;
  disabled: boolean;
  onPlace: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled });
  return (
    <section
      ref={setNodeRef}
      aria-label={label}
      data-zone={id}
      className={`${className}${isOver ? " is-over" : ""}${selected ? " can-place" : ""}`}
      onClick={onPlace}
    >
      {children}
      {selected && (
        <button
          className="zone-drop-button"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onPlace();
          }}
        >
          {label}
          <span aria-hidden="true"> ↵</span>
        </button>
      )}
    </section>
  );
}

export default function GameBoard({
  caseId,
  onNext,
}: {
  caseId: CaseId;
  onNext: () => void;
}) {
  const { player, completeCase } = useGame();
  const t = translations[player.language].board;
  const [board, setBoard] = useState<BoardState>(() => createBoard(caseId));
  const [history, setHistory] = useState<BoardState[]>([]);
  const [selected, setSelected] = useState<Selection | null>(null);
  const [dragging, setDragging] = useState<Selection | null>(null);
  const [feedback, setFeedback] = useState<"retry" | "solved" | null>(null);
  const [earnedPoints, setEarnedPoints] = useState(false);
  const hint = useRef<HTMLDialogElement>(null);
  const playSound = useAudio(player.soundEnabled);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space"] },
    }),
  );
  const solved = feedback === "solved";
  const zones: { id: "a" | "b" | "c"; label: string }[] = [
    { id: "a", label: caseId === 1 ? t.bagA : t.multiple3 },
    { id: "b", label: caseId === 1 ? t.bagB : t.multiple4 },
    { id: "c", label: caseId === 1 ? t.bagC : t.neither },
  ];
  const zoneName = (id: string | number) =>
    id === "tray"
      ? t.tray
      : (zones.find((zone) => zone.id === id)?.label ?? "");
  const tokenName = (token: number) =>
    `${caseId === 1 ? t.biscuit : t.numberCard} ${token}`;

  function place(selection: Selection | null, zone: ZoneId) {
    if (!selection || solved) return;
    const next = moveToken(
      board,
      selection.token,
      selection.zone,
      zone,
      caseId,
    );
    if (next !== board) {
      setHistory((previous) => [...previous, board]);
      setBoard(next);
      setFeedback(null);
      playSound("drop");
    }
    setSelected(null);
  }

  function finishDrag(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.data.current) {
      place(active.data.current as Selection, over.id as ZoneId);
    }
    setDragging(null);
  }

  function reset() {
    setBoard(createBoard(caseId));
    setHistory([]);
    setSelected(null);
    setFeedback(null);
  }

  function checkEvidence() {
    setSelected(null);
    if (isSolved(caseId, board)) {
      setEarnedPoints(!player.completedCases.includes(caseId));
      completeCase(caseId);
      setFeedback("solved");
      playSound("correct");
    } else setFeedback("retry");
  }

  function renderToken(token: number, zone: ZoneId) {
    const clone =
      caseId === 2 &&
      token === 12 &&
      zone === "tray" &&
      (board.a.includes(12) || board.b.includes(12) || board.c.includes(12));
    return (
      <EvidenceToken
        key={`${zone}-${token}`}
        token={token}
        zone={zone}
        caseId={caseId}
        label={`${t.selectToken} ${tokenName(token)}${clone ? `. ${t.number12Copy}` : ""}`}
        selected={selected?.token === token && selected.zone === zone}
        clone={clone}
        disabled={solved}
        onSelect={() => {
          setSelected(
            selected?.token === token && selected.zone === zone
              ? null
              : { token, zone },
          );
          playSound("drag");
        }}
      />
    );
  }

  return (
    <article className="game-board">
      <header className="case-briefing">
        <div className="case-eyebrow">
          <span className="case-number">{caseId === 1 ? "01" : "02"}</span>
          {caseId === 1 ? t.division : t.multiples}
        </div>
        <h2>{caseId === 1 ? t.caseTitle1 : t.caseTitle2}</h2>
        <p className="mission-copy">{caseId === 1 ? t.mission1 : t.mission2}</p>
        <span className="briefing-stamp" aria-hidden="true">
          <Icon name="book" />
        </span>
      </header>

      <DndContext
        sensors={sensors}
        onDragStart={({ active }) => {
          setDragging(active.data.current as Selection);
          setSelected(null);
          playSound("drag");
        }}
        onDragEnd={finishDrag}
        onDragCancel={() => setDragging(null)}
        accessibility={{
          screenReaderInstructions: { draggable: t.keyboardHelp },
          announcements: {
            onDragStart: ({ active }) =>
              `${t.dragStart} ${tokenName(Number(active.data.current?.token))}.`,
            onDragOver: ({ over }) =>
              over ? `${t.dragOver} ${zoneName(over.id)}.` : undefined,
            onDragEnd: ({ over }) =>
              over ? `${t.dragEnd} ${zoneName(over.id)}.` : t.dragCancel,
            onDragCancel: () => t.dragCancel,
          },
        }}
      >
        <div className="board-workspace">
          <div className="workspace-intro">
            <span className="intro-icon">
              <Icon name="hand" />
            </span>
            <div>
              <strong>
                {caseId === 1 ? t.clueInstruction : t.clueInstruction2}
              </strong>
              <p aria-live="polite">
                {selected
                  ? `${tokenName(selected.token)} · ${t.selectedHelp}`
                  : t.dragHelp}
              </p>
            </div>
          </div>

          <DropArea
            id="tray"
            className="evidence-tray"
            label={`${t.dropHere} ${t.tray}`}
            selected={!!selected && selected.zone !== "tray"}
            disabled={solved}
            onPlace={() => place(selected, "tray")}
          >
            <div className="tray-heading">
              <span>{t.tray}</span>
              <span className="tray-count">
                {board.tray.length}{" "}
                {caseId === 1 ? t.biscuitsLeft : t.cardsLeft}
              </span>
            </div>
            <div className="tray-tokens">
              {board.tray.map((token) => renderToken(token, "tray"))}
              {!board.tray.length && (
                <span className="tray-empty" aria-hidden="true">
                  ✓
                </span>
              )}
            </div>
            {caseId === 2 &&
              board.tray.includes(12) &&
              (board.a.includes(12) ||
                board.b.includes(12) ||
                board.c.includes(12)) && (
                <p className="copy-note">{t.number12Copy}</p>
              )}
          </DropArea>

          <div className="dropzones">
            {zones.map(({ id, label }, index) => (
              <DropArea
                key={id}
                id={id}
                className={`evidence-zone zone-${id}${caseId === 2 ? " number-zone" : ""}`}
                label={`${t.dropHere} ${label}`}
                selected={!!selected && selected.zone !== id}
                disabled={solved}
                onPlace={() => place(selected, id)}
              >
                <div className="zone-heading">
                  <span className="zone-letter">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span
                    className="zone-count"
                    aria-label={`${board[id].length} ${caseId === 1 ? t.biscuitsLeft : t.cardsLeft}`}
                  >
                    {board[id].length}
                  </span>
                </div>
                <div className="zone-tokens">
                  {board[id].map((token) => renderToken(token, id))}
                  {!board[id].length && (
                    <div className="zone-placeholder" aria-hidden="true">
                      <svg
                        className="bag-art"
                        width="74"
                        height="82"
                        viewBox="0 0 74 82"
                        fill="none"
                      >
                        <path
                          d="M15 21h44l6 52H9l6-52Z"
                          fill="#EEE6D3"
                          stroke="#B5A98E"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M14 21h46M19 27h36"
                          stroke="#B5A98E"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M25 21v-7a12 12 0 0 1 24 0v7"
                          stroke="#B5A98E"
                          strokeWidth="2"
                        />
                        <rect
                          x="23"
                          y="39"
                          width="29"
                          height="22"
                          rx="2"
                          fill="#FFFCF4"
                          stroke="#C4B9A2"
                        />
                        <path
                          d="M30 46h15M30 51h10M30 56h12"
                          stroke="#B5A98E"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span>{caseId === 1 ? t.emptyBag : t.emptyCategory}</span>
                    </div>
                  )}
                </div>
                <h3 className="zone-label">{label}</h3>
                {caseId === 1 && (
                  <span className="zone-caption">{t.bagCaption}</span>
                )}
              </DropArea>
            ))}
          </div>

          <div
            className={`feedback-panel${feedback ? ` feedback-${feedback}` : ""}`}
            role="status"
            aria-live="polite"
          >
            {feedback === "retry" && (
              <>
                <span aria-hidden="true">✦</span>
                <p>{caseId === 1 ? t.feedback1 : t.feedback2}</p>
              </>
            )}
            {feedback === "solved" && (
              <>
                <span className="success-symbol" aria-hidden="true">
                  ✓
                </span>
                <div>
                  <strong>{t.solved}</strong>
                  <p>{earnedPoints ? t.solvedDetail : t.solvedAgain}</p>
                </div>
                <button className="text-button" onClick={onNext}>
                  {caseId === 1 ? t.nextCase : t.allSolved}{" "}
                  <span aria-hidden="true">→</span>
                </button>
              </>
            )}
          </div>

          <div className="board-toolbar">
            <div className="history-actions">
              <button
                className="subtle-button"
                disabled={!history.length || solved}
                onClick={() => {
                  setBoard(history[history.length - 1]);
                  setHistory(history.slice(0, -1));
                  setSelected(null);
                  setFeedback(null);
                }}
              >
                <Icon name="undo" size={18} />
                {t.undo}
              </button>
              <button className="subtle-button" onClick={reset}>
                <Icon name="reset" size={18} />
                {solved ? t.playAgain : t.reset}
              </button>
            </div>
            <button
              className="primary-button check-button"
              onClick={checkEvidence}
              disabled={solved}
            >
              <Icon name="check" size={18} />
              {t.checkEvidence}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
        <DragOverlay>
          {dragging && (
            <div
              className={`evidence-token drag-overlay ${caseId === 1 ? "biscuit-token" : "number-token"}`}
            >
              {caseId === 1 ? <Biscuit /> : dragging.token}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <footer className="board-footer">
        <button
          className="hint-button"
          onClick={() => {
            hint.current?.showModal();
            playSound("hint");
          }}
        >
          <Icon name="help" size={18} />
          {t.needHint}
        </button>
        <span className="calm-indicator">
          <Icon name="sun" size={18} />
          {t.noTimer}
        </span>
      </footer>

      <dialog ref={hint} className="hint-dialog" aria-labelledby="hint-heading">
        <button
          className="dialog-close"
          aria-label={t.closeDialog}
          onClick={() => hint.current?.close()}
        >
          ×
        </button>
        <span className="dialog-eyebrow">✦ {t.needHint}</span>
        <h2 id="hint-heading">{t.hintTitle}</h2>
        <ol className="hint-steps">
          <li>
            <span className="hint-step-number">1</span>
            <div>
              <p>{caseId === 1 ? t.hintStep1a : t.hintStep2a}</p>
              <div className="hint-visual">
                {caseId === 1 ? (
                  Array.from({ length: 12 }, (_, i) => (
                    <span className="mini-biscuit" key={i}>
                      <Biscuit />
                    </span>
                  ))
                ) : (
                  <span>
                    3 × 3 = <b>9</b> &nbsp; 3 × 5 = <b>15</b>
                  </span>
                )}
              </div>
            </div>
          </li>
          <li>
            <span className="hint-step-number">2</span>
            <div>
              <p>{caseId === 1 ? t.hintStep1b : t.hintStep2b}</p>
              <div className="hint-visual">
                {caseId === 1 ? (
                  ["A", "B", "C"].map((label) => (
                    <span className="hint-mini-bag" key={label}>
                      <b>{label}</b>
                      {[0, 1, 2, 3].map((id) => (
                        <span className="mini-biscuit" key={id}>
                          <Biscuit />
                        </span>
                      ))}
                    </span>
                  ))
                ) : (
                  <span>
                    4 × 2 = <b>8</b> &nbsp; 4 × 4 = <b>16</b>
                    <br />3 × 4 = <b>12</b> = 4 × 3
                  </span>
                )}
              </div>
            </div>
          </li>
          <li>
            <span className="hint-step-number">3</span>
            <div>
              <p>{caseId === 1 ? t.hintStep1c : t.hintStep2c}</p>
              <div className="hint-equation">
                {caseId === 1 ? "12 ÷ 3 = 4" : `7 → ${t.neither}`}
              </div>
            </div>
          </li>
        </ol>
        <button
          className="primary-button"
          onClick={() => hint.current?.close()}
        >
          {t.closeHint} <span aria-hidden="true">→</span>
        </button>
      </dialog>
    </article>
  );
}
