module.exports = {
  testEnvironment: 'jsdom',
  // babel-jest@23 uses babel-core v6, which is already in devDependencies.
  // The transform inherits .babelrc; the "test" env there enables CommonJS.
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  moduleNameMapper: {
    // Strip webpack's raw-loader! prefix so Jest can resolve the file.
    '^raw-loader!(.*)$': '<rootDir>/src/__tests__/mocks/rawLoaderMock.js',
  },
  testMatch: ['**/__tests__/**/*.test.js'],
};
