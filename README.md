# Custom Vercel Proxy

A secure reverse proxy application built with Next.js that provides authentication-gated access to multiple applications through a unified dashboard.

## Features

- 🔐 **Secure Authentication**: JWT-based a3. Choose the required permissions:
   - ✅ `view:contacts` - To search for existing contacts by email for authorization
   - ✅ `view:customers` - To verify customer status during login
   - ⚠️ `create:contacts` - Not needed for this integration
   - ⚠️ `view:sites` - Not needed for this integrationtication with bcrypt password hashing
- 🎯 **Reverse Proxy**: Seamlessly proxy requests to configured applications
- 🔗 **Kajabi Integration**: Mock Kajabi API integration for user verification
- ⚙️ **Dynamic Configuration**: YAML-based application configuration
- 🎨 **Modern UI**: Beautiful, responsive interface built with Tailwind CSS
- 🚀 **Next.js 14**: Built with the latest Next.js App Router
- 🔥 **Firebase Ready**: Pre-configured for Firebase Authentication (optional)
- 🛡️ **Middleware Protection**: Route-level authentication protection

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   User Login    │──▶│  Auth Middleware│──▶│   Dashboard     │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │                 │
                       │ Kajabi Verify   │
                       │                 │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │                 │    │                 │
                       │ Proxy Requests  │───▶│  Target Apps    │
                       │                 │    │                 │
                       └─────────────────┘    └─────────────────┘
```

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd custom-vercel-proxy
npm install
```

### 2. Configure Environment

Copy the environment template and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Firebase Configuration (optional)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Kajabi API Configuration
KAJABI_API_URL=https://api.kajabi.com
KAJABI_CLIENT_ID=your_kajabi_client_id
KAJABI_CLIENT_SECRET=your_kajabi_client_secret

# JWT Secret (generate a secure random string)
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

### 2.1. Firebase Setup (Optional)

If you want to use Firebase Authentication instead of the built-in JWT system, follow these steps:

#### Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** or **"Add project"**
3. Enter your project name (e.g., "custom-vercel-proxy")
4. Choose whether to enable Google Analytics (optional)
5. Click **"Create project"**

#### Step 2: Enable Authentication

1. In your Firebase project dashboard, click **"Authentication"** in the left sidebar
2. Click **"Get started"** if it's your first time
3. Go to the **"Sign-in method"** tab
4. Enable the sign-in providers you want to use:
   - **Email/Password**: Click on it, toggle "Enable", and save
   - **Google** (optional): Click on it, toggle "Enable", add your project's public-facing name, and save
   - **Other providers** as needed

#### Step 3: Get Firebase Configuration

1. In your Firebase project dashboard, click the **gear icon** ⚙️ next to "Project Overview"
2. Select **"Project settings"**
3. Scroll down to the **"Your apps"** section
4. Click the **web icon** `</>` to add a web app
5. Enter an app nickname (e.g., "Custom Vercel Proxy Web")
6. Optionally check "Also set up Firebase Hosting" if you plan to use it
7. Click **"Register app"**

#### Step 4: Copy Configuration Values

After registering your app, you'll see a configuration object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

Copy these values to your `.env.local` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

#### Step 5: Configure Authentication Rules (Optional)

1. Go to **Authentication** > **Users** tab
2. You can manually add users, or they can sign up through your app
3. For production, go to **Authentication** > **Settings** > **Authorized domains**
4. Add your production domain (e.g., `your-app.vercel.app`)

#### Step 6: Set up Firestore Rules (If using Firestore)

If you plan to use Firestore for user data:

1. Go to **Firestore Database** in the Firebase console
2. Click **"Create database"**
3. Choose **"Start in test mode"** for development (remember to secure it later)
4. Select a location for your database

Example Firestore security rules for production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

#### Step 7: Update Your Application Code

The Firebase configuration is already set up in `src/lib/firebase.ts`. To switch from JWT to Firebase auth, you would need to:

1. Update the login page to use Firebase auth methods
2. Modify the middleware to verify Firebase tokens instead of JWT
3. Update the auth utilities in `src/lib/auth.ts`

Example Firebase login implementation:

```typescript
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'

const handleFirebaseLogin = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    // Get Firebase ID token
    const idToken = await user.getIdToken()
    // Send token to your API for verification
    // ...
  } catch (error) {
    console.error('Firebase login error:', error)
  }
}
```

#### Firebase vs JWT Authentication

**Current Implementation (JWT):**
- ✅ Simple setup, no external dependencies
- ✅ Full control over authentication logic
- ✅ Works offline
- ❌ Manual user management
- ❌ Manual password reset implementation

**Firebase Authentication:**
- ✅ Built-in user management
- ✅ Password reset, email verification
- ✅ Multiple sign-in providers (Google, Facebook, etc.)
- ✅ Automatic token refresh
- ❌ Requires internet connection
- ❌ External dependency on Google services

Choose based on your project requirements!

### 2.2. Kajabi API Setup

This application integrates with Kajabi to verify user accounts and manage contacts. Follow these steps to set up the integration:

#### Step 1: Access Your Kajabi Admin Portal

1. Log into your Kajabi account
2. Navigate to **Settings** → **Security** → **User API Keys**

#### Step 2: Create a New API Key

1. Click **"Create User API Key"**
2. Enter a descriptive name (e.g., "Vercel Proxy Integration")
3. Select the user account to associate with this API key
4. Choose the required permissions:
   - ✅ `view:contacts` - To search for existing contacts by email
   - ✅ `create:contacts` - To create new contacts during registration
   - ✅ `view:sites` - To get available sites for contact creation
   - ✅ `view:customers` - To verify customer status
5. Click **"Create"**

#### Step 3: Copy Your Credentials

After creating the API key, you'll receive:
- **Client ID**: A unique identifier for your application
- **Client Secret**: A secret key for authentication (keep this secure!)

Update your `.env.local` file:

```env
# Kajabi API Configuration
KAJABI_API_URL=https://api.kajabi.com
KAJABI_CLIENT_ID=your_actual_client_id_from_kajabi
KAJABI_CLIENT_SECRET=your_actual_client_secret_from_kajabi
```

#### Step 4: How the Integration Works

**During User Registration:**
1. App checks if the account already exists in Firebase (local database)
2. If account exists → "An account already exists"
3. If account doesn't exist → App checks if the email is available in Kajabi
4. If email is in Kajabi → User can register locally (authorized user)
5. If email is NOT in Kajabi → "You are not authorized to create an account on this website"

**During User Login:**
1. App authenticates user against local database
2. App verifies the user exists and is active in Kajabi
3. If both checks pass → User is granted access

**Fallback Behavior:**
- If Kajabi API credentials are not configured, the app uses mock data for development
- The app will still function but won't sync with your actual Kajabi contacts

#### Step 5: Testing the Integration

1. Start your development server: `npm run dev`
2. Try registering with a new email address
3. Check your Kajabi contacts to see if the new contact was created
4. Try logging in with an existing Kajabi contact email

#### API Endpoints Used

The integration uses these Kajabi API endpoints:
- `POST /v1/oauth/token` - Authenticate with Kajabi API
- `GET /v1/contacts?filter[email_contains]=email` - Search for contacts by email
- `POST /v1/contacts` - Create new contacts
- `GET /v1/sites` - Get available sites for contact creation

For more information, visit the [Kajabi API Documentation](https://developers.kajabi.com).

**Important Notes:**
- Keep your API credentials secure and never commit them to version control
- API requests are made server-side to protect your credentials
- The app includes proper error handling if Kajabi API is unavailable
- Rate limiting applies to Kajabi API requests (check their documentation for limits)

### 3. Configure Applications

Edit `config/apps.yaml` to add your applications:

```yaml
apps:
  - name: "Dashboard"
    target_url: "https://dashboard.example.com"
  - name: "Analytics"
    target_url: "https://analytics.example.com"
  - name: "CRM"
    target_url: "https://crm.example.com"
```

### 4. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` and use the demo credentials:
- **Email**: `admin@example.com`
- **Password**: `password123`

Or register a new account at `http://localhost:3000/register`

## Authentication Flow

1. **Registration**: New users can register at `/register`
   - Email validation and password strength requirements
   - **Firebase Check**: System first checks if account already exists locally
   - If account exists → "An account already exists"
   - **Kajabi Authorization Check**: System verifies email exists in Kajabi
   - If email NOT in Kajabi → "You are not authorized to create an account"
   - If email IS in Kajabi → Registration proceeds (authorized user)
   - Secure password hashing with bcrypt
   - User data stored locally in `data/users.json`

2. **Login**: User enters credentials on the login page
3. **Local Auth**: System verifies credentials against local user database
4. **Kajabi Verification**: System checks if user exists and is active in Kajabi
   - If user not found locally but exists in Kajabi → Prompt to register locally
   - If user exists locally but not in Kajabi → Access denied
5. **JWT Token**: Upon successful verification, a JWT token is issued
6. **Protected Routes**: Middleware validates JWT for all protected routes
7. **Dashboard Access**: Authenticated users can access the application dashboard

## Proxy Mechanism

The proxy works by:

1. **Route Mapping**: URLs like `/proxy/dashboard/*` are mapped to configured apps
2. **Header Forwarding**: Original headers are preserved and forwarded
3. **Response Streaming**: Responses are streamed back to the client
4. **Error Handling**: Proper error responses for failed proxy requests

## Configuration

### Adding New Applications

1. Edit `config/apps.yaml`:
```yaml
apps:
  - name: "New App"
    target_url: "https://newapp.example.com"
```

2. Restart the development server or redeploy

### Adding New Users

**Option 1: User Registration (Recommended)**
Users can register themselves at `/register`. The system will:
- Validate email format and password strength
- Check if the email exists in Kajabi (mock implementation)
- Hash the password securely with bcrypt
- Store user data in `data/users.json`

**Option 2: Manual Addition**
Edit `src/lib/auth.ts` and add users to the `mockUsers` array:

```typescript
const mockUsers = [
  {
    id: '3',
    email: 'newuser@example.com',
    passwordHash: '$2a$12$...', // Use bcrypt to hash the password
  }
]
```

**Note:** Registered users are stored in `data/users.json` and are combined with mock users during authentication.

### Kajabi Integration

The app now includes real Kajabi API integration. The mock implementation has been replaced with actual API calls that:

1. **Authenticate** with Kajabi using OAuth 2.0 client credentials
2. **Search contacts** by email to check if they exist
3. **Create new contacts** when users register
4. **Verify user status** during login

**Configuration**: Make sure to set up your Kajabi API credentials in `.env.local` as described in the setup section.

**API Client**: The `KajabiAPIClient` class in `src/lib/kajabi.ts` handles:
- Automatic token management and refresh
- Proper error handling and fallbacks
- Rate limiting compliance
- Secure credential handling
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/register` - User registration

### Applications
- `GET /api/apps` - Get list of configured applications

### Proxy
- `ALL /api/proxy/[app]/[...path]` - Proxy requests to configured applications

## Deployment

### Vercel Deployment

1. Push your code to a Git repository
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Make sure to set these in your Vercel dashboard:

```
JWT_SECRET=your_production_jwt_secret
KAJABI_API_URL=https://api.kajabi.com
KAJABI_CLIENT_ID=your_production_kajabi_client_id
KAJABI_CLIENT_SECRET=your_production_kajabi_client_secret
```

## Security Considerations

1. **JWT Secret**: Use a strong, randomly generated JWT secret in production
2. **HTTPS Only**: Ensure all traffic is served over HTTPS in production
3. **Environment Variables**: Keep sensitive data in environment variables
4. **Password Hashing**: All passwords are hashed using bcrypt with salt rounds of 12
5. **CORS**: Proper CORS headers are set for API routes
6. **User Data**: Registered user data is stored in `data/users.json` (excluded from git)
7. **Input Validation**: Email format and password strength validation on registration
8. **Kajabi Verification**: Optional email verification against Kajabi system

## Development

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── login/            # Login page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── lib/                   # Utility libraries
│   ├── auth.ts           # Authentication utilities
│   ├── config.ts         # Configuration management
│   ├── firebase.ts       # Firebase configuration
│   └── kajabi.ts         # Kajabi integration
└── middleware.ts         # Next.js middleware

config/
└── apps.yaml             # Application configuration
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Troubleshooting

### Common Issues

1. **JWT Token Errors**: Check that `JWT_SECRET` is set correctly
2. **Proxy Failures**: Verify target URLs in `config/apps.yaml`
3. **Authentication Issues**: Check user credentials in `src/lib/auth.ts`
4. **Build Errors**: Run `npm install` to ensure all dependencies are installed

### Debug Mode

Set `NODE_ENV=development` for additional console logging.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.