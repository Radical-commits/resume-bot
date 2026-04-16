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

## Quick Start (Docker)

The fastest way to get your AI resume live.

### 1. Prerequisites
- **Docker & Docker Compose** installed.
- **Cloudflare Tunnel Token**: Created in your [Cloudflare Zero Trust dashboard](https://one.dash.cloudflare.com/).
- **AI API Key**: (e.g., from [Groq](https://console.groq.com) or [OpenAI](https://platform.openai.com)).

### 2. Installation
```bash
git clone [https://github.com/Radical-commits/resume-bot.git](https://github.com/Radical-commits/resume-bot.git)
cd cv-chat-app
```

### 3. Configuration
Copy the example environment file and fill in your keys:
```bash
cp .env.example .env
```
Edit `.env` and set:
- `AI_API_KEY`: Your provider's key.
- `TUNNEL_TOKEN`: Your Cloudflare Tunnel token.

### 4. Launch
```bash
docker compose up -d
```
Your resume is now live on the domain you configured in Cloudflare!
> Make sure your Public Hostname in Cloudflare points to http://app:3001

## Customizing Your Resume

To make the resume yours, modify the JSON files in the root directory:

1. **Your Data**: Edit `data/resume.json` with your experience and skills. Add/edit `data/resume.{lang}.json` files for multi-lingual presentation 
2. **Settings**: Update `config.json` to change the site details, theme, AI model, or language.
3. **Apply Changes**: Since data is optimized and baked into the image, rebuild the container to see updates:
   ```bash
   docker compose up -d --build app
   ```

> For customization tips check [CUSTOMIZATION.md](./CUSTOMIZATION.md)

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