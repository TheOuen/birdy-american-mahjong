'use client'

import { ReactFlow, Background, BackgroundVariant, Controls, Handle, Position } from '@xyflow/react'
import type { Edge, Node, NodeProps } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

export type InfraStatuses = {
  db: boolean
  stripe: boolean
  resend: boolean
}

type ServiceStatus = 'live' | 'keys' | 'pending' | 'off'

type ServiceData = {
  title: string
  emoji: string
  lines: string[]
  cost?: string
  href?: string
  status: ServiceStatus
  statusLabel: string
}

type ServiceNode = Node<ServiceData, 'service'>
type LabelNode = Node<{ title: string }, 'columnLabel'>
type InfraNode = ServiceNode | LabelNode

const STATUS_COLOR: Record<ServiceStatus, string> = {
  live: 'var(--success)',
  keys: 'var(--warning)',
  pending: 'var(--accent-gold)',
  off: 'var(--text-muted)',
}

function ServiceCard({ data }: NodeProps<ServiceNode>) {
  return (
    <div
      className="rounded-[var(--radius-md)] border bg-[var(--bg-elevated)] px-4 py-3 w-[220px]"
      style={{ borderColor: 'var(--border-strong)', boxShadow: 'var(--shadow-sm)' }}
    >
      <Handle type="target" position={Position.Left} style={{ width: 6, height: 6, background: 'var(--border-strong)', border: 'none' }} />
      <div className="flex items-center gap-2">
        <span
          className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: STATUS_COLOR[data.status] }}
          title={data.statusLabel}
        />
        <span aria-hidden="true">{data.emoji}</span>
        <span className="font-semibold text-sm text-[var(--text-primary)] truncate">{data.title}</span>
      </div>
      <div className="mt-1.5 flex flex-col gap-0.5">
        {data.lines.map((line) => (
          <div key={line} className="text-xs text-[var(--text-muted)] leading-snug">{line}</div>
        ))}
        <div className="text-xs font-medium mt-1" style={{ color: STATUS_COLOR[data.status] }}>
          {data.statusLabel}
        </div>
        {data.cost && <div className="text-xs text-[var(--text-muted)]">{data.cost}</div>}
      </div>
      {data.href && (
        <a
          href={data.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium mt-1.5 inline-block underline underline-offset-2"
          style={{ color: 'var(--accent-gold)' }}
        >
          Open ↗
        </a>
      )}
      <Handle type="source" position={Position.Right} style={{ width: 6, height: 6, background: 'var(--border-strong)', border: 'none' }} />
    </div>
  )
}

function ColumnLabel({ data }: NodeProps<LabelNode>) {
  return (
    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)] w-[220px] border-b border-[var(--border-strong)] pb-2">
      {data.title}
    </div>
  )
}

const nodeTypes = { service: ServiceCard, columnLabel: ColumnLabel }

const COL_X = [0, 300, 600, 900, 1200, 1500]

type EdgeTone = 'live' | 'keys' | 'pending'
const EDGE_COLOR: Record<EdgeTone, string> = {
  live: 'var(--success)',
  keys: 'var(--warning)',
  pending: 'var(--accent-gold-light)',
}

function edge(id: string, source: string, target: string, label: string, tone: EdgeTone): Edge {
  return {
    id,
    source,
    target,
    label,
    animated: tone === 'live',
    style: { stroke: EDGE_COLOR[tone], strokeWidth: 1.6, strokeDasharray: '7 5' },
    labelStyle: { fill: 'var(--text-secondary)', fontSize: 11 },
    labelBgStyle: { fill: 'var(--bg-elevated)', stroke: 'var(--border)' },
    labelBgPadding: [6, 3] as [number, number],
    labelBgBorderRadius: 4,
  }
}

export function InfraMap({ statuses }: { statuses: InfraStatuses }) {
  const dbStatus: ServiceStatus = statuses.db ? 'live' : 'off'
  const dbLabel = statuses.db ? 'Live' : 'Unreachable'
  const stripeStatus: ServiceStatus = statuses.stripe ? 'live' : 'keys'
  const stripeLabel = statuses.stripe ? 'Live' : 'Needs keys'
  const resendStatus: ServiceStatus = statuses.resend ? 'live' : 'keys'
  const resendLabel = statuses.resend ? 'Live' : 'Needs key'
  const payTone: EdgeTone = statuses.stripe ? 'live' : 'keys'
  const mailTone: EdgeTone = statuses.resend ? 'live' : 'keys'
  const dbTone: EdgeTone = statuses.db ? 'live' : 'pending'

  const columnLabels: LabelNode[] = (
    [
      ['EDGE', 0], ['THE APP', 1], ['DATA & AUTH', 2], ['PAYMENTS', 3], ['COMMS', 4], ['OPS', 5],
    ] as const
  ).map(([title, col]) => ({
    id: `col-${col}`,
    type: 'columnLabel',
    position: { x: COL_X[col], y: -70 },
    data: { title },
    draggable: false,
    selectable: false,
  }))

  const services: ServiceNode[] = [
    {
      id: 'dns', type: 'service', position: { x: COL_X[0], y: 40 },
      data: {
        title: 'Domain / DNS', emoji: '🌐',
        lines: ['americanmahjonglondon.com', 'not yet pointed at the app'],
        status: 'pending', statusLabel: 'To connect', cost: '≈ £1 /mo',
      },
    },
    {
      id: 'vercel', type: 'service', position: { x: COL_X[0], y: 240 },
      data: {
        title: 'Vercel', emoji: '▲',
        lines: ['Hosts the Next.js app', 'american-mahjong.vercel.app'],
        status: 'pending', statusLabel: 'Deploy pending', cost: '£0 → ≈ £16 /mo',
        href: 'https://vercel.com',
      },
    },

    {
      id: 'site', type: 'service', position: { x: COL_X[1], y: 0 },
      data: {
        title: 'Public site', emoji: '📰',
        lines: ['Home · blog · how-to-play', 'contact & newsletter forms'],
        status: 'live', statusLabel: 'Built',
      },
    },
    {
      id: 'lessons', type: 'service', position: { x: COL_X[1], y: 170 },
      data: {
        title: 'Lessons', emoji: '🎓',
        lines: ['£125 – £250 a session', 'booked & paid on the site'],
        status: 'live', statusLabel: 'Built',
      },
    },
    {
      id: 'shop', type: 'service', position: { x: COL_X[1], y: 340 },
      data: {
        title: 'Shop', emoji: '🛒',
        lines: ['NMJL cards & notepads', 'cart → hosted checkout'],
        status: 'live', statusLabel: 'Built',
      },
    },
    {
      id: 'game', type: 'service', position: { x: COL_X[1], y: 510 },
      data: {
        title: 'Birdy game', emoji: '🐦',
        lines: ['Free online play', 'lobby · Charleston · live moves'],
        status: 'live', statusLabel: 'Built',
      },
    },
    {
      id: 'admin', type: 'service', position: { x: COL_X[1], y: 680 },
      data: {
        title: 'Admin panel', emoji: '🗂️',
        lines: ['Bookings · orders · catalogue', 'posts · messages · players'],
        status: 'live', statusLabel: 'Live',
      },
    },

    {
      id: 'auth', type: 'service', position: { x: COL_X[2], y: 60 },
      data: {
        title: 'Supabase Auth', emoji: '🔑',
        lines: ['Sign-in codes & magic links', 'branded emails installed'],
        status: dbStatus, statusLabel: statuses.db ? 'Live · tested' : dbLabel,
        href: 'https://supabase.com/dashboard/project/abfyjdxtarbrojnsczkr/auth/users',
      },
    },
    {
      id: 'db', type: 'service', position: { x: COL_X[2], y: 280 },
      data: {
        title: 'Supabase DB', emoji: '🗄️',
        lines: ['Postgres · 10 tables', 'row-level security on all'],
        status: dbStatus, statusLabel: dbLabel, cost: '£0 → ≈ £20 /mo',
        href: 'https://supabase.com/dashboard/project/abfyjdxtarbrojnsczkr',
      },
    },
    {
      id: 'realtime', type: 'service', position: { x: COL_X[2], y: 500 },
      data: {
        title: 'Supabase Realtime', emoji: '📡',
        lines: ['Pushes each move to', 'all four seats instantly'],
        status: dbStatus, statusLabel: dbLabel,
      },
    },

    {
      id: 'checkout', type: 'service', position: { x: COL_X[3], y: 190 },
      data: {
        title: 'Stripe Checkout', emoji: '💳',
        lines: ['Hosted payment page', 'prices looked up server-side'],
        status: stripeStatus, statusLabel: stripeLabel, cost: '1.5% + 20p a sale',
        href: 'https://dashboard.stripe.com',
      },
    },
    {
      id: 'webhook', type: 'service', position: { x: COL_X[3], y: 400 },
      data: {
        title: 'Stripe Webhook', emoji: '🪝',
        lines: ['/api/stripe/webhook', 'the only writer of orders'],
        status: stripeStatus, statusLabel: stripeLabel,
      },
    },

    {
      id: 'mailer', type: 'service', position: { x: COL_X[4], y: 60 },
      data: {
        title: 'Sign-in emails', emoji: '✉️',
        lines: ['Supabase built-in sender', 'rate-limited → move to Resend'],
        status: dbStatus, statusLabel: statuses.db ? 'Live · temporary' : dbLabel,
      },
    },
    {
      id: 'resend', type: 'service', position: { x: COL_X[4], y: 280 },
      data: {
        title: 'Resend', emoji: '📮',
        lines: ['Contact form · receipts', 'future sign-in email sender'],
        status: resendStatus, statusLabel: resendLabel, cost: '£0 /mo (3k emails)',
        href: 'https://resend.com',
      },
    },

    {
      id: 'calendar', type: 'service', position: { x: COL_X[5], y: 120 },
      data: {
        title: 'Google Calendar', emoji: '📅',
        lines: ['Lesson scheduling', 'linked from the sidebar'],
        status: 'live', statusLabel: 'Linked',
        href: 'https://calendar.google.com/calendar',
      },
    },
    {
      id: 'deploys', type: 'service', position: { x: COL_X[5], y: 320 },
      data: {
        title: 'Deploys', emoji: '🚀',
        lines: ['Push to main →', 'Vercel builds & ships'],
        status: 'pending', statusLabel: 'Awaiting first push',
      },
    },
  ]

  const edges: Edge[] = [
    edge('e-dns-vercel', 'dns', 'vercel', 'points at', 'pending'),
    edge('e-vercel-site', 'vercel', 'site', 'serves', 'pending'),
    edge('e-site-lessons', 'site', 'lessons', 'browse', 'live'),
    edge('e-site-resend', 'site', 'resend', 'contact form', mailTone),
    edge('e-lessons-checkout', 'lessons', 'checkout', 'book & pay', payTone),
    edge('e-shop-checkout', 'shop', 'checkout', 'cart', payTone),
    edge('e-checkout-webhook', 'checkout', 'webhook', 'payment events', payTone),
    edge('e-webhook-db', 'webhook', 'db', 'writes orders', payTone),
    edge('e-webhook-resend', 'webhook', 'resend', 'receipts', mailTone),
    edge('e-game-auth', 'game', 'auth', 'player accounts', dbTone),
    edge('e-game-db', 'game', 'db', 'game state', dbTone),
    edge('e-game-realtime', 'game', 'realtime', 'live moves', dbTone),
    edge('e-admin-auth', 'admin', 'auth', 'admin sign-in', dbTone),
    edge('e-admin-db', 'admin', 'db', 'reads via RLS', dbTone),
    edge('e-auth-mailer', 'auth', 'mailer', 'sends codes', dbTone),
    edge('e-admin-calendar', 'admin', 'calendar', 'schedule', 'live'),
    edge('e-deploys-vercel', 'deploys', 'vercel', 'ships the app', 'pending'),
  ]

  const nodes: InfraNode[] = [...columnLabels, ...services]

  return (
    <div
      className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)] overflow-hidden"
      style={{ height: 640 }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        minZoom={0.3}
        maxZoom={1.5}
        proOptions={{ hideAttribution: false }}
        nodesConnectable={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.5} color="var(--border)" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
