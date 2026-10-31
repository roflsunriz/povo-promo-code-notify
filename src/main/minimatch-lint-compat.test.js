import { resolve } from 'node:path'
import { Linter } from 'eslint'
import importPlugin from 'eslint-plugin-import'
import react from 'eslint-plugin-react'
import { describe, expect, it } from 'vitest'

function lintConfig(rules) {
  return [
    {
      files: ['**/*.{js,jsx}'],
      languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        parserOptions: { ecmaFeatures: { jsx: true } }
      },
      plugins: { import: importPlugin, react },
      rules
    }
  ]
}

function verify(source, rules) {
  return new Linter().verify(source, lintConfig(rules), {
    filename: resolve('src/renderer/example.jsx')
  })
}

const orderRule = [
  'error',
  {
    groups: ['external'],
    pathGroups: [{ pattern: 'react-dom/**', group: 'external', position: 'before' }],
    pathGroupsExcludedImportTypes: []
  }
]

describe('minimatch互換のlintルール', () => {
  it('importの禁止パターンとブレース展開を判定する', () => {
    const messages = verify("import 'react-dom/client';\nimport 'react-dom/server';", {
      'import/no-internal-modules': ['error', { forbid: ['react-dom/{client,server}'] }]
    })
    expect(messages.map((message) => message.line)).toEqual([1, 2])
  })

  it('import順序のpathGroupsをglobで判定する', () => {
    const messages = verify("import React from 'react';\nimport Client from 'react-dom/client';", {
      'import/order': orderRule
    })
    expect(messages.some((message) => message.ruleId === 'import/order')).toBe(true)
  })

  it('import順序の自動修正でコメントを保持する', () => {
    const source =
      "import React from 'react'; // react note\nimport Client from 'react-dom/client';\n"
    const result = new Linter().verifyAndFix(source, lintConfig({ 'import/order': orderRule }), {
      filename: resolve('src/renderer/example.jsx')
    })
    expect(result.fixed).toBe(true)
    expect(result.output).toBe(
      "import Client from 'react-dom/client';\nimport React from 'react'; // react note\n"
    )
  })

  it('Reactコンポーネントの除外パターンをglobで判定する', () => {
    const source = 'const view = <Bad_component />;'
    const withoutIgnore = verify(source, { 'react/jsx-pascal-case': 'error' })
    const withIgnore = verify(source, {
      'react/jsx-pascal-case': ['error', { ignore: ['Bad_*'] }]
    })
    expect(withoutIgnore).toHaveLength(1)
    expect(withIgnore).toHaveLength(0)
  })

  it('隠しパスは通常のglob規則で除外する', () => {
    const messages = verify("import 'react-dom/.hidden';\nimport 'react-dom/client';", {
      'import/no-internal-modules': ['error', { forbid: ['react-dom/**'] }]
    })
    expect(messages.map((message) => message.line)).toEqual([2])
  })
})
