'use strict'

var execSync = require('child_process').execSync

module.exports = function () {
  return ('' + execSync('git log --format=%B -n 1 || echo "No comment"')).trim()
}
