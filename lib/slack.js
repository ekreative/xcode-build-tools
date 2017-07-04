'use strict'

var fetch = require('node-fetch')
var winston = require('winston')
var moment = require('moment')

module.exports = function (slackHook, slackChannel) {
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
          title: 'Build#',
          value: '' + json.build,
          short: true
        }, {
          title: 'Platform',
          value: json.type,
          short: true
        }, {
          title: 'Date',
          value: moment.unix(json.date).format('llll'),
          short: true
        }, {
          title: 'Comment',
          value: json.comment
        }],
        image_url: json.qrcode,
        thumb_url: json.iconurl
      }],
      channel: slackChannel
    }

    if (json.appServer) {
      data.attachments[0].fields.push({
        title: 'Server',
        value: json.appServer
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
