import { ConvexError } from "convex/values";

/**
 * Sanitize and validate email addresses
 */
export function validateAndSanitizeEmail(email: string): string {
  if (!email || typeof email !== "string") {
    throw new ConvexError("Email is required");
  }

  const sanitizedEmail = email.toLowerCase().trim();
  
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitizedEmail)) {
    throw new ConvexError("Invalid email format");
  }

  // Check for common malicious patterns
  if (sanitizedEmail.includes("<script>") || sanitizedEmail.includes("javascript:")) {
    throw new ConvexError("Invalid email format");
  }

  if (sanitizedEmail.length > 254) { // RFC 5321 limit
    throw new ConvexError("Email address too long");
  }

  return sanitizedEmail;
}

/**
 * Sanitize and validate names (for people, teams, events)
 */
export function validateAndSanitizeName(name: string, fieldName: string = "Name"): string {
  if (!name || typeof name !== "string") {
    throw new ConvexError(`${fieldName} is required`);
  }

  const sanitizedName = name.trim();
  
  if (sanitizedName.length === 0) {
    throw new ConvexError(`${fieldName} cannot be empty`);
  }

  if (sanitizedName.length > 100) {
    throw new ConvexError(`${fieldName} must be less than 100 characters`);
  }

  // Remove potential XSS patterns
  const dangerousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<[^>]*>/g // Remove all HTML tags
  ];

  let cleanName = sanitizedName;
  dangerousPatterns.forEach(pattern => {
    cleanName = cleanName.replace(pattern, "");
  });

  return cleanName;
}

/**
 * Sanitize and validate descriptions and messages
 */
export function validateAndSanitizeText(text: string | undefined, fieldName: string = "Text", maxLength: number = 2000): string | undefined {
  if (!text) return undefined;
  
  if (typeof text !== "string") {
    throw new ConvexError(`${fieldName} must be a string`);
  }

  const sanitizedText = text.trim();
  
  if (sanitizedText.length === 0) return undefined;

  if (sanitizedText.length > maxLength) {
    throw new ConvexError(`${fieldName} must be less than ${maxLength} characters`);
  }

  // Remove script tags and javascript: protocols, but allow basic formatting
  const dangerousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ];

  let cleanText = sanitizedText;
  dangerousPatterns.forEach(pattern => {
    cleanText = cleanText.replace(pattern, "");
  });

  return cleanText;
}

/**
 * Validate and sanitize slugs for URLs
 */
export function validateAndSanitizeSlug(slug: string, fieldName: string = "Slug"): string {
  if (!slug || typeof slug !== "string") {
    throw new ConvexError(`${fieldName} is required`);
  }

  const sanitizedSlug = slug.toLowerCase().trim();
  
  // Only allow alphanumeric characters, hyphens, and underscores
  const slugRegex = /^[a-z0-9\-_]+$/;
  if (!slugRegex.test(sanitizedSlug)) {
    throw new ConvexError(`${fieldName} can only contain lowercase letters, numbers, hyphens, and underscores`);
  }

  if (sanitizedSlug.length < 2) {
    throw new ConvexError(`${fieldName} must be at least 2 characters long`);
  }

  if (sanitizedSlug.length > 50) {
    throw new ConvexError(`${fieldName} must be less than 50 characters`);
  }

  // Prevent reserved words
  const reservedSlugs = [
    "admin", "api", "www", "mail", "ftp", "root", "null", "undefined",
    "create", "edit", "delete", "new", "settings", "profile", "help",
    "about", "contact", "terms", "privacy", "login", "logout", "signup",
    "signin", "register", "auth", "dashboard", "home", "index"
  ];

  if (reservedSlugs.includes(sanitizedSlug)) {
    throw new ConvexError(`${fieldName} '${sanitizedSlug}' is reserved and cannot be used`);
  }

  return sanitizedSlug;
}

/**
 * Validate address fields
 */
export function validateAndSanitizeAddress(address: string): string {
  if (!address || typeof address !== "string") {
    throw new ConvexError("Address is required");
  }

  const sanitizedAddress = address.trim();
  
  if (sanitizedAddress.length === 0) {
    throw new ConvexError("Address cannot be empty");
  }

  if (sanitizedAddress.length > 200) {
    throw new ConvexError("Address must be less than 200 characters");
  }

  // Remove script tags but allow basic punctuation for addresses
  const dangerousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ];

  let cleanAddress = sanitizedAddress;
  dangerousPatterns.forEach(pattern => {
    cleanAddress = cleanAddress.replace(pattern, "");
  });

  return cleanAddress;
}

/**
 * Validate capacity numbers
 */
export function validateCapacity(capacity: number | undefined): number | undefined {
  if (capacity === undefined) return undefined;
  
  if (typeof capacity !== "number" || isNaN(capacity)) {
    throw new ConvexError("Capacity must be a valid number");
  }

  if (capacity < 1) {
    throw new ConvexError("Capacity must be at least 1");
  }

  if (capacity > 10000) {
    throw new ConvexError("Capacity cannot exceed 10,000");
  }

  if (!Number.isInteger(capacity)) {
    throw new ConvexError("Capacity must be a whole number");
  }

  return capacity;
}

/**
 * Generate a slug from a name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s\-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}