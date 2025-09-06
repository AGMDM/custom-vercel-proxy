import { readFileSync } from 'fs'
import { join } from 'path'
import yaml from 'js-yaml'

export interface AppConfig {
  name: string
  target_url: string
}

export interface AppsConfig {
  apps: AppConfig[]
}

let cachedConfig: AppsConfig | null = null

export function getAppsConfig(): AppsConfig {
  if (cachedConfig) {
    return cachedConfig
  }

  try {
    const configPath = join(process.cwd(), 'config', 'apps.yaml')
    const fileContents = readFileSync(configPath, 'utf8')
    const config = yaml.load(fileContents) as AppsConfig
    
    cachedConfig = config
    return config
  } catch (error) {
    console.error('Failed to load apps configuration:', error)
    // Return default configuration if file is not found
    return {
      apps: [
        {
          name: 'Default App',
          target_url: 'https://example.com'
        }
      ]
    }
  }
}

export function getAppByName(name: string): AppConfig | undefined {
  const config = getAppsConfig()
  return config.apps.find(app => app.name === name)
}

export function getAllApps(): AppConfig[] {
  const config = getAppsConfig()
  return config.apps
}

// Clear cache - useful for development or when config changes
export function clearConfigCache(): void {
  cachedConfig = null
}
