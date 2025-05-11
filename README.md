# AI Finance Platform

A modern, AI-powered financial management platform built with Next.js, Clerk, and Prisma. This platform helps users manage their finances smarter with the help of artificial intelligence.

## 🌟 Features

- **AI-Powered Financial Analysis**: Get intelligent insights and recommendations for your financial decisions
- **Secure Authentication**: Built-in user authentication and authorization using Clerk
- **Modern UI/UX**: Beautiful and responsive interface built with Tailwind CSS and Radix UI
- **Real-time Updates**: Stay informed with live financial data and notifications
- **Email Notifications**: Integrated email system for important updates and alerts
- **Dark Mode Support**: Seamless dark/light mode switching
- **Mobile Responsive**: Fully responsive design for all devices

## 🚀 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Authentication**: Clerk
- **Database**: Prisma with PostgreSQL
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Form Handling**: React Hook Form with Zod validation
- **Email**: React Email with Resend
- **Charts**: Recharts
- **Animations**: Framer Motion
- **AI Integration**: Google's Generative AI

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-finance-platform.git
cd ai-finance-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=sign-up

# Database Configuration
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_database_url

# API Keys
ARCJET_API_KEY=your_arcjet_api_key
ARCJET_ENV=development
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
IPINFO_TOKEN=your_ipinfo_token
WEATHER_API_KEY=your_weather_api_key
RESEND_API_KEY=your_resend_api_key
```

4. Initialize the database:
```bash
npx prisma generate
npx prisma db push
```

5. Start the development server:
```bash
npm run dev
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run email` - Start email development server

## 📁 Project Structure

```
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── (auth)/         # Authentication pages
│   ├── (main)/         # Main application pages
│   └── lib/            # Utility functions
├── components/         # Reusable UI components
├── context/           # React context providers
├── data/              # Static data and constants
├── emails/            # Email templates
├── hooks/             # Custom React hooks
├── lib/               # Shared utilities
├── prisma/            # Database schema and migrations
└── public/            # Static assets
```

## 🔒 Security

- Authentication handled by Clerk
- Environment variables for sensitive data
- API rate limiting with Arcjet
- Secure database connections
- Protected API routes

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Clerk](https://clerk.com/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
