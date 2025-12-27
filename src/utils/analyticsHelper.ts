/**
 * Analytics Helper Module
 * 
 * This module provides utilities for tracking user interactions and custom events
 * using Vercel Web Analytics. Use these functions throughout the app to track
 * meaningful user actions.
 * 
 * @example
 * import { trackContentCreation, trackUserAction } from '@/utils/analyticsHelper';
 * 
 * trackContentCreation({
 *   contentType: 'artwork',
 *   category: 'paintings'
 * });
 */

import { track } from '@vercel/analytics/react';

/**
 * Enum for common event types
 */
export enum AnalyticsEventType {
  // User authentication
  USER_SIGNUP = 'user_signup',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_PROFILE_UPDATE = 'user_profile_update',
  
  // Content creation
  CONTENT_CREATED = 'content_created',
  CONTENT_EDITED = 'content_edited',
  CONTENT_DELETED = 'content_deleted',
  CONTENT_SHARED = 'content_shared',
  CONTENT_FAVORITED = 'content_favorited',
  
  // Community engagement
  COMMENT_POSTED = 'comment_posted',
  COMMENT_LIKED = 'comment_liked',
  USER_FOLLOWED = 'user_followed',
  
  // Membership
  MEMBERSHIP_PURCHASE = 'membership_purchase',
  MEMBERSHIP_UPGRADED = 'membership_upgraded',
  MEMBERSHIP_CANCELLED = 'membership_cancelled',
  
  // Monetization
  PURCHASE_INITIATED = 'purchase_initiated',
  PURCHASE_COMPLETED = 'purchase_completed',
  PAYMENT_FAILED = 'payment_failed',
  
  // Feature usage
  FEATURE_USED = 'feature_used',
  TOOL_OPENED = 'tool_opened',
  SEARCH_PERFORMED = 'search_performed',
  
  // Error tracking
  ERROR_OCCURRED = 'error_occurred',
  
  // Other interactions
  PAGE_VIEWED = 'page_viewed',
  SECTION_SCROLLED = 'section_scrolled',
}

/**
 * Enum for content types
 */
export enum ContentType {
  ARTWORK = 'artwork',
  DESIGN = 'design',
  PHOTO = 'photo',
  VIDEO = 'video',
  ARTICLE = 'article',
  MUSIC = 'music',
  ANIMATION = 'animation',
  OTHER = 'other',
}

/**
 * Enum for content categories
 */
export enum ContentCategory {
  PAINTINGS = 'paintings',
  DIGITAL_ART = 'digital_art',
  PHOTOGRAPHY = 'photography',
  DESIGN_WORK = 'design_work',
  CULTURAL = 'cultural',
  INNOVATION = 'innovation',
  COMMERCIAL = 'commercial',
  PERSONAL = 'personal',
}

/**
 * Track user signup event
 * @param signupMethod - How the user signed up (email, google, github, etc.)
 * @param referralSource - Where the user came from (organic_search, direct, social_media, etc.)
 */
export function trackUserSignup(
  signupMethod: string = 'email',
  referralSource: string = 'direct'
): void {
  track(AnalyticsEventType.USER_SIGNUP, {
    signup_method: signupMethod,
    referral_source: referralSource,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track user login event
 * @param loginMethod - How the user logged in (email, google, github, etc.)
 */
export function trackUserLogin(loginMethod: string = 'email'): void {
  track(AnalyticsEventType.USER_LOGIN, {
    login_method: loginMethod,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track user logout event
 */
export function trackUserLogout(): void {
  track(AnalyticsEventType.USER_LOGOUT, {
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track profile update
 * @param fieldsUpdated - Array of fields that were updated
 */
export function trackProfileUpdate(fieldsUpdated: string[]): void {
  track(AnalyticsEventType.USER_PROFILE_UPDATE, {
    fields_updated: fieldsUpdated.join(', '),
    field_count: fieldsUpdated.length,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track content creation
 * @param contentType - Type of content created
 * @param category - Category of the content
 * @param additionalData - Any additional properties to track
 */
export function trackContentCreation(
  contentType: ContentType | string,
  category?: ContentCategory | string,
  additionalData?: Record<string, any>
): void {
  track(AnalyticsEventType.CONTENT_CREATED, {
    content_type: contentType,
    category: category || 'uncategorized',
    timestamp: new Date().toISOString(),
    ...additionalData,
  });
}

/**
 * Track content editing
 * @param contentId - ID of the content being edited
 * @param contentType - Type of content
 * @param fieldsChanged - Fields that were modified
 */
export function trackContentEdit(
  contentId: string,
  contentType: ContentType | string,
  fieldsChanged?: string[]
): void {
  track(AnalyticsEventType.CONTENT_EDITED, {
    content_id: contentId,
    content_type: contentType,
    fields_changed: fieldsChanged ? fieldsChanged.join(', ') : 'none',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track content deletion
 * @param contentId - ID of the content being deleted
 * @param contentType - Type of content
 */
export function trackContentDeletion(
  contentId: string,
  contentType: ContentType | string
): void {
  track(AnalyticsEventType.CONTENT_DELETED, {
    content_id: contentId,
    content_type: contentType,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track content sharing
 * @param contentId - ID of the content being shared
 * @param platform - Where it's being shared (social_media, email, link, etc.)
 * @param contentType - Type of content
 */
export function trackContentShare(
  contentId: string,
  platform: string,
  contentType?: ContentType | string
): void {
  track(AnalyticsEventType.CONTENT_SHARED, {
    content_id: contentId,
    platform: platform,
    content_type: contentType || 'unknown',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track content being favorited
 * @param contentId - ID of the content being favorited
 * @param contentType - Type of content
 * @param isFavorited - Whether it's being favorited or unfavorited
 */
export function trackContentFavorite(
  contentId: string,
  contentType: ContentType | string,
  isFavorited: boolean = true
): void {
  track(AnalyticsEventType.CONTENT_FAVORITED, {
    content_id: contentId,
    content_type: contentType,
    action: isFavorited ? 'favorite' : 'unfavorite',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track comment posted
 * @param contentId - ID of the content being commented on
 * @param commentLength - Length of the comment
 */
export function trackCommentPosted(
  contentId: string,
  commentLength?: number
): void {
  track(AnalyticsEventType.COMMENT_POSTED, {
    content_id: contentId,
    comment_length: commentLength || 0,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track comment liked
 * @param commentId - ID of the comment being liked
 * @param isLiked - Whether it's being liked or unliked
 */
export function trackCommentLike(
  commentId: string,
  isLiked: boolean = true
): void {
  track(AnalyticsEventType.COMMENT_LIKED, {
    comment_id: commentId,
    action: isLiked ? 'like' : 'unlike',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track user following
 * @param followedUserId - ID of the user being followed
 * @param isFollowing - Whether the user is being followed or unfollowed
 */
export function trackUserFollow(
  followedUserId: string,
  isFollowing: boolean = true
): void {
  track(AnalyticsEventType.USER_FOLLOWED, {
    followed_user_id: followedUserId,
    action: isFollowing ? 'follow' : 'unfollow',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track membership purchase
 * @param planName - Name of the membership plan
 * @param price - Price of the membership
 * @param billingCycle - Billing cycle (monthly, yearly, lifetime)
 */
export function trackMembershipPurchase(
  planName: string,
  price?: number,
  billingCycle: string = 'monthly'
): void {
  track(AnalyticsEventType.MEMBERSHIP_PURCHASE, {
    plan_name: planName,
    price: price || 0,
    billing_cycle: billingCycle,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track membership upgrade
 * @param fromPlan - Previous membership plan
 * @param toPlan - New membership plan
 * @param price - Price of the upgrade
 */
export function trackMembershipUpgrade(
  fromPlan: string,
  toPlan: string,
  price?: number
): void {
  track(AnalyticsEventType.MEMBERSHIP_UPGRADED, {
    from_plan: fromPlan,
    to_plan: toPlan,
    price: price || 0,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track membership cancellation
 * @param planName - Name of the membership plan being cancelled
 * @param reason - Reason for cancellation (optional)
 */
export function trackMembershipCancellation(
  planName: string,
  reason?: string
): void {
  track(AnalyticsEventType.MEMBERSHIP_CANCELLED, {
    plan_name: planName,
    reason: reason || 'user_initiated',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track purchase initiation
 * @param itemId - ID of the item being purchased
 * @param itemName - Name of the item
 * @param price - Price of the item
 */
export function trackPurchaseInitiated(
  itemId: string,
  itemName: string,
  price: number
): void {
  track(AnalyticsEventType.PURCHASE_INITIATED, {
    item_id: itemId,
    item_name: itemName,
    price: price,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track purchase completion
 * @param orderId - Order ID
 * @param totalAmount - Total purchase amount
 * @param itemCount - Number of items purchased
 */
export function trackPurchaseCompleted(
  orderId: string,
  totalAmount: number,
  itemCount: number = 1
): void {
  track(AnalyticsEventType.PURCHASE_COMPLETED, {
    order_id: orderId,
    total_amount: totalAmount,
    item_count: itemCount,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track purchase failure
 * @param orderId - Order ID (optional)
 * @param errorMessage - Error message explaining the failure
 */
export function trackPaymentFailed(
  errorMessage: string,
  orderId?: string
): void {
  track(AnalyticsEventType.PAYMENT_FAILED, {
    order_id: orderId || 'unknown',
    error_message: errorMessage,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track feature usage
 * @param featureName - Name of the feature
 * @param additionalData - Any additional properties
 */
export function trackFeatureUsed(
  featureName: string,
  additionalData?: Record<string, any>
): void {
  track(AnalyticsEventType.FEATURE_USED, {
    feature_name: featureName,
    timestamp: new Date().toISOString(),
    ...additionalData,
  });
}

/**
 * Track tool opening
 * @param toolName - Name of the tool
 * @param toolCategory - Category of the tool
 */
export function trackToolOpened(
  toolName: string,
  toolCategory?: string
): void {
  track(AnalyticsEventType.TOOL_OPENED, {
    tool_name: toolName,
    tool_category: toolCategory || 'general',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track search
 * @param query - Search query
 * @param resultsCount - Number of results returned
 */
export function trackSearchPerformed(
  query: string,
  resultsCount?: number
): void {
  track(AnalyticsEventType.SEARCH_PERFORMED, {
    query: query,
    results_count: resultsCount || 0,
    query_length: query.length,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track error occurrence
 * @param errorMessage - Error message
 * @param errorContext - Context where the error occurred
 * @param severity - Severity level (low, medium, high)
 */
export function trackError(
  errorMessage: string,
  errorContext?: string,
  severity: 'low' | 'medium' | 'high' = 'medium'
): void {
  track(AnalyticsEventType.ERROR_OCCURRED, {
    error_message: errorMessage,
    error_context: errorContext || 'unknown',
    severity: severity,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track page view (usually automatic but can be manual)
 * @param pageName - Name of the page
 * @param pageCategory - Category of the page
 */
export function trackPageView(
  pageName: string,
  pageCategory?: string
): void {
  track(AnalyticsEventType.PAGE_VIEWED, {
    page_name: pageName,
    page_category: pageCategory || 'general',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track custom user action
 * @param actionName - Name of the action
 * @param properties - Properties of the action
 */
export function trackCustomAction(
  actionName: string,
  properties?: Record<string, any>
): void {
  track(actionName, {
    timestamp: new Date().toISOString(),
    ...properties,
  });
}

/**
 * Get current analytics status
 * Useful for debugging and verifying analytics setup
 */
export function getAnalyticsStatus(): {
  isProduction: boolean;
  isEnabled: boolean;
  message: string;
} {
  const isProduction = process.env.NODE_ENV === 'production';
  const isEnabled = typeof window !== 'undefined' && !!window.va;

  return {
    isProduction,
    isEnabled,
    message: isProduction
      ? 'Analytics is enabled in production'
      : 'Analytics is configured but not sending data in development',
  };
}

export default {
  AnalyticsEventType,
  ContentType,
  ContentCategory,
  trackUserSignup,
  trackUserLogin,
  trackUserLogout,
  trackProfileUpdate,
  trackContentCreation,
  trackContentEdit,
  trackContentDeletion,
  trackContentShare,
  trackContentFavorite,
  trackCommentPosted,
  trackCommentLike,
  trackUserFollow,
  trackMembershipPurchase,
  trackMembershipUpgrade,
  trackMembershipCancellation,
  trackPurchaseInitiated,
  trackPurchaseCompleted,
  trackPaymentFailed,
  trackFeatureUsed,
  trackToolOpened,
  trackSearchPerformed,
  trackError,
  trackPageView,
  trackCustomAction,
  getAnalyticsStatus,
};
