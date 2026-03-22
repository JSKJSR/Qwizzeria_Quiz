# 20 Critical Mistakes Developers Still Make (and Their Consequences)

## 1. No rate limiting on API routes
> Anyone can spam your backend into a $500 bill overnight

## 2. Auth tokens stored in localStorage
> One XSS attack = every single user account compromised

## 3. No input sanitisation on forms
> SQL injection still works in 2026. Your AI didn’t tell you that.

## 4. Hardcoded API keys in the frontend
> Someone WILL find them within 48 hours of launch

## 5. Stripe webhooks with no signature verification
> Anyone can fake a successful payment event

## 6. No database indexing on queried fields
> Works fine at 100 users. Completely dies at 1,000

## 7. No error boundaries in the UI
> One crash = white screen = user never comes back

## 8. Sessions that never expire
> Stolen token = permanent access to that account. Forever

## 9. No pagination on database queries
> One fetch loads your entire database into memory

## 10. Password reset links that don’t expire
> Old email in someone’s inbox = instant account takeover

## 11. No environment variable validation at startup
> App silently breaks in production with zero error message

## 12. Images uploaded directly to your server
> No CDN = 8 second load times + massive hosting bill

## 13. No CORS policy
> Any website on the internet can make requests to your API

## 14. Emails sent synchronously in request handlers
> One slow SMTP server = your entire app hangs

## 15. No database connection pooling
> First traffic spike = database crashes

## 16. Admin routes with no role checks
> Any logged in user can access your admin panel

## 17. No health check endpoint
> Your app goes down silently. You find out from a client

## 18. No logging in production
> When something breaks you have zero idea where or why

## 19. No backup strategy on your database
> One bad migration = all your user data gone

## 20. No TypeScript on AI-generated code
> AI writes confident, wrong, untyped code—and you ship it anyway