# 🎨 Visual Deployment Guide

A visual, step-by-step guide to deploying FitCore on Vercel + Supabase.

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USERS                                    │
│                    (Gym Staff/Admin)                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL PLATFORM                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  FRONTEND (React + Vite)                  │  │
│  │  • Login Page                                             │  │
│  │  • Admin Dashboard                                        │  │
│  │  • Member Management                                      │  │
│  │  • Finance Management                                     │  │
│  └──────────────────────┬───────────────────────────────────┘  │
│                         │                                        │
│                         ▼                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            BACKEND (Flask Serverless API)                 │  │
│  │  • Authentication (JWT)                                