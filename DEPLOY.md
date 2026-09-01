# Deploying Terranova Web to Vercel

## One-time: push the code to GitHub
Open PowerShell in this folder (C:\terranova-web\web) and run:

    git init
    git add .
    git commit -m "Terranova web app"
    git branch -M main
    git remote add origin https://github.com/Peak-Dev288/terranova-web.git
    git push -u origin main

(Create the empty repo first at github.com/new, name it terranova-web, do NOT
add a readme or gitignore - leave it empty.)

## Deploy on Vercel
1. Go to vercel.com, sign in with GitHub (Peak-Dev288).
2. Add New -> Project -> import terranova-web.
3. Framework preset auto-detects Next.js. Leave build settings default.
4. Before deploying, open "Environment Variables" and add these two:
       NEXT_PUBLIC_SUPABASE_URL   = https://tmbsqhwentesqvgxjmcj.supabase.co
       NEXT_PUBLIC_SUPABASE_ANON_KEY = (your anon key from Supabase)
5. Click Deploy. ~2 minutes later you get a live URL like
   terranova-web.vercel.app

## Every future update
    git add .
    git commit -m "what changed"
    git push
Vercel redeploys automatically on every push.
