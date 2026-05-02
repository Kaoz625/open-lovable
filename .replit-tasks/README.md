# open-lovable — Project Overview
**Owner:** Kaoz625 | **Stack:** Next.js, TypeScript, AI SDK (Anthropic/OpenAI/Google/Groq), Crawl4AI, Docker | **Status:** Functional but has OpenRouter provider errors and limited model selection

## What This Is
An AI-powered website builder that uses Crawl4AI to clone and re-imagine any website with multi-model AI support. Users provide a URL, the app crawls it, and an AI model generates a new version. Supports multiple AI providers via the Vercel AI SDK.

## Current State
Full Next.js app with Docker Compose setup, Crawl4AI service integration, multiple AI provider support. Known issues: OpenRouter "Provider returned error" after retries, no rate limit handling, limited Claude models in picker, poor user-facing error messages.

## Tech Stack
- Next.js (App Router)
- TypeScript
- Vercel AI SDK (@ai-sdk/anthropic, @ai-sdk/openai, @ai-sdk/google, @ai-sdk/groq)
- Anthropic SDK
- Crawl4AI (Python service, Docker)
- Radix UI components
- Tailwind CSS
- E2B Code Interpreter
