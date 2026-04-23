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

