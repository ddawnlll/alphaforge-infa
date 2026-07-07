/**
 * AlphaForge RemoteBridge — replaces desktop-fork's stub
 *
 * SSH tunnel + Gateway API ile remote sunucudaki ledger'a bağlanır.
 *
 * Env:
 *   REMOTE_SSH_HOST     → ssh bağlantı adresi (örn. user@host)
 *   REMOTE_LEDGER_PATH  → remote ledger dizini (örn. /path/to/.alphaforge/orchestrator)
 *   REMOTE_SSH_KEY      → SSH private key yolu (opsiyonel, ~/.ssh/id_rsa)
 *   REMOTE_SSH_PORT     → SSH port (default 22)
 *   GATEWAY_URL         → Gateway HTTP URL (default http://localhost:8530)
 */

import { execSync, exec } from 'child_process'
import { readFileSync, existsSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

// ── Types ────────────────────────────────────────────────────────────────────

export interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modifiedAt: string
}

// ── RemoteBridge ─────────────────────────────────────────────────────────────

export class RemoteBridge {
  private _connected = false
  private _sshHost: string | null = null
  private _remoteLedgerPath: string | null = null
  private _sshKey: string | null = null
  private _sshPort: number = 22

  constructor() {
    // Read env at construction time
    this._sshHost = process.env.REMOTE_SSH_HOST || null
    this._remoteLedgerPath = process.env.REMOTE_LEDGER_PATH || null
    this._sshKey = process.env.REMOTE_SSH_KEY || null
    this._sshPort = parseInt(process.env.REMOTE_SSH_PORT || '22', 10)
  }

  /** Connect (validate SSH host + ledger path are set) */
  async connect(): Promise<void> {
    if (!this._sshHost || !this._remoteLedgerPath) {
      throw new Error(
        'RemoteBridge: REMOTE_SSH_HOST and REMOTE_LEDGER_PATH must be set',
      )
    }
    // Quick connectivity test
    try {
      this.runSsh(['--version'])
    } catch {
      throw new Error('RemoteBridge: ssh command not available')
    }
    this._connected = true
  }

  isConnected(): boolean {
    return this._connected
  }

  disconnect(): void {
    this._connected = false
  }

  // ── File Operations ────────────────────────────────────────────────────

  /** Read a file from the remote ledger */
  async readFile(relativePath: string): Promise<string | null> {
    this.ensureConnected()
    const remotePath = `${this._remoteLedgerPath}/${relativePath}`
    try {
      return this.runSsh(['cat', remotePath], { trim: true })
    } catch {
      return null
    }
  }

  /** Write a file to the remote ledger */
  async writeFile(relativePath: string, content: string): Promise<void> {
    this.ensureConnected()
    const remotePath = `${this._remoteLedgerPath}/${relativePath}`
    // Create parent directory, then write content via heredoc
    const remoteDir = remotePath.substring(
      0,
      remotePath.lastIndexOf('/'),
    )
    this.runSsh(['mkdir', '-p', remoteDir])
    this.runSsh(
      ['tee', remotePath],
      { input: content },
    )
  }

  /** Check if a path exists on the remote */
  async exists(relativePath: string): Promise<boolean> {
    this.ensureConnected()
    const remotePath = `${this._remoteLedgerPath}/${relativePath}`
    try {
      this.runSsh(['test', '-e', remotePath])
      return true
    } catch {
      return false
    }
  }

  /** List directory contents on the remote */
  async listDir(relativePath: string): Promise<FileEntry[]> {
    this.ensureConnected()
    const remotePath = `${this._remoteLedgerPath}/${relativePath}`
    try {
      const output = this.runSsh([
        'ls', '-la', '--time-style=+%Y-%m-%dT%H:%M:%S', remotePath,
      ])
      return this.parseLsOutput(output, relativePath)
    } catch {
      return []
    }
  }

  /** Run a shell command on the remote server */
  async runCommand(command: string): Promise<string> {
    this.ensureConnected()
    return this.runSsh(['bash', '-c', command])
  }

  /** Execute a Hermes command on the remote via SSH */
  async runHermes(args: string): Promise<string> {
    const hermesPath =
      "$HOME/.hermes/hermes-agent/venv/bin/hermes"
    return this.runCommand(
      `export PATH="$HOME/.hermes/hermes-agent/venv/bin:$PATH" && ${hermesPath} ${args}`,
    )
  }

  // ── High-level operations ──────────────────────────────────────────────

  /** Get current control.yaml mode */
  async getMode(): Promise<string> {
    const content = await this.readFile('control.yaml')
    if (!content) return 'unknown'
    const match = content.match(/^mode:\s*(\S+)/m)
    return match ? match[1] : 'unknown'
  }

  /** Get state.json as parsed object */
  async getState(): Promise<Record<string, unknown>> {
    const content = await this.readFile('state.json')
    if (!content) return {}
    try {
      return JSON.parse(content)
    } catch {
      return {}
    }
  }

  // ── SSH Implementation ──────────────────────────────────────────────────

  private sshBaseArgs(): string[] {
    const args: string[] = [
      '-o', 'StrictHostKeyChecking=accept-new',
      '-o', 'ConnectTimeout=10',
      '-o', 'ServerAliveInterval=30',
      '-o', 'ServerAliveCountMax=3',
    ]
    if (this._sshKey) {
      args.push('-i', this._sshKey)
    }
    if (this._sshPort !== 22) {
      args.push('-p', String(this._sshPort))
    }
    return args
  }

  private runSsh(
    remoteArgs: string[],
    opts?: { trim?: boolean; input?: string },
  ): string {
    const args = [
      ...this.sshBaseArgs(),
      this._sshHost!,
      ...remoteArgs.map((a) => `'${a.replace(/'/g, "'\\''")}'`),
    ]
    const cmd = `ssh ${args.join(' ')}`
    try {
      const result = execSync(cmd, {
        encoding: 'utf-8',
        timeout: 30_000,
        input: opts?.input,
        stdio: opts?.input ? ['pipe', 'pipe', 'pipe'] : undefined,
      })
      return opts?.trim !== false ? result.trim() : result
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(`SSH error: ${msg}`)
    }
  }

  private ensureConnected(): void {
    if (!this._connected) {
      throw new Error('RemoteBridge: not connected. Call connect() first.')
    }
  }

  private parseLsOutput(
    output: string,
    baseRelative: string,
  ): FileEntry[] {
    const entries: FileEntry[] = []
    const lines = output.split('\n')
    for (const line of lines) {
      const parts = line.trim().split(/\s+/)
      if (
        parts.length < 6 ||
        parts[0].startsWith('total') ||
        parts[0] === ''
      ) {
        continue
      }
      const perms = parts[0]
      const size = parseInt(parts[4], 10) || 0
      const date = parts[5]
      const time = parts[6] || ''
      const name = parts.slice(7).join(' ')
      entries.push({
        name,
        path: `${baseRelative}/${name}`,
        isDirectory: perms.startsWith('d'),
        size,
        modifiedAt: `${date}T${time}`,
      })
    }
    return entries
  }
}

// ── Singleton ────────────────────────────────────────────────────────────────

export const bridge = new RemoteBridge()
