# TODO - upload_to_github.bot

## Step 1: Add GitHub upload bot (local)
- Create `upload_to_github.bot/` folder ✅
- Implement `index.js` Node script ✅
  - Reads JSON payload (base64)
  - Uses GitHub REST API to get username, create repo, upload files via Contents API ✅
- Support CLI args ✅


## Step 2: Add example payload + docs
- Add `upload_to_github.bot/example_payload.json` ✅
- Add `README_GITHUB_BOT.md` ✅


## Step 3: (Optional) Export from UI
- If needed later, modify `src/components/AgentSwarm.tsx` to export a payload JSON for the bot.

## Step 4: Test
- Run bot locally against a test repo.

