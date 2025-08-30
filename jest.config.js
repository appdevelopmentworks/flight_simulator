const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Next.js アプリのパスを指定
  dir: './',
})

// Jestの設定を追加
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Next.jsのpathマッピングに対応
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.{js,ts}',
  ],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  // Three.jsのES6モジュールを変換
  transformIgnorePatterns: [
    '/node_modules/(?!(three|@react-three)/)',
  ],
}

// createJestConfigはasync関数なので、設定をNext.jsのプロパティと結合して返す
module.exports = createJestConfig(customJestConfig)