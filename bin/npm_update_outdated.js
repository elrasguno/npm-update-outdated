#!/usr/local/bin/node

process.stdin.setEncoding('utf8');

var data = '';
process.stdin.on('readable', function() {
    var chunk = process.stdin.read();
    if (chunk !== null) {
        data += chunk;
    }
});

process.stdin.on('end', function() {
    main(data);
});

var NPMUdateOutdated = require('../lib/NPMUpdateOutdated.js');

function main(data)
{
    var updater = new NPMUdateOutdated();
    updater.Load(data);

    var outdated = updater.GetOutdated();

    updater.UpdateOutdated(outdated);

    updater.on('end', function()
    {
        process.exit(0);
    })
    .on('error', function(err)
    {
        process.exit(1);
    });
}
