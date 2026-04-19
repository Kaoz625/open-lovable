// Application Configuration
// This file contains all configurable settings for the application

export const appConfig = {
  // Vercel Sandbox Configuration
  vercelSandbox: {
    // Sandbox timeout in minutes
    timeoutMinutes: 15,

    // Convert to milliseconds for Vercel Sandbox API
    get timeoutMs() {
      return this.timeoutMinutes * 60 * 1000;
    },

    // Development server port (Vercel Sandbox typically uses 3000 for Next.js/React)
    devPort: 3000,

    // Time to wait for dev server to be ready (in milliseconds)
    devServerStartupDelay: 7000,

    // Time to wait for CSS rebuild (in milliseconds)
    cssRebuildDelay: 2000,

    // Working directory in sandbox
    workingDirectory: '/app',

    // Default runtime for sandbox
    runtime: 'node22' // Available: node22, python3.13, v0-next-shadcn, cua-ubuntu-xfce
  },

  // E2B Sandbox Configuration
  e2b: {
    // Sandbox timeout in minutes
    timeoutMinutes: 30,

    // Convert to milliseconds for E2B API
    get timeoutMs() {
      return this.timeoutMinutes * 60 * 1000;
    },

    // Development server port (E2B uses 5173 for Vite)
    vitePort: 5173,

    // Time to wait for Vite dev server to be ready (in milliseconds)
    viteStartupDelay: 10000,

    // Working directory in sandbox
    workingDirectory: '/home/user/app',
  },
  
  // AI Model Configuration
  ai: {
    // Default AI model
    defaultModel: 'anthropic/claude-sonnet-4-6',

    // Available models
    availableModels: [
      'anthropic/claude-sonnet-4-6',
      'anthropic/claude-opus-4-7',
      'anthropic/claude-haiku-4-5-20251001',
      'google/gemini-3-pro-preview',
      'google/gemini-2.5-pro',
      'openai/gpt-5.4',
      'openai/gpt-5.4-mini',
      'openai/gpt-5.4-nano',
      'openai/gpt-5',
      'openai/gpt-5-mini',
      'openai/gpt-4.1',
      'openai/gpt-4.1-mini',
      'openai/gpt-4.1-nano',
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'openai/o3',
      'openai/o4-mini',
      'litellm/rotation-stable',
      'litellm/rotation-groq',
      'litellm/rotation-gemini',
      'litellm/rotation-anthropic',
      'litellm/rotation-openrouter-free',
      'litellm/rotation-longctx',
      'groq/llama-3.3-70b-versatile',
      'google/gemini-2.0-flash',
      'google/gemini-2.0-flash-lite',
      'google/gemini-1.5-flash',
      'openrouter/qwen/qwen3-coder:free',
      'openrouter/openai/gpt-oss-120b:free',
      'openrouter/nousresearch/hermes-3-llama-3.1-405b:free',
      'openrouter/nvidia/nemotron-3-super-120b-a12b:free',
      'openrouter/moonshotai/kimi-k2.5:free',
      'openrouter/google/gemma-4-31b:free',
      'openrouter/nvidia/nemotron-3-super:free',
    ],

    // Model display names
    modelDisplayNames: {
      'anthropic/claude-sonnet-4-6': 'Claude Sonnet 4.6',
      'anthropic/claude-opus-4-7': 'Claude Opus 4.7',
      'anthropic/claude-haiku-4-5-20251001': 'Claude Haiku 4.5 (Fast)',
      'google/gemini-3-pro-preview': 'Gemini 3 Pro',
      'google/gemini-2.5-pro': 'Gemini 2.5 Pro',
      'openai/gpt-5.4': 'GPT-5.4 (Flagship)',
      'openai/gpt-5.4-mini': 'GPT-5.4 Mini',
      'openai/gpt-5.4-nano': 'GPT-5.4 Nano (Fast)',
      'openai/gpt-5': 'GPT-5',
      'openai/gpt-5-mini': 'GPT-5 Mini',
      'openai/gpt-4.1': 'GPT-4.1',
      'openai/gpt-4.1-mini': 'GPT-4.1 Mini',
      'openai/gpt-4.1-nano': 'GPT-4.1 Nano (Fast)',
      'openai/gpt-4o': 'GPT-4o',
      'openai/gpt-4o-mini': 'GPT-4o Mini',
      'openai/o3': 'o3 (Reasoning)',
      'openai/o4-mini': 'o4-mini (Reasoning)',
      'litellm/rotation-stable': 'LiteLLM — Stable (Auto-rotate)',
      'litellm/rotation-groq': 'LiteLLM — Groq Fast',
      'litellm/rotation-gemini': 'LiteLLM — Gemini (Auto-rotate)',
      'litellm/rotation-anthropic': 'LiteLLM — Anthropic (Auto-rotate)',
      'litellm/rotation-openrouter-free': 'LiteLLM — Free Models',
      'litellm/rotation-longctx': 'LiteLLM — Long Context (128k+)',
      'groq/llama-3.3-70b-versatile': 'Llama 3.3 70B (Fast)',
      'google/gemini-2.0-flash': 'Gemini 2.0 Flash',
      'google/gemini-2.0-flash-lite': 'Gemini 2.0 Flash Lite',
      'google/gemini-1.5-flash': 'Gemini 1.5 Flash',
      'openrouter/qwen/qwen3-coder:free': 'Qwen3 Coder (Free)',
      'openrouter/openai/gpt-oss-120b:free': 'GPT-OSS 120B (Free)',
      'openrouter/nousresearch/hermes-3-llama-3.1-405b:free': 'Hermes 3 405B (Free)',
      'openrouter/nvidia/nemotron-3-super-120b-a12b:free': 'Nemotron 120B (Free)',
      'openrouter/moonshotai/kimi-k2.5:free': 'Kimi K2.5 (Free)',
      'openrouter/google/gemma-4-31b:free': 'Gemma 4 31B (Free)',
      'openrouter/nvidia/nemotron-3-super:free': 'Nemotron Super (Free)',
    } as Record<string, string>,

    // Model API configuration (kept for reference)
    modelApiConfig: {},
    
    // Temperature settings for non-reasoning models
    defaultTemperature: 0.7,
    
    // Max tokens for code generation
    maxTokens: 8000,
    
    // Max tokens for truncation recovery
    truncationRecoveryMaxTokens: 4000,
  },
  
  // Code Application Configuration
  codeApplication: {
    // Delay after applying code before refreshing iframe (milliseconds)
    defaultRefreshDelay: 2000,
    
    // Delay when packages are installed (milliseconds)
    packageInstallRefreshDelay: 5000,
    
    // Enable/disable automatic truncation recovery
    enableTruncationRecovery: false, // Disabled - too many false positives
    
    // Maximum number of truncation recovery attempts per file
    maxTruncationRecoveryAttempts: 1,
  },
  
  // UI Configuration
  ui: {
    // Show/hide certain UI elements
    showModelSelector: true,
    showStatusIndicator: true,
    
    // Animation durations (milliseconds)
    animationDuration: 200,
    
    // Toast notification duration (milliseconds)
    toastDuration: 3000,
    
    // Maximum chat messages to keep in memory
    maxChatMessages: 100,
    
    // Maximum recent messages to send as context
    maxRecentMessagesContext: 20,
  },
  
  // Development Configuration
  dev: {
    // Enable debug logging
    enableDebugLogging: true,
    
    // Enable performance monitoring
    enablePerformanceMonitoring: false,
    
    // Log API responses
    logApiResponses: true,
  },
  
  // Package Installation Configuration
  packages: {
    // Use --legacy-peer-deps flag for npm install
    useLegacyPeerDeps: true,
    
    // Package installation timeout (milliseconds)
    installTimeout: 60000,
    
    // Auto-restart Vite after package installation
    autoRestartVite: true,
  },
  
  // File Management Configuration
  files: {
    // Excluded file patterns (files to ignore)
    excludePatterns: [
      'node_modules/**',
      '.git/**',
      '.next/**',
      'dist/**',
      'build/**',
      '*.log',
      '.DS_Store'
    ],
    
    // Maximum file size to read (bytes)
    maxFileSize: 1024 * 1024, // 1MB
    
    // File extensions to treat as text
    textFileExtensions: [
      '.js', '.jsx', '.ts', '.tsx',
      '.css', '.scss', '.sass',
      '.html', '.xml', '.svg',
      '.json', '.yml', '.yaml',
      '.md', '.txt', '.env',
      '.gitignore', '.dockerignore'
    ],
  },
  
  // API Endpoints Configuration (for external services)
  api: {
    // Retry configuration
    maxRetries: 3,
    retryDelay: 1000, // milliseconds
    
    // Request timeout (milliseconds)
    requestTimeout: 30000,
  }
};

// Type-safe config getter
export function getConfig<K extends keyof typeof appConfig>(key: K): typeof appConfig[K] {
  return appConfig[key];
}

// Helper to get nested config values
export function getConfigValue(path: string): any {
  return path.split('.').reduce((obj, key) => obj?.[key], appConfig as any);
}

export default appConfig;