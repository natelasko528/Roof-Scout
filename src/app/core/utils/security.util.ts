import DOMPurify from 'dompurify';

/**
 * Security utility for sanitizing HTML content to prevent XSS attacks
 */
export class SecurityUtil {
  private static sanitizer = DOMPurify;

  /**
   * Sanitizes HTML content by removing potentially dangerous scripts and attributes
   * @param dirty - Raw HTML string that may contain malicious content
   * @returns Sanitized HTML string safe for use with innerHTML
   */
  static sanitizeHtml(dirty: string | null | undefined): string {
    if (!dirty) {
      return '';
    }

    return this.sanitizer.sanitize(dirty, {
      ALLOWED_TAGS: [
        'p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'br',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
        'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'mark', 'del', 'ins', 'sub', 'sup'
      ],
      ALLOWED_ATTR: [
        'href', 'title', 'class', 'id', 'target', 'rel'
      ],
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: [
        'script', 'style', 'iframe', 'object', 'embed', 'link', 'meta',
        'form', 'input', 'button', 'select', 'textarea'
      ],
      FORBID_ATTR: [
        'onclick', 'onload', 'onerror', 'onmouseover', 'onfocus',
        'onblur', 'onchange', 'onsubmit', 'onreset', 'onkeydown',
        'onkeypress', 'onkeyup', 'onmousedown', 'onmouseup',
        'onmousemove', 'style', 'src'
      ],
      KEEP_CONTENT: true
    });
  }

  /**
   * Sanitizes plain text input (removes HTML tags)
   * @param input - Raw text input that may contain HTML
   * @returns Plain text string with all HTML removed
   */
  static sanitizeText(input: string | null | undefined): string {
    if (!input) {
      return '';
    }

    // First remove any HTML tags, then sanitize
    const withoutTags = input.replace(/<[^>]*>/g, '');
    return this.sanitizer.sanitize(withoutTags);
  }

  /**
   * Sanitizes a URL to ensure it's safe
   * @param url - URL string that may be malicious
   * @returns Sanitized URL safe for use in href or src attributes
   */
  static sanitizeUrl(url: string | null | undefined): string {
    if (!url) {
      return '';
    }

    // Only allow http, https, and mailto protocols
    const sanitized = this.sanitizer.sanitize(url, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      ALLOW_DATA_ATTR: false
    });

    // Additional check for dangerous protocols
    const dangerousProtocols = /^(javascript|vbscript|data):/i;
    if (dangerousProtocols.test(sanitized)) {
      return '';
    }

    return sanitized;
  }

  /**
   * Validates that a string contains only allowed characters
   * @param input - String to validate
   * @param allowedPattern - Regex pattern of allowed characters (default: alphanumeric, spaces, basic punctuation)
   * @returns true if input contains only allowed characters
   */
  static validateInput(input: string | null | undefined, allowedPattern: RegExp = /^[a-zA-Z0-9\s\-_.,!?@#$%&*()+\/\\]*$/): boolean {
    if (!input) {
      return true; // Empty is valid
    }
    return allowedPattern.test(input);
  }
}
