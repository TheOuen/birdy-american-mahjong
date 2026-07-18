'use client'

import { ReactFlow, Background, BackgroundVariant, Controls, Handle, Position } from '@xyflow/react'
import type { Edge, Node, NodeProps } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

export type BusinessFigures = {
  players: number
  subscribers: number
  newBookings: number
  newOrders: number
  lessonPriceRange: string
  retailPriceRange: string
}

type PillarData = {
  kicker: string
  title: string
  emoji: string
  lines: string[]
  stat: string
  accent: string
}

type PlainData = {
  title: string
  emoji: string
  lines: string[]
}

type PillarNode = Node<PillarData, 'pillar'>
type PlainNode = Node<PlainData, 'plain'>
type BusinessNode = PillarNode | PlainNode

function NodeHandles() {
  return (
    <>
      <Handle type="target" position={Position.Left} style={{ width: 6, height: 6, background: 'var(--border-strong)', border: 'none' }} />
      <Handle type="source" position={Position.Right} style={{ width: 6, height: 6, background: 'var(--border-strong)', border: 'none' }} />
    </>
  )
}

function PillarCard({ data }: NodeProps<PillarNode>) {
  return (
    <div
      className="rounded-[var(--radius-md)] border bg-[var(--bg-elevated)] w-[250px] overflow-hidden"
      style={{ borderColor: 'var(--border-strong)', boxShadow: 'var(--shadow-md)', borderTop: `5px solid ${data.accent}` }}
    >
      <NodeHandles />
      <div className="px-4 pt-3 pb-3.5">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: data.accent }}>
          {data.kicker}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span aria-hidden="true" className="text-lg">{data.emoji}</span>
          <span className="font-bold text-base text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-heading)' }}>
            {data.title}
          </span>
        </div>
        <div className="mt-1.5 flex flex-col gap-0.5">
          {data.lines.map((line) => (
            <div key={line} className="text-xs text-[var(--text-muted)] leading-snug">{line}</div>
          ))}
        </div>
        <div
          className="mt-2.5 inline-block rounded-full px-3 py-1 text-xs font-semibold"
          style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
        >
          {data.stat}
        </div>
      </div>
    </div>
  )
}

function PlainCard({ data }: NodeProps<PlainNode>) {
  return (
    <div
      className="rounded-[var(--radius-md)] border bg-[var(--bg-elevated)] w-[210px] px-4 py-3"
      style={{ borderColor: 'var(--border-strong)', boxShadow: 'var(--shadow-sm)' }}
    >
      <NodeHandles />
      <div className="flex items-center gap-2">
        <span aria-hidden="true">{data.emoji}</span>
        <span className="font-semibold text-sm text-[var(--text-primary)]">{data.title}</span>
      </div>
      <div className="mt-1 flex flex-col gap-0.5">
        {data.lines.map((line) => (
          <div key={line} className="text-xs text-[var(--text-muted)] leading-snug">{line}</div>
        ))}
      </div>
    </div>
  )
}

const nodeTypes = { pillar: PillarCard, plain: PlainCard }

function flowEdge(id: string, source: string, target: string, label: string, money?: boolean): Edge {
  return {
    id,
    source,
    target,
    label,
    animated: true,
    style: {
      stroke: money ? 'var(--success)' : 'var(--accent-gold)',
      strokeWidth: money ? 2.2 : 1.6,
      strokeDasharray: '7 5',
    },
    labelStyle: { fill: 'var(--text-secondary)', fontSize: 11, fontWeight: money ? 700 : 400 },
    labelBgStyle: { fill: 'var(--bg-elevated)', stroke: 'var(--border)' },
    labelBgPadding: [6, 3] as [number, number],
    labelBgBorderRadius: 4,
  }
}

export function BusinessMap({ figures }: { figures: BusinessFigures }) {
  const nodes: BusinessNode[] = [
    {
      id: 'visitors', type: 'plain', position: { x: 0, y: 220 },
      data: {
        title: 'New visitors', emoji: '👋',
        lines: ['Word of mouth, Google,', 'friends invited to a game'],
      },
    },
    {
      id: 'website', type: 'plain', position: { x: 290, y: 40 },
      data: {
        title: 'Website & blog', emoji: '📰',
        lines: ['What AML is, how to play,', 'contact & newsletter'],
      },
    },
    {
      id: 'game', type: 'pillar', position: { x: 270, y: 330 },
      data: {
        kicker: 'Pillar three · the front door', title: 'Free Birdy game', emoji: '🐦',
        accent: 'var(--accent-jade)',
        lines: ['Play American Mahjong online', 'free forever - no adverts'],
        stat: `${figures.players} players signed up`,
      },
    },
    {
      id: 'community', type: 'plain', position: { x: 620, y: 210 },
      data: {
        title: 'The community', emoji: '💬',
        lines: [
          'Newsletter, returning players,',
          'people who love the game',
          `${figures.subscribers} newsletter subscriber${figures.subscribers === 1 ? '' : 's'}`,
        ],
      },
    },
    {
      id: 'lessons', type: 'pillar', position: { x: 930, y: 30 },
      data: {
        kicker: 'Pillar one · the engine', title: 'Lessons', emoji: '🎓',
        accent: 'var(--accent-warm)',
        lines: ['Taught in person by Andrew,', 'booked & paid on the website'],
        stat: figures.lessonPriceRange,
      },
    },
    {
      id: 'retail', type: 'pillar', position: { x: 930, y: 380 },
      data: {
        kicker: 'Pillar two · the add-on', title: 'Retail', emoji: '🛒',
        accent: 'var(--accent-gold)',
        lines: ['NMJL cards & scorecard pads -', 'the kit every player needs'],
        stat: figures.retailPriceRange,
      },
    },
    {
      id: 'till', type: 'plain', position: { x: 1290, y: 210 },
      data: {
        title: 'The till', emoji: '💷',
        lines: [
          'Stripe → bank in ~2 days',
          `${figures.newBookings} booking${figures.newBookings === 1 ? '' : 's'} · ${figures.newOrders} order${figures.newOrders === 1 ? '' : 's'} waiting`,
        ],
      },
    },
  ]

  const edges: Edge[] = [
    flowEdge('b-visitors-website', 'visitors', 'website', 'find AML online'),
    flowEdge('b-visitors-game', 'visitors', 'game', 'invited to play'),
    flowEdge('b-website-community', 'website', 'community', 'join the newsletter'),
    flowEdge('b-game-community', 'game', 'community', 'players stick around'),
    flowEdge('b-community-lessons', 'community', 'lessons', 'book a lesson', true),
    flowEdge('b-lessons-retail', 'lessons', 'retail', 'every student needs a card', true),
    flowEdge('b-lessons-till', 'lessons', 'till', '£ bookings', true),
    flowEdge('b-retail-till', 'retail', 'till', '£ orders', true),
    flowEdge('b-lessons-game', 'lessons', 'game', 'practise between lessons'),
    flowEdge('b-community-visitors', 'community', 'visitors', 'bring their friends'),
  ]

  return (
    <div
      className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)] overflow-hidden"
      style={{ height: 560 }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        minZoom={0.3}
        maxZoom={1.5}
        nodesConnectable={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.5} color="var(--border)" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
