'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { TileId } from '@/lib/tiles/constants'
import type { BotDifficulty, ClaimType, GameMode, PlayerState } from '@/lib/game-engine/types'
import {
  createDemoGame,
  createGameForMode,
  drawTile,
  discardTile,
  botTurn,
  isGameOver,
  chooseBotDiscard,
  collectAndResolveClaims,
  winByDiscard,
  extractMatch,
} from '@/lib/game-engine/engine'
import type { DemoGameState } from '@/lib/game-engine/engine'
import {
  getValidClaims,
  getClaimTileIds,
  executeClaim,
} from '@/lib/game-engine/claims'
import { findJokerSwaps, executeJokerSwap } from '@/lib/game-engine/jokerSwap'
import { JokerSwapDialog } from './JokerSwapDialog'
import type { JokerSwapOption } from './JokerSwapDialog'
import { SeatPlaque } from './SeatPlaque'
import { PlayerHand } from './PlayerHand'
import { DiscardPile } from './DiscardPile'
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
import { hasWinningHand, findMatchingHands } from '@/lib/nmjl/matcher'
import { calculateScore, applyScores } from '@/lib/game-engine/scoring'

type ClaimPhase = {
  discardIndex: number
  validClaims: ClaimType[]
} | null

const DEFAULT_TIMER_SEC = 60

export type GameBoardProps = {
  /**
   * Optional ruleset variant. Defaults to 'standard' (4-player, full wall build,
   * Charleston). Variants skip Charleston and follow DRAFT GUIDE alternate rules.
   */
  mode?: GameMode
  /** Seconds per turn. 0 = relaxed play, no timer. Defaults to 60. */
  timerSec?: number
  /** How the bots play. 'easy' (default) is random; 'clever' builds hands. */
  botDifficulty?: BotDifficulty
  /** Table size for the 'short' variant (2 or 3 players). */
  playerCount?: 2 | 3
}

export function GameBoard({ mode, timerSec, botDifficulty, playerCount }: GameBoardProps = {}) {
  const timerLimit = timerSec ?? DEFAULT_TIMER_SEC
  const timerEnabled = timerLimit > 0
  const difficulty: BotDifficulty = botDifficulty ?? 'easy'
  const [game, setGame] = useState<DemoGameState | null>(null)
  const [selectedTile, setSelectedTile] = useState<TileId | null>(null)
  const [message, setMessage] = useState('')
  const [hasDrawn, setHasDrawn] = useState(false)
  const [claimPhase, setClaimPhase] = useState<ClaimPhase>(null)
  const [botsProcessing, setBotsProcessing] = useState(false)
  const [showCard, setShowCard] = useState(false)
  const [charleston, setCharleston] = useState<CharlestonState | null>(null)
  const [canDeclareMahjong, setCanDeclareMahjong] = useState(false)
  const [swapDialogOpen, setSwapDialogOpen] = useState(false)

  // Turn timer state
  const [turnTimer, setTurnTimer] = useState(timerLimit)
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
        : createGameForMode(resolvedMode, { playerCount })

    if (resolvedMode === 'standard') {
      // Standard: open with Charleston.
      newGame.gameState.status = 'charleston' as const
      setGame(newGame)
      setCharleston(createCharlestonState())
      setMessage('The Charleston - select 3 tiles to pass.')
      setHasDrawn(false)
    } else {
      // Variants skip Charleston; dealer opens play holding 14 tiles.
      setGame(newGame)
      setCharleston(null)
      setHasDrawn(true)
      const opener =
        newGame.gameState.currentTurn === 'player'
          ? 'Your turn - tap a tile to discard.'
          : `${newGame.gameState.players.find((p) => p.id === newGame.gameState.currentTurn)?.displayName ?? 'Dealer'} opens play…`
      setMessage(opener)
    }
  }, [mode, playerCount])

  // Reset turn timer when it becomes the player's turn during playing phase
  useEffect(() => {
    if (
      game?.gameState.currentTurn === 'player' &&
      game?.gameState.status === 'playing'
    ) {
      setTurnTimer(timerLimit)
    }
  }, [game?.gameState.currentTurn, game?.gameState.status])

  // Countdown timer - ticks every second only when it's the player's turn in playing phase
  useEffect(() => {
    if (
      !timerEnabled ||
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

  // Auto-play when timer reaches 0 - separate effect so it fires once, not every tick
  useEffect(() => {
    if (!timerEnabled || turnTimer !== 0) return
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
        setMessage('No tiles left - wall game!')
        return
      }

      // Then auto-discard a random non-joker, non-flower tile. Flowers should
      // already be auto-exposed during drawTile, but filter defensively.
      const drawnPlayer = drawResult.state.gameState.players.find(
        (p) => p.id === 'player'
      )!
      const candidates = drawnPlayer.hand.filter(
        (t) => t.type.kind !== 'joker' && t.type.kind !== 'flower'
      )
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
      setMessage('Time ran out - auto-played for you.')
    } else {
      // Already drawn - auto-discard a random non-joker tile
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
      setMessage('Time ran out - auto-discarded for you.')
    }
  }, [turnTimer])

  // Messages for the current charleston state, used after each pass/vote
  const describeCharleston = useCallback((c: CharlestonState): string => {
    if (c.phase === 'stop_vote') {
      return 'First Charleston complete - continue to the second, or stop?'
    }
    if (c.phase === 'courtesy') {
      return 'Offer 0-3 tiles to the player across - or skip.'
    }
    return `Pass ${c.step} of 3 - select 3 tiles to pass ${c.direction}.`
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
        setMessage('Second Charleston - pass 1 of 3. Select 3 tiles to pass left.')
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

      // Courtesy concludes charleston - transition to playing
      const finalGame = {
        ...result.gameState,
        gameState: { ...result.gameState.gameState, status: 'playing' as const },
      }
      setGame(finalGame)
      setCharleston(null)
      setHasDrawn(true) // East starts with 14 tiles
      setMessage(
        humanCount === 0
          ? 'Charleston complete! Your turn - tap a tile to discard.'
          : 'Courtesy pass complete! Your turn - tap a tile to discard.'
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
      setMessage('No tiles left - wall game!')
      setGame((prev) =>
        prev ? { ...prev, gameState: { ...prev.gameState, status: 'finished' } } : null
      )
      return
    }

    setGame(result.state)
    setHasDrawn(true)
    setTurnTimer(timerLimit)

    // Check if player now has a winning hand (self-draw Mahjong)
    const playerState = result.state.gameState.players.find((p) => p.id === 'player')!
    if (hasWinningHand(playerState.hand, playerState.exposed)) {
      setCanDeclareMahjong(true)
      setMessage('You have a winning hand! Declare Mahjong or discard to continue.')
    } else {
      setCanDeclareMahjong(false)
      setMessage('You drew a tile. Tap a tile to discard.')
    }
  }, [game, isPlayerTurn, hasDrawn, timerLimit])

  // Handle declaring Mahjong on a self-drawn 14-tile hand.
  // Picks the best-paying match (jokerless wins double, except Singles & Pairs)
  // and threads joker usage + any deferred Mahjong-in-Error penalty to scoring.
  const handleDeclareMahjong = useCallback(() => {
    if (!game) return
    const player = game.gameState.players.find((p) => p.id === 'player')!
    const matches = findMatchingHands(player.hand, player.exposed)
    if (matches.length === 0) {
      setMessage('Your hand does not match any NMJL pattern.')
      setCanDeclareMahjong(false)
      return
    }
    const scored = matches.map((m) => extractMatch(m))
    const effective = (x: (typeof scored)[number]) =>
      x.hand.points *
      (x.jokersUsed === 0 && x.hand.category !== 'singles-and-pairs' ? 2 : 1)
    const best = scored.sort((a, b) => effective(b) - effective(a))[0]

    const scoreResult = calculateScore(
      game.gameState,
      'player',
      'self_draw',
      best.hand.points,
      {
        jokersUsed: best.jokersUsed,
        handCategory: best.hand.category,
        pendingMahjongError: game.gameState.pendingMahjongError ?? null,
      }
    )
    const updatedPlayers = applyScores(game.gameState.players, scoreResult)
    setGame({
      ...game,
      gameState: {
        ...game.gameState,
        status: 'finished',
        winnerId: 'player',
        winningMethod: 'self_draw',
        winningHandId: best.hand.id,
        players: updatedPlayers,
        pendingMahjongError: null,
      },
    })
    setCanDeclareMahjong(false)
    const bonus = scoreResult.jokerlessBonus ? ' Jokerless - payments doubled!' : ''
    setMessage(`Mahjong! You won with "${best.hand.pattern}" for ${best.hand.points} points!${bonus}`)
  }, [game])

  // Handle winning off a discard (via the claim dialog). winByDiscard moves
  // the claimed tile into the hand, verifies the 14 tiles, and scores it -
  // discarder pays double, jokerless bonus applied.
  const handleWinByDiscard = useCallback(
    (discardIndex: number) => {
      if (!game) return
      const won = winByDiscard(game, 'player', discardIndex)
      if (!won) {
        setMessage('Your hand does not match any NMJL pattern with that tile.')
        return
      }
      setGame(won)
      setCanDeclareMahjong(false)
      const handId = won.gameState.winningHandId
      setMessage(`Mahjong! You claimed the discard and won${handId ? ` with "${handId}"` : ''}!`)
    },
    [game]
  )

  // Exchange a natural tile for a joker in an exposed group (NMJL joker rule).
  // The swapped-in joker may complete the hand, so re-check for Mahjong.
  const handleJokerSwap = useCallback(
    (swap: JokerSwapOption) => {
      if (!game) return
      const result = executeJokerSwap(
        game,
        'player',
        swap.handTileId,
        swap.targetPlayerId,
        swap.groupIndex,
        swap.jokerTileId
      )
      if (!result) {
        setMessage('That swap is no longer available.')
        setSwapDialogOpen(false)
        return
      }
      setGame(result.state)
      setSwapDialogOpen(false)
      setSelectedTile(null)
      const player = result.state.gameState.players.find((p) => p.id === 'player')!
      if (hasWinningHand(player.hand, player.exposed)) {
        setCanDeclareMahjong(true)
        setMessage('Joker swapped - and you have a winning hand! Declare Mahjong or discard.')
      } else {
        setMessage('Joker swapped into your hand. Now discard a tile.')
      }
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

  // Run bot turns sequentially with delays
  const runBotTurns = useCallback((startState: DemoGameState) => {
    if (isGameOver(startState) || startState.gameState.currentTurn === 'player') {
      setGame(startState)
      if (isGameOver(startState)) {
        setMessage('Wall game - no tiles remain! No winner this round.')
      } else {
        setHasDrawn(false)
        setMessage('Your turn - tap Draw to pick up a tile.')
      }
      return
    }

    setBotsProcessing(true)

    const runNext = (state: DemoGameState) => {
      if (state.gameState.currentTurn === 'player' || isGameOver(state)) {
        setGame(state)
        setBotsProcessing(false)
        if (isGameOver(state)) {
          setMessage('Wall game - no tiles remain! No winner this round.')
        } else {
          // Check if player can claim the last discard
          if (!checkPlayerClaims(state)) {
            setHasDrawn(false)
            setMessage('Your turn - tap Draw to pick up a tile.')
          }
        }
        return
      }

      setTimeout(() => {
        const result = botTurn(state, difficulty)
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
            setMessage('Your turn - tap Draw to pick up a tile.')
          }
        } else {
          // Check if player can claim this bot's discard before next bot goes
          const discardPile = result.gameState.discardPile
          const discardIndex = discardPile.length - 1
          const lastDiscard = discardPile[discardIndex]
          if (lastDiscard && !lastDiscard.claimed && lastDiscard.discardedBy !== 'player') {
            const player = result.gameState.players.find((p) => p.id === 'player')!
            const claims = getValidClaims(player, lastDiscard.tile)
            if (claims.length > 0) {
              setBotsProcessing(false)
              setClaimPhase({
                discardIndex,
                validClaims: claims,
              })
              return
            }

            // Human passed (no claims) - other bots may claim this discard.
            const winning = collectAndResolveClaims(result, discardIndex, null)
            if (winning && winning.claimerId !== lastDiscard.discardedBy) {
              const claimer = result.gameState.players.find((p) => p.id === winning.claimerId)
              if (claimer) {
                if (winning.claimType === 'mahjong') {
                  const won = winByDiscard(result, claimer.id, discardIndex)
                  if (won) {
                    setGame(won)
                    setBotsProcessing(false)
                    setMessage(`${claimer.displayName} declared Mahjong!`)
                    return
                  }
                } else {
                  const claimed = executeClaim(result, claimer.id, discardIndex, winning.claimType, winning.tileIds)
                  if (claimed) {
                    setMessage(`${claimer.displayName} claimed a ${winning.claimType}!`)
                    const claimerState = claimed.gameState.players.find((p) => p.id === claimer.id)!
                    const tile = chooseBotDiscard(claimerState, difficulty)
                    if (tile) {
                      const afterDiscard = discardTile(claimed, claimer.id, tile.id)
                      if (afterDiscard) {
                        setGame(afterDiscard)
                        if (afterDiscard.gameState.currentTurn === 'player') {
                          setBotsProcessing(false)
                          if (!checkPlayerClaims(afterDiscard)) {
                            setHasDrawn(false)
                            setMessage('Your turn - tap Draw to pick up a tile.')
                          }
                          return
                        }
                        runNext(afterDiscard)
                        return
                      }
                    }
                    setGame(claimed)
                    runNext(claimed)
                    return
                  }
                }
              }
            }
          }
          runNext(result)
        }
      }, 800)
    }

    runNext(startState)
  }, [checkPlayerClaims, difficulty])

  // After a discard the human has passed on (or made), give the bots their
  // window. collectAndResolveClaims polls every live bot and arbitrates by
  // NMJL priority - a Mahjong claim beats any exposure claim, ties go to the
  // seat closest after the discarder.
  const checkBotClaimsAfterDiscard = useCallback(
    (state: DemoGameState) => {
      const discardPile = state.gameState.discardPile
      const discardIndex = discardPile.length - 1
      const lastDiscard = discardPile[discardIndex]
      if (!lastDiscard || lastDiscard.claimed) {
        runBotTurns(state)
        return
      }

      const winning = collectAndResolveClaims(state, discardIndex, null)
      if (!winning) {
        runBotTurns(state)
        return
      }

      const bot = state.gameState.players.find((p) => p.id === winning.claimerId)
      if (!bot) {
        runBotTurns(state)
        return
      }

      // Bot wins off the discard - scored and finished by the engine.
      if (winning.claimType === 'mahjong') {
        const won = winByDiscard(state, bot.id, discardIndex)
        setBotsProcessing(false)
        if (won) {
          setGame(won)
          setMessage(`${bot.displayName} declared Mahjong!`)
        } else {
          runBotTurns(state)
        }
        return
      }

      const result = executeClaim(state, bot.id, discardIndex, winning.claimType, winning.tileIds)
      if (!result) {
        runBotTurns(state)
        return
      }

      // Bot claimed an exposure - it must now discard.
      setBotsProcessing(true)
      setMessage(`${bot.displayName} claimed a ${winning.claimType}!`)
      setTimeout(() => {
        setBotsProcessing(false)
        const botPlayer = result.gameState.players.find((p) => p.id === bot.id)!
        const tile = chooseBotDiscard(botPlayer, difficulty)
        if (!tile) return
        const afterDiscard = discardTile(result, bot.id, tile.id)
        if (!afterDiscard) return

        setGame(afterDiscard)

        // Check if player can claim this bot's discard
        if (afterDiscard.gameState.currentTurn === 'player') {
          if (!checkPlayerClaims(afterDiscard)) {
            setHasDrawn(false)
            setMessage('Your turn - tap Draw to pick up a tile.')
          }
        } else {
          runBotTurns(afterDiscard)
        }
      }, 1000)
    },
    [difficulty, runBotTurns, checkPlayerClaims]
  )

  // Handle player claiming a discard
  const handleClaim = useCallback(
    (claimType: ClaimType) => {
      if (!game || !claimPhase) return

      const discard = game.gameState.discardPile[claimPhase.discardIndex]

      // Mahjong claim - win off the discard
      if (claimType === 'mahjong') {
        setClaimPhase(null)
        handleWinByDiscard(claimPhase.discardIndex)
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
    [game, claimPhase, handleWinByDiscard]
  )

  // Handle player passing on a claim - the bots then get their chance at the
  // same discard (seat-priority arbitrated) before play continues.
  const handlePassClaim = useCallback(() => {
    setClaimPhase(null)
    if (game) {
      checkBotClaimsAfterDiscard(game)
    }
  }, [game, checkBotClaimsAfterDiscard])

  // Handle tile click - select then discard
  const handleTileClick = useCallback(
    (tileId: TileId) => {
      if (!game || !isPlayerTurn || !hasDrawn || claimPhase) return

      if (selectedTile === tileId) {
        // Check if it's a joker - can't discard jokers
        const player = game.gameState.players.find((p) => p.id === 'player')!
        const tile = player.hand.find((t) => t.id === tileId)
        if (tile?.type.kind === 'joker') {
          setMessage('Jokers cannot be discarded!')
          setSelectedTile(null)
          return
        }

        // Second click - discard
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
    [game, isPlayerTurn, selectedTile, hasDrawn, claimPhase, checkBotClaimsAfterDiscard]
  )

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
  const gameOver = isGameOver(game)

  // Show timer only during playing phase when it's the player's turn
  const showTimer =
    timerEnabled &&
    isPlayerTurn &&
    game.gameState.status === 'playing' &&
    !gameOver &&
    !claimPhase

  // Legal joker exchanges, offered once the player has drawn (14 tiles in hand)
  const jokerSwaps =
    isPlayerTurn && hasDrawn && game.gameState.status === 'playing' && !gameOver
      ? findJokerSwaps(player, game.gameState.players)
      : []

  // Seats around the table, counter-clockwise from you: next player on your
  // right, then across, then left - the real-table arrangement.
  const order = game.gameState.turnOrder
  const seatCount2 = order.length
  const meIdx = order.indexOf('player')
  const seatAt = (rel: number) =>
    game.gameState.players.find((p) => p.id === order[(meIdx + rel) % seatCount2])
  const rightSeat = seatCount2 >= 3 ? seatAt(1) : undefined
  const acrossSeat = seatCount2 === 4 ? seatAt(2) : seatCount2 === 2 ? seatAt(1) : undefined
  const leftSeat = seatCount2 === 4 ? seatAt(3) : seatCount2 === 3 ? seatAt(2) : undefined
  const dealerId = order[game.gameState.dealerIndex]
  const lastEntry = game.gameState.discardPile[game.gameState.discardPile.length - 1]
  const lastDiscardBy = lastEntry
    ? game.gameState.players.find((p) => p.id === lastEntry.discardedBy)?.displayName
    : undefined
  const renderSeat = (p?: PlayerState) =>
    p ? (
      <SeatPlaque
        player={p}
        isCurrentTurn={game.gameState.currentTurn === p.id}
        isDealer={p.id === dealerId}
      />
    ) : null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--brand-dark)' }}>
      {/* Game Header - dark, elegant */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 bg-[var(--bg-deep)] border-b border-[rgba(255,255,255,0.08)]" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
        <p
          className="text-sm sm:text-base font-bold tracking-wide"
          style={{ color: 'var(--accent-periwinkle)', fontFamily: 'var(--font-display)' }}
        >
          Birdy
        </p>
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

      {/* The table - seats arranged around a felt centre */}
      <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col gap-2 sm:gap-3 px-2 sm:px-6 py-3 sm:py-4">
        {/* Seat across the table */}
        <div className="flex justify-center">{renderSeat(acrossSeat)}</div>

        {/* Small screens: side seats sit above the felt */}
        <div className="flex md:hidden justify-center gap-2 flex-wrap">
          {renderSeat(leftSeat)}
          {renderSeat(rightSeat)}
        </div>

        <div className="flex items-center justify-center gap-3 sm:gap-5">
          <div className="hidden md:flex flex-col justify-center min-w-[170px]">
            {renderSeat(leftSeat)}
          </div>

          {/* The felt */}
          <div
            className="flex-1 max-w-2xl min-h-[240px] sm:min-h-[300px] rounded-[36px] flex flex-col items-center justify-center gap-2.5 p-4 sm:p-6"
            style={{
              background: 'radial-gradient(ellipse at center, #205138 0%, var(--bg-table) 75%)',
              border: '6px solid rgba(15, 20, 40, 0.9)',
              boxShadow: 'inset 0 2px 28px rgba(0,0,0,0.45), 0 12px 32px rgba(0,0,0,0.35)',
            }}
          >
            <p
              className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em]"
              style={{ color: 'rgba(229, 233, 253, 0.55)' }}
            >
              Wall {game.gameState.tilesRemaining} &middot; Round {game.gameState.round}
            </p>
            <DiscardPile discards={game.gameState.discardPile} lastDiscardBy={lastDiscardBy} />
          </div>

          <div className="hidden md:flex flex-col justify-center min-w-[170px] items-end">
            {renderSeat(rightSeat)}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 px-1">

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
            {jokerSwaps.length > 0 && (
              <button
                onClick={() => setSwapDialogOpen(true)}
                className="btn-secondary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4"
                style={{ background: 'var(--bg-elevated)' }}
              >
                Swap for joker
              </button>
            )}
            {canDeclareMahjong && (
              <button
                onClick={handleDeclareMahjong}
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
                  : createGameForMode(resolvedMode, { dealerIndex: newDealerIndex, playerCount })
              ng.gameState.round = game.gameState.round + 1
              setGame(ng)
              setSelectedTile(null)
              setClaimPhase(null)
              setBotsProcessing(false)
              setTurnTimer(timerLimit)
              if (resolvedMode === 'standard') {
                ng.gameState.status = 'charleston' as const
                setHasDrawn(false)
                setCharleston(createCharlestonState())
                setMessage('The Charleston - select 3 tiles to pass.')
              } else {
                setHasDrawn(true)
                setCharleston(null)
                setMessage(
                  ng.gameState.currentTurn === 'player'
                    ? 'Your turn - tap a tile to discard.'
                    : 'Dealer opens play…',
                )
              }
            }}
          />
        )}
        </div>

        {/* Your seat - clock lives here, chess.com style */}
        <div className="flex justify-center">
          <SeatPlaque
            player={player}
            isCurrentTurn={isPlayerTurn}
            isDealer={player.id === dealerId}
            clockSec={showTimer ? turnTimer : null}
            variant="you"
          />
        </div>
      </div>

      {/* Player hand - warm elevated tray */}
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

      {/* Joker swap dialog */}
      {swapDialogOpen && jokerSwaps.length > 0 && (
        <JokerSwapDialog
          swaps={jokerSwaps}
          players={game.gameState.players}
          hand={player.hand}
          onSwap={handleJokerSwap}
          onClose={() => setSwapDialogOpen(false)}
        />
      )}

      {/* NMJL Card Viewer */}
      <NmjlCardViewer isOpen={showCard} onClose={() => setShowCard(false)} />
    </div>
  )
}
