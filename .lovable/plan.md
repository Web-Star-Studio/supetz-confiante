

## Plan: Add Apple Sign In to Login and Registration Pages

### Summary
Add an "Apple Sign In" button alongside the existing Google button on both the Login and Cadastro (Registration) pages, using the same `lovable.auth.signInWithOAuth("apple")` method.

### Changes

**1. `src/pages/Login.tsx`**
- Add an Apple sign-in button below the Google button
- Use `lovable.auth.signInWithOAuth("apple", { redirect_uri: window.location.origin })`
- Style consistently with the Google button, using the Apple logo SVG icon

**2. `src/pages/Cadastro.tsx`**
- Add the same Apple sign-in button below the Google button
- Same styling and behavior as Login page

### Technical Details
- Both providers (Google and Apple) are natively supported by Lovable Cloud — no additional configuration needed
- The divider text "ou continue com" already exists; both buttons will appear below it
- Apple button will use a black Apple logo icon with text "Entrar com Apple" / "Criar conta com Apple"

