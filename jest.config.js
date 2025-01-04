// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // This line tells Jest to load .env variables before running tests.
  // If you also have a setupEnv.ts, add it here too:
  setupFiles: [
    'dotenv/config',
    '<rootDir>/test/setupEnv.ts',
  ],
};