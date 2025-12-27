# Vercel Web Analytics Setup Guide

This document describes how Vercel Web Analytics is implemented in the **jinmai-lab** project, a Vite + React application. This guide will help developers understand how to use, maintain, and extend analytics features in the project.

## Overview

Vercel Web Analytics provides detailed insights into your application's performance and user behavior. The project is already configured to use both:
- **@vercel/analytics** - For web analytics tracking
- **@vercel/speed-insights** - For performance monitoring

## Prerequisites

Before working with analytics in this project, ensure you have:

- A Vercel account ([Sign up for free](https://vercel.com/signup))
- A Vercel project ([Create a new project](https://vercel.com/new))
- The Vercel CLI installed:
  ```bash
  pnpm i vercel
  # or
  npm i vercel
  ```

## Current Installation

The required packages are already installed in the project:

```json
{
  "dependencies": {
    "@vercel/analytics": "^1.6.1",
    "@vercel/speed-insights": "^1.3.1"
  }
}
```

## Implementation in the Project

### 1. Package Installation

The analytics packages are already added to `package.json`. If you need to update them:

```bash
pnpm add @vercel/analytics@latest @vercel/speed-insights@latest
```

### 2. Integration with React Application

The analytics components are integrated in `src/main.tsx`:

```tsx
// Vercel Analytics and Speed Insights
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

// ... other imports ...

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <BrowserRouter>
            <AuthProvider>
              <WorkflowProvider>
                <App />
                <Toaster />
                {/* Vercel Analytics and Speed Insights */}
                <Analytics />
                <SpeedInsights />
              </WorkflowProvider>
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>
);
```

**Key Points:**
- The `<Analytics />` component is placed after the main app content
- The `<SpeedInsights />` component tracks performance metrics
- Both components are included at the root level for comprehensive tracking

### 3. How It Works

#### Analytics Component (`@vercel/analytics/react`)

The Analytics component automatically:
- **Tracks page views**: Each route navigation is automatically tracked
- **Tracks custom events**: You can manually send events for user interactions
- **Sends data to Vercel**: All analytics data is sent to the Vercel dashboard for analysis
- **Routes detection**: Automatically detects and tracks route changes in React Router

#### Speed Insights Component (`@vercel/speed-insights/react`)

The Speed Insights component:
- **Monitors Core Web Vitals**: Tracks LCP, FID, and CLS metrics
- **Measures performance**: Provides detailed performance data
- **Non-blocking**: Runs in the background without affecting app performance

### 4. Vercel Configuration

The project includes `vercel.json` for Vercel-specific configuration:

```json
{
  "version": 2,
  "installCommand": "pnpm install",
  "buildCommand": "vite build",
  "outputDirectory": "dist",
  "cleanUrls": true,
  "trailingSlash": false
}
```

After deployment, the analytics endpoint becomes available at `/_vercel/insights/*`

> **Note:** After your next deployment to Vercel, new analytics routes will be automatically added at `/_vercel/insights/*`

## Enabling Web Analytics in Vercel Dashboard

To enable Web Analytics for this project:

1. Go to your [Vercel Dashboard](/dashboard)
2. Select your Project
3. Click the **Analytics** tab
4. Click **Enable** from the dialog
5. Deploy your app using: `vercel deploy`

## Custom Events

You can track custom user interactions (button clicks, form submissions, etc.) using the analytics package:

### Example: Tracking a Button Click

```tsx
import { track } from '@vercel/analytics/react';

export function MyComponent() {
  const handleClick = () => {
    // Track custom event
    track('button_clicked', {
      button_name: 'submit',
      section: 'form'
    });
    // ... rest of your logic
  };

  return <button onClick={handleClick}>Submit</button>;
}
```

### Example: Tracking Form Submission

```tsx
import { track } from '@vercel/analytics/react';

export function FormComponent() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Track form submission
    track('form_submitted', {
      form_name: 'contact_form',
      fields_count: 3
    });
    
    // Submit form logic
  };

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
}
```

## Viewing Analytics Data

Once your app is deployed to Vercel:

1. Go to your [Vercel Dashboard](/dashboard)
2. Select your project
3. Click the **Analytics** tab
4. After a few days of traffic, you'll see:
   - Visitor metrics
   - Page views
   - Top pages
   - Core Web Vitals
   - Custom events (if configured)

### Filtering Data

The analytics dashboard allows you to:
- Filter by date range
- View data by page
- Analyze custom events
- Compare performance metrics

## Development vs. Production

### Development Environment

During local development (`pnpm dev`):
- Analytics tracking is configured but may not send data to Vercel
- Use the browser's Network tab to verify requests to `/_vercel/insights/view`
- Custom events are still tracked for testing purposes

### Production Environment

After deployment to Vercel:
- Analytics data is automatically collected and sent to the Vercel dashboard
- All page views and custom events are tracked
- Core Web Vitals are monitored in real-time
- You can view comprehensive analytics in the dashboard

## Best Practices

### 1. **Strategic Event Tracking**

Don't track every action. Focus on meaningful user interactions:
- Form submissions
- Purchase completions
- Feature usage
- Error states
- User milestones

### 2. **Meaningful Event Names**

Use clear, descriptive event names:
```tsx
// Good
track('user_registration_completed');
track('payment_initiated');

// Avoid
track('click');
track('action');
```

### 3. **Include Context in Events**

Always include relevant properties in custom events:
```tsx
track('content_created', {
  content_type: 'artwork',
  category: 'paintings',
  user_tier: 'premium'
});
```

### 4. **Monitor Core Web Vitals**

Focus on improving Core Web Vitals:
- **LCP (Largest Contentful Paint)**: < 2.5 seconds
- **FID (First Input Delay)**: < 100 milliseconds
- **CLS (Cumulative Layout Shift)**: < 0.1

### 5. **Privacy Considerations**

The analytics setup respects privacy:
- No personally identifiable information is tracked
- Users have control through browser privacy settings
- Complies with GDPR and other privacy regulations
- Data is anonymized

## Troubleshooting

### Analytics Data Not Appearing

1. **Check if Web Analytics is enabled** in your Vercel dashboard
2. **Verify deployment**: Run `vercel deploy` to ensure your app is deployed
3. **Check browser console**: Look for any errors in the browser's developer tools
4. **Network tab**: Verify requests to `/_vercel/insights/view` are being sent

### Speed Insights Not Tracking

1. **Verify SpeedInsights component is imported**: Check `src/main.tsx`
2. **Check Core Web Vitals**: Visit your site and check browser's Network tab
3. **Allow time for data collection**: It may take a few minutes for data to appear

### Custom Events Not Being Tracked

1. **Verify track function is imported**: 
   ```tsx
   import { track } from '@vercel/analytics/react';
   ```
2. **Check event name**: Ensure it's a valid string
3. **Verify app is deployed**: Custom events only send in production
4. **Check browser console**: Look for any errors

## Performance Impact

The analytics implementation is designed to be lightweight:
- **Bundle size impact**: ~20KB gzipped
- **Runtime performance**: Minimal overhead
- **Non-blocking**: All tracking happens asynchronously
- **Network impact**: Batched requests to minimize network calls

## Advanced Configuration

### Custom Event Properties

You can include multiple properties in custom events:

```tsx
track('user_action', {
  action_type: 'content_share',
  content_id: 'work_123',
  platform: 'social_media',
  timestamp: new Date().toISOString(),
  duration_ms: 5000
});
```

### Conditional Analytics

You can conditionally enable analytics based on environment:

```tsx
// In main.tsx
{process.env.NODE_ENV === 'production' && <Analytics />}
{process.env.NODE_ENV === 'production' && <SpeedInsights />}
```

## API Reference

### Analytics Methods

#### `track(name: string, properties?: Record<string, any>): void`

Track a custom event.

```tsx
import { track } from '@vercel/analytics/react';

track('user_signed_up', {
  signup_method: 'email',
  referral_source: 'organic_search'
});
```

### Available Events (Automatic)

The following events are automatically tracked:
- Page views (route changes)
- Navigation events
- Resource timing
- Core Web Vitals

## Integration with Custom Analytics

If you want to use multiple analytics services:

```tsx
// Track in both Vercel and another service
track('custom_event', { data: 'value' });

// Also send to custom service
customAnalytics.track('custom_event', { data: 'value' });
```

## Related Documentation

- [Vercel Analytics Package Documentation](/docs/analytics/package)
- [Custom Events Guide](/docs/analytics/custom-events)
- [Data Filtering](/docs/analytics/filtering)
- [Privacy Policy](/docs/analytics/privacy-policy)
- [Limits and Pricing](/docs/analytics/limits-and-pricing)
- [Troubleshooting Guide](/docs/analytics/troubleshooting)

## Next Steps

1. **Deploy to Vercel**: Use `vercel deploy` to deploy your changes
2. **Enable Web Analytics**: In the Vercel dashboard, enable Web Analytics for your project
3. **Monitor Dashboard**: Check your analytics dashboard for initial data after deployment
4. **Add Custom Events**: Implement custom event tracking for key user interactions
5. **Optimize Performance**: Use Web Vitals data to improve your app's performance

## Support

For issues or questions about Vercel Analytics:
- Check the [Vercel Documentation](https://vercel.com/docs/analytics)
- Review [Troubleshooting Guide](/docs/analytics/troubleshooting)
- Contact Vercel Support through your dashboard

## Summary

This project is already configured with Vercel Web Analytics and Speed Insights. The analytics components are:
- ✅ Installed in `package.json`
- ✅ Imported in `src/main.tsx`
- ✅ Integrated at the application root
- ✅ Ready for production deployment

No additional setup is required to start tracking analytics. Simply deploy to Vercel and enable Web Analytics in your project dashboard.
