#!/bin/bash
export npm_config_user_agent="pnpm/11.0.8"
export PORT=8080
export BASE_PATH="/"
export PATH="/home/kira/.config/nvm/versions/node/v24.15.0/bin:$PATH"

/home/kira/.config/nvm/versions/node/v24.15.0/bin/pnpm --filter @workspace/vibe run dev
