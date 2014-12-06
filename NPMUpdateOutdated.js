var exec = require('child_process').exec;

function NPMUdateOutdated() 
{
    this.modules = {};
    this.outdated = {};
    this.update_to = 'wanted';
}

NPMUdateOutdated.prototype.Load = function(mods)
{
    try {
        this.modules = JSON.parse(mods);
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

NPMUdateOutdated.prototype.UpdateOutdated = function(mods, options)
{
    var current, wanted, latest;

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
        else
        {
            current = mod + '@' + mods[mod].current;
            wanted = mod + '@' + mods[mod].wanted;
            console.log('Updating from ' + current + ' to ' + wanted);
            exec('npm update ' + mod, function(error, stdout, stderr)
            {
                if (!error)
                {
                    console.log(stdout);
                }
            });
        }
    }
};


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
