# Challenges Page Enhancement TODO

## Status: In Progress

### 1. [x] Create Groq AI utility ✅
- File: `client/src/utils/groq.js`
- Generate cyber security MCQs by level (easy/medium/hard)

### 2. [x] Enhance Challenges.jsx ✅
- Add 5 levels with prerequisites
- Integrate Groq for dynamic questions
- Level progress tracking & UI

### 3. [x] Update i18n translations ✅
- Add `challenges.*` keys to all locales: en/, hi/, kn/, te/, bn/, mr/

### 4. [x] Test & Verify ✅
- Add GROQ_API_KEY to client/.env (user action needed)
- Run `cd client && npm run dev`
- Test at http://localhost:5173/#/challenges

### 5. [x] Finalize ✅
