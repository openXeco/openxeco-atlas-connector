import type pino from 'pino'
import type { Cluster } from '@/services/atlas/types.js'

export type PullProps = {
  id?: string
  registrationNumber?: string
  logger?: pino.Logger
}

export type PullResult =
  | {
      status: 'success'
      cluster: Cluster
    }
  | {
      status: 'error'
    }
