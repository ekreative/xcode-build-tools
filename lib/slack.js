'use strict'

var fetch = require('node-fetch')
var winston = require('winston')
var moment = require('moment')

module.exports = function (slackHook, slackChannel, projectUrl) {
  return function (json) {
    var data = {
      attachments: [{
        fallback: 'Uploaded ' + json.name + ' to TestBuild.rocks',
        pretext: 'Uploaded ' + json.name + ' to TestBuild.rocks',
        title: json.name,
        title_link: json.install,
        color: 'good',
        fields: [{
          title: 'Version',
          value: '' + json.version,
          short: true
        }, {
          title: 'Build',
          value: projectUrl ? '<' + projectUrl + '/-/jobs/' + json.build + '|' + json.build + '>' : '' + json.build,
          short: true
        }, {
          title: 'Platform',
          value: json.type,
          short: true
        }, {
          title: 'Date',
          value: moment.unix(json.date).format('llll'),
          short: true
        }],
        thumb_url: json.qrcode
      }],
      channel: slackChannel
    }

    if (json.iconurl) {
      data.image_url = json.iconurl
    }

    if (json.appServer) {
      data.attachments[0].fields.push({
        title: 'Server',
        value: json.appServer,
        short: true
      })
    }

    if (json.ref) {
      data.attachments[0].fields.push({
        title: 'Git Ref',
        value: projectUrl ? '<' + projectUrl + '/tree/' + json.ref + '|' + json.ref + '>' : json.ref,
        short: true
      })
    }

    if (json.commit) {
      data.attachments[0].fields.push({
        title: 'Git Commit',
        value: projectUrl ? '<' + projectUrl + '/commit/' + json.commit + '|' + json.commit + '>' : json.commit,
        short: true
      })
    }

    if (json.comment) {
      data.attachments[0].fields.push({
        title: 'Comment',
        value: json.comment
      })
    }

    var reqBody = JSON.stringify(data)
    return fetch(slackHook, {
      method: 'POST',
      body: reqBody
    })
      .then(function (res) {
        if (res.status === 200) {
          winston.info('Sent to Slack')
          return
        }
        return res.text().then(function (body) {
          throw new Error('Failed to send to slack (' + slackHook + ', ' + slackChannel + ') [' + body + '] [' + reqBody + ']')
        })
      })
  }
}
