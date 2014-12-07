var exec = require('child_process').exec,
    events = require('events'),
    util = require('util');

function NPMUdateOutdated() 
{
    this.modules = {};
    this.outdated = {};
    this.format = 'parseable';
    this.update_to = 'wanted';
    this.auto_update = false;
    this.args = [];

    _parseParseableInput = _parseParseableInput.bind(this);
    _parseArgs = _parseArgs.bind(this);
}

util.inherits(NPMUdateOutdated, events.EventEmitter);

NPMUdateOutdated.prototype.Load = function(mods)
{
    try {
        this.modules = _parseParseableInput(mods);
        _parseArgs();
    } catch (e) {
        throw new Error('Failed to parse input data: ' + e.stack);
    }
};

NPMUdateOutdated.prototype.Length = function()
{
    return Object.keys(this.modules).length;
};

NPMUdateOutdated.prototype.GetOutdated = function(filter, options)
{
    var mods = this.modules,
        update_to,
        depth,
        pattern,
        filter = filter || this.filter,
        result = {};

    // Update this.update_to if options.update_to is either "wanted" or "latest"
    if (options && options.hasOwnProperty('update_to'))
    {
        if (['wanted', 'latest'].indexOf(options.update_to) !== -1)
        {
            this.update_to = options.update_to;
        }
    }
    
    if (filter)
    {
        pattern = new RegExp(filter);
    }

    for (var mod in mods)
    {
        if (!pattern || (pattern.test(mod)))
        {
            depth = mods[mod].location.split('/').length;
            if ((!mods[mod].current || 
                mods[mod].current !== mods[mod][this.update_to]) && 
                depth === 2)
            {
                result[mod] = mods[mod];
            }
        }
    }

    return result;
};

NPMUdateOutdated.prototype.InstallMissing = function(mods, options)
{
    for (mod in mods)
    {
        if (!mods[mod].current)
        {
            // MISSING Module
            wanted = mod + '@' + mods[mod].wanted;
            console.log('Installing MISSING module ' + wanted);
            exec('npm install ' + wanted, function(error, stdout, stderr)
            {
                if (!error)
                {
                    console.log(stdout);
                }
            });
        }
    }
};

NPMUdateOutdated.prototype.UpdateOutdated = function(mods, options)
{
    var that = this,
        current, wanted, latest,
        complete = 0, total = 0,
        modsLen;

    if (!mods || mods.constructor !== Object )
    {
        console.log('Invalid or empty input: ' + JSON.stringify(mods));
        return;
    }

    if ((modsLen = Object.keys(mods).length) === 0)
    {
        console.log('All your NPM modules are up to date. You rule!');
        return;
    }

    total = modsLen;

    for (mod in mods)
    {
        if (!mods[mod].current)
        {
            // Decrement total; These are the "MISSING" modules.
            total--;
        }
        else
        {
            current = mod + '@' + mods[mod].current;
            wanted = mod + '@' + mods[mod].wanted;
            process.stdout.write('Updating from ' + current + ' to ' + wanted + ' ... ');
            exec('npm update ' + mod, function(error, stdout, stderr)
            {
                if (!error)
                {
                    console.log('OK!');
                }
                else
                {
                    console.error('OH NOES!');
                    console.error(stderr);
                }

                complete++;

                if (complete === total)
                {
                    console.log('# All done!');
                    that.emit('end');
                }
            });
        }
    }
};

/*********************************************************/
/* private methods

/**
 * Parse this.parseableInput i.e. the format produced by running "npm outdated --parseable"
 * e.g. 
 * /usr/local/lib/node_modules/istanbul/node_modules/escodegen:escodegen@1.3.3:escodegen@1.3.2:escodegen@1.4.1
 *
 *
 */
function _parseParseableInput(input, isGlobal)
{
    var lines = input.split("\n"),
        mods = {},
        mod,
        modStr,
        split,
        splitVersions,
        global = isGlobal || false;
    
    lines.forEach(function(line)
    {
        if (line.length)
        {
            modStr = line.split(process.cwd() + '/node_modules/').pop();
            // This version only supports modules in the top-level node_modules
            // directory, and not sub modules
            console.log('modStr', modStr);
            if (modStr.indexOf('node_modules') === -1)
            {
                mod = new Version().SetFromParseableString(modStr);
                mods[mod.name] = mod;
            }
        }
    });

    return mods;
}

function _parseArgs ()
{
    var len, i;
    if (process.argv.length > 2)
    {
        this.args = [].slice.call(process.argv, 2);
        len = this.args.length;
    }

    for (i = 0; i < len; i++)
    {
        switch(this.args[i])
        {
            case '--help':
                _printHelp();
                break;
            case '--filter':
                this.filter = this.args[i+1];
                break;
            case '--latest':
                this.update_to = 'latest';
                break;
            case '-y':
                this.auto_updates = true;
                break;
        }
    }
}

function _printHelp()
{
    console.log('########################################################');
    console.log('# HELP!');
    console.log('########################################################');
    process.exit(0);
}
/*********************************************************/


function Version()
{
    this.name    = null;
    this.location = null;
    this.wanted  = 0;
    this.current = 0;
    this.latest  = 0;

    //return this;
}

Version.prototype.SetFromParseableString = function(str)
{
    var split;

    if (str && str.length > 0 && str.indexOf(':') !== -1)
    {
        split = str.split(':');

        this.SetName(split[0])
            .SetLocation('node_modules/' + split[0])
            .SetWanted(split[1].split('@').pop())
            .SetCurrent(split[2].split('@').pop())
            .SetLatest(split[3].split('@').pop());
    }
    
    return this;
};

Version.prototype.SetFromObject = function(mod)
{

};

Version.prototype.SetName = function(v)
{
    this.name = v;
    return this;
};

Version.prototype.SetLocation = function(v)
{
    this.location = v;
    return this;
};

Version.prototype.SetWanted = function(v)
{
    if (!isNaN(v))
    {
        throw new Error('SetWanted expects a number');
    }

    this.wanted = v;

    return this;
};

Version.prototype.SetCurrent = function(v)
{
    if (!isNaN(v))
    {
        throw new Error('SetCurrent expects a number');
    }

    this.current = v;

    return this;
};

Version.prototype.SetLatest = function(v)
{
    if (!isNaN(v))
    {
        throw new Error('SetLatest expects a number');
    }

    this.latest = v;

    return this;
};

module.exports = NPMUdateOutdated;
