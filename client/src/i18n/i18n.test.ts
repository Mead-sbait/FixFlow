import { describe, expect, it, vi, afterEach } from 'vitest'
import { ar } from './ar'
import { he } from './he'
import { categoryText, localizedError, notificationText, dirFor, initialLang, isLang, languages, translate } from './index'

afterEach(() => vi.unstubAllGlobals())
describe('Arabic and Hebrew interface', () => {
  it('has complete translations with matching placeholders', () => {
    expect(Object.keys(he).sort()).toEqual(Object.keys(ar).sort())
    const holes = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort()
    for (const key of Object.keys(ar) as (keyof typeof ar)[]) {
      expect(he[key].trim(), key).not.toBe('')
      expect(holes(he[key]), key).toEqual(holes(ar[key]))
    }
  })
  it('only offers the two supported right-to-left languages', () => {
    expect(languages.map(item => item.code).sort()).toEqual(['ar', 'he'])
    expect(isLang('en')).toBe(false)
    expect(dirFor('ar')).toBe('rtl')
    expect(dirFor('he')).toBe('rtl')
  })
  it('replaces a saved English preference with the Arabic default', () => {
    vi.stubGlobal('localStorage', { getItem: () => 'en' })
    vi.stubGlobal('navigator', { language: 'en-US' })
    expect(initialLang()).toBe('ar')
  })
  it('keeps a saved supported preference', () => {
    vi.stubGlobal('localStorage', { getItem: () => 'he' })
    expect(initialLang()).toBe('he')
  })
  it('uses Hebrew browser preference when storage is unavailable', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked') } })
    vi.stubGlobal('navigator', { language: 'he-IL' })
    expect(initialLang()).toBe('he')
  })
  it('translates system data while preserving custom content', () => {
    expect(categoryText('he', 'الكهرباء')).toBe('חשמל')
    expect(categoryText('ar', 'Electrical')).toBe('الكهرباء')
    expect(categoryText('he', 'My custom category')).toBe('My custom category')
    expect(localizedError('ar', 'Email is already registered')).toBe(ar['err.emailUsed'])
    expect(localizedError('he', ar['err.emailUsed'])).toBe(he['err.emailUsed'])
    expect(notificationText('ar', { type: 'issue_assigned', message: 'You have been assigned to "Custom title"' })).toContain('Custom title')
    expect(notificationText('he', { type: 'issue_updated', message: 'Issue status changed to completed.' })).toBe(he['notif.completed'])
  })
  it('interpolates translated text', () => {
    expect(translate('ar', 'common.by', { name: 'نورا' })).toBe('بواسطة نورا')
    expect(translate('he', 'common.by', { name: 'נורה' })).toBe('מאת נורה')
  })
})
