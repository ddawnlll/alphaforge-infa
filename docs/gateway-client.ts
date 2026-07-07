/**
 * AlphaForge Gateway API Client
 * 
 * Remote Hermes Gateway ile iletişim kurar.
 * SSH tunnel üzerinden localhost:8530'a forward edilmiş gateway'e bağlanır.
 * 
 * Kullanım:
 *   import { gateway } from './gateway-client'
 *   const board = await gateway.kanbanList()
 *   await gateway.cronRun('af-sandbox-tick')
 */

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8530'

// ── Types ────────────────────────────────────────────────────────────────────

export interface KanbanTask {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'done' | 'blocked'
  priority?: string
  tags?: string[]
  comments?: string[]
  created_at?: string
  updated_at?: string
}

export interface CronJob {
  id: string
  name: string
  schedule: string
  last_run?: string
  next_run?: string
  state?: string
}

export interface GatewayStatus {
  pid: number
  version: string
  uptime: string
}

// ── HTTP Client ──────────────────────────────────────────────────────────────

async function rpc(method: string, params?: unknown): Promise<unknown> {
  const url = `${GATEWAY_URL}/rpc`
  const body = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method,
    params: params || {},
  })

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })

  if (!res.ok) {
    throw new Error(`Gateway RPC error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()

  if (data.error) {
    throw new Error(`Gateway RPC error: ${data.error.message || JSON.stringify(data.error)}`)
  }

  return data.result
}

// ── Gateway API Methods ───────────────────────────────────────────────────────

export const gateway = {
  /** Gateway health check */
  async health(): Promise<GatewayStatus> {
    const res = await fetch(`${GATEWAY_URL}/health`)
    if (!res.ok) throw new Error(`Gateway health check failed: ${res.status}`)
    return res.json()
  },

  // ── Kanban ──────────────────────────────────────────────────────────────

  /** List all kanban boards */
  async kanbanBoards(): Promise<string[]> {
    return (await rpc('kanban.list_boards')) as string[]
  },

  /** Switch to a board */
  async kanbanSwitch(board: string): Promise<void> {
    await rpc('kanban.switch_board', { name: board })
  },

  /** List tasks on current board */
  async kanbanList(board?: string): Promise<KanbanTask[]> {
    return (await rpc('kanban.list_tasks', { board })) as KanbanTask[]
  },

  /** Create a kanban task */
  async kanbanCreate(params: {
    board?: string
    title: string
    status?: string
    priority?: string
    tags?: string[]
  }): Promise<KanbanTask> {
    return (await rpc('kanban.create_task', params)) as KanbanTask
  },

  /** Complete a kanban task */
  async kanbanComplete(taskId: string): Promise<void> {
    await rpc('kanban.complete_task', { task_id: taskId })
  },

  // ── Cron ────────────────────────────────────────────────────────────────

  /** List cron jobs */
  async cronList(): Promise<CronJob[]> {
    return (await rpc('cron.list_jobs')) as CronJob[]
  },

  /** Run a cron job immediately */
  async cronRun(name: string): Promise<void> {
    await rpc('cron.run_job', { name })
  },

  /** Pause a cron job */
  async cronPause(name: string): Promise<void> {
    await rpc('cron.pause_job', { name })
  },

  /** Resume a cron job */
  async cronResume(name: string): Promise<void> {
    await rpc('cron.resume_job', { name })
  },

  // ── Ledger (file access via Gateway) ────────────────────────────────────

  /** Read a file from the ledger */
  async readLedger(path: string): Promise<string> {
    const res = await fetch(`${GATEWAY_URL}/ledger/${encodeURIComponent(path)}`)
    if (!res.ok) throw new Error(`Ledger read error: ${res.status}`)
    return res.text()
  },

  /** Write a file to the ledger */
  async writeLedger(path: string, content: string): Promise<void> {
    const res = await fetch(`${GATEWAY_URL}/ledger/${encodeURIComponent(path)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain' },
      body: content,
    })
    if (!res.ok) throw new Error(`Ledger write error: ${res.status}`)
  },

  // ── Tick ────────────────────────────────────────────────────────────────

  /** Trigger a manual orchestrator tick */
  async triggerTick(): Promise<void> {
    await rpc('tick.run')
  },

  /** Get latest tick status */
  async tickStatus(): Promise<{ tick: number; state: string; last_tick_at: string | null }> {
    return (await rpc('tick.status')) as { tick: number; state: string; last_tick_at: string | null }
  },
}
