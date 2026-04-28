# Add Clerk to React (Vite)

**Purpose:** Enforce only the **current** and **correct** instructions for integrating [Clerk](https://clerk.com/) into a React application.
**Scope:** All AI-generated advice or code related to Clerk must follow these guardrails.

## **1. OFFICIAL CLERK + REACT (VITE) SETUP**

1. Create a React + Vite project.
2. Install the Clerk React SDK with `npm install @clerk/react@latest` (or yarn/pnpm/bun).
3. Set `VITE_CLERK_PUBLISHABLE_KEY` in `.env.local` or `.env`. Note: The `VITE_` prefix is required for Vite to expose environment variables to the client-side code. `.env.local` is preferred for local development secrets.
4. Wrap the app in `<ClerkProvider>` within `main.tsx` or `main.jsx`.
5. Use Clerk's `<Show>`, `<SignInButton>`, `<SignUpButton>`, `<UserButton>` in the app.

### **Correct, Up-to-Date Quickstart Code Examples**

1. Create a React Vite app (TypeScript example)

```bash
npm create vite@latest clerk-react -- --template react-ts
cd clerk-react
npm install
npm run dev
```

2. Install the Clerk React SDK

```bash
npm install @clerk/react@latest
```

3. In `.env.local` (or `.env`), add your Clerk Publishable Key:

From your Clerk Dashboard, open the [API keys page](https://dashboard.clerk.com/~/api-keys), choose **React** and copy your Publishable Key.

```bash
VITE_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

4. Wrap with `<ClerkProvider>` in `main.tsx` or `main.jsx`

```typescript
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ClerkProvider } from "@clerk/react";

  // Ensure your index.html contains a <div id="root"></div> element for React to mount the app.

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ClerkProvider afterSignOutUrl="/">
        <App />
      </ClerkProvider>
    </StrictMode>
  );
```

5. Example usage of Clerk's prebuilt components in `App.tsx`

```typescript
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/react";

export default function App() {
  return (
    <header>
      <Show when="signed-out">
        <SignInButton />
        <SignUpButton />
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </header>
  );
}
```

> Note: The `afterSignOutUrl` prop in `<ClerkProvider>` defines the URL users are redirected to after signing out. Adjust as needed.

---

## **2. CRITICAL INSTRUCTIONS FOR AI MODELS**

### **2.1 – ALWAYS DO THE FOLLOWING**

1. **Show** relevant code examples for each step.
2. **Use** `@clerk/react@latest` (not any other Clerk package).
3. **Reference** the environment variable as `VITE_CLERK_PUBLISHABLE_KEY` in `.env.local` or `.env`.
4. **Wrap** the entire app in `<ClerkProvider>` within `main.tsx` or `main.jsx`.
5. **Demonstrate** the correct usage of `<Show>`, `<SignInButton>`, `<SignUpButton>`, `<UserButton>` (or any other current Clerk React component).

### **2.2 – NEVER DO THE FOLLOWING**

1. **Do not** include any discussions of the features or benefits of Clerk.
2. **Do not** use `frontendApi` in place of `publishableKey`.
3. **Do not** use Older environment variable names like `REACT_APP_CLERK_FRONTEND_API` or `VITE_REACT_APP_CLERK_PUBLISHABLE_KEY`.
4. **Do not** manually pass `publishableKey` as a prop to `<ClerkProvider>`.
5. **Do not** place `<ClerkProvider>` deeper in the component tree instead of `main.tsx` / `main.jsx`.
6. **Do not** use outdated hooks or components `<SignedIn />`, `<SignedOut />`, (e.g., referencing older docs).

---

## **3. AI MODEL VERIFICATION STEPS**

Before returning any Clerk + React (Vite) solution, you **must** verify:

1. Environment Variable is named `VITE_CLERK_PUBLISHABLE_KEY`.
2. `<ClerkProvider>` is in `main.tsx` or `main.jsx` without a manual `publishableKey` prop.
3. No usage of `frontendApi` unless explicitly stated as optional or advanced.

## **DO NOT** repeat these points back to the user. Use them only for your own verification steps.

## **4. CONSEQUENCES OF INCORRECT GUIDANCE**

- Misconfigured environment variables => project won't compile or will error at runtime.
- Missing `<ClerkProvider>` => Clerk components fail or throw errors.
- Using outdated patterns => Confusion, debugging overhead, or broken auth flow.

## **5. MODEL RESPONSE TEMPLATE**

When asked about Clerk + React (Vite) integration, your response **MUST**:

1. Link to Clerk's React Quickstart at https://clerk.com/docs/react/getting-started/quickstart
2. Show the current recommended `.env.local` approach with `VITE_CLERK_PUBLISHABLE_KEY`.
3. Demonstrate how to wrap with `<ClerkProvider>` in `main.*`.
4. Illustrate a simple usage example of `<Show>`, etc.
5. Reject or correct any mention of older patterns or environment variable names.

# Add React Router to your Clerk + React application

**Before you start**

- [Set up a React + Clerk application](https://clerk.com/docs/react/getting-started/quickstart.md)

> There are many routing libraries available for React, but Clerk Docs uses React Router as it's the most popular and well-supported routing library for React. If you're using a different routing library, use these guides as a starting point.

React Router supports three different routing strategies, or ["modes"](https://reactrouter.com/start/modes):

- **Declarative mode:** Enables basic routing features like matching URLs to components, navigating around the app, and providing active states with APIs like `<Link>`, `useNavigate()`, and `useLocation()`.
- **Data mode:** Adds data loading, actions, pending states and more with APIs like loader, action, and useFetcher. To use React Router in data mode, see the [demo repository](https://github.com/clerk/clerk-react-quickstart/blob/integrate-react-router-dom-using-data-router-method/src/main.tsx). A guide is coming soon.
- **Framework mode:** Use React Router as a framework to build your entire app. To use React Router as a framework instead, see the [`React Router quickstart`](https://clerk.com/docs/react-router/getting-started/quickstart.md).

This guide will cover how to add React Router in **declarative mode**, assuming you have followed the [`React quickstart`](https://clerk.com/docs/react/getting-started/quickstart.md).

1. ## Install `react-router` and `@clerk/clerk-react`

   Run the following command to install both React Router and the Clerk React Router SDK:

   ```npm
   npm install react-router @clerk/clerk-react
   ```
2. ## Update `<ClerkProvider>`

   Move `<ClerkProvider />` to its own component.

   > [!QUIZ]
   > Why do we need to move `<ClerkProvider />` to its own component?
   >
   > ***
   >
   > `createRoot(document.getElementById('root')!).render()` isn't a component, so you can't use a hook inside of it. In the next step, you'll use the `useNavigate()` hook with `<ClerkProvider>`, so you need to move it to its own component.

   ```tsx {{ filename: 'src/main.tsx', mark: [[7, 13], 17] }}
   import { StrictMode } from 'react'
   import { createRoot } from 'react-dom/client'
   import { ClerkProvider } from '@clerk/clerk-react'
   import './index.css'
   import App from './App.tsx'

   function RootLayout() {
     return (
       <ClerkProvider>
         <App />
       </ClerkProvider>
     )
   }

   createRoot(document.getElementById('root')!).render(
     <StrictMode>
       <RootLayout />
     </StrictMode>,
   )
   ```
3. ## Set up React Router

   To use declarative mode, wrap your app in a `<BrowserRouter>`. To define your app's routes, add `<Routes>` and `<Route>` components. This example adds the `/` (home) route and renders the `<App />` component when the URL matches. Read more about routing in the [React Router docs](https://reactrouter.com/start/declarative/routing).

   The `useNavigate()` hook from `react-router` is used by Clerk components for navigation events. This will prevent flicker and app reloading.

   ```tsx {{ filename: 'src/main.tsx', mark: [3, 9, [13, 14], [16, 18], [25, 27]] }}
   import { StrictMode } from 'react'
   import { createRoot } from 'react-dom/client'
   import { BrowserRouter, Routes, Route, useNavigate } from 'react-router'
   import { ClerkProvider } from '@clerk/clerk-react'
   import './index.css'
   import App from './App.tsx'

   function RootLayout() {
     const navigate = useNavigate()

     return (
       <ClerkProvider
         routerPush={(to) => navigate(to)}
         routerReplace={(to) => navigate(to, { replace: true })}
       >
         <Routes>
           <Route path="/" element={<App />} />
         </Routes>
       </ClerkProvider>
     )
   }

   createRoot(document.getElementById('root')!).render(
     <StrictMode>
       <BrowserRouter>
         <RootLayout />
       </BrowserRouter>
     </StrictMode>,
   )
   ```

# Build your own sign-in-or-up page for your React Router app with Clerk

This guide shows you how to use the [`<SignIn />`](https://clerk.com/docs/react-router/reference/components/authentication/sign-in.md) component to build a custom page **that allows users to sign in or sign up within a single flow**.

To set up separate sign-in and sign-up pages, follow this guide, and then follow the [`custom sign-up page guide`](https://clerk.com/docs/react-router/guides/development/custom-sign-up-page.md).

> If prebuilt components don't meet your specific needs or if you require more control over the logic, you can rebuild the existing Clerk flows using the Clerk API. For more information, see the [custom flow guides](https://clerk.com/docs/guides/development/custom-flows/overview.md).

1. ## Build a sign-in-or-up page

   The following example demonstrates how to render the [`<SignIn />`](https://clerk.com/docs/react-router/reference/components/authentication/sign-in.md) component on a dedicated page using the [React Router Splat route](https://reactrouter.com/start/framework/routing#splats).

   ```tsx {{ filename: 'app/routes/sign-in.tsx' }}
   import { SignIn } from '@clerk/react-router'

   export default function SignInPage() {
     return (
       <div>
         <h1>Sign in or up route</h1>
         <SignIn />
       </div>
     )
   }
   ```
2. ## Configure routes

   React Router expects you to define routes in [`app/routes.ts`](https://reactrouter.com/start/framework/routing). Add the previously created sign-in-or-up page to your route configuration.

   ```tsx {{ filename: 'app/routes.ts', mark: [5] }}
   import { type RouteConfig, index, route } from '@react-router/dev/routes'

   export default [
     index('routes/home.tsx'),
     route('sign-in/*', 'routes/sign-in.tsx'),
   ] satisfies RouteConfig
   ```
3. ## Configure redirect behavior

   - Set the `CLERK_SIGN_IN_URL` environment variable to tell Clerk where the `<SignIn />` component is being hosted.
   - Set `CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` as a fallback URL incase users visit the `/sign-in` route directly.
   - Set `CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` as a fallback URL incase users select the 'Don't have an account? Sign up' link at the bottom of the component.

   Learn more about these environment variables and how to customize Clerk's redirect behavior in the [dedicated guide](https://clerk.com/docs/guides/development/customize-redirect-urls.md).

   ```env {{ filename: '.env' }}
   CLERK_SIGN_IN_URL=/sign-in
   CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
   CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
   ```
4. ## Visit your new page

   Run your project with the following command:

   ```npm
   npm run dev
   ```

   Visit your new custom page locally at [localhost:5173/sign-in](http://localhost:5173/sign-in).

# Build your own sign-up page for your React Router app with Clerk

By default, the [`<SignIn />`](https://clerk.com/docs/react-router/reference/components/authentication/sign-in.md) component handles signing in and signing up, but if you'd like to have a dedicated sign-up page, this guide shows you how to use the [`<SignUp />`](https://clerk.com/docs/react-router/reference/components/authentication/sign-up.md) component to build a custom sign-up page.

To set up a single sign-in-or-up page, follow the [`custom sign-in-or-up page guide`](https://clerk.com/docs/react-router/guides/development/custom-sign-in-or-up-page.md).

> If prebuilt components don't meet your specific needs or if you require more control over the logic, you can rebuild the existing Clerk flows using the Clerk API. For more information, see the [custom flow guides](https://clerk.com/docs/guides/development/custom-flows/overview.md).

1. ## Build a sign-up page

   The following example demonstrates how to render the [`<SignUp />`](https://clerk.com/docs/react-router/reference/components/authentication/sign-up.md) component on a dedicated sign-up page using the [React Router Splat route](https://reactrouter.com/start/framework/routing#splats).

   ```tsx {{ filename: 'app/routes/sign-up.tsx' }}
   import { SignUp } from '@clerk/react-router'

   export default function SignUpPage() {
     return (
       <div>
         <h1>Sign up route</h1>
         <SignUp />
       </div>
     )
   }
   ```
2. ## Configure routes

   React Router expects you to define routes in [`app/routes.ts`](https://reactrouter.com/start/framework/routing). Add the previously created sign-up page to your route configuration.

   ```tsx {{ filename: 'app/routes.ts', mark: [6] }}
   import { type RouteConfig, index, route } from '@react-router/dev/routes'

   export default [
     index('routes/home.tsx'),
     route('sign-in/*', 'routes/sign-in.tsx'),
     route('sign-up/*', 'routes/sign-up.tsx'),
   ] satisfies RouteConfig
   ```
3. ## Configure redirect behavior

   - Set the `CLERK_SIGN_UP_URL` environment variable to tell Clerk where the `<SignUp />` component is being hosted.
   - Set `CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` as a fallback URL incase users visit the `/sign-up` route directly.
   - Set `CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` as a fallback URL incase users select the 'Already have an account? Sign in' link at the bottom of the component.

   Learn more about these environment variables and how to customize Clerk's redirect behavior in the [dedicated guide](https://clerk.com/docs/guides/development/customize-redirect-urls.md).

   ```env {{ filename: '.env' }}
   CLERK_SIGN_UP_URL=/sign-up
   CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
   CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
   ```

   These values control the behavior of the `<SignUp />` and `<SignIn />` components and when you visit the respective links at the bottom of each component.
4. ## Visit your new page

   Run your project with the following command:

   ```npm
   npm run dev
   ```

   Visit your new custom page locally at [localhost:5173/sign-up](http://localhost:5173/sign-up).

# Protect content and read user data

Clerk provides a set of [`hooks`](https://clerk.com/docs/react/reference/hooks/overview.md) that you can use to protect content and read user data in your React application. Here are examples of how to use these hooks to get you started.

### `useAuth()`

The following example uses the [`useAuth()`](https://clerk.com/docs/react/reference/hooks/use-auth.md) hook to access the current auth state, as well as helper methods to manage the current session.

```tsx {{ filename: 'example.tsx' }}
export default function Example() {
  const { isLoaded, isSignedIn, userId, sessionId, getToken } = useAuth()

  const fetchExternalData = async () => {
    // Use `getToken()` to get the current user's session token
    const token = await getToken()

    // Use `token` to fetch data from an external API
    const response = await fetch('https://api.example.com/data', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return response.json()
  }

  // Use `isLoaded` to check if Clerk is loaded
  if (!isLoaded) {
    return <div>Loading...</div>
  }

  // Use `isSignedIn` to check if the user is signed in
  if (!isSignedIn) {
    // You could also add a redirect to the sign-in page here
    return <div>Sign in to view this page</div>
  }

  return (
    <div>
      Hello, {userId}! Your current active session is {sessionId}.
    </div>
  )
}
```

### `useUser()`

The following example demonstrates how to use the [`useUser()`](https://clerk.com/docs/react/reference/hooks/use-user.md) hook to access the [`User`](https://clerk.com/docs/react/reference/objects/user.md) object, which contains the current user's data such as their ID.

```tsx {{ filename: 'src/pages/Example.tsx' }}
import { useUser } from '@clerk/react'

export default function Example() {
  const { isSignedIn, user, isLoaded } = useUser()

  // Handle loading state
  if (!isLoaded) return <div>Loading...</div>

  // Protect the page from unauthenticated users
  if (!isSignedIn) return <div>Sign in to view this page</div>

  return <div>Hello {user.id}!</div>
}
```


# Clerk Official Docs

## Use OAuth for Single Sign-On (SSO)

You've likely seen buttons like "Sign in with Google" or "Sign in with GitHub" countless times. Clerk supports both sides of this experience:

1. **Sign in with [Other App]** – Let users sign in to your Clerk app using their existing credentials from social providers like Google, Facebook, or GitHub.
2. **Sign in with [Your App]** – Let users sign in to _other_ apps using their Clerk credentials from your app. In this case, _your app_ becomes the identity provider.

These features help you streamline authentication for your users, whether they're signing into your Clerk-powered app or accessing external apps with their Clerk credentials. This guide covers both options in detail and provides links to additional resources where applicable.

## Option 1: Sign in with [Other App]

This feature allows users to sign up or sign in to your Clerk app using their existing credentials from popular social providers (also known as Identity Providers, or IdPs) like Google, Facebook, or GitHub. For example, if you enable GitHub as a social provider, then a user can sign in to your Clerk app by selecting GitHub as an option and authenticating with their GitHub account credentials.

Refer to the appropriate provider's [guide](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/overview.md) for implementation details.

## Option 2: Sign in with [Your App]

Clerk can be configured as an OAuth 2.0 and OpenID Connect (OIDC) Identity Provider (IdP) to enable Single Sign-On (SSO) with other clients that support these protocols. This allows users to authenticate to third-party applications using their Clerk credentials, enabling user information sharing between your Clerk app and OAuth clients.

It's the reverse of Option 1: instead of using an external provider to authenticate into your Clerk app, users use their Clerk credentials to sign in to external apps.

### What you can build

With Clerk as an IdP, you can:

- **Integrate with third-party tools** – Let users authenticate into platforms like Notion, Retool, or custom internal tools using their credentials from your app.
- **Build a developer ecosystem** – Enable partners or third-party developers to offer "Sign in with [Your App]" in their applications.
- **Support AI agents and automation** – Allow [MCP servers or AI tools](https://clerk.com/docs/guides/ai/overview.md) to authenticate users through your app.
- **Implement enterprise SSO** – Provide B2B customers with centralized identity management using OpenID Connect.

### How it works: The big picture

When you configure Clerk as an IdP, you're registering a third-party app as an OAuth client in your Clerk Dashboard. You then provide that client with credentials (a Client ID and Client Secret) that it uses to redirect users to Clerk for authentication. After the user authenticates with Clerk, they're redirected back to the third-party app with the authorization they need.

## Configure Clerk as an IdP

The following steps walk you through setting up Clerk as an OAuth provider for a third-party client.

Here is the general flow to set up your Clerk instance as an OAuth provider:

1. Create a connection or integration in the client.
2. Create an OAuth application in Clerk and configure it.
3. Obtain the Client ID and Client Secret from Clerk.
4. Enter these credentials into the client to complete the integration.

### Create a connection or integration in the client

Ensure you have setup a new connection within the third-party client or tool where your users will authenticate. As part of this process, you'll be provided a **redirect URL** that you'll need to use in the next step.

### Create a Clerk OAuth application

To create a Clerk OAuth application:

1. In the Clerk Dashboard, navigate to the [**OAuth applications**](https://dashboard.clerk.com/~/oauth-applications) page.
2. Select **Add OAuth application**. A modal will open.
3. Complete the following fields:
   - `Name` - Helps you identify your application.
   - `Scopes` - The scopes that you would like to leverage. Learn more about [OAuth scopes currently supported by Clerk](https://clerk.com/docs/guides/configure/auth-strategies/oauth/how-clerk-implements-oauth.md#scopes).
4. Select **Add**. A modal will open with your **Client Secret**. For security reasons, Clerk does not store your Client Secret and cannot show it to you again, so **ensure that you copy it and store it somewhere secure**, like an environment variable.
5. You'll be redirected to your app's settings page. Under **Application credentials**, save the **Client ID** somewhere secure as you'll need it later.
6. In the **Redirect URIs** field, add the redirect URI/URL provided by your client [in the earlier step](#create-a-connection-or-integration-in-the-client). This is the URL that Clerk will redirect to after the user has authenticated.

To learn more about the other OAuth application configuration settings, like **Dynamic client registration**, see the [dedicated guide](https://clerk.com/docs/guides/configure/auth-strategies/oauth/how-clerk-implements-oauth.md).

### Configure your client

Once you have set up a Clerk OAuth app, you'll need to configure a few settings in your client to establish the connection. All the necessary information can be found in your Clerk OAuth app's settings, starting with two key parameters:

- **Client ID**: Public identifier of your Clerk OAuth app.
- **Client Secret**: Confidential secret used to authenticate your Clerk OAuth app.

Both of these are available in your Clerk [OAuth app's settings in the Clerk Dashboard](https://dashboard.clerk.com/~/oauth-applications). They need to be entered into your client's setup interface to complete the integration. Once completed, your users will be able to authenticate into the third-party app using their Clerk credentials.

Other available settings that may be useful include:

- **Discovery URL**: Used by the client to retrieve the configuration data of the Clerk OAuth app.
- **Authorize URL**: Used by the client to request authorization from your user.
- **Token URL**: Used by the client to exchange an authorization code for an access token and a refresh token.
- **User Info URL**: Used by the client to retrieve additional user data upon authentication.

## Get additional user information with the OAuth 2.0 flow

After a user has successfully completed an OAuth 2.0 flow, you can retrieve additional user information from Clerk's [`/oauth/userinfo`](https://clerk.com/docs/reference/frontend-api/tag/oauth2-identify-provider/post/oauth/userinfo){{ target: '_blank' }} endpoint. When making the request to this endpoint, you must include the OAuth access token in the `Authorization` header.

This example is written for Next.js App Router **but can be adapted for any framework/language**. It assumes the OAuth flow has already been completed and that you have obtained an access token from Clerk.

```tsx {{ filename: 'app/api/userinfo/route.ts' }}
import { NextResponse } from 'next/server'

export async function GET() {
  // Assume you already have the access token available here
  const accessToken = 'YOUR_ACCESS_TOKEN_HERE'

  try {
    // Your Frontend API URL can be found on the API keys page in the Clerk Dashboard
    // https://dashboard.clerk.com/~/api-keys
    const response = await fetch(`${process.env.CLERK_FRONTEND_API_URL}/oauth/userinfo`, {
      headers: {
        // Include the access token as a Bearer token in the Authorization header
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Failed to fetch user info', details: (error as Error).message },
      { status: 500 },
    )
  }
}
```

**Example response**

```json
{
  "object": "string",
  "instance_id": "string",
  "user_id": "string",
  "sub": "string",
  "email": "string",
  "email_verified": true,
  "family_name": "string",
  "given_name": "string",
  "name": "string",
  "username": "string",
  "preferred_username": "string",
  "picture": "string",
  "public_metadata": {},
  "private_metadata": {},
  "unsafe_metadata": {}
}
```

The `/oauth/userinfo` endpoint provides the following user properties, depending on the granted scopes:

| Property             | Description                                          |
| -------------------- | ---------------------------------------------------- |
| `user_id`            | The ID of the user                                   |
| `sub`                | The ID of the user                                   |
| `given_name`         | The user's first name                                |
| `family_name`        | The user's last name                                 |
| `name`               | The user's full name                                 |
| `picture`            | The user's avatar URL                                |
| `preferred_username` | The user's username                                  |
| `email`              | The user's primary email address                     |
| `email_verified`     | Whether the user's primary email address is verified |
| `public_metadata`    | The user's public metadata                           |
| `private_metadata`   | The user's private metadata                          |
| `unsafe_metadata`    | The user's unsafe metadata                           |

### Get token information

For validating access tokens or refresh tokens and retrieving additional token metadata, Clerk provides a standard OAuth 2.0 [Token Introspection Endpoint](https://datatracker.ietf.org/doc/html/rfc7662) at [`/oauth/token_info`](https://clerk.com/docs/reference/frontend-api/tag/oauth2-identify-provider/post/oauth/token_info){{ target: '_blank' }}.

The endpoint returns detailed token information such as if the token is still active, the Client ID, and the granted scopes.

> This endpoint is protected. You must provide your Clerk Client ID and Client Secret credentials to authenticate.

This example is written for Next.js App Router **but can be adapted for any framework/language**. It demonstrates how to call the `/oauth/token_info` endpoint, assuming you already have the access token and refresh token available.

```tsx {{ filename: 'app/api/tokeninfo/route.ts' }}
import { NextRequest, NextResponse } from 'next/server'

// Assume you already have the access token and refresh token available here
const tokens = {
  accessToken: 'YOUR_ACCESS_TOKEN_HERE',
  refreshToken: 'YOUR_REFRESH_TOKEN_HERE',
}

export async function POST(req: NextRequest) {
  try {
    // Your Frontend API URL can be found on the API keys page in the Clerk Dashboard
    // https://dashboard.clerk.com/~/api-keys
    const response = await fetch(`${process.env.CLERK_FRONTEND_API_URL}/oauth/token_info`, {
      method: 'POST',
      headers: {
        // Include the access token as a Bearer token in the Authorization header
        Authorization: `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        // Include the refresh token in the body
        token: tokens.refreshToken,
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch token info' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Example response**

```json
{
  "active": true,
  "client_id": "string",
  "iat": 0,
  "scope": "string",
  "sub": "string"
}
```

## Get additional user information with the OAuth 2.0 flow using the OpenID Connect (OIDC) protocol

> Not all third-party apps expect or use OIDC. However, this feature was designed with OIDC compatibility in mind, which is why it's included in this guide. Ensure that your integration target supports OIDC before proceeding.

In order to enable OIDC in your OAuth flow, you can follow the same steps outlined above, but ensure to select the `openid` scope when configuring your OAuth app in the Clerk Dashboard. This scope triggers OIDC and instructs the authorization server to issue an ID token alongside your access token.

You'll also need to include this `openid` scope in the query parameters of your authorization endpoint when initiating the OAuth flow. For example:

```http
GET /oauth/authorize?
  client_id=x&
  response_type=code&
  state=y&
  code_challenge=z&
  redirect_uri=a&
  scope=openid%20profile%20email&...
Host: clerk.<INSERT_YOUR_APP_DOMAIN>.com
```

Once a user successfully authenticates using the OIDC flow, you'll receive:

- An access token
- A **refresh token**
- An **ID token**

The **ID token** is a JWT (JSON Web Token) that contains standard JWT claims as defined in [RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519), as well as additional custom claims that represent the authenticated user's profile information. The token is signed using your instance's private key.

You must verify the signature on the ID token before using any of the user information it contains. This will require your instance's public key. You can find your instance's public key by loading your Frontend API URL with `/.well-known/jwks.json` appended to it. For example:

- `https://verb-noun-00.clerk.accounts.dev/.well-known/jwks.json` for a development environment.
- `https://clerk.<INSERT_YOUR_APP_DOMAIN>.com/.well-known/jwks.json` for a production environment.

Here is an example verifying the ID token using the [`jsonwebtoken`](https://www.npmjs.com/package/jsonwebtoken) library in a production environment:

```js
const jwt = require('jsonwebtoken')

function verifyIdToken(idToken) {
  jwt.verify(
    idToken,
    PUBLIC_KEY,
    {
      algorithms: ['RS256'],
      issuer: 'https://clerk.<YOUR_APP_DOMAIN>.com',
      audience: '<YOUR_CLIENT_ID>',
    },
    (err, decoded) => {
      if (err) {
        console.error('Token verification failed:', err)
      } else {
        console.log('Token is valid:', decoded)
      }
    },
  )
}
```

The ID token includes the following standard claims:

| Standard claim | Description                                                          |
| -------------- | -------------------------------------------------------------------- |
| `iss`          | The issuer of the token, which matches your Clerk Frontend API URL   |
| `sub`          | The subject of the token, which matches the authenticated user ID    |
| `aud`          | The intended audience of the token, which matches the used Client ID |
| `exp`          | The expiration time of the token                                     |
| `iat`          | The time at which the token was issued                               |
| `jti`          | A unique identifier for the token                                    |

Depending on the granted scopes, the ID token can include the following additional claims:

| Additional claim     | Description                                          |
| -------------------- | ---------------------------------------------------- |
| `nonce`              | The nonce provided and used during the request       |
| `family_name`        | The user's last name                                 |
| `given_name`         | The user's first name                                |
| `name`               | The user's full name                                 |
| `picture`            | The user's avatar URL                                |
| `preferred_username` | The user's username                                  |
| `email`              | The user's primary email address                     |
| `email_verified`     | Whether the user's primary email address is verified |
| `public_metadata`    | The user's public metadata                           |
| `private_metadata`   | The user's private metadata                          |
| `unsafe_metadata`    | The user's unsafe metadata                           |

# Social connections (OAuth)

Social connections, also known as OAuth connections in Clerk, allow users to gain access to your application by using their existing credentials from an Identity Provider (IdP), like Google or Microsoft. For example, if you enable Google as a social provider, then when a user wants to sign in to your application, they can select Google and use their Google account to sign in.

> When using social connections, the sign-up and sign-in flows are equivalent. If a user doesn't have an account and tries to sign in, an account will be made for them, and vice versa.

The easiest way to add social connections to your Clerk app is by using [`prebuilt components`](https://clerk.com/docs/nextjs/reference/components/overview.md). If prebuilt components don't meet your specific needs or if you require more control over the logic, you can [rebuild the existing Clerk flows using the Clerk API](https://clerk.com/docs/guides/development/custom-flows/authentication/oauth-connections.md).

## Before you start

- You need to create a Clerk application in the [Clerk Dashboard](https://dashboard.clerk.com/). For more information, check out the [setup guide](https://clerk.com/docs/getting-started/quickstart/setup-clerk.md).
- You need to install the correct SDK for your application. For more information, see the [quickstart guides](https://clerk.com/docs/getting-started/quickstart/overview.md).

## Enable a social connection

### Development instances

For **development** instances, Clerk uses **pre-configured shared** OAuth credentials and redirect URIs to make the development flow as smooth as possible. This means that you can enable most social providers **without additional configuration**.

To enable a social connection:

1. In the Clerk Dashboard, navigate to the [**SSO connections**](https://dashboard.clerk.com/~/user-authentication/sso-connections) page.
2. Select the **Add connection** button, and select **For all users**.
3. Select the provider you want to use.

### Production instances

For **production** instances, you will need to configure the provider with custom OAuth credentials. See the social provider's [dedicated guide](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/overview.md) for more information.

## Configure additional OAuth scopes

Each OAuth provider requires a specific set of scopes that are necessary for proper authentication with Clerk. These essential scopes are pre-configured and automatically included by Clerk. They typically include permissions for basic profile information and email access, which are fundamental for user authentication and account creation.

In addition to the core scopes, you can specify additional scopes supported by the provider. These scopes can be used to access additional user data from the provider.

To add additional OAuth scopes, when you are [enabling a new social connection](#enable-a-social-connection), enable **Use custom credentials**. The **Scopes** field will appear.

## Request additional OAuth scopes after sign-up

Clerk allows you to request additional OAuth scopes even after a user has signed up.

Pass the [`additionalOAuthScopes`](https://clerk.com/docs/nextjs/reference/components/user/user-profile.md) prop to the [`<UserProfile/>`](https://clerk.com/docs/nextjs/reference/components/user/user-profile.md) or [`<UserButton />`](https://clerk.com/docs/nextjs/reference/components/user/user-button.md) component, with any additional OAuth scope you would like per provider. The user will be prompted to reconnect their account on their user profile page.

Use the following tabs to see how to add additional OAuth scopes to the `<UserProfile/>` and `<UserButton/>` components.

**<UserProfile />**

```tsx {{ filename: 'app/page.tsx' }}
<UserProfile
  additionalOAuthScopes={{
    google: ['foo', 'bar'],
    github: ['qux'],
  }}
/>
```

**<UserButton />**

```tsx {{ filename: 'app/page.tsx' }}
<UserButton
  userProfileProps={{
    additionalOAuthScopes: {
      google: ['foo', 'bar'],
      github: ['qux'],
    },
  }}
/>
```

## Get an OAuth access token for a social provider

You can use a social provider's OAuth access token to access user data from that provider in addition to their data from Clerk.

Use the [`getUserOauthAccessToken()`](https://clerk.com/docs/reference/backend/user/get-user-oauth-access-token.md) method to get the user's OAuth access token. **This method must be used in a server environment, and cannot be run on the client.**

> Clerk does not automatically keep OAuth access tokens fresh behind the scenes. When you request an access token using [the relevant backend API endpoint](https://clerk.com/docs/reference/backend-api/tag/oauth-access-tokens/post/oauth_applications/access_tokens/verify){{ target: '_blank' }}, Clerk will attempt to obtain a fresh access token as well as a new refresh token. However, this process occurs only when you initiate the request; Clerk does not proactively refresh tokens on your behalf.

The following example demonstrates how to retrieve the OAuth access token for a user and use it to fetch user data from the Notion API. It assumes:

- You have already [enabled the Notion social connection in the Clerk Dashboard](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/notion.md).
- The user has already connected their Notion account to your application.
- The user has the correct permissions to access the Notion API.

**If your SDK isn't listed, you can use the comments in the example to help you adapt it to your SDK.**

**Next.js**

```tsx {{ filename: 'app/api/notion/route.tsx' }}
import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  // The `Auth` object gives you access to properties like `isAuthenticated` and `userId`
  // Accessing the `Auth` object differs depending on the SDK you're using
  // https://clerk.com/docs/reference/backend/types/auth-object#how-to-access-the-auth-object
  const { isAuthenticated, userId } = await auth()

  // Protect the route from unauthenticated users
  if (!isAuthenticated) {
    return NextResponse.json({ message: 'User not found' })
  }

  const provider = 'notion'

  // Initialize clerkClient
  const client = await clerkClient()

  // Use the `getUserOauthAccessToken()` method to get the user's OAuth access token
  const clerkResponse = await client.users.getUserOauthAccessToken(userId, provider)
  const accessToken = clerkResponse.data[0].token || ''
  if (!accessToken) {
    return NextResponse.json({ message: 'Access token not found' }, { status: 401 })
  }

  // Fetch the user data from the Notion API
  // This endpoint fetches a list of users
  // https://developers.notion.com/reference/get-users
  const notionUrl = 'https://api.notion.com/v1/users'

  const notionResponse = await fetch(notionUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Notion-Version': '2022-06-28',
    },
  })

  // Handle the response from the Notion API
  const notionData = await notionResponse.json()

  return NextResponse.json({ message: notionData })
}
```

## Add a social connection after sign-up

For each social provider, you can disable the option to sign up and sign in to your application using the provider. This is especially useful for users that want to connect their OAuth account _after_ authentication.

For example, say your application wants to read a user's GitHub repository data but doesn't want to allow the user to authenticate with their GitHub account. The user can sign up with their email and password, or whatever authentication method you choose, and then afterwards, connect their GitHub account to your application through their user profile. The easiest way to enable this for your users is by using the [`<UserProfile />`](https://clerk.com/docs/nextjs/reference/components/user/user-profile.md) component. If you prefer to build a custom user interface, see how to [build a social connection flow using the Clerk API](https://clerk.com/docs/guides/development/custom-flows/authentication/oauth-connections.md).

To configure the option for users to sign up and sign in with a social provider:

1. In the Clerk Dashboard, navigate to the [**SSO connections**](https://dashboard.clerk.com/~/user-authentication/sso-connections) page.
2. Select the social provider you want to configure.
3. Enable or disable **Enable for sign-up and sign-in**.
4. Save the changes.

## Connecting to social providers while signed in

When signed in, a user can connect to further social providers. There is no need to perform another sign-up.

When using the [Account Portal](https://clerk.com/docs/guides/account-portal/overview.md) pages, users can see which providers they have already connected to and which ones they can still connect to on their [user profile page](https://clerk.com/docs/guides/account-portal/overview.md#user-profile).

When using the [`prebuilt components`](https://clerk.com/docs/nextjs/reference/components/overview.md), you can use the [`<UserProfile/>`](https://clerk.com/docs/nextjs/reference/components/user/user-profile.md) component to allow users to connect to further social providers.

## OAuth for native applications

Currently, the prebuilt components are not supported in native applications, but you can use the Clerk API to [build a custom flow for authenticating with social connections](https://clerk.com/docs/guides/development/custom-flows/authentication/oauth-connections.md).

Clerk ensures that security critical nonces are passed only to allowlisted URLs when the SSO flow is completed in native browsers or webviews. For maximum security in your **production** instances, you need to allowlist your custom redirect URLs via the [Clerk Dashboard](https://dashboard.clerk.com/) or the [Clerk Backend API](https://clerk.com/docs/reference/backend/redirect-urls/create-redirect-url.md).

To allowlist a redirect URL via the Clerk Dashboard:

1. In the Clerk Dashboard, navigate to the [**Native applications**](https://dashboard.clerk.com/~/native-applications) page.
2. Scroll down to the **Allowlist for mobile SSO redirect** section and add your redirect URLs.

> By default, Clerk uses `{bundleIdentifier}://callback` as the redirect URL.

## OAuth for Apple native applications

You can use [Sign in with Apple](https://developer.apple.com/sign-in-with-apple/) to offer a native authentication experience in your iOS, watchOS, macOS or tvOS apps.

Instead of the typical OAuth flow that performs redirects in a browser context, you can utilize Apple's native authorization and provide the openID token and grant code to Clerk. Clerk ensures that the user will be verified in a secure and reliable way with the information that Apple has provided about the user.

For additional information on how to configure Apple as a social provider for your Clerk instance, see the [dedicated guide](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/apple.md).

## Supported social providers

Clerk provides a wide range of social providers to ease your user's sign-up and sign-in processes. Select a provider to learn how to configure it for your Clerk app.

- [Apple](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/apple.md): Add Apple as an authentication provider for your Clerk app.
- [Atlassian](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/atlassian.md): Add Atlassian as an authentication provider for your Clerk app.
- [Bitbucket](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/bitbucket.md): Add Bitbucket as an authentication provider for your Clerk app.
- [Box](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/box.md): Add Box as an authentication provider for your Clerk app.
- [Coinbase](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/coinbase.md): Add Coinbase as an authentication provider for your Clerk app.
- [Discord](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/discord.md): Add Discord as an authentication provider for your Clerk app.
- [Dropbox](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/dropbox.md): Add Dropbox as an authentication provider for your Clerk app.
- [Facebook](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/facebook.md): Add Facebook as an authentication provider for your Clerk app.
- [GitHub](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/github.md): Add GitHub as an authentication provider for your Clerk app.
- [GitLab](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/gitlab.md): Add GitLab as an authentication provider for your Clerk app.
- [Google](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/google.md): Add Google as an authentication provider for your Clerk app.
- [HubSpot](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/hubspot.md): Add HubSpot as an authentication provider for your Clerk app.
- [Hugging Face](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/hugging-face.md): Add Hugging Face as an authentication provider for your Clerk app.
- [LINE](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/line.md): Add LINE as an authentication provider for your Clerk app.
- [Linear](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/linear.md): Add Linear as an authentication provider for your Clerk app.
- [LinkedIn](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/linkedin-oidc.md): Add LinkedIn as an authentication provider for your Clerk app.
- [Microsoft](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/microsoft.md): Add Microsoft as an authentication provider for your Clerk app.
- [Notion](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/notion.md): Add Notion as an authentication provider for your Clerk app.
- [Slack](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/slack.md): Add Slack as an authentication provider for your Clerk app.
- [Spotify](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/spotify.md): Add Spotify as an authentication provider for your Clerk app.
- [TikTok](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/tiktok.md): Add TikTok as an authentication provider for your Clerk app.
- [Twitch](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/twitch.md): Add Twitch as an authentication provider for your Clerk app.
- [Vercel](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/vercel.md): Add Vercel as an authentication provider for your Clerk app.
- [X/Twitter v2](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/x-twitter.md): Add X (Twitter v2) as an authentication provider for your Clerk app.
- [Xero](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/xero.md): Add Xero as an authentication provider for your Clerk app.

Don't see the provider you're looking for? You can [configure a custom OIDC-compatible provider](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/custom-provider.md) or [request a new one](https://feedback.clerk.com/roadmap).


# Add Apple as a social connection

**Before you start**

- [A Clerk application is required.](https://clerk.com/docs/getting-started/quickstart/setup-clerk.md)
- [An Apple Developer account is required.](https://developer.apple.com/programs/enroll/)

Enabling OAuth via [Sign in with Apple](https://developer.apple.com/sign-in-with-apple/) allows your users to sign in and sign up to your Clerk app with their Apple ID.

> This guide explains how to configure Sign in with Apple for web-based flows. To configure Sign in with Apple on native applications (such as iOS or Expo apps), see the [`dedicated guide`](https://clerk.com/docs/guides/configure/auth-strategies/sign-in-with-apple.md).

## Configure for your development instance

For _development instances_, Clerk uses preconfigured shared OAuth credentials and redirect URIs.

To configure your development instance, follow these steps:

1. In the Clerk Dashboard, navigate to the [**SSO connections**](https://dashboard.clerk.com/~/user-authentication/sso-connections) page.
2. Select **Add connection** and select **For all users**.
3. Select **Apple** from the provider list.

## Configure for your production instance

For _production instances_, you must provide custom credentials.

You must generate and provide your own **Apple Services ID**, **Apple Private Key**, **Apple Team ID**, and **Apple Key ID** using your Apple Developer account.

To make the setup process easier, it's recommended to keep two browser tabs open: one for your [Clerk Dashboard](https://dashboard.clerk.com/~/user-authentication/sso-connections) and one for your [Apple Developer dashboard](https://developer.apple.com/account).

1. ### Enable Apple as a social connection

   1. In the Clerk Dashboard, navigate to the [**SSO connections**](https://dashboard.clerk.com/~/user-authentication/sso-connections) page.
   2. Select **Add connection** and select **For all users**.
   3. Select **Apple** from the provider list.
   4. Ensure that both **Enable for sign-up and sign-in** and **Use custom credentials** are toggled on.
   5. Save the **Email Source for Apple Private Email Relay** and **Return URL** values somewhere secure, as you'll need to provide them to Apple later. Keep this page open.
2. ### Get your Apple Team ID

   To get your **Apple Team ID**, create a new **App ID** in the Apple Developer portal by following these steps:

   1. On a separate page, navigate to the [Apple Developer dashboard](https://developer.apple.com/account).
   2. Under **Certificates, IDs and Profiles**, select [**Identifiers**](https://developer.apple.com/account/resources/identifiers/list).
   3. In the top-right, select the dropdown and select **App IDs**.
   4. Next to **Identifiers** at the top of the page, select the plus icon (+) to register a new identifier. You'll be redirected to the **Register a new identifier** page.
   5. Select **App IDs**, then select **Continue**.
   6. On the next page, you'll be prompted to **Select a type** for your app. Choose **App** and select **Continue**. You will be redirected to the **Register an App ID** page.
   7. Fill in a description for your **App ID** and a **Bundle ID**. Under **Capabilities**, ensure that **Sign In with Apple** is enabled. Then select **Continue**. You'll be redirected to the **Confirm your App ID** page.
   8. At the top of the page, you'll see your **App ID Prefix**. Save this value somewhere secure. This is your **Apple Team ID** in Clerk.
   9. Finally, select **Register**. You'll be redirected to the **Identifiers** page.
3. ### Get your Apple Services ID

   To get your **Apple Services ID**, create a new **Services ID** in the Apple Developer portal.

   1. On the **Identifiers** page, in the dropdown near the top-right of the page, select the **Services IDs** option from the list.
   2. Next to **Identifiers** at the top of the page, select the plus icon (+) to register a new identifier. You'll be redirected to the **Register a new identifier** page.
   3. Select **Services IDs**, then select **Continue**. You'll be redirected to the **Register a Services ID** page.
   4. Add a description for your **Services ID**, and set an **Identifier**. Save the **Identifier** value somewhere secure. This is your **Apple Services ID** in Clerk. Finally, select **Continue**.
   5. In the confirmation view, select **Register**.
   6. After the registration is finished, select the newly-created **Services ID**. Ensure the **Sign In with Apple** box is enabled and select **Configure**.
   7. Under **Primary App ID**, select the **App ID** you created in the previous step.
   8. Under **Domains and Subdomains**, add your Clerk Frontend API URL **without the protocol**. For example, if your domain is `https://myapp.com`, then your Frontend API URL is `https://clerk.myapp.com`, and you would add `clerk.myapp.com` to **Domains and Subdomains**.
   9. Under **Return URLS**, add the **Return URL** value you saved from the Clerk Dashboard.
   10. Select **Next**. You'll be redirected to the **Confirm your web authentication configuration** screen.
   11. Select **Done**. You'll be redirected to the **Edit your Services ID Configuration** page.
   12. Select **Continue**. You'll be redirected to the confirmation page.
   13. Select **Save**. You'll be redirected to the **Identifiers** page.
4. ### Get your Apple Private Key and Key ID

   To get your **Apple Private Key** and **Key ID**, create a new **Key** in the Apple Developer portal.

   1. On the **Identifiers** page, in the sidenav, select **Keys**.
   2. Next to **Keys** at the top of the page, select the plus icon (+) to register a new key. You'll be redirected to the **Register a New Key** page.
   3. Add a **Key Name** and ensure the **Sign In with Apple** box is enabled and select **Configure**. You'll be redirected to the **Configure Key** page.
   4. Under **Primary App ID**, select the **App ID** you created in the first step of this guide. Then select **Save**. You'll be redirected to the previous **Register a New Key** page.
   5. Select **Continue** and you'll be presented with the final confirmation screen. Verify that **Sign in with Apple** is checked. Select **Register**. You'll be redirected to the **Download Your Key** page.
   6. Save the **Key ID** value somewhere secure. This is your **Apple Key ID** in Clerk.
   7. Download the private key file. This is your **Apple Private Key** in Clerk. Ensure you back up the key in a secure location, as it cannot be downloaded again later.
   8. Select **Done**. You'll be redirected to the **Keys** page.
5. ### Configure Email Source for Apple Private Relay

   > In some regions (such as China and India), Apple IDs may not include an email address at all, and instead are tied only to a phone number. If your instance requires all users to have an email, Sign in with Apple may fail for these users. Depending on your user base, you may want to navigate to the [**User & authentication**](https://dashboard.clerk.com/~/user-authentication/user-and-authentication) page in the Clerk Dashboard and disable the **Sign-up with email** setting.
   >
   > If you'd like to know more about this, see the [Apple documentation](https://support.apple.com/en-au/105034).

   Apple provides a privacy feature called [Hide My Email](https://support.apple.com/en-us/HT210425#hideemail), allowing users to sign in to your app with Apple without disclosing their actual email addresses. Instead, your instance receives an app-specific email address that forwards any emails to the user real's address.

   To be able to send emails properly to users with hidden addresses, you must configure an additional setting in the Apple Developer portal.

   1. In the sidenav of the Apple Developer Portal, select [**Services**](https://developer.apple.com/account/resources/services/list).
   2. Under **Sign in with Apple for Email Communication**, select **Configure**. You'll be redirected to the **Configure Sign in with Apple for Email Communication** page.
   3. Next to **Email Sources** at the top of the page, select the plus icon (+) to add a new **Email Source**.
   4. In the **Register your email sources** modal that opens, under **Email Addresses**, add the **Email Source for Apple Private Email Relay** value that you copied from the [**Apple SSO custom credentials**](https://dashboard.clerk.com/~/user-authentication/sso-connections) in the Clerk Dashboard. It should look something like this: `bounces+00000000@clkmail.myapp.com`.
   5. Select **Next**. The modal will redirect to the **Confirm your email sources** screen.
   6. Select **Register**. The modal will redirect to the **Email Source Registration Complete** screen.
   7. Select **Done**.

   After this step, the email address should appear in the list and display a green check icon, indicating it has been verified. If it's not marked as verified yet, DNS propagation may still be in progress. Wait for the propagation to complete before attempting to select **Reverify SPF**.

   For more info about Apple's Private Relay service, refer to the following documentation:

   - [https://support.apple.com/en-us/HT210425#hideemail](https://support.apple.com/en-us/HT210425#hideemail)
   - [https://developer.apple.com/help/account/configure-app-capabilities/configure-private-email-relay-service](https://developer.apple.com/help/account/configure-app-capabilities/configure-private-email-relay-service)
6. ### Connect your Apple app to your Clerk app

   By now, you should have the following values saved from the Apple Developer portal:

   - **Apple Team ID**
   - **Apple Services ID**
   - **Apple Key ID**
   - **Apple Private Key** file

   Connect your Apple app to your Clerk app by adding these values to the Clerk Dashboard.

   1. Navigate back to the Clerk Dashboard where the configuration page should still be open.
   2. Add all the corresponding fields depending on your desired flow. For the **Apple Private Key** file, open it with a text editor and copy/paste the contents. You must include the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines.
   3. Select **Save**.
7. ### Test your connection

   The simplest way to test your connection is to visit your Clerk app's [Account Portal](https://clerk.com/docs/guides/account-portal/overview.md), which is available for all Clerk apps out-of-the-box.

   1. In the Clerk Dashboard, navigate to the [**Account Portal**](https://dashboard.clerk.com/~/account-portal) page.
   2. Next to **Sign-in**, select the button to visit the sign-in page. The URL should resemble:
      - **For development** - `https://your-domain.accounts.dev/sign-in`
      - **For production** - `https://accounts.your-domain.com/sign-in`
   3. Sign in with your connection's credentials.

# Add Google as a social connection

**Before you start**

- [A Clerk application is required.](https://clerk.com/docs/getting-started/quickstart/setup-clerk.md)
- [A Google Developer account is required.](https://console.developers.google.com/)

Enabling OAuth with [Google](https://developers.google.com/identity/protocols/oauth2) allows your users to sign up and sign in to your Clerk application with their Google account.

> Google OAuth 2.0 **does not** allow apps to use WebViews for authentication. See the dedicated [Google blog post](https://developers.googleblog.com/en/modernizing-oauth-interactions-in-native-apps-for-better-usability-and-security) for more information. If your app requires users to sign in via in-app browsers, follow the setup instructions in the [Google Help guide](https://support.google.com/faqs/answer/12284343).

## Configure for your development instance

For _development instances_, Clerk uses preconfigured shared OAuth credentials and redirect URIs—no other configuration is needed.

1. In the Clerk Dashboard, navigate to the [**SSO connections**](https://dashboard.clerk.com/~/user-authentication/sso-connections) page.
2. Select **Add connection** and select **For all users**.
3. Select **Google** from the provider list.

## Configure for your production instance

For _production instances_, you must provide custom credentials.

To make the setup process easier, it's recommended to keep two browser tabs open: one for the [Clerk Dashboard](https://dashboard.clerk.com/~/user-authentication/sso-connections) and one for your [Google Cloud Console](https://console.cloud.google.com/).

1. ### Enable Google as a social connection

   1. In the Clerk Dashboard, navigate to the [**SSO connections**](https://dashboard.clerk.com/~/user-authentication/sso-connections) page.
   2. Select **Add connection** and select **For all users**.
   3. Select **Google** from the provider list.
   4. Ensure that both **Enable for sign-up and sign-in** and **Use custom credentials** are toggled on.
   5. Save the **Authorized Redirect URI** somewhere secure. Keep this page open.
2. ### Create a Google Developer project

   1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
   2. Select a project or [create a new one](https://console.cloud.google.com/projectcreate). You'll be redirected to your project's **Dashboard** page.
   3. In the top-left, select the menu icon (**≡**) and select **APIs & Services**. Then, select **Credentials**.
   4. Next to **Credentials**, select **Create Credentials**. Then, select **OAuth client ID.** You might need to [configure your OAuth consent screen](https://support.google.com/cloud/answer/6158849#userconsent). Otherwise, you'll be redirected to the **Create OAuth client ID** page.
   5. Select the appropriate application type for your project. In most cases, it's **Web application**.
   6. In the **Authorized JavaScript origins** setting, select **Add URI** and add your domain (e.g., `https://your-domain.com` and `https://www.your-domain.com` if you have a `www` version). For local development, add `http://localhost:PORT` (replace `PORT` with the port number of your local development server).
   7. In the **Authorized Redirect URIs** setting, paste the **Authorized Redirect URI** value you saved from the Clerk Dashboard.
   8. Select **Create**. A modal will open with your **Client ID** and **Client Secret**. Save these values somewhere secure.
3. ### Set the Client ID and Client Secret in the Clerk Dashboard

   1. Navigate back to the Clerk Dashboard where the configuration page should still be open. Paste the **Client ID** and **Client Secret** values that you saved into the respective fields.
   2. Select **Save**.

   > If the page is no longer open, navigate to the [**SSO connections**](https://dashboard.clerk.com/~/user-authentication/sso-connections) page in the Clerk Dashboard. Select the connection. Under **Use custom credentials**, paste the values into their respective fields.
4. ### Test your connection

   The simplest way to test your connection is to visit your Clerk app's [Account Portal](https://clerk.com/docs/guides/account-portal/overview.md), which is available for all Clerk apps out-of-the-box.

   1. In the Clerk Dashboard, navigate to the [**Account Portal**](https://dashboard.clerk.com/~/account-portal) page.
   2. Next to **Sign-in**, select the button to visit the sign-in page. The URL should resemble:
      - **For development** - `https://your-domain.accounts.dev/sign-in`
      - **For production** - `https://accounts.your-domain.com/sign-in`
   3. Sign in with your connection's credentials.

   > Google sign-in [**does not** allow users to sign in via in-app browsers](https://developers.googleblog.com/en/modernizing-oauth-interactions-in-native-apps-for-better-usability-and-security).

### Important note about switching to production

Google OAuth apps have a publishing status that determines who can access the app. The publishing status setting can be found in the Google Cloud Platform console on the **APIs & Services > OAuth consent screen** page. You can only view the publishing status if the **User type** is set to **External**.

By default, Google OAuth apps are set to the **"Testing"** [publishing status](https://support.google.com/cloud/answer/10311615#publishing-status), which is intended for internal testing before opening connections to your [intended audience](https://support.google.com/cloud/answer/10311615#user-type). It's limited to 100 test users and depending on the requested OAuth scopes, they might need to be explicitly added to your trusted user list to be able to connect.

To switch a Google OAuth app to production, **you must set the publishing status to "In production".** This involves a verification process with regard to your app name, logo, and scopes requested before Google accepts the switch to production.

Ensure that your Clerk production app always uses a corresponding Google OAuth app that is set to the **"In production"** publishing status, so your end users don't encounter any issues using Google as a social connection.

### Block email subaddresses

By default, your app will block any Google account with an email address that contains the characters `+`, `=` or `#` from being able to sign up, sign in, or be added to existing accounts.

For a Google organization with the domain `example.com`, blocking email subaddresses prevents someone with access to `user@example.com` from signing up with `user+alias@example.com`. This is a known [Google OAuth vulnerability](https://trufflesecurity.com/blog/google-oauth-is-broken-sort-of/) that could allow unauthorized, as Google organization administrators cannot suspend or delete the email alias account. It's recommended to keep this setting enabled for enhanced security.

To configure this setting:

1. In the Clerk Dashboard, navigate to the [**SSO connections**](https://dashboard.clerk.com/~/user-authentication/sso-connections) page.
2. Select the **Google** connection.
3. Enable or disable **Block email subaddresses**.

> Existing Google accounts with email subaddresses will be blocked by this restriction and won't be able to sign in.

## Google One Tap

[Google One Tap](https://developers.google.com/identity/gsi/web/guides/features) enables users to sign up or sign in to your Clerk app with the press of a button. After adding Google to your Clerk app as a social connection, you can use the prebuilt `<GoogleOneTap />` component to render the One Tap UI in your app. See [`the <GoogleOneTap /> component reference`](https://clerk.com/docs/nextjs/reference/components/authentication/google-one-tap.md) to learn more.
