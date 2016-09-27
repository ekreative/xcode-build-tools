'use strict';

const fetch = require('node-fetch'),
    winston = require('winston'),
    moment = require('moment');

module.exports = (slackHook, slackChannel) => {
    return res => {
        return res.json()
            .then(json => {
                return fetch(slackHook, {
                    method: 'POST',
                    body: JSON.stringify({
                        attachments: [
                            {
                                fallback: `Uploaded ${json.name} to TestBuild.rocks`,
                                pretext: `Uploaded ${json.name} to TestBuild.rocks`,
                                title: json.name,
                                title_link: json.install,
                                color: 'good',
                                fields: [
                                    {
                                        title: 'Version',
                                        value: json.version,
                                        short: true
                                    },
                                    {
                                        title: 'Build#',
                                        value: json.build,
                                        short: true
                                    },
                                    {
                                        title: 'Platform',
                                        value: json.type,
                                        short: true
                                    },
                                    {
                                        title: 'Date',
                                        value: moment.unix(json.date).format('llll'),
                                        short: true
                                    },
                                    {
                                        title: 'Comment',
                                        value: json.comment
                                    }
                                ],
                                image_url: json.qrcode,
                                thumb_url: json.iconurl
                            }
                        ],
                        channel: slackChannel
                    })
                })
            })
            .then(res => {
                if (res.status == 200) {
                    winston.info('Sent to Slack');
                    return;
                }
                return res.text().then((body) => {
                    throw new Error(`Failed to send to slack (${slackHook}, ${slackChannel}) [${body}]`);
                });
            });
    };
};
