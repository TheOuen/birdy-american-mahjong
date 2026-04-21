'use client'

import { useMemo, useState } from 'react'
import type { Tile, TileId } from '@/lib/tiles/constants'
import { TileRenderer } from '@/components/tiles/TileRenderer'
import { sortHand } from '@/lib/tiles/sorting'
import {
  getDirectionLabel,
  isBlindPassEligible,
  validateBlindPass,
  validateCharlestonSelection,
} from '@/lib/game-engine/charleston'
import type {
  CharlestonDirection,
  CharlestonPhase as CharlestonPhaseName,
  CharlestonState,
} from '@/lib/game-engine/charleston'

type CharlestonPhaseProps = {
  hand: Tile[]
  charleston: CharlestonState
  onPass: (tileIds: TileId[]) => void
  onBlindPass: (blindTileIds: TileId[], fromHandTileIds: TileId[]) => void
  onStopVote: (stop: boolean) => void
  onCourtesy: (humanCount: number, tileIds: TileId[]) => void
  // Back-compat props (no longer used by this component but preserved on the type
  // in case parent components still pass them):
  step?: 1 | 2 | 3
  direction?: CharlestonDirection
  receivedTileIds?: Set<TileId>
  awaitingSecondVote?: boolean
  charlestonRound?: 'first' | 'second'
  onAcceptSecond?: () => void
  onDeclineSecond?: () => void
}

const DIRECTION_ARROWS: Record<CharlestonDirection, string> = {
  right: '→',
  across: '↑',
  left: '←',
}

export function CharlestonPhase(props: CharlestonPhaseProps) {
  const phase: CharlestonPhaseName = props.charleston.phase

  if (phase === 'stop_vote') {
    return <StopVoteView onStopVote={props.onStopVote} hand={props.hand} />
  }

  if (phase === 'courtesy') {
    return (
      <CourtesyView
        hand={props.hand}
        onCourtesy={props.onCourtesy}
      />
    )
  }

  // Default: pass phase
  return <PassView
    hand={props.hand}
    charleston={props.charleston}
    onPass={props.onPass}
    onBlindPass={props.onBlindPass}
  />
}

// ---------------------------------------------------------------------------
// Standard/blind pass view
// ---------------------------------------------------------------------------

type PassViewProps = {
  hand: Tile[]
  charleston: CharlestonState
  onPass: (tileIds: TileId[]) => void
  onBlindPass: (blindTileIds: TileId[], fromHandTileIds: TileId[]) => void
}

function PassView({ hand, charleston, onPass, onBlindPass }: PassViewProps) {
  const { direction, step, receivedTileIds, lastReceivedTileIds } = charleston
  const roundLabel = charleston.round === 'first' ? 'First Charleston' : 'Second Charleston'
  const blindEligible = isBlindPassEligible(charleston)
  const sorted = useMemo(() => sortHand(hand), [hand])

  const [blindMode, setBlindMode] = useState(false)
  const [blindCount, setBlindCount] = useState(0) // 0-3 tiles from the received bundle
  const [selectedBlindIds, setSelectedBlindIds] = useState<TileId[]>([])
  const [selectedFromHandIds, setSelectedFromHandIds] = useState<TileId[]>([])
  const [error, setError] = useState<string | null>(null)

  // Standard-pass selection
  const [selectedIds, setSelectedIds] = useState<TileId[]>([])

  function resetAll() {
    setSelectedIds([])
    setSelectedBlindIds([])
    setSelectedFromHandIds([])
    setBlindCount(0)
    setBlindMode(false)
    setError(null)
  }

  // ---- Standard pass handlers --------------------------------------------
  function handleTileClickStandard(tileId: TileId) {
    setError(null)
    const tile = hand.find((t) => t.id === tileId)
    if (tile?.type.kind === 'joker' && !selectedIds.includes(tileId)) {
      setError('Jokers cannot be passed in the Charleston.')
      return
    }
    setSelectedIds((prev) => {
      if (prev.includes(tileId)) return prev.filter((id) => id !== tileId)
      if (prev.length >= 3) return prev
      return [...prev, tileId]
    })
  }

  function handleConfirmStandard() {
    if (selectedIds.length !== 3) return
    const validation = validateCharlestonSelection(hand, selectedIds, receivedTileIds)
    if (!validation.valid) {
      setError(validation.error ?? 'Invalid selection.')
      return
    }
    onPass(selectedIds)
    resetAll()
  }

  // ---- Blind pass handlers ------------------------------------------------
  function autoPickBlindTileIds(count: number): TileId[] {
    // Deterministically (by insertion order) grab `count` tile IDs from lastReceived
    // still present in hand. We can't show the tiles face-up so the player never sees them.
    const received = Array.from(lastReceivedTileIds)
    const availableInHand = received.filter((id) => hand.some((t) => t.id === id))
    return availableInHand.slice(0, count)
  }

  function handleBlindCountChange(count: number) {
    setError(null)
    setBlindCount(count)
    setSelectedBlindIds(autoPickBlindTileIds(count))
    // Trim from-hand selection if total would exceed 3
    setSelectedFromHandIds((prev) => prev.slice(0, Math.max(0, 3 - count)))
  }

  function handleTileClickFromHand(tileId: TileId) {
    setError(null)
    const tile = hand.find((t) => t.id === tileId)

    // Face-down tiles (received in last pass) cannot be hand-picked — user must look at them
    if (lastReceivedTileIds.has(tileId)) {
      setError('That tile was just passed to you — it stays face-down. Use the "Blind" buttons above.')
      return
    }

    if (tile?.type.kind === 'joker' && !selectedFromHandIds.includes(tileId)) {
      setError('Jokers cannot be passed in the Charleston.')
      return
    }

    const needed = 3 - blindCount
    setSelectedFromHandIds((prev) => {
      if (prev.includes(tileId)) return prev.filter((id) => id !== tileId)
      if (prev.length >= needed) return prev
      return [...prev, tileId]
    })
  }

  function handleConfirmBlind() {
    if (blindCount === 0) {
      setError('Choose 1, 2, or 3 blind tiles — or use the standard pass.')
      return
    }
    if (selectedFromHandIds.length + blindCount !== 3) {
      setError(`Select ${3 - blindCount} more tile${3 - blindCount !== 1 ? 's' : ''} from your hand.`)
      return
    }
    const validation = validateBlindPass(
      hand,
      selectedBlindIds,
      selectedFromHandIds,
      lastReceivedTileIds,
      charleston
    )
    if (!validation.valid) {
      setError(validation.error ?? 'Invalid blind pass.')
      return
    }
    onBlindPass(selectedBlindIds, selectedFromHandIds)
    resetAll()
  }

  // ---- Render -------------------------------------------------------------
  const blindSelectionCount = blindCount
  const handSelectionCount = selectedFromHandIds.length
  const totalSelected = blindMode ? blindSelectionCount + handSelectionCount : selectedIds.length
  const remaining = 3 - totalSelected

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-table)' }}>
      {/* Header */}
      <div className="px-6 py-6 bg-[var(--bg-deep)] border-b border-[rgba(255,255,255,0.08)] text-center">
        <h2 className="text-3xl text-[var(--accent-gold)]" style={{ fontFamily: 'var(--font-display)' }}>
          {roundLabel}
        </h2>
        <p className="text-lg text-[#A09888] mt-2">Pass {step} of 3</p>
        <div className="gold-line w-20 mx-auto mt-4" />
      </div>

      {/* Direction indicator */}
      <div className="flex flex-col items-center gap-4 sm:gap-6 py-6 sm:py-10 px-4 sm:px-6">
        <div
          className="flex items-center gap-4 sm:gap-6 px-6 sm:px-10 py-5 sm:py-8 rounded-[var(--radius-lg)]"
          style={{
            background: 'rgba(250, 247, 242, 0.95)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border)',
          }}
        >
          <span className="text-5xl text-[var(--brand)]">{DIRECTION_ARROWS[direction]}</span>
          <div>
            <p className="text-2xl text-[var(--brand)]" style={{ fontFamily: 'var(--font-display)' }}>
              Pass {getDirectionLabel(direction)}
            </p>
            <p className="text-lg text-[var(--text-secondary)] mt-1">
              {blindMode
                ? 'Blind pass — forward received tiles unseen'
                : `Select 3 tiles to pass to the player on your ${direction}`}
            </p>
          </div>
        </div>

        {/* Blind-pass toggle */}
        {blindEligible && (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => {
                setBlindMode((prev) => !prev)
                setSelectedIds([])
                setSelectedBlindIds([])
                setSelectedFromHandIds([])
                setBlindCount(0)
                setError(null)
              }}
              className={
                blindMode
                  ? 'btn-secondary text-base px-6 py-3'
                  : 'px-6 py-3 rounded-[var(--radius-md)] text-base font-semibold border-2 border-[var(--accent-gold)] text-[var(--accent-gold)] bg-transparent'
              }
            >
              {blindMode ? 'Cancel blind pass' : 'Blind pass (advanced)'}
            </button>
            <p className="text-xs text-[#A09888] max-w-md text-center">
              A blind pass forwards tiles you just received without looking at them.
              You can blind-pass 1, 2, or 3 of the tiles you just received and fill the rest from your hand.
            </p>
          </div>
        )}

        {/* Blind-pass count selector */}
        {blindMode && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#A09888]">Blind tiles:</span>
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => handleBlindCountChange(n)}
                className={
                  blindCount === n
                    ? 'w-11 h-11 rounded-[var(--radius-md)] text-base font-semibold bg-[var(--accent-gold)] text-[var(--text-inverse)]'
                    : 'w-11 h-11 rounded-[var(--radius-md)] text-base font-semibold border border-[var(--border)] text-[var(--text-primary)] bg-[rgba(250,247,242,0.9)]'
                }
                disabled={lastReceivedTileIds.size < n}
                title={lastReceivedTileIds.size < n ? 'Not enough received tiles' : `Blind-pass ${n}`}
              >
                {n}
              </button>
            ))}
          </div>
        )}

        {/* Selected tiles preview */}
        <div className="flex items-center gap-3">
          <span className="text-[#A09888] font-medium">Passing:</span>
          <div className="flex gap-1 min-h-20">
            {/* Blind face-down slots first */}
            {blindMode &&
              Array.from({ length: blindCount }).map((_, i) => (
                <div
                  key={`blind-${i}`}
                  className="w-12 h-[4.25rem] rounded-[var(--radius-sm)] flex items-center justify-center text-xl font-semibold"
                  style={{
                    background: 'linear-gradient(135deg, var(--brand) 0%, var(--bg-deep) 100%)',
                    color: 'var(--accent-gold)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                  aria-label="Face-down blind-pass tile"
                >
                  ?
                </div>
              ))}
            {/* From-hand tiles shown face-up */}
            {blindMode
              ? selectedFromHandIds.map((id) => {
                  const tile = hand.find((t) => t.id === id)
                  return tile ? (
                    <TileRenderer
                      key={tile.id}
                      tile={tile}
                      size="md"
                      onClick={() => handleTileClickFromHand(tile.id)}
                    />
                  ) : null
                })
              : selectedIds.map((id) => {
                  const tile = hand.find((t) => t.id === id)
                  return tile ? (
                    <TileRenderer
                      key={tile.id}
                      tile={tile}
                      size="md"
                      onClick={() => handleTileClickStandard(tile.id)}
                    />
                  ) : null
                })}
            {/* Empty placeholders */}
            {Array.from({ length: remaining }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="w-12 h-[4.25rem] rounded-[var(--radius-sm)] border-2 border-dashed"
                style={{ borderColor: 'rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)' }}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--error-light)] text-[var(--error)] text-sm font-medium">
            {error}
          </div>
        )}

        {/* Confirm button */}
        {blindMode ? (
          <button
            onClick={handleConfirmBlind}
            disabled={totalSelected !== 3 || blindCount === 0}
            className={
              totalSelected === 3 && blindCount > 0
                ? 'btn-primary text-lg px-10 py-4'
                : 'btn-secondary text-lg px-10 py-4 opacity-50 cursor-not-allowed'
            }
          >
            {totalSelected === 3 && blindCount > 0
              ? `Pass ${getDirectionLabel(direction)} (${blindCount} blind)`
              : `Select ${remaining} more tile${remaining !== 1 ? 's' : ''}`}
          </button>
        ) : (
          <button
            onClick={handleConfirmStandard}
            disabled={selectedIds.length !== 3}
            className={
              selectedIds.length === 3
                ? 'btn-primary text-lg px-10 py-4'
                : 'btn-secondary text-lg px-10 py-4 opacity-50 cursor-not-allowed'
            }
          >
            {selectedIds.length === 3
              ? `Pass ${getDirectionLabel(direction)}`
              : `Select ${3 - selectedIds.length} more tile${3 - selectedIds.length !== 1 ? 's' : ''}`}
          </button>
        )}
      </div>

      {/* Player hand */}
      <div className="flex-1" />
      <div
        className="px-2 sm:px-6 py-3 sm:py-5 border-t"
        style={{
          background: 'var(--bg-elevated)',
          borderColor: 'var(--border)',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
        }}
      >
        <p className="text-center text-xs sm:text-sm text-[var(--text-muted)] mb-2 sm:mb-3">
          {blindMode
            ? 'Tap tiles FROM YOUR HAND to pass. Tiles you just received appear face-down.'
            : 'Your hand — tap tiles to select for passing'}
        </p>
        <div className="flex flex-wrap justify-center gap-0.5 sm:gap-1">
          {sorted.map((tile) => {
            const isReceived = blindMode && lastReceivedTileIds.has(tile.id)
            const isBlindSelected = blindMode && selectedBlindIds.includes(tile.id)
            const isSelected = blindMode
              ? selectedFromHandIds.includes(tile.id)
              : selectedIds.includes(tile.id)
            if (isReceived) {
              // Render a face-down marker; if slot is consumed by blind count, dim it extra
              return (
                <div
                  key={tile.id}
                  className="w-14 h-20 sm:w-16 sm:h-[5.5rem] rounded-[var(--radius-sm)] flex items-center justify-center text-xl font-semibold"
                  style={{
                    background: 'linear-gradient(135deg, var(--brand) 0%, var(--bg-deep) 100%)',
                    color: 'var(--accent-gold)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)',
                    opacity: isBlindSelected ? 1 : 0.65,
                  }}
                  aria-label="Face-down received tile"
                >
                  ?
                </div>
              )
            }
            return (
              <TileRenderer
                key={tile.id}
                tile={tile}
                selected={isSelected}
                onClick={() =>
                  blindMode ? handleTileClickFromHand(tile.id) : handleTileClickStandard(tile.id)
                }
                size="lg"
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stop vote view
// ---------------------------------------------------------------------------

function StopVoteView({
  onStopVote,
  hand,
}: {
  onStopVote: (stop: boolean) => void
  hand: Tile[]
}) {
  const sorted = sortHand(hand)
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-table)' }}>
      <div className="px-6 py-6 bg-[var(--bg-deep)] border-b border-[rgba(255,255,255,0.08)] text-center">
        <h2 className="text-3xl text-[var(--accent-gold)]" style={{ fontFamily: 'var(--font-display)' }}>
          First Charleston Complete
        </h2>
        <div className="gold-line w-20 mx-auto mt-4" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 sm:gap-10 px-4 sm:px-6">
        <div
          className="flex flex-col items-center gap-6 px-8 sm:px-12 py-8 sm:py-12 rounded-[var(--radius-lg)] max-w-md w-full text-center"
          style={{
            background: 'rgba(250, 247, 242, 0.95)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border)',
          }}
        >
          <p className="text-2xl text-[var(--brand)]" style={{ fontFamily: 'var(--font-display)' }}>
            Would you like a second Charleston?
          </p>
          <p className="text-lg text-[var(--text-secondary)]">
            If any player stops, the second Charleston is skipped. A courtesy pass is still offered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full mt-2">
            <button onClick={() => onStopVote(false)} className="btn-primary text-lg px-8 py-4 flex-1">
              Continue
            </button>
            <button onClick={() => onStopVote(true)} className="btn-secondary text-lg px-8 py-4 flex-1">
              Stop Charleston
            </button>
          </div>
        </div>
      </div>

      <div
        className="px-2 sm:px-6 py-3 sm:py-5 border-t"
        style={{
          background: 'var(--bg-elevated)',
          borderColor: 'var(--border)',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
        }}
      >
        <p className="text-center text-xs sm:text-sm text-[var(--text-muted)] mb-2 sm:mb-3">Your hand</p>
        <div className="flex flex-wrap justify-center gap-0.5 sm:gap-1">
          {sorted.map((tile) => (
            <TileRenderer key={tile.id} tile={tile} size="lg" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Courtesy pass view
// ---------------------------------------------------------------------------

function CourtesyView({
  hand,
  onCourtesy,
}: {
  hand: Tile[]
  onCourtesy: (humanCount: number, tileIds: TileId[]) => void
}) {
  const sorted = useMemo(() => sortHand(hand), [hand])
  const [count, setCount] = useState<number>(0)
  const [selectedIds, setSelectedIds] = useState<TileId[]>([])
  const [error, setError] = useState<string | null>(null)

  function handleTileClick(tileId: TileId) {
    setError(null)
    const tile = hand.find((t) => t.id === tileId)
    if (tile?.type.kind === 'joker' && !selectedIds.includes(tileId)) {
      setError('Jokers cannot be exchanged in the courtesy pass.')
      return
    }
    setSelectedIds((prev) => {
      if (prev.includes(tileId)) return prev.filter((id) => id !== tileId)
      if (prev.length >= count) return prev
      return [...prev, tileId]
    })
  }

  function handleCountChange(n: number) {
    setError(null)
    setCount(n)
    setSelectedIds((prev) => prev.slice(0, n))
  }

  function handleConfirm() {
    if (count === 0) {
      onCourtesy(0, [])
      return
    }
    if (selectedIds.length !== count) {
      setError(`Select ${count - selectedIds.length} more tile${count - selectedIds.length !== 1 ? 's' : ''}.`)
      return
    }
    onCourtesy(count, selectedIds)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-table)' }}>
      <div className="px-6 py-6 bg-[var(--bg-deep)] border-b border-[rgba(255,255,255,0.08)] text-center">
        <h2 className="text-3xl text-[var(--accent-gold)]" style={{ fontFamily: 'var(--font-display)' }}>
          Courtesy Pass
        </h2>
        <p className="text-lg text-[#A09888] mt-2">Optional exchange with the player across</p>
        <div className="gold-line w-20 mx-auto mt-4" />
      </div>

      <div className="flex flex-col items-center gap-4 sm:gap-6 py-6 sm:py-10 px-4 sm:px-6">
        <div
          className="flex flex-col gap-3 px-6 sm:px-10 py-5 sm:py-8 rounded-[var(--radius-lg)] max-w-md w-full text-center"
          style={{
            background: 'rgba(250, 247, 242, 0.95)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border)',
          }}
        >
          <p className="text-lg text-[var(--text-secondary)]">
            Offer 0-3 tiles to the player across. Both players must agree on a count, and no jokers may
            be exchanged. This pass happens once.
          </p>
        </div>

        {/* Count selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#A09888]">Offer:</span>
          {[0, 1, 2, 3].map((n) => (
            <button
              key={n}
              onClick={() => handleCountChange(n)}
              className={
                count === n
                  ? 'w-12 h-12 rounded-[var(--radius-md)] text-base font-semibold bg-[var(--accent-gold)] text-[var(--text-inverse)]'
                  : 'w-12 h-12 rounded-[var(--radius-md)] text-base font-semibold border border-[var(--border)] text-[var(--text-primary)] bg-[rgba(250,247,242,0.9)]'
              }
            >
              {n}
            </button>
          ))}
        </div>

        {/* Selected tiles preview */}
        {count > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-[#A09888] font-medium">Passing:</span>
            <div className="flex gap-1 min-h-20">
              {selectedIds.map((id) => {
                const tile = hand.find((t) => t.id === id)
                return tile ? (
                  <TileRenderer
                    key={tile.id}
                    tile={tile}
                    size="md"
                    onClick={() => handleTileClick(tile.id)}
                  />
                ) : null
              })}
              {Array.from({ length: count - selectedIds.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="w-12 h-[4.25rem] rounded-[var(--radius-sm)] border-2 border-dashed"
                  style={{ borderColor: 'rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)' }}
                />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--error-light)] text-[var(--error)] text-sm font-medium">
            {error}
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={count > 0 && selectedIds.length !== count}
          className={
            count === 0 || selectedIds.length === count
              ? 'btn-primary text-lg px-10 py-4'
              : 'btn-secondary text-lg px-10 py-4 opacity-50 cursor-not-allowed'
          }
        >
          {count === 0 ? 'Skip courtesy pass' : `Offer ${count} tile${count !== 1 ? 's' : ''}`}
        </button>
      </div>

      <div className="flex-1" />

      <div
        className="px-2 sm:px-6 py-3 sm:py-5 border-t"
        style={{
          background: 'var(--bg-elevated)',
          borderColor: 'var(--border)',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
        }}
      >
        <p className="text-center text-xs sm:text-sm text-[var(--text-muted)] mb-2 sm:mb-3">
          {count > 0 ? 'Select the tiles you want to offer' : 'Your hand'}
        </p>
        <div className="flex flex-wrap justify-center gap-0.5 sm:gap-1">
          {sorted.map((tile) => (
            <TileRenderer
              key={tile.id}
              tile={tile}
              selected={selectedIds.includes(tile.id)}
              onClick={count > 0 ? () => handleTileClick(tile.id) : undefined}
              size="lg"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
