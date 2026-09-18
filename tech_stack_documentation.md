# Project Tech Stack Architecture

**Project Name:** Personal Photography Portfolio  
**Target User:** Non-technical Photographer (Admin / Content Creator)  
**Architecture Pattern:** Serverless / Jamstack (Headless CMS + Static Site Generation)

---

### Overview

This project uses a **Serverless Static-First Architecture**. Rather than relying on a traditional database and backend server, the application pre-renders HTML/CSS at build time using **Astro** and **React**. The photographer manages all content via a visual dashboard (**Sanity.io** or **Decap CMS**), which stores media in Cloudinary and triggers automatic deployment builds to **Vercel**.

---

### Core Tech Stack

| Layer | Technology | Function & Strategy |
| :--- | :--- | :--- |
| **Frontend Framework** | **Astro** *(with React Islands)* | Handles routing, pre-rendering static HTML, and SEO. Uses React specifically for interactive components (e.g., Lightbox modals, image filtering). |
| **CMS (Content Admin)** | **Sanity.io** or **Decap CMS** | Provides a web-based, no-code dashboard for the photographer to upload galleries, add titles, and reorder photos. |
| **Media Host & CDN** | **Cloudinary** | Hosts all high-resolution images, automatically serving optimized, responsive WebP/AVIF images to visitors based on their device. |
| **Hosting & CI/CD** | **Vercel** | Hosts the pre-built site globally on edge networks. Rebuilds the site automatically whenever new content is published in the CMS. |

---

### System Architecture Workflow

```text
┌────────────────────────────────┐
│      Photographer (Admin)      │
└──────────────┬─────────────────┘
               │  1. Uploads photos & content
               ▼
┌────────────────────────────────┐       2. Delivers Assets
│  Headless CMS  + Cloudinary    ├─────────────────────────────────┐
└──────────────┬─────────────────┘                                 │
               │  3. Triggers Webhook                              │
               ▼                                                   │
┌────────────────────────────────┐                                 │
│      Vercel Deployment         │                                 │
│  (Builds Astro/React Static)   │                                 │
└──────────────┬─────────────────┘                                 │
               │  4. Serves Static Site                            │
               ▼                                                   │
┌────────────────────────────────┐     5. Fetches Optimized Images │
│         End Visitor            ├─────────────────────────────────┘
└────────────────────────────────┘
```

---

### Key Technical Advantages

1. **Zero Ongoing Infrastructure Cost:** Every service operates on a generous, perpetual free tier suitable for portfolio traffic.
2. **Zero Backend Maintenance:** No server security patches, no database management, and no backend API server setup required.
3. **Maximum Performance:** Near-zero JavaScript shipped to the client by default (Astro Islands), resulting in top-tier Lighthouse performance scores and fast image load times.
4. **Developer-Free Content Updates:** The photographer manages all portfolio content through a simple user interface without touching code or repository commits.
