'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import type { TileId } from '@/lib/tiles/constants'
import type { ClaimType, GameMode } from '@/lib/game-engine/types'
import {
  createDemoGame,
  createGameForMode,
  drawTile,
  discardTile,
  botTurn,
  isGameOver,
  rotateDealerForNextRound,
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
  executeCharlestonBlindPass,
  executeCourtesyPass,
  submitStopVote,
} from '@/lib/game-engine/charleston'
import type { CharlestonState } from '@/lib/game-engine/charleston'
import { hasWinningHand, findMatchingHands, wouldCompleteHand } from '@/lib/nmjl/matcher'
import { calculateScore, applyScores } from '@/lib/game-engine/scoring'

type ClaimPhase = {
  discardIndex: number
  validClaims: ClaimType[]
} | null

const TURN_TIMER_SEC = 60

export type GameBoardProps = {
  /**
   * Optional ruleset variant. Defaults to 'standard' (4-player, full wall build,
   * Charleston). Variants skip Charleston and follow DRAFT GUIDE alternate rules.
   */
  mode?: GameMode
}

export function GameBoard({ mode }: GameBoardProps = {}) {
  const [game, setGame] = useState<DemoGameState | null>(null)
  const [selectedTile, setSelectedTile] = useState<TileId | null>(null)
  const [message, setMessage] = useState('')
  const [hasDrawn, setHasDrawn] = useState(false)
  const [claimPhase, setClaimPhase] = useState<ClaimPhase>(null)
  const [botsProcessing, setBotsProcessing] = useState(false)
  const [showCard, setShowCard] = useState(false)
  const [charleston, setCharleston] = useState<CharlestonState | null>(null)
  const [canDeclareMahjong, setCanDeclareMahjong] = useState(false)

  // Turn timer state
  const [turnTimer, setTurnTimer] = useState(TURN_TIMER_SEC)
  const gameRef = useRef<DemoGameState | null>(null)
  const hasDrawnRef = useRef(false)

  // Keep refs in sync with state
  useEffect(() => {
    gameRef.current = game
  }, [game])

  useEffect(() => {
    hasDrawnRef.current = hasDrawn
  }, [hasDrawn])

  // Initialize game
  useEffect(() => {
    const resolvedMode: GameMode = mode ?? 'standard'
    const newGame =
      resolvedMode === 'standard'
        ? createDemoGame()
        : createGameForMode(resolvedMode)

    if (resolvedMode === 'standard') {
      // Standard: open with Charleston.
      newGame.gameState.status = 'charleston' as const
      setGame(newGame)
      setCharleston(createCharlestonState())
      setMessage('The Charleston — select 3 tiles to pass.')
      setHasDrawn(false)
    } else {
      // Variants skip Charleston; dealer opens play holding 14 tiles.
      setGame(newGame)
      setCharleston(null)
      setHasDrawn(true)
      const opener =
        newGame.gameState.currentTurn === 'player'
          ? 'Your turn — tap a tile to discard.'
          : `${newGame.gameState.players.find((p) => p.id === newGame.gameState.currentTurn)?.displayName ?? 'Dealer'} opens play…`
      setMessage(opener)
    }
  }, [mode])

  // Reset turn timer when it becomes the player's turn during playing phase
  useEffect(() => {
    if (
      game?.gameState.currentTurn === 'player' &&
      game?.gameState.status === 'playing'
    ) {
      setTurnTimer(TURN_TIMER_SEC)
    }
  }, [game?.gameState.currentTurn, game?.gameState.status])

  // Countdown timer — ticks every second only when it's the player's turn in playing phase
  useEffect(() => {
    if (
      !game ||
      game.gameState.currentTurn !== 'player' ||
      game.gameState.status !== 'playing' ||
      isGameOver(game) ||
      claimPhase
    ) {
      return
    }

    const interval = setInterval(() => {
      setTurnTimer((prev) => {
        if (prev <= 1) {
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [game?.gameState.currentTurn, game?.gameState.status, claimPhase])

  // Auto-play when timer reaches 0 — separate effect so it fires once, not every tick
  useEffect(() => {
    if (turnTimer !== 0) return
    // Immediately set to -1 to prevent double-fire on re-render
    setTurnTimer(-1)
    if (!gameRef.current) return
    if (gameRef.current.gameState.currentTurn !== 'player') return
    if (gameRef.current.gameState.status !== 'playing') return
    if (isGameOver(gameRef.current)) return

    const currentGame = gameRef.current
    const currentHasDrawn = hasDrawnRef.current

    if (!currentHasDrawn) {
      // Auto-draw first
      const drawResult = drawTile(currentGame)
      if (!drawResult) {
        setGame((prev) =>
          prev
            ? { ...prev, gameState: { ...prev.gameState, status: 'finished' } }
            : null
        )
        setMessage('No tiles left — wall game!')
        return
      }

      // Then auto-discard a random non-joker tile
      const drawnPlayer = drawResult.state.gameState.players.find(
        (p) => p.id === 'player'
      )!
      const nonJokers = drawnPlayer.hand.filter((t) => t.type.kind !== 'joker')
      const candidates = nonJokers.length > 0 ? nonJokers : drawnPlayer.hand
      if (candidates.length === 0) return

      const autoDiscard =
        candidates[Math.floor(Math.random() * candidates.length)]
      const discardResult = discardTile(
        drawResult.state,
        'player',
        autoDiscard.id
      )
      if (!discardResult) return

      setGame(discardResult)
      setHasDrawn(false)
      setSelectedTile(null)
      setMessage('Time ran out — auto-played for you.')
    } else {
      // Already drawn — auto-discard a random non-joker tile
      const currentPlayer = currentGame.gameState.players.find(
        (p) => p.id === 'player'
      )!
      const nonJokers = currentPlayer.hand.filter(
        (t) => t.type.kind !== 'joker'
      )
      const candidates =
        nonJokers.length > 0 ? nonJokers : currentPlayer.hand
      if (candidates.length === 0) return

      const autoDiscard =
        candidates[Math.floor(Math.random() * candidates.length)]
      const discardResult = discardTile(
        currentGame,
        'player',
        autoDiscard.id
      )
      if (!discardResult) return

      setGame(discardResult)
      setHasDrawn(false)
      setSelectedTile(null)
      setMessage('Time ran out — auto-discarded for you.')
    }
  }, [turnTimer])

  // Messages for the current charleston state, used after each pass/vote
  const describeCharleston = useCallback((c: CharlestonState): string => {
    if (c.phase === 'stop_vote') {
      return 'First Charleston complete — continue to the second, or stop?'
    }
    if (c.phase === 'courtesy') {
      return 'Offer 0-3 tiles to the player across — or skip.'
    }
    return `Pass ${c.step} of 3 — select 3 tiles to pass ${c.direction}.`
  }, [])

  // Handle charleston pass (standard 3-tile)
  const handleCharlestonPass = useCallback(
    (tileIds: TileId[]) => {
      if (!game || !charleston) return

      const result = executeCharlestonPass(game, charleston, tileIds)
      if (!result) return

      setGame(result.gameState)
      setCharleston(result.charleston)
      setMessage(describeCharleston(result.charleston))
    },
    [game, charleston, describeCharleston]
  )

  // Handle blind pass
  const handleBlindPass = useCallback(
    (blindTileIds: TileId[], fromHandTileIds: TileId[]) => {
      if (!game || !charleston) return

      const result = executeCharlestonBlindPass(
        game,
        charleston,
        blindTileIds,
        fromHandTileIds
      )
      if (!result) return

      setGame(result.gameState)
      setCharleston(result.charleston)
      setMessage(describeCharleston(result.charleston))
    },
    [game, charleston, describeCharleston]
  )

  // Handle stop vote (post first Charleston)
  const handleStopVote = useCallback(
    (stop: boolean) => {
      if (!game || !charleston) return
      const result = submitStopVote(game, charleston, stop)
      if (!result) return

      setGame(result.gameState)
      setCharleston(result.charleston)
      if (result.charleston.phase === 'courtesy') {
        setMessage(
          stop
            ? 'Charleston stopped. One last courtesy pass before play begins.'
            : 'A player voted to stop. One last courtesy pass before play begins.'
        )
      } else {
        setMessage('Second Charleston — pass 1 of 3. Select 3 tiles to pass left.')
      }
    },
    [game, charleston]
  )

  // Handle courtesy pass
  const handleCourtesyPass = useCallback(
    (humanCount: number, tileIds: TileId[]) => {
      if (!game || !charleston) return
      const result = executeCourtesyPass(game, charleston, humanCount, tileIds)
      if (!result) return

      // Courtesy concludes charleston — transition to playing
      const finalGame = {
        ...result.gameState,
        gameState: { ...result.gameState.gameState, status: 'playing' as const },
      }
      setGame(finalGame)
      setCharleston(null)
      setHasDrawn(true) // East starts with 14 tiles
      setMessage(
        humanCount === 0
          ? 'Charleston complete! Your turn — tap a tile to discard.'
          : 'Courtesy pass complete! Your turn — tap a tile to discard.'
      )
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
    setTurnTimer(TURN_TIMER_SEC)

    // Check if player now has a winning hand (self-draw Mahjong)
    const playerState = result.state.gameState.players.find((p) => p.id === 'player')!
    if (hasWinningHand(playerState.hand, playerState.exposed)) {
      setCanDeclareMahjong(true)
      setMessage('You have a winning hand! Declare Mahjong or discard to continue.')
    } else {
      setCanDeclareMahjong(false)
      setMessage('You drew a tile. Tap a tile to discard.')
    }
  }, [game, isPlayerTurn, hasDrawn])

  // Handle declaring Mahjong
  const handleDeclareMahjong = useCallback(
    (method: 'self_draw' | 'discard', discarderId?: string) => {
      if (!game) return
      const player = game.gameState.players.find((p) => p.id === 'player')!
      const matches = findMatchingHands(player.hand, player.exposed)
      if (matches.length === 0) {
        setMessage('Your hand does not match any NMJL pattern.')
        setCanDeclareMahjong(false)
        return
      }
      const winningHand = matches[0]
      const scoreResult = calculateScore(game.gameState, 'player', method, winningHand.points, discarderId)
      const updatedPlayers = applyScores(game.gameState.players, scoreResult)
      setGame({
        ...game,
        gameState: {
          ...game.gameState,
          status: 'finished',
          winnerId: 'player',
          winningMethod: method,
          winningHandId: winningHand.id,
          players: updatedPlayers,
        },
      })
      setCanDeclareMahjong(false)
      setMessage(`Mahjong! You won with "${winningHand.pattern}" for ${winningHand.points} points!`)
    },
    [game]
  )

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

      // Mahjong claim — declare win from discard
      if (claimType === 'mahjong') {
        setClaimPhase(null)
        handleDeclareMahjong('discard', discard.discardedBy)
        return
      }

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
        // Check if it's a joker — can't discard jokers
        const player = game.gameState.players.find((p) => p.id === 'player')!
        const tile = player.hand.find((t) => t.id === tileId)
        if (tile?.type.kind === 'joker') {
          setMessage('Jokers cannot be discarded!')
          setSelectedTile(null)
          return
        }

        // Second click — discard
        const result = discardTile(game, 'player', tileId)
        if (!result) {
          setMessage('Cannot discard that tile.')
          setSelectedTile(null)
          return
        }

        setGame(result)
        setSelectedTile(null)
        setHasDrawn(false)
        setCanDeclareMahjong(false)
        setMessage('Bots are playing...')

        // Check if any bot wants to claim
        checkBotClaimsAfterDiscard(result)
      } else {
        setSelectedTile(tileId)
        // Warn if selecting a joker
        const player = game.gameState.players.find((p) => p.id === 'player')!
        const tile = player.hand.find((t) => t.id === tileId)
        if (tile?.type.kind === 'joker') {
          setMessage('Jokers cannot be discarded. Choose a different tile.')
        } else {
          setMessage('Tap again to discard, or choose a different tile.')
        }
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

      // Check bots in turn order priority (next in turn first, then others)
      const discarderId = lastDiscard.discardedBy
      const turnOrder = state.gameState.turnOrder
      const discarderIndex = turnOrder.indexOf(discarderId)
      const seatCount = turnOrder.length
      const bots = state.gameState.players
        .filter((p) => p.isBot && !p.isDead)
        .sort((a, b) => {
          // Sort by proximity to discarder in turn order (next player first)
          const aIdx = (turnOrder.indexOf(a.id) - discarderIndex + seatCount) % seatCount
          const bIdx = (turnOrder.indexOf(b.id) - discarderIndex + seatCount) % seatCount
          return aIdx - bIdx
        })
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
              // Bot claimed Mahjong — end the game
              if (claim === 'mahjong') {
                setBotsProcessing(false)
                setGame(result)
                setMessage(`${bot.displayName} declared Mahjong!`)
                return
              }

              // Bot claimed — they need to discard
              setBotsProcessing(true)
              setMessage(`${bot.displayName} claimed a ${claim}!`)
              setTimeout(() => {
                setBotsProcessing(false)
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

  // Charleston phase (handles pass, stop vote, courtesy, and both rounds)
  if (charleston && !charleston.complete && game.gameState.status === 'charleston') {
    const playerHand = game.gameState.players.find((p) => p.id === 'player')!.hand
    return (
      <CharlestonPhase
        hand={playerHand}
        charleston={charleston}
        onPass={handleCharlestonPass}
        onBlindPass={handleBlindPass}
        onStopVote={handleStopVote}
        onCourtesy={handleCourtesyPass}
      />
    )
  }

  const player = game.gameState.players.find((p) => p.id === 'player')!
  const opponents = game.gameState.players.filter((p) => p.id !== 'player')
  const gameOver = isGameOver(game)

  // Show timer only during playing phase when it's the player's turn
  const showTimer =
    isPlayerTurn &&
    game.gameState.status === 'playing' &&
    !gameOver &&
    !claimPhase

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

        {/* Status message with turn timer */}
        <div
          className="px-4 sm:px-8 py-3 sm:py-4 rounded-[var(--radius-lg)] text-center max-w-md w-full sm:w-auto"
          style={{
            background: 'rgba(250, 247, 242, 0.95)',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--border)',
          }}
        >
          <p className="text-[var(--text-primary)] text-base sm:text-lg font-medium" style={{ fontFamily: 'var(--font-body)' }}>
            {message}
            {showTimer && (
              <span
                className={`ml-2 font-bold ${
                  turnTimer <= 15
                    ? 'text-[var(--accent-warm)]'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                — {turnTimer}s
              </span>
            )}
          </p>
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
            {canDeclareMahjong && (
              <button
                onClick={() => handleDeclareMahjong('self_draw')}
                className="btn-gold text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-4 animate-pulse"
              >
                Declare Mahjong!
              </button>
            )}
          </div>
        )}

        {gameOver && (
          <GameOverScreen
            gameState={game.gameState}
            onPlayAgain={() => {
              // Determine if this was a wall game (no winner)
              const wasWallGame = game.gameState.winnerId === null
              // Rotate dealer: same dealer if wall game, next dealer if someone won
              const seatCount = game.gameState.turnOrder.length || 4
              const newDealerIndex = wasWallGame
                ? game.gameState.dealerIndex
                : (game.gameState.dealerIndex + 1) % seatCount
              const resolvedMode: GameMode = mode ?? 'standard'
              const ng =
                resolvedMode === 'standard'
                  ? createDemoGame(newDealerIndex)
                  : createGameForMode(resolvedMode, { dealerIndex: newDealerIndex })
              ng.gameState.round = game.gameState.round + 1
              setGame(ng)
              setSelectedTile(null)
              setClaimPhase(null)
              setBotsProcessing(false)
              setTurnTimer(TURN_TIMER_SEC)
              if (resolvedMode === 'standard') {
                ng.gameState.status = 'charleston' as const
                setHasDrawn(false)
                setCharleston(createCharlestonState())
                setMessage('The Charleston — select 3 tiles to pass.')
              } else {
                setHasDrawn(true)
                setCharleston(null)
                setMessage(
                  ng.gameState.currentTurn === 'player'
                    ? 'Your turn — tap a tile to discard.'
                    : 'Dealer opens play…',
                )
              }
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
