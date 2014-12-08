'use strict';

var exec = require('child_process').exec,
    events = require('events'),
    util = require('util'),
    when = require('when'),
    seq = require('when/sequence'),
    nodefn = require('when/node'),
    pExec = nodefn.lift(exec),
    commander = require('commander'),
    pkg = require('../package.json');


function NPMUpdateOutdated() 
{
    this.modules = {};
    this.outdated = {};
    this.missing = {};
    this.format = 'parseable';
    this.update_to = 'wanted';
    this.update_missing = false;
    this.auto_update = false;
    this.filter = null;
    this.args = [];

    // Private, but bound, methods
    _parseParseableInput = _parseParseableInput.bind(this);
}

util.inherits(NPMUpdateOutdated, events.EventEmitter);

NPMUpdateOutdated.prototype.Load = function(mods)
{
    try {
        this.modules = _parseParseableInput(mods);
    } catch (e) {
        throw new Error('Failed to parse input data: ' + e.stack);
    }
};

NPMUpdateOutdated.prototype.SetFilter = function(v)
{
    this.filter = v;
    return this;
};

NPMUpdateOutdated.prototype.SetAutoUpdate = function(v)
{
    this.auto_update = !!v; // coerce to boolean
    return this;
};

NPMUpdateOutdated.prototype.SetUpdateTo = function(v)
{
    this.update_to = v;
    return this;
}

NPMUpdateOutdated.prototype.SetInstallMissing = function(v)
{
    this.install_missing = v;
    return this;
};

NPMUpdateOutdated.prototype.GetOutdated = function(filter, options)
{
    var mods = this.modules,
        update_to,
        depth,
        pattern,
        filter = filter || this.filter;

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
            if (depth === 2)
            {
                if (!mods[mod].current || mods[mod].current === 'MISSING')
                {
                    this.missing[mod] = mods[mod];
                }
                else if (mods[mod].current && (mods[mod].current !== mods[mod][this.update_to]))
                {
                    this.outdated[mod] = mods[mod];
                }
            }
        }
    }

    return this.outdated;
};

NPMUpdateOutdated.prototype.InstallMissing = function(mods)
{
    var mods = this.missing;
    if (this.install_missing === true)
    {
        return this.UpdateOutdated(mods, 'missing'); 
    }

    return;
};

NPMUpdateOutdated.prototype.UpdateOutdated = function(mods, type)
{
    var that = this,
        type = type || 'outdated',
        current, wanted, latest,
        mods = mods || this.outdated,
        mod,
        modsLen,
        pChain = [];

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

    _updateModules(mods, type) 
    .then(function(resp)
    {
        that.emit(type + '_end', resp);
    })
    .catch(function(err)
    {
        console.error(err);
        that.emit('error', err);
    });

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
            if (modStr.indexOf('node_modules') === -1)
            {
                mod = new Version().SetFromParseableString(modStr);
                mods[mod.name] = mod;
            }
        }
    });

    return mods;
}

function _updateModules(mods, type)
{
    var current, 
        wanted,
        mod,
        pChain = when(function() { return mods; });

    for (mod in mods)
    {
        
        current = mod + '@' + mods[mod].current;
        wanted = mod + '@' + mods[mod].wanted;

        pChain = pChain.then(function(arg)
        {
            return _updateModule(mods[arg], type);
        }.bind(null, mod));
    }

    return pChain;
}

function _updateModule (mod, type)
{
    var deferred = when.defer(),
        cmd;
    // TODO: Account for "--latest" argument being passed.
    if (type && type === 'missing')
    {
        process.stdout.write('Installing MISSING module ' + mod.name + '@' + mod.wanted + ' ... ');
        cmd = 'npm install '  + mod.name;
    }
    else
    {
        process.stdout.write('Updating ' + mod.name + ' from ' + mod.current + ' to ' + mod.wanted + ' ... ');
        cmd = 'npm update '  + mod.name;
    }

    pExec(cmd)
    .then(function() 
    { 
        console.log('OK!');
        deferred.resolve(true);
    })
    .catch(function(err)
    {
        console.error('OH NOES!');
        console.error(err);

        deferred.reject(err);
    });

    return deferred.promise;
}


/*********************************************************/

function Version()
{
    this.name    = null;
    this.location = null;
    this.wanted  = 0;
    this.current = 0;
    this.latest  = 0;
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

module.exports = NPMUpdateOutdated;
