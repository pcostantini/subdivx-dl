#!/usr/bin/env node
"use strict";

var subdivx = require('./subdivx');

// tests
// subdivx.downloadSubtitle(
// 	'the big bang theory s07e06',
// 	['dimension', 'argenteam'],
// 	'./tmp/');

subdivx.searchShow('the wolverine', function (results) {
    console.log('searchShow().response:', {
    	lengh: results.length,
    	data: results
    });
});

subdivx.searchShowRelease(
    'the wolverine',
    ['yify', '1080p', 'argenteam'],
    function (results) {
        console.log('searchShowRelease().response:', results);
    }
);
