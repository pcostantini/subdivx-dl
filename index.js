#!/usr/bin/env node

"use strict";

var subdivx = require('./subdivx');

var args = process.argv.splice(2);

var show = args[0];
var releaseDetails = args.splice(1);

console.log('searching "'+ show +'" with details:', releaseDetails);
subdivx.downloadSubtitle(show, releaseDetails, './');


// test
//subdivx.downloadSubtitle('the big bang theory s07e06', ['dimension', 'argenteam'], './tmp/');

// subdivx.searchShow('the wolverine', function (results) {
//     console.log('SHOW SEARCH - count:', results.length);
// });

// subdivx.searchRelease(
//     'the wolverine',
//     ['yify', '1080p', 'argenteam'],
//     function (results) {
//         console.log('RELEASE SEARCH:', results);
//     }
// );
