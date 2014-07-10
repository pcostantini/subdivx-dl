#!/usr/bin/env node
"use strict";

var subdivx = require('./subdivx');
var args = process.argv.splice(2);

var show = args[0];
var releaseDetails = args.splice(1);

console.log(['searching:', show, '-using details:', releaseDetails].join(' '));
subdivx.downloadSubtitle(show, releaseDetails, './');
