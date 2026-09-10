import { beforeEach, describe, expect, it } from 'vitest'
import { readUiLocale, uiText, UI_LOCALE_STORAGE_KEY } from './i18n'

describe('UI localization contract', () => {
  beforeEach(() => window.localStorage.removeItem(UI_LOCALE_STORAGE_KEY))

  it('keeps English as the stable default and restores an explicit persisted locale', () => {
    expect(readUiLocale()).toBe('en')
    window.localStorage.setItem(UI_LOCALE_STORAGE_KEY, 'zh-CN')
    expect(readUiLocale()).toBe('zh-CN')
  })

  it('interpolates dynamic accessible labels from the selected locale', () => {
    expect(uiText('en', 'catalog.page', { page: 2, pages: 4 })).toBe('Page 2 of 4')
    expect(uiText('zh-CN', 'catalog.page', { page: 2, pages: 4 })).toBe('第 2 页，共 4 页')
    expect(uiText('zh-CN', 'request.configure', { name: 'Country Explorer' })).toBe('配置 Country Explorer')
    expect(uiText('zh-CN', 'detail.dialogLabel', { name: 'Live Weather' })).toBe('Live Weather 详情')
    expect(uiText('zh-CN', 'request.failedLabel', { type: 'rate-limit' })).toBe('请求失败：rate-limit')
    expect(uiText('zh-CN', 'request.errorTypeLabel', { type: 'rate-limit' })).toBe('错误类型：rate-limit')
    expect(uiText('zh-CN', 'request.responseReceived', { name: 'Country Explorer' })).toBe('已收到 Country Explorer 的实时响应。')
  })
})
