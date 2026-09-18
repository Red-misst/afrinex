import { LipadError } from './base'

export class ConfigurationError extends LipadError {
  constructor(message: string) {
    super('CONFIGURATION_ERROR', message)
    this.name = 'ConfigurationError'
  }
}
