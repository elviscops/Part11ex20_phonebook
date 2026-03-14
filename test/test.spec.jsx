const { test, describe, expect } = require('@playwright/test')

const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3003'

const buildContact = (overrides = {}) => {
  const unique = `${Date.now()}${Math.floor(Math.random() * 1000)}`

  return {
    name: `API User ${unique}`,
    number: `040-${unique.slice(-7)}`,
    ...overrides,
  }
}

const createContact = async (request, overrides = {}) => {
  const payload = buildContact(overrides)
  const response = await request.post(`${baseUrl}/api/persons`, {
    data: payload,
  })

  expect(response.status()).toBe(200)

  const body = await response.json()

  return {
    payload,
    body,
    id: body.id || body._id,
  }
}

const removeContact = async (request, id) => {
  if (!id) return
  await request.delete(`${baseUrl}/api/persons/${id}`)
}

describe('Phonebook API', () => {
  test('GET /api/persons returns contacts as JSON', async ({ request }) => {
    const response = await request.get(`${baseUrl}/api/persons`)

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('application/json')

    const body = await response.json()
    expect(Array.isArray(body)).toBeTruthy()
  })

  test('GET /info returns phonebook info as HTML', async ({ request }) => {
    const response = await request.get(`${baseUrl}/info`)

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('text/html')

    const body = await response.text()
    expect(body).toContain('Phone book has info for')
  })

  test('POST /api/persons creates a new contact', async ({ request }) => {
    const created = await createContact(request)

    try {
      expect(created.body.name).toBe(created.payload.name)
      expect(created.body.number).toBe(created.payload.number)
      expect(created.id).toBeTruthy()
    } finally {
      await removeContact(request, created.id)
    }
  })

  test('POST /api/persons returns 400 if content is missing', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/persons`, {
      data: { name: 'Missing Number' },
    })

    expect(response.status()).toBe(400)

    const body = await response.json()
    expect(body.error).toBe('content missing')
  })

  test('GET /api/persons/:id returns one contact', async ({ request }) => {
    const created = await createContact(request)

    try {
      const response = await request.get(`${baseUrl}/api/persons/${created.id}`)

      expect(response.status()).toBe(200)
      expect(response.headers()['content-type']).toContain('application/json')

      const body = await response.json()
      expect(body.name).toBe(created.payload.name)
      expect(body.number).toBe(created.payload.number)
    } finally {
      await removeContact(request, created.id)
    }
  })

  test('GET /api/persons/:id returns 400 for malformed id', async ({ request }) => {
    const response = await request.get(`${baseUrl}/api/persons/not-a-valid-id`)

    expect(response.status()).toBe(400)

    const body = await response.json()
    expect(body.error).toBe('malformatted id')
  })

  test('PUT /api/persons/:id updates a contact', async ({ request }) => {
    const created = await createContact(request)

    try {
      const updates = {
        name: `${created.payload.name} Updated`,
        number: '050-7654321',
      }

      const response = await request.put(`${baseUrl}/api/persons/${created.id}`, {
        data: updates,
      })

      expect(response.status()).toBe(200)

      const body = await response.json()
      expect(body.name).toBe(updates.name)
      expect(body.number).toBe(updates.number)
    } finally {
      await removeContact(request, created.id)
    }
  })

  test('DELETE /api/persons/:id removes a contact', async ({ request }) => {
    const created = await createContact(request)

    const deleteResponse = await request.delete(`${baseUrl}/api/persons/${created.id}`)
    expect(deleteResponse.status()).toBe(204)

    const getResponse = await request.get(`${baseUrl}/api/persons/${created.id}`)
    expect(getResponse.status()).toBe(404)
  })

  test('unknown endpoint returns 404', async ({ request }) => {
    const response = await request.get(`${baseUrl}/api/unknown-endpoint`)

    expect(response.status()).toBe(404)

    const body = await response.json()
    expect(body.error).toBe('unknown endpoint')
  })
})