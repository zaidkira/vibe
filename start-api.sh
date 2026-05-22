#!/bin/bash
export npm_config_user_agent="pnpm/11.0.8"
export PORT=3000
export DATABASE_URL="postgresql://postgres.pkthpqkcqffsrwhfavyk:tiouraadam%40gmail.com@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"
export PATH="/home/kira/.config/nvm/versions/node/v24.15.0/bin:$PATH"

/home/kira/.config/nvm/versions/node/v24.15.0/bin/pnpm --filter @workspace/api-server run dev
