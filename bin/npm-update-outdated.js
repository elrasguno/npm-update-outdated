#!/usr/bin/env node

'use strict';

var commander = require('commander'),
    exec      = require('child_process').exec,
    when      = require('when'),
    nodefn    = require('when/node'),
    pExec     = nodefn.lift(exec),
    pkg       = require('../package.json');

var NPMUdateOutdated = require('../lib/NPMUpdateOutdated.js');
var updater = new NPMUdateOutdated();

commander.version(pkg.version)
    .option('--filter <string|regex>', 'filter packages to be updated by string or regex', updater.SetFilter.bind(updater))
    //.option('-y', 'disable confirmation prompts and auto-update modules', updater.SetAutoUpdate.bind(updater, true))
    .option('--missing', 'install missing modules', updater.SetInstallMissing.bind(updater, true))
    .usage('[options]')
    .parse(process.argv);

pExec('npm outdated --parseable')
    .then(main)
    .catch(function(err)
    {
        console.error('npm outdated command failed');
        console.error(err);
        process.exit(1);
    });

function main(data)
{
    if (data && data.length)
    {
        updater.Load(data[0]);

        var outdated = updater.GetOutdated();

        updater.UpdateOutdated(outdated);

        updater.on('outdated_end', function()
        {
            updater.InstallMissing();
        })
        updater.on('missing_end', function()
        {
            console.log('All done!');
            process.exit(0);
        })
        .on('error', function(err)
        {
            process.exit(1);
        });
    }
    else
    {
        process.exit(0);
    }
}