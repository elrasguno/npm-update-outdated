var assert = require("assert"),
    exec   = require("child_process").exec,
    when   = require("when"),
    nodefn = require("when/node"),
    pExec  = nodefn.lift(exec),
    Surely = require('surely');



describe('Update Outdated Modules', function()
{
    describe('setup', function()
    {
        it('should install outdated module', function(done)
        {
            this.timeout(5000);
            var version = 'surely@0.1.2';
            pExec('npm install ' + version)
            .then(function(resp)
            {
                assert.notEqual(resp[0] && resp[0].indexOf(-1, version));
                done();
            })
            .catch(done);
        });
    });

    describe ('touch surely', function()
    {
        it ('should be good touch', function(done)
        {
            var test = Surely
                .string('arg')
                .object('options')
                .callback('callback');

            done();
        });
    });

    describe('try to update', function()
    {
        it('should update to surely@wanted', function(done)
        {
            this.timeout(5000);
            pExec('./bin/npm-update-outdated.js')
            .then(function(resp)
            {
                done();    
            })
            .catch(done);
        });
    });

    describe('verify new version', function()
    {
        it('should be update to the latest surely@0.1.x version', function(done)
        {
            this.timeout(5000);
            var latest;
            pExec('npm info surely versions')
            .then(function(resp)
            {
                // Filter versions
                var versions;
                try {
                    versions = JSON.parse(resp[0].replace(/'/g, '"'));
                    latest = versions.pop();
                } catch (e) {
                    console.error('error parsing versions', e.stack);
                }
                
                return latest;
            })
            .then(function(latest)
            {
                pExec('npm info surely version')
                .then(function(resp)
                {
                    var version;
                    try {
                        version = resp[0].replace(/\n/g, '');
                    } catch (e) {
                        console.error('error parsing version', e.stack);
                    }
                    assert.equal(latest, version);
                    done();
                })
                .catch(done);
            })
            .catch(done);
        });
    });

	describe('test "--missing" flag', function()
    {
        it('should install surely@0.1.x if in the MISSING state', function(done)
        {
            this.timeout(5000);
            var latest;
            pExec('npm uninstall surely')
			.then(pExec.bind(null, './bin/npm-update-outdated.js --missing'))
			.then(pExec.bind(null, 'npm info surely versions'))
            .then(function(resp)
            {
                // Filter versions
                var versions;
                try {
                    versions = JSON.parse(resp[0].replace(/'/g, '"'));
                    latest = versions.pop();
                } catch (e) {
                    console.error('error parsing versions', e.stack);
                }
                
                return latest;
            })
            .then(function(latest)
            {
                pExec('npm info surely version')
                .then(function(resp)
                {
                    var version;
                    try {
                        version = resp[0].replace(/\n/g, '');
                    } catch (e) {
                        console.error('error parsing version', e.stack);
                    }
                    assert.equal(latest, version);
                    done();
                })
                .catch(done);
            })
            .catch(done);
        });
    });
});