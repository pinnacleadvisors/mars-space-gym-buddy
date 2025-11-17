#!/bin/bash

# Watch script to automatically pull database type updates
# This script runs in the background and checks for updates every 30 seconds
# Press Ctrl+C to stop watching

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

INTERVAL=${1:-30000} # Default to 30 seconds, can be overridden

echo -e "${BLUE}👀 Watching for database type updates (checking every ${INTERVAL}s)${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

# Trap Ctrl+C
trap 'echo -e "\n${BLUE}👋 Stopped watching${NC}"; exit 0' INT

LAST_COMMIT=""

while true; do
    # Fetch latest changes
    git fetch origin main --quiet 2>/dev/null || true
    
    # Get latest commit hash
    CURRENT_COMMIT=$(git rev-parse origin/main 2>/dev/null || echo "")
    
    if [ -z "$CURRENT_COMMIT" ]; then
        echo -e "${RED}❌ Could not fetch from origin/main${NC}"
        sleep $INTERVAL
        continue
    fi
    
    if [ "$CURRENT_COMMIT" != "$LAST_COMMIT" ]; then
        if [ -n "$LAST_COMMIT" ]; then
            # Check if database.ts was changed in the new commit
            if git diff --name-only $LAST_COMMIT $CURRENT_COMMIT | grep -q "src/types/database.ts"; then
                echo -e "${GREEN}📥 New database types detected!${NC}"
                echo -e "${YELLOW}Pulling changes...${NC}"
                
                # Check if database.ts has local changes
                if git diff --quiet src/types/database.ts; then
                    git pull origin main --quiet
                    echo -e "${GREEN}✅ Database types updated!${NC}"
                else
                    echo -e "${YELLOW}⚠️  You have local changes to database.ts. Skipping auto-pull.${NC}"
                    echo -e "${YELLOW}   Run 'npm run sync:types' manually to merge changes${NC}"
                fi
            else
                echo -e "${BLUE}ℹ️  New commit detected, but database.ts wasn't updated${NC}"
            fi
        fi
        LAST_COMMIT=$CURRENT_COMMIT
    fi
    
    sleep $INTERVAL
done

