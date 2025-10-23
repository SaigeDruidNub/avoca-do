# Avoca-do: Judge Testing Guide

Welcome, Judges! This README will help you test the Avoca-do application efficiently. Please follow the instructions below to set up, run, and evaluate the app.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Setup Instructions](#setup-instructions)
- [Running the Application](#running-the-application)
- [Testing Features](#testing-features)
- [User Accounts](#user-accounts)
- [Troubleshooting](#troubleshooting)
- [Contact](#contact)

---

## Project Overview

Avoca-do is a social platform with real-time chat, translation, notifications, and user profile management. It is built with Next.js, TypeScript, Tailwind CSS, and MongoDB.

---

## Setup Instructions

1. **Clone the repository:**
   ```sh
   git clone <repo-url>
   cd avoca-do
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Set up environment variables:**
   - Copy `.env.example` to `.env.local` and fill in required values (MongoDB URI, API keys, etc.).
   - If `.env.example` is missing, refer to `TROUBLESHOOTING.md` or ask the project contact.
4. **Start MongoDB:**
   - Ensure you have a running MongoDB instance (local or cloud).

---

## Running the Application

- **Development mode:**
  ```sh
  npm run dev
  ```
- **Production build:**
  ```sh
  npm run build
  npm start
  ```
- **Real-time server:**
  ```sh
  cd realtime
  npm install
  node server.js
  ```

---

## Testing Features

- **Authentication:**
  - Test login, logout, and registration flows.
- **Feed:**
  - Create, like, dislike, comment, and delete posts.
- **Chat:**
  - Send and receive real-time messages.
- **Translation:**
  - Use the translation feature on posts and messages.
- **Notifications:**
  - Check notification delivery and preferences.
- **Profile:**
  - Edit profile, upload images, manage friends and blocked users.
- **Settings:**
  - Adjust privacy, interests, and notification settings.

---

## User Accounts

- You may use your own accounts or request test credentials from the project contact.
- Some features may require multiple users (e.g., chat, friend requests).

---

## Troubleshooting

- See `TROUBLESHOOTING.md` for common issues and solutions.
- For translation and notification issues, refer to `AUTO_TRANSLATION.md` and `NOTIFICATION_SYSTEM.md`.
- Check the terminal for build or runtime errors.

---

## Contact

For questions or issues, please contact the project maintainer:

- GitHub: [SaigeDruidNub](https://github.com/SaigeDruidNub)
- Email: [add your email here]

---

Thank you for judging Avoca-do!
