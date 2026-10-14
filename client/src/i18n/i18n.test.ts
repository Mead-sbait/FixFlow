import { describe, expect, it } from 'vitest'
import { ar } from './ar'
import { en } from './en'
import { he } from './he'
import { dirFor, translate } from './index'

const others = { he, ar }

describe('translations', () => {
  it('every language has every english key and nothing extra', () => {
    const enKeys = Object.keys(en).sort()
    for (const [name, dict] of Object.entries(others)) {
      expect(Object.keys(dict).sort(), name).toEqual(enKeys)
    }
  })

  it('no translation is empty', () => {
    for (const [name, dict] of Object.entries(others)) {
      for (const [key, value] of Object.entries(dict)) {
        expect(value.trim(), `${name}.${key}`).not.toBe('')
      }
    }
  })

  it('placeholders match between languages', () => {
    const holes = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort()
    for (const [name, dict] of Object.entries(others)) {
      for (const key of Object.keys(en) as (keyof typeof en)[]) {
        expect(holes(dict[key]), `${name}.${key}`).toEqual(holes(en[key]))
      }
    }
  })

  it('fills placeholders', () => {
    expect(translate('en', 'common.pageOf', { page: 2, pages: 5 })).toBe('Page 2 of 5')
    expect(translate('he', 'common.by', { name: 'נורה' })).toBe('מאת נורה')
    expect(translate('ar', 'common.by', { name: 'نورا' })).toBe('بواسطة نورا')
  })

  it('hebrew and arabic read right to left', () => {
    expect(dirFor('en')).toBe('ltr')
    expect(dirFor('he')).toBe('rtl')
    expect(dirFor('ar')).toBe('rtl')
  })
})
