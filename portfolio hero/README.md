# AI-Native Portfolio for Anubhav[cite: 1]

A modern, fast, bento-grid style portfolio for a CS student specializing in Python, C++, Web Dev, and GenAI. 

## Features
* **Bento-Grid Layout**: Clean, responsive, mobile-first design with a light/dark theme toggle.
* **Ask Anubhav AI**: A floating chat widget powered by a Vercel Edge function (streaming responses, rate-limited, prompt-injection safe).
* **Live GitHub Fetch**: Fetches top 6 repos for `anubhavwadhwa011-jpg`[cite: 1] and caches them in `sessionStorage`.
* **Live Data Demo**: Renders a Python-style data analysis chart via Chart.js from a bundled JSON.
* **Accessible & SEO Optimized**: JSON-LD schema, OpenGraph tags, ARIA-labels, and a focus-trapped chat widget.

## Deployment Steps (Vercel)
1. Initialize a Git repository and push this code to GitHub.
2. Log into [Vercel](https://vercel.com) and import the repository.
3. In the Vercel project settings, navigate to **Environment Variables** and add:
   * `GEMINI_API_KEY`: Your Google Gemini API Key (used by the edge function).
4. Deploy. The `/api/chat` serverless function will automatically be routed by Vercel.

## Test Plan
* **Lighthouse**: Run Chrome DevTools Lighthouse audit in Incognito mode. Ensure Performance, Accessibility, Best Practices, and SEO are all >90.
* **Chat Functionality**: Open the chat widget. Press `Esc` to test closing. Open it again, tab through to test the focus trap. Send a message to ensure streaming text renders correctly and rate limiting (max 5 requests/minute) triggers.
* **Fallback Test**: Temporarily change the API key to an invalid one to ensure the graceful fallback error message appears in the chat UI.
* **GitHub Cache**: Reload the page and check the Network tab to ensure the GitHub API is only called once per session.