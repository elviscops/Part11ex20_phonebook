const { test, describe, expect } = require('@playwright/test')

const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3003'

const fillPersonForm = async (page, name, number) => {
  const form = page.locator('form').first()

  await form.locator('div').filter({ hasText: /^name:/i }).locator('input').fill(name)
  await form.locator('div').filter({ hasText: /^number:/i }).locator('input').fill(number)
}

describe('Phonebook app', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(baseUrl)
  })

  test('front page loads', async ({ page }) => {
    await expect(page.locator('form').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /add/i })).toBeVisible()
  })

  test('user can add a new contact', async ({ page }) => {
    const name = `E2E User ${Date.now()}`
    const number = '040-1234567'

    await fillPersonForm(page, name, number)
    await page.getByRole('button', { name: /add/i }).click()

    await page.reload()

    await expect(page.getByText(`${name}: ${number}`)).toBeVisible()
  })

  test('user can delete a contact', async ({ page }) => {
    const name = `E2E User ${Date.now()}`
    const number = '040-1234567'

    await fillPersonForm(page, name, number)
    await page.getByRole('button', { name: /add/i }).click()

    await page.reload()

    const contact = page.getByText(`${name}: ${number}`)
    await expect(contact).toBeVisible()

    const deleteButton = contact.locator('button').filter({ hasText: /delete/i })
    await deleteButton.click()

    await page.reload()

    await expect(contact).not.toBeVisible()
  })
})