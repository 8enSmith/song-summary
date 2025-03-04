# Song Summary

A modern web application that helps you discover and analyze songs. Get lyrics and AI-powered song analysis.

<p align="center">
   <img width="278" alt="image" src="https://github.com/user-attachments/assets/15de9c71-ce13-41b5-a827-a80bd14617a8" />
</p>

## Features

- 🎵 Search for songs with an intuitive autocomplete interface
- 📝 View song lyrics in a clean, readable format
- 🤖 AI-powered analysis of song lyrics (using Google Gemini 2.0 pro via OpenRouter)
- 📺 Integrated YouTube video player for songs
- 💅 Modern, responsive UI built with shadcn/ui and Tailwind CSS

## Tech Stack

- [Next.js 15](https://nextjs.org/) - React framework
- [React 19](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [React Query](https://tanstack.com/query/latest) - Data fetching
- [Radix UI](https://www.radix-ui.com/) - Accessible UI components
- [Google APIs](https://github.com/googleapis/google-api-nodejs-client) - YouTube integration

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
