/**
 * Test fixtures for Roof Scout E2E tests
 * Provides consistent test data across all test suites
 */

export const TEST_DATA = {
  // Lead test data
  leads: [
    {
      address: '123 Main Street, Anytown, NY 10001',
      homeownerName: 'John Doe',
      phone: '555-123-4567',
      email: 'john.doe@example.com',
      roofAge: '10-15 years',
      roofMaterial: 'Asphalt Shingle',
      visibleDamage: 'Some missing shingles',
      notes: 'Interested in learning more about roof replacement',
      priority: 'High',
      status: 'Not Visited',
    },
    {
      address: '456 Oak Avenue, Somewhere, CA 90210',
      homeownerName: 'Jane Smith',
      phone: '555-987-6543',
      email: 'jane.smith@example.com',
      roofAge: '20+ years',
      roofMaterial: 'Metal',
      visibleDamage: 'Storm damage visible',
      notes: 'Has insurance claim pending',
      priority: 'High',
      status: 'Interested',
    },
    {
      address: '789 Elm Street, Nowhere, TX 77001',
      homeownerName: 'Bob Johnson',
      phone: '555-456-7890',
      email: 'bob.johnson@example.com',
      roofAge: '5-10 years',
      roofMaterial: 'Tile',
      visibleDamage: 'Minor wear',
      notes: 'Just wants a quote',
      priority: 'Medium',
      status: 'Not Interested',
    },
  ],

  // Session test data
  sessions: [
    {
      name: 'Test Session 1',
    },
    {
      name: 'Morning Canvass',
    },
    {
      name: 'Weekend Route',
    },
  ],

  // Search queries
  searchQueries: [
    'Main Street',
    'Jane Smith',
    'interested',
    'Asphalt',
  ],

  // Chatbot queries
  chatbotQueries: [
    'What can you tell me about this property?',
    'How should I approach this homeowner?',
    'Generate a sales pitch for this lead',
    'Tell me about roof damage in this area',
  ],
};

/**
 * Generate a unique lead with timestamp
 */
export function generateUniqueLead(overrides: Partial<typeof TEST_DATA.leads[0]> = {}): typeof TEST_DATA.leads[0] {
  const timestamp = Date.now();
  const baseLead = TEST_DATA.leads[0];

  return {
    address: `${baseLead.address} - ${timestamp}`,
    homeownerName: baseLead.homeownerName,
    phone: `555-${timestamp.toString().slice(-7)}`,
    email: `test${timestamp}@example.com`,
    roofAge: baseLead.roofAge,
    roofMaterial: baseLead.roofMaterial,
    visibleDamage: baseLead.visibleDamage,
    notes: baseLead.notes,
    priority: baseLead.priority,
    status: baseLead.status,
    ...overrides,
  };
}

/**
 * Sample image data for testing uploads
 */
export const TEST_IMAGES = {
  // Small test image (1x1 pixel PNG)
  small: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
};

/**
 * Expected roof scores for testing
 */
export const EXPECTED_ROOF_SCORES = {
  GOOD: { min: 70, max: 100 },
  FAIR: { min: 40, max: 69 },
  POOR: { min: 0, max: 39 },
};
