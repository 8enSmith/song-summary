# Song Summary

A modern web application that helps you discover and analyze songs. Get lyrics, AI-powered song analysis, and listen to the analysis through text-to-speech technology.

NOTE: The Genius Lyrics API prohibits the use of their API in popular domains e.g. Vercel. Deploying this project in such a domain results a CAPTCHA being required when the
API is called. Hence to keep within the TOS with Genius this should only be run locally.

## Features

- 🎵 Search for songs with an intuitive autocomplete interface
- 📝 View song lyrics in a clean, readable format
- 🤖 AI-powered analysis of song lyrics
- 📺 Integrated YouTube video player for songs
- 💅 Modern, responsive UI built with Tailwind CSS

## Tech Stack

- [Next.js 15](https://nextjs.org/) - React framework
- [React 19](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [React Query](https://tanstack.com/query/latest) - Data fetching
- [Radix UI](https://www.radix-ui.com/) - Accessible UI components
- [Google APIs](https://github.com/googleapis/google-api-nodejs-client) - YouTube integration
- [Genius Lyrics](https://genius.com/) - Lyrics data

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/yourusername/song-summary.git
cd song-summary
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:
   Create a `.env.local` file with the necessary API keys (refer to `.env.example` for required variables)

4. Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
