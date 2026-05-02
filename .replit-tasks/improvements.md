# Replit Agent Task Spec

## Instructions for Replit Agent
You are building/improving this project. Read this file carefully before touching any code.
Commit all changes with prefix "replit: " and push to main when done.

## Stack Rules (non-negotiable)
- Static → Cloudflare Pages (never Vercel)
- DB → Supabase self-hosted Docker (never cloud Supabase)
- Auth → NextAuth.js (free, not Auth0/Clerk)
- AI → Claude Sonnet 4.6 via Anthropic API (model: claude-sonnet-4-6)
- Payments (adult) → CCBill or Segpay only

## Improvements To Make
1. **Fix OpenRouter "Provider returned error" bug** — Locate where OpenRouter API calls are made (likely in app/api/ or lib/). Add exponential backoff retry logic (3 retries, 1s/2s/4s delays). If all retries fail, automatically fall back to direct Anthropic API instead of showing an error. Log which provider was used for debugging.
2. **Add rate limit handling** — Detect 429 responses from all providers. Show a user-friendly message: "Rate limit reached — switching to backup model..." and automatically retry with a different provider. Never show raw API error objects to the user.
3. **Add more Claude models to model picker** — In the model selection UI, add these options: `claude-sonnet-4-6` (default, label: "Claude Sonnet 4.6 — Recommended"), `claude-opus-4-5` (label: "Claude Opus 4.5 — Powerful"), `claude-haiku-3-5` (label: "Claude Haiku 3.5 — Fast & Free"). Make claude-sonnet-4-6 the default selected model.
4. **Improve error messages shown to user** — Replace all raw error/stack traces shown in the UI with friendly messages. Examples: network error → "Connection issue — please check your internet and try again", API key error → "API key issue — please check your settings", timeout → "This is taking longer than expected — try a simpler website URL".
5. **Make Anthropic the primary provider** — Ensure the default model provider is Anthropic (claude-sonnet-4-6), not OpenRouter. OpenRouter should be a fallback option, not the default. Update any provider selection logic accordingly.
6. **Add loading state improvements** — Show a progress indicator with stages: "Crawling website...", "Analyzing content...", "Generating with AI...", "Finalizing...". This gives users feedback during the (potentially slow) generation process.
7. **Update Next.js config for Cloudflare Pages** — Remove any Vercel-specific config. Add `output: 'export'` to next.config.ts for static export capability, or document that it needs a Node.js runtime on Cloudflare Workers. Add a `_worker.js` or document the Cloudflare Pages deployment process.

## Do Not Touch
- crawl4ai-service/ directory (Python service — leave as-is)
- docker-compose.yml (infrastructure config)
- LICENSE file

## Definition of Done
- [ ] All improvements implemented and working
- [ ] No TypeScript/lint errors (`npm run build` passes)
- [ ] OpenRouter errors no longer crash the UI — fallback works
- [ ] Rate limit handling shows friendly message
- [ ] Claude Sonnet 4.6 is default model in picker
- [ ] No raw error objects visible to users
- [ ] Pushed to main with "replit: " commit prefix
