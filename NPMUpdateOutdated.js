var exec = require('child_process').exec,
    events = require('events'),
    util = require('util');

function NPMUdateOutdated() 
{
    this.modules = {};
    this.outdated = {};
    this.update_to = 'wanted';
    this.auto_update = false;
    this.args = [];

    _parseArgs = _parseArgs.bind(this);
}

util.inherits(NPMUdateOutdated, events.EventEmitter);

NPMUdateOutdated.prototype.Load = function(mods)
{
    try {
        this.modules = JSON.parse(mods);
        _parseArgs();
    } catch (e) {
        throw new Error('Failed to parse input data: ' + e);
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
/*********************************************************/
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
    this.major = 0;
    this.minor = 0;
    this.patch = 0;
}

Version.prototype.SetFromObject = function(mod)
{

};

Version.prototype.SetMajor = function(v)
{
    if (!IsNaN(v))
    {
        throw new Error('SetMajor expects a number');
    }

    this.major = v;

    return this;
};

Version.prototype.SetMinor = function(v)
{
    if (!IsNaN(v))
    {
        throw new Error('SetMinor expects a number');
    }

    this.minor = v;

    return this;
};

Version.prototype.SetPatch = function(v)
{
    if (!IsNaN(v))
    {
        throw new Error('SetPatch expects a number');
    }

    this.patch = v;

    return this;
};

module.exports = NPMUdateOutdated;
