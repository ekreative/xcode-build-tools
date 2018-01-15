'use strict'

var execSync = require('child_process').execSync

module.exports.commit = function () {
  return ('' + execSync('git log --format=%B -n 1 || echo "No comment"')).trim()
}

module.exports.ref = function () {
  return ('' + execSync('git rev-parse HEAD')).trim()
}

module.exports.branch = function () {
  return ('' + execSync('git symbolic-ref --quiet --short HEAD || git rev-parse --short HEAD')).trim()
}
