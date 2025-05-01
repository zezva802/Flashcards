module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
    },
    moduleNameMapper: {
      '^@logic/(.*)$': '<rootDir>/logic/$1',
      '^@/(.*)$': '<rootDir>/$1',
    },
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    verbose: true,
  };