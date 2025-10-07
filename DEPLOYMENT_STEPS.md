# PixelPin Deployment Steps

## 1. GitHub Repository (COMPLETE FIRST)
✅ Repository configured for: https://github.com/jpjaydus/pixelpin

After creating the repository on GitHub, run:
```bash
git push -u origin main
```

## 2. Neon Database Setup
1. Go to https://neon.tech
2. Sign up/login with your GitHub account
3. Click "Create Project"
4. Project name: `PixelPin`
5. Database name: `pixelpin`
6. Region: Choose closest to your users
7. Copy the connection string (starts with `postgresql://`)

## 3. Vercel Deployment
1. Go to https://vercel.com
2. Sign up/login with your GitHub account
3. Click "New Project"
4. Import `jpjaydus/pixelpin` repository
5. Framework Preset: Next.js (auto-detected)
6. Root Directory: `./` (default)
7. Click "Deploy"

## 4. Environment Variables in Vercel
After deployment, go to your project settings and add:

### Environment Variables:
- `DATABASE_URL`: Your Neon connection string
- `NEXTAUTH_SECRET`: `your-generated-secret-here`
- `NEXTAUTH_URL`: Your Vercel app URL (e.g., https://pixelpin-jpjaydus.vercel.app)

### Generate NEXTAUTH_SECRET:
Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```

## 5. Redeploy
After adding environment variables, trigger a new deployment in Vercel.

## Next Steps
Once deployed, you can continue with Task 3: Database schema and authentication setup.