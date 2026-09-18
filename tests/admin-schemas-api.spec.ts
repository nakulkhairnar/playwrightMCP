import { test, expect } from '@playwright/test';

// ── Configuration ──────────────────────────────────────────────────────────────
const BASE_URL = 'http://192.168.10.190:3001';
const SCHEMAS_ENDPOINT = `${BASE_URL}/api/v1.0/admin/schemas`;
const AUTH_CREDENTIALS = {
  username: 'PS10@vgos.org',
  password: 'e=K=}Uv5cf+Mu5!06N',
};

// ── JSON Schema for optional deep validation ───────────────────────────────────
// Each schema object is expected to conform to this shape.
const schemaItemShape = {
  type: 'object',
  required: ['id', 'title', 'header'],
  properties: {
    id: { type: ['string', 'number'] },
    title: { type: 'string' },
    header: { type: ['string', 'object', 'array'] },
  },
};

/**
 * Lightweight JSON-schema validator that checks `type` and `required` fields.
 * Returns an array of error strings (empty = valid).
 */
function validateJsonSchema(
  data: unknown,
  schema: typeof schemaItemShape
): string[] {
  const errors: string[] = [];

  if (schema.type === 'object' && (typeof data !== 'object' || data === null || Array.isArray(data))) {
    errors.push(`Expected an object but got ${typeof data}`);
    return errors;
  }

  const record = data as Record<string, unknown>;

  // Check required keys
  for (const key of schema.required) {
    if (!(key in record)) {
      errors.push(`Missing required key: "${key}"`);
    }
  }

  // Check property types
  for (const [key, rule] of Object.entries(schema.properties)) {
    if (key in record) {
      const allowedTypes = Array.isArray((rule as any).type)
        ? (rule as any).type
        : [(rule as any).type];
      const actualType = Array.isArray(record[key]) ? 'array' : typeof record[key];
      if (!allowedTypes.includes(actualType)) {
        errors.push(
          `Key "${key}" expected type [${allowedTypes.join('|')}] but got "${actualType}"`
        );
      }
    }
  }

  return errors;
}

// ── Test Suite ──────────────────────────────────────────────────────────────────
test.describe('Admin Schemas API – GET /api/v1.0/admin/schemas', () => {
  let authToken: string;

  // Authenticate once before all tests and store the token / cookie
  test.beforeAll(async ({ request }) => {
    // Attempt login — adjust the login endpoint & payload to match your API.
    // Common patterns are shown below; uncomment / edit whichever fits.
    const loginResponse = await request.post(`${BASE_URL}/api/v1.0/admin/login`, {
      data: {
        username: AUTH_CREDENTIALS.username,
        password: AUTH_CREDENTIALS.password,
      },
    });

    expect(
      loginResponse.ok(),
      `Login failed with status ${loginResponse.status()}`
    ).toBeTruthy();

    const loginBody = await loginResponse.json();

    // Store the token — adapt the key name (token / accessToken / jwt) to your API
    authToken = loginBody.token ?? loginBody.accessToken ?? loginBody.jwt ?? '';
    console.log('✅ Authentication successful — token acquired');
  });

  // ── Test 1: Status 200 ─────────────────────────────────────────────────────
  test('GET /schemas returns status 200', async ({ request }) => {
    const response = await request.get(SCHEMAS_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);
    console.log(`✅ Response status: ${response.status()}`);
  });

  // ── Test 2: Response contains required keys (id, title, header) ────────────
  test('Response contains required keys: id, title, header', async ({ request }) => {
    const response = await request.get(SCHEMAS_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();

    const body = await response.json();

    // The response may be an array of schemas or wrapped in a data key
    const schemas: any[] = Array.isArray(body) ? body : body.data ?? body.schemas ?? [];

    expect(schemas.length).toBeGreaterThan(0);

    // Validate required keys on every schema item
    for (const [index, schema] of schemas.entries()) {
      expect(schema, `Schema at index ${index} should have "id"`).toHaveProperty('id');
      expect(schema, `Schema at index ${index} should have "title"`).toHaveProperty('title');
      expect(schema, `Schema at index ${index} should have "header"`).toHaveProperty('header');
    }

    console.log(`✅ All ${schemas.length} schema(s) contain required keys`);
  });

  // ── Test 3: JSON Schema validation (optional / deeper check) ───────────────
  test('Each schema item conforms to the expected JSON schema', async ({ request }) => {
    const response = await request.get(SCHEMAS_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const body = await response.json();
    const schemas: any[] = Array.isArray(body) ? body : body.data ?? body.schemas ?? [];

    for (const [index, item] of schemas.entries()) {
      const errors = validateJsonSchema(item, schemaItemShape);
      expect(
        errors,
        `Schema item [${index}] validation errors:\n${errors.join('\n')}`
      ).toHaveLength(0);
    }

    console.log(`✅ JSON schema validation passed for ${schemas.length} item(s)`);
  });

  // ── Test 4: Log schemas list & count ───────────────────────────────────────
  test('Log the list of schemas and total count', async ({ request }) => {
    const response = await request.get(SCHEMAS_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const body = await response.json();
    const schemas: any[] = Array.isArray(body) ? body : body.data ?? body.schemas ?? [];

    console.log('──────────────────────────────────────────────────');
    console.log(`📋 Total schemas count: ${schemas.length}`);
    console.log('──────────────────────────────────────────────────');
    schemas.forEach((schema, i) => {
      console.log(
        `  [${i + 1}] id: ${schema.id} | title: ${schema.title}`
      );
    });
    console.log('──────────────────────────────────────────────────');

    // Soft assertion — at least one schema should exist
    expect(schemas.length).toBeGreaterThan(0);
  });
});
