#!/bin/bash

# Script to sync database types from GitHub after workflow updates
# This script checks for remote changes and pulls them if available

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Checking for database type updates...${NC}"

# Fetch latest changes from remote
echo -e "${YELLOW}Fetching latest changes from origin/main...${NC}"
git fetch origin main

# Check if there are remote changes
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})
BASE=$(git merge-base @ @{u})

if [ $LOCAL = $REMOTE ]; then
    echo -e "${GREEN}✅ Your local branch is up to date with origin/main${NC}"
    exit 0
elif [ $LOCAL = $BASE ]; then
    echo -e "${YELLOW}📥 Remote has new changes. Pulling updates...${NC}"
    
    # Check if database.ts has local changes
    if git diff --quiet src/types/database.ts; then
        # No local changes, safe to pull
        git pull origin main
        echo -e "${GREEN}✅ Successfully pulled latest changes${NC}"
        echo -e "${GREEN}📄 Updated file: src/types/database.ts${NC}"
    else
        echo -e "${YELLOW}⚠️  You have local changes to src/types/database.ts${NC}"
        echo -e "${YELLOW}   Stashing local changes, pulling, then reapplying...${NC}"
        git stash push -m "Auto-stash before pulling database types"
        git pull origin main
        git stash pop || echo -e "${YELLOW}   Note: Some conflicts may need manual resolution${NC}"
        echo -e "${GREEN}✅ Successfully pulled latest changes${NC}"
    fi
elif [ $REMOTE = $BASE ]; then
    echo -e "${YELLOW}⚠️  You have local commits that haven't been pushed${NC}"
    echo -e "${YELLOW}   Consider pushing your changes first${NC}"
    exit 1
else
    echo -e "${YELLOW}⚠️  Your branch has diverged from origin/main${NC}"
    echo -e "${YELLOW}   Manual merge may be required${NC}"
    exit 1
fi

# Check if database.ts was actually updated
if git diff HEAD@{1} HEAD --quiet src/types/database.ts; then
    echo -e "${BLUE}ℹ️  No changes to database.ts in this update${NC}"
else
    echo -e "${GREEN}✨ Database types have been updated!${NC}"
fi

