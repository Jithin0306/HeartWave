# 🚀 Deploying HeartWave Website on Vercel ($0 Free Forever)

This website is engineered with **Vite + React + Tailwind CSS**, inspired by the dark craft aesthetic of **Raycast**. It runs completely client-side with zero server maintenance costs and connects dynamically to GitHub's Releases API.

---

## ⚡ 1-Click Free Deployment on Vercel

### Option 1: Via Vercel Web Dashboard (Easiest)

1. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **"Add New..."** &rarr; **"Project"**.
3. Select your repository: **`Jithin0306/HeartWave`**.
4. In the Project Configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click `Edit` and select `website` (or leave default if using root `vercel.json`).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **"Deploy"**.
6. Within ~30 seconds, your site is live with a free SSL-secured production URL (e.g. `heartwave.vercel.app`)!

---

## 🌐 Connecting Your Free Custom Domain (e.g., `heartwave.cam`)

Once deployed on Vercel, attaching a custom domain is **100% free with unlimited bandwidth**:

1. In your Vercel project dashboard, go to **Settings** &rarr; **Domains**.
2. Type your domain (e.g., `heartwave.cam` or `www.heartwave.cam`) and click **Add**.
3. Vercel will show two simple DNS records to add at your domain registrar (e.g., Porkbun, Cloudflare, Namecheap):
   - **A Record**: `@` &rarr; `76.76.21.21`
   - **CNAME Record**: `www` &rarr; `cname.vercel-dns.com`
4. Once added, Vercel automatically issues an SSL certificate within 2 minutes. Your custom domain is now live!

---

## 📦 Dynamic GitHub Releases Syncing

The download buttons and platform matrix in the website do **not** use hardcoded links:
- They automatically query `https://api.github.com/repos/Jithin0306/HeartWave/releases/latest` in real time.
- When you release a new version (e.g. `v1.3.31`), the website updates version tags, file sizes, and download URLs immediately without re-deploying the site!
- Safe fallbacks are built-in so users can always download even if the GitHub API is temporarily rate-limited.

---

## 💻 Local Development

To run and preview the website on your local machine:

```bash
cd website
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
