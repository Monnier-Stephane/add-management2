# Subscription Management Frontend

A Next.js-based frontend application for managing subscriptions and memberships.

## Features

- **Dashboard**: Overview of subscriptions and statistics
- **Student Management**: View and manage student subscriptions
- **Planning Calendar**: Schedule and view classes
- **Admin Panel**: Statistics and administrative functions
- **Authentication**: Protected routes and user management
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with shadcn/ui
- **State Management**: React Query for server state
- **Authentication**: Firebase Auth
- **Testing**: Jest with React Testing Library
- **Charts**: Recharts for data visualization

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard pages
│   │   ├── admin/        # Admin panel
│   │   ├── planning/     # Calendar view
│   │   └── students/     # Student management
│   ├── login/            # Authentication pages
│   └── signup/           # Registration pages
├── components/            # Reusable components
│   ├── admin/            # Admin-specific components
│   ├── auth/             # Authentication components
│   └── ui/               # Base UI components
└── lib/                  # Utilities and configurations
    ├── auth/             # Authentication logic
    └── ReactQueryProvider.tsx
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- Backend API running on `http://localhost:3001`

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test ProtectedRoute.test.tsx
```

### Building for Production

```bash
npm run build
npm start
```

## Key Components

### Dashboard
- **Admin Panel**: Statistics dashboard with charts
- **Student Management**: List and manage student subscriptions
- **Planning**: Calendar view for class scheduling

### Authentication
- Protected routes with automatic redirection
- Firebase authentication integration
- User session management

### Data Visualization
- Pie charts for payment status and age distribution
- Responsive design for all screen sizes

## Development Status

This project is currently **under active development**.

### Current Status
- ✅ **Core Pages**: Dashboard, students, planning implemented
- ✅ **Authentication**: Protected routes and Firebase integration
- ✅ **Testing**: Unit tests for authentication components
- 🔄 **API Integration**: Connecting with backend services
- 🔄 **Advanced Features**: Enhanced UI and user experience

## Contributing

This project is under active development. Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## Roadmap

- [ ] Complete API integration with backend
- [ ] Add real-time updates
- [ ] Implement advanced filtering and search
- [ ] Add export functionality
- [ ] Create mobile app

## License

[MIT licensed](LICENSE)
