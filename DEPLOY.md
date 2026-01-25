# Deployment Guide for Bankim Jewellery ERP

This system consists of two parts:
1.  **Backend**: FastAPI (Python)
2.  **Frontend**: React (Vite)

## 1. Deploying Backend (Render / DigitalOcean / Heroku)

The backend requires python environment and Google Credentials.

### Prerequisites
-   A cloud provider account (e.g., [Render](https://render.com) is easiest for Python).
-   Your Google Cloud Service Account JSON file.

### Steps for Render.com

1.  **Push code to GitHub**.
2.  **New Web Service** -> Connect your repo.
3.  **Root Directory**: `backend`
4.  **Runtime**: Python 3
5.  **Build Command**: `pip install -r requirements.txt`
6.  **Start Command**: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app`
7.  **Environment Variables**:
    *   Add your `.env` variables here.
    *   **CRITICAL**: For `GOOGLE_CREDENTIALS_JSON`, paste the *entire content* of your `service_account.json` file as the value. 
    *   (You might need to update code to read JSON from env var instead of file path if file persistence is an issue, or use Render's "Secret Files").

## 2. Deploying Frontend (Vercel)

1.  **New Project** on Vercel -> Import Repo.
2.  **Root Directory**: `frontend`
3.  **Build Command**: `npm run build`
4.  **Output Directory**: `dist`
5.  **Install Command**: `npm install`
6.  **Environment Variables**:
    *   `VITE_API_URL`: The URL of your deployed Backend (e.g., `https://bankim-backend.onrender.com`).

## 3. Post-Deployment

-   Go to your Vercel URL.
-   Check "Settings" page in the app to verify backend connection.
-   Adjust `vercel.json` in frontend if you need to proxy API calls differently (e.g. to avoid CORS if domains differ).
