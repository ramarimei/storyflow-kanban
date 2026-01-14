# StoryFlow Kanban - Project Status

## Deployed URL
https://storyflow-kanban.vercel.app

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (email/password)
- **AI**: Google Gemini API (for parsing documents into stories)

## Environment Variables (Vercel)
```
VITE_API_KEY=<Gemini API key>
VITE_SUPABASE_URL=https://xlkkepltexylzkggdqjl.supabase.co
VITE_SUPABASE_ANON_KEY=<Supabase anon key>
```

## Supabase Setup
- **Table**: `stories` - stores all kanban cards
- **Auth**: Email/password enabled
- **RLS**: Policies set to allow authenticated users only
- **Site URL**: https://storyflow-kanban.vercel.app (for email redirects)

## Features Working
- [x] User authentication (signup/login/logout)
- [x] Kanban board with 5 columns (TODO, IN_PROGRESS, BLOCKED, TESTING, DONE)
- [x] Backlog view
- [x] Drag and drop cards between columns
- [x] Create/edit/delete stories and bugs
- [x] Acceptance criteria with checkboxes
- [x] Story points (XP)
- [x] User assignment
- [x] Dark/Light theme toggle
- [x] Pacman/Professional mode toggle
- [x] Real-time sync with Supabase

## Features Pending
- [ ] AI Import (waiting for Gemini quota reset - resets midnight PT / 9pm NZDT)
- [ ] AI Meeting Script generator (same quota issue)
- [ ] Claude API as backup AI provider (optional enhancement)

## Known Issues
1. **Gemini 429 Error**: Free tier quota exhausted. Resets daily at midnight Pacific Time.
2. **Tailwind Warning**: Pattern `./**/*.ts` matches node_modules - cosmetic warning only, doesn't affect build.

## Future Enhancements to Consider
- Add Claude API as backup AI provider
- Team member management (invite users)
- Multiple project/board support
- Comments on stories
- Activity history/audit log
- Export to CSV/PDF

## Local Development
```bash
cd StoryFlow-Kanban
npm install
npm run dev
```

Create `.env` file with:
```
VITE_API_KEY=your_gemini_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment
Push to `master` branch - Vercel auto-deploys.

```bash
git add -A
git commit -m "Your message"
git push origin master
```

## Last Updated
January 2025
