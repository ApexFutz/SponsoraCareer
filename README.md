# SponsoraCareer - Database Integration

A platform connecting sponsors with dreamers, now with full database integration using SQLite and Node.js backend.

## Features

✅ **Authentication System**

- JWT-based authentication
- User registration and login
- Session management

✅ **Database Integration**

- SQLite database with comprehensive schema
- User profiles, offers, contracts, milestones, notifications
- RESTful API endpoints

✅ **Profile Management**

- Complete dreamer profile creation
- Real-time data persistence
- Financial calculations

✅ **Notification System**

- Working notification bell
- Real-time notifications
- Mark as read functionality

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Server

```bash
npm start
```

Or for development with auto-restart:

```bash
npm run dev
```

### 3. Access the Application

Open your browser and go to: `http://localhost:3000`

## Database Schema

The application uses SQLite with the following tables:

- **users** - Authentication and user types
- **dreamer_profiles** - Dreamer profile information
- **sponsor_profiles** - Sponsor profile information
- **offers** - Sponsorship offers
- **contracts** - Active sponsorship contracts
- **milestones** - Goal tracking milestones
- **notifications** - User notifications

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Profile Management

- `GET /api/profile` - Get user profile
- `POST /api/profile` - Save/update profile

### Offers

- `GET /api/offers` - Get user offers
- `PUT /api/offers/:id/status` - Update offer status

### Notifications

- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/mark-all-read` - Mark all as read

### Milestones

- `GET /api/milestones` - Get user milestones
- `POST /api/milestones` - Create milestone
- `PUT /api/milestones/:id` - Update milestone

## Demo Credentials

**Dreamer Account:**

- Email: `dreamer@example.com`
- Password: `dreamer123`

**Sponsor Account:**

- Email: `sponsor@example.com`
- Password: `sponsor123`

_Or use any valid email with 6+ character password_

## File Structure

```
├── server.js              # Express server and API routes
├── database/
│   ├── database.js         # Database connection and models
│   ├── schema.sql          # Database schema and demo data
│   └── sponsoracareer.db   # SQLite database (auto-created)
├── api-client.js           # Frontend API client
├── dashboard.js            # Dashboard functionality
├── script.js               # Authentication logic
├── index.html              # Login page
├── dashboard.html          # Dashboard page
├── styles.css              # Main styles
├── dashboard.css           # Dashboard styles
└── package.json            # Dependencies and scripts
```

## Development

### Adding New Features

1. **Database Changes**: Update `database/schema.sql`
2. **API Endpoints**: Add routes in `server.js`
3. **Frontend Integration**: Update `api-client.js` and dashboard files

### Environment Variables

Create a `.env` file for production:

```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=production
```

## Production Deployment

1. Set environment variables
2. Install production dependencies: `npm install --production`
3. Start server: `npm start`

## Technologies Used

- **Backend**: Node.js, Express.js, SQLite3
- **Authentication**: JWT, bcryptjs
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Database**: SQLite with comprehensive schema

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- SQL injection prevention
- CORS configuration

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - see LICENSE file for details.
