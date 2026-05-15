# ResumeAI

> Transform your professional experience into an AI-powered resume website

## Overview

ResumeAI is a complete template for creating your own AI-powered resume website. Visitors can interact with an AI chatbot that answers questions about your professional experience, get job fit assessments, and explore your background through an elegant, responsive interface.

The app is containerized and designed for secure, easy deployment using **Cloudflare Tunnel**, allowing you to host it from anywhere (even behind NAT) without opening ports.

> **The app comes preconfigured with a sample resume** (Sarah Chen, Senior Product Manager) that you can view immediately after installation. Simply replace it with your own information to make it yours.

## Features

- ✅ **AI chatbot** - Answer questions about your experience
- ✅ **Job fit assessment** - Match your background to job descriptions
- ✅ **Multiple AI providers** - Groq, OpenAI, Google Gemini, Anthropic, or self-hosted (Ollama)
- ✅ **4 pre-built themes** - Professional, Modern, Minimal, Creative
- ✅ **Fully responsive** design
- ✅ **Multilingual support** - Add multiple languages easily
- ✅ **SEO optimized** with Open Graph tags
- ✅ **Zero-port Deployment** - Secured via Cloudflare Tunnel
- ✅ **Easy configuration** - JSON-based, no code changes needed
- ✅ **Admin console** - analytics dashboard, conversation log, and AI-powered visitor insights at `/admin`

## Quick Start (Docker)

The fastest way to get your AI resume live. No build step — the app runs from a pre-built image published to GitHub Container Registry.

### 1. Prerequisites
- **Docker & Docker Compose** installed.
- **Cloudflare Tunnel Token**: Created in your [Cloudflare Zero Trust dashboard](https://one.dash.cloudflare.com/).
- **AI API Key**: (e.g., from [Groq](https://console.groq.com) or [OpenAI](https://platform.openai.com)).

### 2. Clone the repository
```bash
git clone https://github.com/Radical-commits/resume-bot.git
cd resume-bot
```
> This gives you the starter `config.json`, `data/`, and `themes/` files to customise.

### 3. Configure
Copy the example environment file and fill in your keys:
```bash
cp .env.example .env
```
Edit `.env` and set:
- `AI_API_KEY`: Your provider's key.
- `TUNNEL_TOKEN`: Your Cloudflare Tunnel token.
- `ADMIN_TOKEN`: Password for the `/admin` console.
- `DATA_DIR` *(optional)*: Absolute path to a directory containing your `config.json`, `data/`, and `themes/`. Defaults to the repo directory if not set.

### 4. Launch
```bash
docker compose up -d
```
Docker pulls the latest image from GHCR automatically. Your resume is now live on the domain you configured in Cloudflare!
> Make sure your Public Hostname in Cloudflare points to `http://app:3001`

## Customizing Your Resume

Config, resume data, and themes are loaded from the host at runtime via Docker volumes — no image rebuild needed. Edit the files and restart the container to apply changes.

| File / Directory | Purpose |
|---|---|
| `config.json` | Site settings, theme selection, AI provider & model |
| `data/resume.json` | Your resume content (English) |
| `data/resume.{lang}.json` | Multilingual resume variants (e.g. `resume.de.json`) |
| `data/translations.json` | UI text translations |
| `themes/{name}.json` | Theme colour and font definitions |

1. **Your data**: Edit `data/resume.json` with your experience and skills.
2. **Settings**: Update `config.json` to change the site domain, theme, AI model, or language.
3. **Apply changes**:
   ```bash
   docker compose restart app
   ```

**Using files from a different directory**: Set `DATA_DIR` in your `.env` to point Docker at any folder on the host:
```
DATA_DIR=/path/to/my/resume-config
```

> For detailed customisation tips see [CUSTOMIZATION.md](./docs/CUSTOMIZATION.md)

### Building from source

If you want to modify the application code itself, replace `image:` with `build: .` in `docker-compose.yml` and run `docker compose up -d --build app`.

## Admin Console

Navigate to `/admin` and enter your `ADMIN_TOKEN` to access the monitoring console.

| Tab | What it shows |
|---|---|
| **Dashboard** | Session counts, token usage, LLM latency, and database size — with a 7 d / 30 d toggle |
| **Insights** | AI-generated topic clusters, off-topic attempt rate, and coverage gaps from the past 30 days |
| **Visitor Questions** | Paginated log of every chat exchange with latency, session ID, and refusal flagging |

The console also exposes API endpoints for programmatic access and a one-click 90-day prune button for database maintenance. See [docs/ANALYTICS.md](./docs/ANALYTICS.md) for the full reference.

## Themes

| Theme | Vibe | Best For |
|-------|------|----------|
| **Professional** | Clean & Trustworthy | Corporate, Finance, Engineering |
| **Modern** | Bold & Trendy | Innovators, startup professionals |
| **Minimal** | Black & White | Designers, writers, minimalists |
| **Creative** | Pink & Purple | Creative professionals, artists |

## Deployment & Security

### Option A: Cloudflare Tunnel (Recommended)
This project uses **Cloudflare Tunnel** (`cloudflared`) to bridge your local Docker container with the internet. 

- **No Open Ports**: Your firewall remains closed. No 80/443 exposure.
- **SSL by Default**: Cloudflare handles Let's Encrypt certificates at the edge.
- **Privacy**: You can add Cloudflare Access to password-protect your resume.

### Option B: No Cloudflare (Direct IP or Reverse Proxy)
If you do not want to use Cloudflare Tunnel (e.g., you prefer using your hosting provider's domain or a direct IP), follow these steps:

#### 1. Direct IP Access
To access the app directly via your server's IP address:
- **Expose Ports**: In your `docker-compose.yml`, uncomment the `ports` section for the `app` service:
  ```yaml
  ports:
    - "3001:3001"
  ```
- **Firewall**: Ensure port `3001` is open in your VPS firewall (e.g., run `ufw allow 3001`).
- **Access**: Your site will be available at `http://your-server-ip:3001`.

#### 2. Reverse Proxy (Nginx/Caddy)
If you are using a standard domain from a hosting provider:
- **Setup**: Configure a reverse proxy on your VPS to point your domain to `http://localhost:3001`.
- **SSL**: You will need to manage SSL certificates manually (e.g., using Certbot for Nginx or let Caddy handle it automatically).
- **Tunnel Service**: You can safely comment out or remove the entire `tunnel` service in `docker-compose.yml`.

> **Note:** When deploying without Cloudflare, your server's IP becomes publicly visible. Ensure you have proper security measures in place.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Express.js + TypeScript
- **Tunneling:** Cloudflare Tunnel (cloudflared)
- **Containerization:** Docker
- **AI:** Multiple providers supported (Groq, OpenAI, Gemini, Anthropic, Ollama)