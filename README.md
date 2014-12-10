# npm-update-outdated

If you're ever thinking that the [npm update](https://www.npmjs.org/doc/cli/npm-update.html) command should have an _--all_ option, then this is the module for you.
By default, `npm-update-outdated` will update each of your project's node dependencies to the _wanted_ version shown by the `npm outdated` command.

## Installation

```
npm install -g npm-update-outdated
```

## Usage

```bash
$ cd /path/to/your/node/project
$ npm-update-outdated [options]
```

## Options

```bash
$ npm-update-outdated --help

  Usage: npm-update-outdated [options]

  Options:

    -h, --help               output usage information
    -V, --version            output the version number
    --filter <string|regex>  filter packages to be updated by string or regex
    --missing                install missing modules
```

The MIT License
===============

Copyright (c) 2014 Dan Racanelli

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.