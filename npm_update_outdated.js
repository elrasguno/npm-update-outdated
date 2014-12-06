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

var NPMUdateOutdated = require('./NPMUpdateOutdated.js');

function main(data)
{
    var updater = new NPMUdateOutdated();
    updater.Load(data);
    var outdated = updater.GetOutdated();
    console.log('outdated', outdated);
    updater.UpdateOutdated(outdated);
    //console.log('outdated', updater.GetOutdated('bars$'));
    process.exit(0);
}
