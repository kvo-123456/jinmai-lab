/**
 * Example component demonstrating how to use Vercel Analytics
 * in the jinmai-lab application.
 * 
 * This file shows practical examples of tracking various user interactions
 * and can be used as a reference for implementing analytics throughout the app.
 */

import React, { useState } from 'react';
import {
  trackUserSignup,
  trackContentCreation,
  trackContentShare,
  trackPurchaseCompleted,
  trackFeatureUsed,
  trackSearchPerformed,
  ContentType,
  ContentCategory,
  getAnalyticsStatus,
} from '@/utils/analyticsHelper';

/**
 * Example: Track content creation
 */
export function ContentCreationExample() {
  const handleCreateArtwork = () => {
    // Track that user created new artwork
    trackContentCreation(ContentType.ARTWORK, ContentCategory.PAINTINGS, {
      title: 'My Amazing Painting',
      duration_minutes: 45,
      tools_used: ['brush', 'palette', 'canvas'],
    });

    // Your content creation logic here
    console.log('Artwork created and analytics event tracked');
  };

  return (
    <button
      onClick={handleCreateArtwork}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Create Artwork
    </button>
  );
}

/**
 * Example: Track content sharing
 */
export function ContentSharingExample() {
  const handleShare = (platform: string) => {
    const contentId = 'artwork_12345';

    // Track that user is sharing content
    trackContentShare(contentId, platform, ContentType.ARTWORK);

    // Your sharing logic here
    console.log(`Content shared on ${platform}`);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleShare('twitter')}
        className="px-3 py-2 bg-blue-400 text-white rounded"
      >
        Share on Twitter
      </button>
      <button
        onClick={() => handleShare('instagram')}
        className="px-3 py-2 bg-purple-600 text-white rounded"
      >
        Share on Instagram
      </button>
      <button
        onClick={() => handleShare('facebook')}
        className="px-3 py-2 bg-blue-600 text-white rounded"
      >
        Share on Facebook
      </button>
    </div>
  );
}

/**
 * Example: Track purchase
 */
export function PurchaseExample() {
  const handleCompletePurchase = () => {
    const orderId = 'order_' + Date.now();
    const totalAmount = 99.99;

    // Track purchase completion
    trackPurchaseCompleted(orderId, totalAmount, 1);

    // Your purchase completion logic here
    console.log('Purchase tracked:', { orderId, totalAmount });
  };

  return (
    <button
      onClick={handleCompletePurchase}
      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
    >
      Complete Purchase
    </button>
  );
}

/**
 * Example: Track feature usage
 */
export function FeatureUsageExample() {
  const handleUseAdvancedFilter = () => {
    // Track that user is using advanced filtering feature
    trackFeatureUsed('advanced_filter', {
      filter_type: 'multi_category',
      filter_count: 3,
      sort_option: 'trending',
    });

    console.log('Feature usage tracked');
  };

  return (
    <button
      onClick={handleUseAdvancedFilter}
      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
    >
      Use Advanced Filter
    </button>
  );
}

/**
 * Example: Track search
 */
export function SearchExample() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (searchQuery.trim()) {
      // Track search action
      trackSearchPerformed(searchQuery, 25); // assuming 25 results

      console.log('Search tracked:', searchQuery);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search artworks..."
        className="flex-1 px-4 py-2 border border-gray-300 rounded"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
      >
        Search
      </button>
    </form>
  );
}

/**
 * Main example component showing all usage patterns
 */
export function AnalyticsExamplePage() {
  const analyticsStatus = getAnalyticsStatus();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Vercel Analytics Examples</h1>

      {/* Analytics Status */}
      <div className="mb-8 p-4 bg-blue-100 border border-blue-400 rounded">
        <h2 className="text-lg font-semibold mb-2">Analytics Status</h2>
        <p>
          <strong>Environment:</strong>{' '}
          {analyticsStatus.isProduction ? 'Production' : 'Development'}
        </p>
        <p>
          <strong>Analytics Enabled:</strong> {analyticsStatus.isEnabled ? 'Yes' : 'No'}
        </p>
        <p className="text-sm text-gray-700 mt-2">{analyticsStatus.message}</p>
      </div>

      {/* Content Creation Example */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">1. Track Content Creation</h2>
        <p className="mb-4 text-gray-700">
          Track when users create new artwork or content. This helps understand what types
          of content are being created most frequently.
        </p>
        <ContentCreationExample />
      </section>

      {/* Content Sharing Example */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">2. Track Content Sharing</h2>
        <p className="mb-4 text-gray-700">
          Track when users share content on social media or other platforms. This helps
          measure content virality and platform preference.
        </p>
        <ContentSharingExample />
      </section>

      {/* Purchase Example */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">3. Track Purchases</h2>
        <p className="mb-4 text-gray-700">
          Track completed purchases to understand revenue and customer behavior. This is
          crucial for business metrics.
        </p>
        <PurchaseExample />
      </section>

      {/* Feature Usage Example */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">4. Track Feature Usage</h2>
        <p className="mb-4 text-gray-700">
          Track when users interact with specific features. This helps identify which
          features are most valuable to users.
        </p>
        <FeatureUsageExample />
      </section>

      {/* Search Example */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">5. Track Search</h2>
        <p className="mb-4 text-gray-700">
          Track search queries to understand what users are looking for. This helps
          optimize search functionality and content discovery.
        </p>
        <SearchExample />
      </section>

      {/* Usage Instructions */}
      <section className="bg-gray-100 p-6 rounded">
        <h2 className="text-2xl font-bold mb-4">How to Use in Your Components</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Step 1: Import the helper</h3>
            <pre className="bg-white p-4 rounded overflow-x-auto text-sm">
              {`import { 
  trackContentCreation, 
  trackContentShare,
  ContentType,
  ContentCategory 
} from '@/utils/analyticsHelper';`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Step 2: Use in event handlers</h3>
            <pre className="bg-white p-4 rounded overflow-x-auto text-sm">
              {`const handleSaveArtwork = () => {
  // Your save logic...
  
  // Track the action
  trackContentCreation(
    ContentType.ARTWORK,
    ContentCategory.DIGITAL_ART,
    { title: 'My Artwork' }
  );
};`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Step 3: Deploy to Vercel</h3>
            <p className="text-gray-700">
              Run <code className="bg-white px-2 py-1 rounded">vercel deploy</code> to
              deploy your changes. Analytics will start collecting data immediately.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Step 4: View in Vercel Dashboard</h3>
            <p className="text-gray-700">
              Go to your Vercel dashboard, select your project, and click the Analytics tab
              to view your data.
            </p>
          </div>
        </div>
      </section>

      {/* Available Functions Reference */}
      <section className="mt-8 bg-gray-50 p-6 rounded">
        <h2 className="text-2xl font-bold mb-4">Available Analytics Functions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white p-3 rounded border border-gray-200">
            <p className="font-semibold">User Actions</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>trackUserSignup()</li>
              <li>trackUserLogin()</li>
              <li>trackUserLogout()</li>
              <li>trackProfileUpdate()</li>
            </ul>
          </div>

          <div className="bg-white p-3 rounded border border-gray-200">
            <p className="font-semibold">Content Actions</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>trackContentCreation()</li>
              <li>trackContentEdit()</li>
              <li>trackContentDeletion()</li>
              <li>trackContentShare()</li>
              <li>trackContentFavorite()</li>
            </ul>
          </div>

          <div className="bg-white p-3 rounded border border-gray-200">
            <p className="font-semibold">Community</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>trackCommentPosted()</li>
              <li>trackCommentLike()</li>
              <li>trackUserFollow()</li>
            </ul>
          </div>

          <div className="bg-white p-3 rounded border border-gray-200">
            <p className="font-semibold">Monetization</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>trackMembershipPurchase()</li>
              <li>trackPurchaseCompleted()</li>
              <li>trackPaymentFailed()</li>
            </ul>
          </div>

          <div className="bg-white p-3 rounded border border-gray-200">
            <p className="font-semibold">Usage Tracking</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>trackFeatureUsed()</li>
              <li>trackToolOpened()</li>
              <li>trackSearchPerformed()</li>
            </ul>
          </div>

          <div className="bg-white p-3 rounded border border-gray-200">
            <p className="font-semibold">Custom Events</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>trackError()</li>
              <li>trackPageView()</li>
              <li>trackCustomAction()</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AnalyticsExamplePage;
