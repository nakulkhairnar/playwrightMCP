# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-schemas-api.spec.ts >> Admin Schemas API – GET /api/v1.0/admin/schemas >> GET /schemas returns status 200
- Location: tests\admin-schemas-api.spec.ts:93:7

# Error details

```
SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | // ── Configuration ──────────────────────────────────────────────────────────────
  4   | const BASE_URL = 'http://192.168.10.190:3001';
  5   | const SCHEMAS_ENDPOINT = `${BASE_URL}/api/v1.0/admin/schemas`;
  6   | const AUTH_CREDENTIALS = {
  7   |   username: 'PS10@vgos.org',
  8   |   password: 'e=K=}Uv5cf+Mu5!06N',
  9   | };
  10  | 
  11  | // ── JSON Schema for optional deep validation ───────────────────────────────────
  12  | // Each schema object is expected to conform to this shape.
  13  | const schemaItemShape = {
  14  |   type: 'object',
  15  |   required: ['id', 'title', 'header'],
  16  |   properties: {
  17  |     id: { type: ['string', 'number'] },
  18  |     title: { type: 'string' },
  19  |     header: { type: ['string', 'object', 'array'] },
  20  |   },
  21  | };
  22  | 
  23  | /**
  24  |  * Lightweight JSON-schema validator that checks `type` and `required` fields.
  25  |  * Returns an array of error strings (empty = valid).
  26  |  */
  27  | function validateJsonSchema(
  28  |   data: unknown,
  29  |   schema: typeof schemaItemShape
  30  | ): string[] {
  31  |   const errors: string[] = [];
  32  | 
  33  |   if (schema.type === 'object' && (typeof data !== 'object' || data === null || Array.isArray(data))) {
  34  |     errors.push(`Expected an object but got ${typeof data}`);
  35  |     return errors;
  36  |   }
  37  | 
  38  |   const record = data as Record<string, unknown>;
  39  | 
  40  |   // Check required keys
  41  |   for (const key of schema.required) {
  42  |     if (!(key in record)) {
  43  |       errors.push(`Missing required key: "${key}"`);
  44  |     }
  45  |   }
  46  | 
  47  |   // Check property types
  48  |   for (const [key, rule] of Object.entries(schema.properties)) {
  49  |     if (key in record) {
  50  |       const allowedTypes = Array.isArray((rule as any).type)
  51  |         ? (rule as any).type
  52  |         : [(rule as any).type];
  53  |       const actualType = Array.isArray(record[key]) ? 'array' : typeof record[key];
  54  |       if (!allowedTypes.includes(actualType)) {
  55  |         errors.push(
  56  |           `Key "${key}" expected type [${allowedTypes.join('|')}] but got "${actualType}"`
  57  |         );
  58  |       }
  59  |     }
  60  |   }
  61  | 
  62  |   return errors;
  63  | }
  64  | 
  65  | // ── Test Suite ──────────────────────────────────────────────────────────────────
  66  | test.describe('Admin Schemas API – GET /api/v1.0/admin/schemas', () => {
  67  |   let authToken: string;
  68  | 
  69  |   // Authenticate once before all tests and store the token / cookie
  70  |   test.beforeAll(async ({ request }) => {
  71  |     // Attempt login — adjust the login endpoint & payload to match your API.
  72  |     // Common patterns are shown below; uncomment / edit whichever fits.
  73  |     const loginResponse = await request.post(`${BASE_URL}/api/v1.0/admin/login`, {
  74  |       data: {
  75  |         username: AUTH_CREDENTIALS.username,
  76  |         password: AUTH_CREDENTIALS.password,
  77  |       },
  78  |     });
  79  | 
  80  |     expect(
  81  |       loginResponse.ok(),
  82  |       `Login failed with status ${loginResponse.status()}`
  83  |     ).toBeTruthy();
  84  | 
> 85  |     const loginBody = await loginResponse.json();
      |                       ^ SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
  86  | 
  87  |     // Store the token — adapt the key name (token / accessToken / jwt) to your API
  88  |     authToken = loginBody.token ?? loginBody.accessToken ?? loginBody.jwt ?? '';
  89  |     console.log('✅ Authentication successful — token acquired');
  90  |   });
  91  | 
  92  |   // ── Test 1: Status 200 ─────────────────────────────────────────────────────
  93  |   test('GET /schemas returns status 200', async ({ request }) => {
  94  |     const response = await request.get(SCHEMAS_ENDPOINT, {
  95  |       headers: {
  96  |         Authorization: `Bearer ${authToken}`,
  97  |       },
  98  |     });
  99  | 
  100 |     expect(response.status()).toBe(200);
  101 |     console.log(`✅ Response status: ${response.status()}`);
  102 |   });
  103 | 
  104 |   // ── Test 2: Response contains required keys (id, title, header) ────────────
  105 |   test('Response contains required keys: id, title, header', async ({ request }) => {
  106 |     const response = await request.get(SCHEMAS_ENDPOINT, {
  107 |       headers: {
  108 |         Authorization: `Bearer ${authToken}`,
  109 |       },
  110 |     });
  111 | 
  112 |     expect(response.ok()).toBeTruthy();
  113 | 
  114 |     const body = await response.json();
  115 | 
  116 |     // The response may be an array of schemas or wrapped in a data key
  117 |     const schemas: any[] = Array.isArray(body) ? body : body.data ?? body.schemas ?? [];
  118 | 
  119 |     expect(schemas.length).toBeGreaterThan(0);
  120 | 
  121 |     // Validate required keys on every schema item
  122 |     for (const [index, schema] of schemas.entries()) {
  123 |       expect(schema, `Schema at index ${index} should have "id"`).toHaveProperty('id');
  124 |       expect(schema, `Schema at index ${index} should have "title"`).toHaveProperty('title');
  125 |       expect(schema, `Schema at index ${index} should have "header"`).toHaveProperty('header');
  126 |     }
  127 | 
  128 |     console.log(`✅ All ${schemas.length} schema(s) contain required keys`);
  129 |   });
  130 | 
  131 |   // ── Test 3: JSON Schema validation (optional / deeper check) ───────────────
  132 |   test('Each schema item conforms to the expected JSON schema', async ({ request }) => {
  133 |     const response = await request.get(SCHEMAS_ENDPOINT, {
  134 |       headers: {
  135 |         Authorization: `Bearer ${authToken}`,
  136 |       },
  137 |     });
  138 | 
  139 |     const body = await response.json();
  140 |     const schemas: any[] = Array.isArray(body) ? body : body.data ?? body.schemas ?? [];
  141 | 
  142 |     for (const [index, item] of schemas.entries()) {
  143 |       const errors = validateJsonSchema(item, schemaItemShape);
  144 |       expect(
  145 |         errors,
  146 |         `Schema item [${index}] validation errors:\n${errors.join('\n')}`
  147 |       ).toHaveLength(0);
  148 |     }
  149 | 
  150 |     console.log(`✅ JSON schema validation passed for ${schemas.length} item(s)`);
  151 |   });
  152 | 
  153 |   // ── Test 4: Log schemas list & count ───────────────────────────────────────
  154 |   test('Log the list of schemas and total count', async ({ request }) => {
  155 |     const response = await request.get(SCHEMAS_ENDPOINT, {
  156 |       headers: {
  157 |         Authorization: `Bearer ${authToken}`,
  158 |       },
  159 |     });
  160 | 
  161 |     const body = await response.json();
  162 |     const schemas: any[] = Array.isArray(body) ? body : body.data ?? body.schemas ?? [];
  163 | 
  164 |     console.log('──────────────────────────────────────────────────');
  165 |     console.log(`📋 Total schemas count: ${schemas.length}`);
  166 |     console.log('──────────────────────────────────────────────────');
  167 |     schemas.forEach((schema, i) => {
  168 |       console.log(
  169 |         `  [${i + 1}] id: ${schema.id} | title: ${schema.title}`
  170 |       );
  171 |     });
  172 |     console.log('──────────────────────────────────────────────────');
  173 | 
  174 |     // Soft assertion — at least one schema should exist
  175 |     expect(schemas.length).toBeGreaterThan(0);
  176 |   });
  177 | });
  178 | 
```