import { AfrinexError } from './base'

export class ConfigurationError extends AfrinexError {
  constructor(message: string) {
    super('CONFIGURATION_ERROR', message)
    this.name = 'ConfigurationError'
  }
}
