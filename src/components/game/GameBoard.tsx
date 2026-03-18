'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import type { TileId } from '@/lib/tiles/constants'
import type { ClaimType } from '@/lib/game-engine/types'
import {
  createDemoGame,
  drawTile,
  discardTile,
  botTurn,
  isGameOver,
} from '@/lib/game-engine/engine'
import type { DemoGameState } from '@/lib/game-engine/engine'
import {
  getValidClaims,
  getClaimTileIds,
  executeClaim,
  evaluateBotClaim,
} from '@/lib/game-engine/claims'
import { PlayerHand } from './PlayerHand'
import { DiscardPile } from './DiscardPile'
import { OpponentRow } from './OpponentRow'
import { ExposedGroups } from './ExposedGroups'
import { ClaimDialog } from './ClaimDialog'
import { NmjlCardViewer } from './NmjlCardViewer'
import { CharlestonPhase } from './CharlestonPhase'
import { GameOverScreen } from './GameOverScreen'
import {
  createCharlestonState,
  executeCharlestonPass,
} from '@/lib/game-engine/charleston'
import type { CharlestonState } from '@/lib/game-engine/charleston'

type ClaimPhase = {
  discardIndex: number
  validClaims: ClaimType[]
} | null

export function GameBoard() {
  const [game, setGame] = useState<DemoGameState | null>(null)
  const [selectedTile, setSelectedTile] = useState<TileId | null>(null)
  const [message, setMessage] = useState('')
  const [hasDrawn, setHasDrawn] = useState(false)
  const [claimPhase, setClaimPhase] = useState<ClaimPhase>(null)
  const [botsProcessing, setBotsProcessing] = useState(false)
  const [showCard, setShowCard] = useState(false)
  const [charleston, setCharleston] = useState<CharlestonState | null>(null)

  // Initialize game
  useEffect(() => {
    const newGame = createDemoGame()
    // Start in charleston phase
    newGame.gameState.status = 'charleston' as const
    setGame(newGame)
    setCharleston(createCharlestonState())
    setMessage('The Charleston — select 3 tiles to pass.')
    setHasDrawn(false)
  }, [])

  // Handle charleston pass
  const handleCharlestonPass = useCallback(
    (tileIds: TileId[]) => {
      if (!game || !charleston) return

      const result = executeCharlestonPass(game, charleston, tileIds)
      if (!result) return

      if (result.charleston.complete) {
        // Charleston done — transition to playing
        result.gameState.gameState.status = 'playing'
        setGame(result.gameState)
        setCharleston(null)
        setHasDrawn(true) // East starts with 14 tiles
        setMessage('Charleston complete! Your turn — tap a tile to discard.')
      } else {
        setGame(result.gameState)
        setCharleston(result.charleston)
        setMessage(`Pass ${result.charleston.step} of 3 — select 3 tiles to pass ${result.charleston.direction}.`)
      }
    },
    [game, charleston]
  )

  const isPlayerTurn = game?.gameState.currentTurn === 'player'

  // Handle drawing a tile
  const handleDraw = useCallback(() => {
    if (!game || !isPlayerTurn || hasDrawn) return

    const result = drawTile(game)
    if (!result) {
      setMessage('No tiles left — wall game!')
      setGame((prev) =>
        prev ? { ...prev, gameState: { ...prev.gameState, status: 'finished' } } : null
      )
      return
    }

    setGame(result.state)
    setHasDrawn(true)
    setMessage('You drew a tile. Tap a tile to discard.')
  }, [game, isPlayerTurn, hasDrawn])

  // After a discard, check if player can claim
  const checkPlayerClaims = useCallback(
    (state: DemoGameState): boolean => {
      const discardPile = state.gameState.discardPile
      if (discardPile.length === 0) return false

      const lastDiscard = discardPile[discardPile.length - 1]
      if (lastDiscard.claimed) return false
      if (lastDiscard.discardedBy === 'player') return false // can't claim own discard

      const player = state.gameState.players.find((p) => p.id === 'player')!
      const claims = getValidClaims(player, lastDiscard.tile)

      if (claims.length > 0) {
        setClaimPhase({
          discardIndex: discardPile.length - 1,
          validClaims: claims,
        })
        return true
      }
      return false
    },
    []
  )

  // Handle player claiming a discard
  const handleClaim = useCallback(
    (claimType: ClaimType) => {
      if (!game || !claimPhase) return

      const discard = game.gameState.discardPile[claimPhase.discardIndex]
      const player = game.gameState.players.find((p) => p.id === 'player')!
      const tileIds = getClaimTileIds(player.hand, discard.tile, claimType)
      if (!tileIds) return

      const result = executeClaim(game, 'player', claimPhase.discardIndex, claimType, tileIds)
      if (!result) return

      setGame(result)
      setClaimPhase(null)
      setHasDrawn(true) // player claimed, now needs to discard
      setMessage(`You claimed a ${claimType}! Now discard a tile.`)
    },
    [game, claimPhase]
  )

  // Handle player passing on a claim
  const handlePassClaim = useCallback(() => {
    setClaimPhase(null)
    // Continue with bot turns
    if (game) {
      runBotTurns(game)
    }
  }, [game])

  // Handle tile click — select then discard
  const handleTileClick = useCallback(
    (tileId: TileId) => {
      if (!game || !isPlayerTurn || !hasDrawn || claimPhase) return

      if (selectedTile === tileId) {
        // Second click — discard
        const result = discardTile(game, 'player', tileId)
        if (!result) return

        setGame(result)
        setSelectedTile(null)
        setHasDrawn(false)
        setMessage('Bots are playing...')

        // Check if any bot wants to claim
        checkBotClaimsAfterDiscard(result)
      } else {
        setSelectedTile(tileId)
        setMessage('Tap again to discard, or choose a different tile.')
      }
    },
    [game, isPlayerTurn, selectedTile, hasDrawn, claimPhase]
  )

  // Check if any bot wants to claim after player discards
  const checkBotClaimsAfterDiscard = useCallback(
    (state: DemoGameState) => {
      const discardPile = state.gameState.discardPile
      const lastDiscard = discardPile[discardPile.length - 1]
      if (!lastDiscard || lastDiscard.claimed) {
        runBotTurns(state)
        return
      }

      // Check bots in turn order for claims
      const bots = state.gameState.players.filter((p) => p.isBot && !p.isDead)
      for (const bot of bots) {
        const claim = evaluateBotClaim(bot, lastDiscard.tile)
        if (claim) {
          const tileIds = getClaimTileIds(bot.hand, lastDiscard.tile, claim)
          if (tileIds) {
            const result = executeClaim(
              state,
              bot.id,
              discardPile.length - 1,
              claim,
              tileIds
            )
            if (result) {
              // Bot claimed — they need to discard
              setMessage(`${bot.displayName} claimed a ${claim}!`)
              setTimeout(() => {
                // Bot auto-discards after claiming
                const botPlayer = result.gameState.players.find((p) => p.id === bot.id)!
                const nonJokers = botPlayer.hand.filter((t) => t.type.kind !== 'joker')
                const candidates = nonJokers.length > 0 ? nonJokers : botPlayer.hand
                if (candidates.length === 0) return
                const tile = candidates[Math.floor(Math.random() * candidates.length)]
                const afterDiscard = discardTile(result, bot.id, tile.id)
                if (!afterDiscard) return

                setGame(afterDiscard)

                // Check if player can claim this bot's discard
                if (afterDiscard.gameState.currentTurn === 'player') {
                  if (!checkPlayerClaims(afterDiscard)) {
                    setHasDrawn(false)
                    setMessage('Your turn — tap Draw to pick up a tile.')
                  }
                } else {
                  // Continue bot turns
                  runBotTurns(afterDiscard)
                }
              }, 1000)
              return
            }
          }
        }
      }

      // No bot claimed — continue normal bot turns
      runBotTurns(state)
    },
    []
  )

  // Run bot turns sequentially with delays
  const runBotTurns = useCallback((startState: DemoGameState) => {
    if (isGameOver(startState) || startState.gameState.currentTurn === 'player') {
      setGame(startState)
      if (isGameOver(startState)) {
        setMessage('Wall game — no tiles remain! No winner this round.')
      } else {
        setHasDrawn(false)
        setMessage('Your turn — tap Draw to pick up a tile.')
      }
      return
    }

    setBotsProcessing(true)

    const runNext = (state: DemoGameState) => {
      if (state.gameState.currentTurn === 'player' || isGameOver(state)) {
        setGame(state)
        setBotsProcessing(false)
        if (isGameOver(state)) {
          setMessage('Wall game — no tiles remain! No winner this round.')
        } else {
          // Check if player can claim the last discard
          if (!checkPlayerClaims(state)) {
            setHasDrawn(false)
            setMessage('Your turn — tap Draw to pick up a tile.')
          }
        }
        return
      }

      setTimeout(() => {
        const result = botTurn(state)
        if (!result) {
          setGame(state)
          setBotsProcessing(false)
          return
        }

        setGame(result)

        // After this bot's discard, check if player wants to claim
        // before continuing to next bot
        if (result.gameState.currentTurn === 'player') {
          setBotsProcessing(false)
          if (!checkPlayerClaims(result)) {
            setHasDrawn(false)
            setMessage('Your turn — tap Draw to pick up a tile.')
          }
        } else {
          // Check if player can claim this bot's discard before next bot goes
          const discardPile = result.gameState.discardPile
          const lastDiscard = discardPile[discardPile.length - 1]
          if (lastDiscard && !lastDiscard.claimed && lastDiscard.discardedBy !== 'player') {
            const player = result.gameState.players.find((p) => p.id === 'player')!
            const claims = getValidClaims(player, lastDiscard.tile)
            if (claims.length > 0) {
              setBotsProcessing(false)
              setClaimPhase({
                discardIndex: discardPile.length - 1,
                validClaims: claims,
              })
              return
            }
          }
          runNext(result)
        }
      }, 800)
    }

    runNext(startState)
  }, [checkPlayerClaims])

  // Run bot turns when it's not the player's turn
  useEffect(() => {
    if (!game || isPlayerTurn || isGameOver(game) || claimPhase || botsProcessing) return

    // Small delay before bots start
    const timer = setTimeout(() => {
      runBotTurns(game)
    }, 500)

    return () => clearTimeout(timer)
  }, [game?.gameState.currentTurn])

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-[var(--text-muted)]">Setting up the table...</p>
      </div>
    )
  }

  // Charleston phase
  if (charleston && !charleston.complete && game.gameState.status === 'charleston') {
    const playerHand = game.gameState.players.find((p) => p.id === 'player')!.hand
    return (
      <CharlestonPhase
        hand={playerHand}
        step={charleston.step}
        direction={charleston.direction}
        onPass={handleCharlestonPass}
      />
    )
  }

  const player = game.gameState.players.find((p) => p.id === 'player')!
  const opponents = game.gameState.players.filter((p) => p.id !== 'player')
  const gameOver = isGameOver(game)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-table)' }}>
      {/* Game Header — dark, elegant */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 bg-[var(--bg-deep)] border-b border-[rgba(255,255,255,0.08)]" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
        <div className="flex items-center gap-3 text-[#A09888]">
          <span className="text-xs sm:text-sm font-medium">
            Wall: <span className="text-[var(--accent-gold)]">{game.gameState.tilesRemaining}</span>
          </span>
          <span className="text-[rgba(255,255,255,0.15)] hidden sm:inline">|</span>
          <span className="text-xs sm:text-sm font-medium hidden sm:inline">
            Round <span className="text-[var(--accent-gold)]">{game.gameState.round}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCard(true)}
            className="px-3 sm:px-4 h-8 sm:h-9 inline-flex items-center rounded-md text-xs sm:text-sm font-semibold
              bg-[var(--accent-gold)] text-[var(--text-inverse)]
              active:bg-[var(--accent-gold-dark)] active:scale-[0.97]
              transition-all duration-150"
          >
            NMJL Card
          </button>
          <a
            href="/lobby"
            className="px-3 sm:px-4 h-8 sm:h-9 inline-flex items-center text-xs sm:text-sm rounded-md bg-[rgba(255,255,255,0.08)] text-[#A09888] hover:bg-[rgba(255,255,255,0.12)] active:bg-[rgba(255,255,255,0.18)] transition-all"
          >
            Leave
          </a>
        </div>
      </header>

      {/* Opponents — on the felt */}
      <div className="flex justify-center gap-2 sm:gap-4 px-3 sm:px-6 py-3 sm:py-5 flex-wrap">
        {opponents.map((opp) => (
          <OpponentRow
            key={opp.id}
            player={opp}
            isCurrentTurn={game.gameState.currentTurn === opp.id}
          />
        ))}
      </div>

      {/* Center — Discard pile + status */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 sm:gap-5 px-3 sm:px-6">
        <DiscardPile discards={game.gameState.discardPile} />

        {/* Status message */}
        <div
          className="px-4 sm:px-8 py-3 sm:py-4 rounded-[var(--radius-lg)] text-center max-w-md w-full sm:w-auto"
          style={{
            background: 'rgba(250, 247, 242, 0.95)',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--border)',
          }}
        >
          <p className="text-[var(--text-primary)] text-base sm:text-lg font-medium" style={{ fontFamily: 'var(--font-body)' }}>{message}</p>
        </div>

        {/* Action buttons */}
        {!gameOver && isPlayerTurn && !claimPhase && (
          <div className="flex gap-4">
            {!hasDrawn && (
              <button onClick={handleDraw} className="btn-primary text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-4">
                Draw Tile
              </button>
            )}
            {hasDrawn && selectedTile && (
              <button
                onClick={() => handleTileClick(selectedTile)}
                className="px-8 sm:px-10 py-3 sm:py-4 rounded-[var(--radius-md)] text-base sm:text-lg font-semibold text-[var(--text-inverse)] min-h-[var(--touch-min)] transition-all"
                style={{
                  background: 'var(--accent-warm)',
                  boxShadow: '0 4px 12px rgba(196, 106, 60, 0.3)',
                  letterSpacing: '0.02em',
                }}
              >
                Discard Selected
              </button>
            )}
          </div>
        )}

        {gameOver && (
          <GameOverScreen
            gameState={game.gameState}
            onPlayAgain={() => {
              const ng = createDemoGame()
              ng.gameState.status = 'charleston' as const
              setGame(ng)
              setSelectedTile(null)
              setHasDrawn(false)
              setClaimPhase(null)
              setBotsProcessing(false)
              setCharleston(createCharlestonState())
              setMessage('The Charleston — select 3 tiles to pass.')
            }}
          />
        )}
      </div>

      {/* Player exposed groups */}
      {player.exposed.length > 0 && (
        <div className="px-6 py-3 flex justify-center">
          <ExposedGroups groups={player.exposed} />
        </div>
      )}

      {/* Player hand — warm elevated tray */}
      <div
        className="px-2 sm:px-6 py-3 sm:py-5 border-t"
        style={{
          background: 'var(--bg-elevated)',
          borderColor: 'var(--border)',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
        }}
      >
        <PlayerHand
          tiles={player.hand}
          selectedTileId={selectedTile}
          onTileClick={handleTileClick}
          canDiscard={isPlayerTurn && hasDrawn && !claimPhase}
        />
      </div>

      {/* Claim dialog */}
      {claimPhase && game && (
        <ClaimDialog
          discardedTile={game.gameState.discardPile[claimPhase.discardIndex].tile}
          validClaims={claimPhase.validClaims}
          onClaim={handleClaim}
          onPass={handlePassClaim}
        />
      )}

      {/* NMJL Card Viewer */}
      <NmjlCardViewer isOpen={showCard} onClose={() => setShowCard(false)} />
    </div>
  )
}
