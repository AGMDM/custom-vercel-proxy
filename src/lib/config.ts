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
  
  // First try exact match
  let app = config.apps.find(app => app.name === name)
  
  if (!app) {
    // Try case-insensitive match
    app = config.apps.find(app => app.name.toLowerCase() === name.toLowerCase())
  }
  
  if (!app) {
    // Try matching with slug transformation (spaces to dashes, lowercase)
    const nameFromSlug = name.toLowerCase().replace(/-/g, ' ')
    app = config.apps.find(app => app.name.toLowerCase() === nameFromSlug)
  }
  
  if (!app) {
    // Try matching the other way (transform app names to slugs)
    const targetSlug = name.toLowerCase()
    app = config.apps.find(app => {
      const appSlug = app.name.toLowerCase().replace(/\s+/g, '-')
      return appSlug === targetSlug
    })
  }
  
  return app
}

export function getAllApps(): AppConfig[] {
  const config = getAppsConfig()
  return config.apps
}

// Clear cache - useful for development or when config changes
export function clearConfigCache(): void {
  cachedConfig = null
}
