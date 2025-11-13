# Upper Base - Community Platform MVP

A modern, modular community platform built with Next.js 15, Supabase, and Stripe Connect.

## Features

- 🔐 **Authentication** - Sign up, sign in, and magic link support via Supabase
- 🏢 **Community Management** - Create and manage multiple communities
- 💰 **Payments** - Monetize communities with Stripe Connect
- 💬 **Chat Module** - Real-time messaging within communities
- 📝 **Notes Module** - Collaborative note-taking
- ✅ **Tasks Module** - Task management and tracking
- 🎨 **Modern UI** - Clean design with Tailwind CSS and Shadcn/UI
- 🚀 **Ready to Deploy** - Optimized for Vercel

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: TailwindCSS + Shadcn/UI
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Payments**: Stripe Connect
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Supabase account and project
- Stripe account (for payments)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd upper-base
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
- Supabase URL and keys (from your Supabase project settings)
- Stripe keys (from your Stripe dashboard)

4. Set up the database:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the SQL from `supabase/schema.sql`

5. Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/               # Shadcn/UI components
│   ├── dashboard/        # Dashboard components
│   └── modules/          # Feature modules
├── lib/                  # Core libraries
│   ├── supabase/        # Supabase client setup
│   ├── types.ts         # TypeScript types
│   ├── utils.ts         # Utility functions
│   └── stripe.ts        # Stripe integration
├── hooks/               # Custom React hooks
├── services/            # API service functions
└── middleware.ts        # Next.js middleware
```

## Supabase Setup

1. Create a new Supabase project
2. Copy your project URL and anon key to `.env`
3. Run the SQL schema from `supabase/schema.sql` in the SQL Editor
4. Enable Row Level Security (RLS) policies are included in the schema

## Stripe Setup

1. Create a Stripe account
2. Get your publishable and secret keys from the Stripe dashboard
3. Add keys to `.env`
4. Enable Stripe Connect in your Stripe dashboard

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel project settings
4. Deploy!

The app is optimized for Vercel with:
- Automatic environment variable detection
- Edge middleware support
- Optimized builds

## Features Breakdown

### Authentication
- Email/password authentication
- Magic link (passwordless) authentication
- Protected routes with middleware
- Persistent sessions

### Community Management
- Create unlimited communities
- Customize community settings
- Enable/disable modules per community
- Track member count and revenue

### Module System
- **Chat**: Real-time messaging (placeholder for WebSocket integration)
- **Notes**: Create, edit, and delete notes
- **Tasks**: Task management with completion tracking
- Easily extendable for new modules

### Payments (Stripe Connect)
- Create paid memberships
- Set monthly pricing
- Stripe Connect for creator payouts
- Automatic product/price creation

## Environment Variables

See `.env.example` for all required variables:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `NEXT_PUBLIC_APP_URL` - Your app URL

## Development

### Running locally
```bash
pnpm dev
```

### Building for production
```bash
pnpm build
```

### Running production build
```bash
pnpm start
```

## Code Standards

- TypeScript for type safety
- Clean code principles
- Folder-by-feature structure
- Reusable components
- Proper error handling
- No console.logs or commented code in production

## Future Enhancements

- Real-time chat with WebSocket/Supabase Realtime
- Zoom integration module
- File uploads and storage
- Advanced analytics dashboard
- Mobile app (React Native)
- Email notifications
- Advanced member management

## License

MIT License - feel free to use this for your own projects!

## Support

For issues and questions, please open an issue on GitHub.
