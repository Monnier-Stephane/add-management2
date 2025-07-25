# Subscription Management API

A NestJS-based REST API for managing subscriptions and memberships.

## 🚧 Development Status

This project is currently **under active development**. Features and API endpoints may change as the application evolves.

### Current Status
- ✅ **Backend API**: Core CRUD operations implemented
- ✅ **Database**: MongoDB integration with Mongoose
- ✅ **Testing**: Unit tests for subscription service
- 🔄 **Frontend**: In development
- 🔄 **Authentication**: Planned
- 🔄 **Advanced Features**: Planning phase

## Features

- **Subscription Management**: CRUD operations for subscriptions
- **CSV Import**: Process subscription data from CSV files
- **Coach Management**: Manage coaches and their information
- **Database Integration**: MongoDB with Mongoose ODM
- **Testing**: Comprehensive unit tests with Jest

## Tech Stack

- **Framework**: NestJS
- **Database**: MongoDB with Mongoose
- **Language**: TypeScript
- **Testing**: Jest
- **Environment**: Node.js

## Project Structure

```
src/
├── subscriptions/          # Subscription management
│   ├── dto/               # Data transfer objects
│   ├── schemas/           # MongoDB schemas
│   ├── subscriptions.controller.ts
│   ├── subscriptions.service.ts
│   ├── subscriptions.service.spec.ts
│   └── csv-processor.service.ts
├── coaches/               # Coach management
│   ├── dto/
│   ├── schemas/
│   ├── coaches.controller.ts
│   ├── coaches.service.ts
│   └── coaches.service.spec.ts
└── database/              # Database configuration
    └── database.module.ts
```

## Environment Variables

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/subscription-management
```

## Installation

```bash
npm install
```

## Running the app

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## Testing

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## API Endpoints

### Subscriptions
- `GET /subscriptions` - Get all subscriptions
- `POST /subscriptions` - Create a new subscription
- `GET /subscriptions/:id` - Get subscription by ID
- `PUT /subscriptions/:id` - Update subscription
- `DELETE /subscriptions/:id` - Delete subscription
- `POST /subscriptions/upload-csv` - Upload and process CSV file

### Coaches
- `GET /coaches` - Get all coaches
- `POST /coaches` - Create a new coach
- `GET /coaches/:id` - Get coach by ID
- `PUT /coaches/:id` - Update coach
- `DELETE /coaches/:id` - Delete coach

## CSV Import Format

The CSV processor expects the following columns:
- `nom adherent` - Member's last name
- `prénom adherent` - Member's first name
- `email facilement joignable` - Contact email
- `telephone` - Phone number
- `telephone urgence` - Emergency phone number
- `tarif` - Pricing tier

## Contributing

This project is under active development. Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## Roadmap

- [ ] Complete frontend implementation
- [ ] Add authentication and authorization
- [ ] Implement advanced reporting features
- [ ] Add email notifications
- [ ] Create mobile app

## License

[MIT licensed](LICENSE)
