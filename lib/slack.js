'use strict';

var fetch = require('node-fetch'),
    winston = require('winston'),
    moment = require('moment');

module.exports = function (slackHook, slackChannel) {
    return function (res) {
        return res.json()
            .then(function (json) {
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
                };

                if (json.appServer) {
                    data.attachments[0].fields.push({
                        title: 'Server',
                        value: json.appServer
                    });
                }

                var reqBody = JSON.stringify();
                return fetch(slackHook, {
                    method: 'POST',
                    body: reqBody
                }).then(function (res) {
                    return { res: res, reqBody: reqBody };
                });
            }).then(function (_ref) {
                var res = _ref.res;
                var reqBody = _ref.reqBody;

                if (res.status == 200) {
                    winston.info('Sent to Slack');
                    return;
                }
                return res.text().then(function (body) {
                    throw new Error('Failed to send to slack (' + slackHook + ', ' + slackChannel + ') [' + body + '] [' + reqBody + ']');
                });
            });
    };
};
