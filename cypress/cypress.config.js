const { defineConfig } = require("cypress");

module.exports = defineConfig({
  allowCypressEnv: false,

  e2e: {
      baseUrl: 'http://localhost:3000/',
      watchForFileChanges: false,
      screenshotOnRunFailure: false,
      video: false
    },
});
