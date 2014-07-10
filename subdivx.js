"use strict";

var path = require('path');
var child_process = require('child_process');
var http = require('http');
var request = require('request');
var fs = require('fs');
var unzip = require('unzip');
var $ = require('jquery');
var _ = require('underscore');

function downloadSubtitle(show, releaseDetails, outputPath) {
    searchShowRelease(show, releaseDetails, function(results) {
        if(!results.length) {
            console.log('no subs found, try with less details');
            return;
        }

        var first = results[0];
        
        console.log('Downloading:', first.title);
        console.log(first.details);

        var url = first.url;
        var tmp = path.resolve(path.join(outputPath, 'tmp_sub'));

        request(url)
            .on('end', function() {
                var type = this.response.headers['content-type'];
                decompressFor(type)(tmp, outputPath, function() {
                    // delete
                    fs.unlink(tmp);
                });
            })
            .pipe(fs.createWriteStream(tmp));
    });
}

function searchShowRelease(show, releaseDetails, callback) {

    var and = function(predicates){
      return function(e){
        return _.every(predicates, function(p){return p(e)})
      }
    };

    var conditions = releaseDetails.map(function(release) {
        return function(match) {
            return match.details.indexOf(release) != -1;
        };
    });

    var matchsRelease = and(conditions);

    searchShow(show, function(showMatches) {
        var releaseMatches = showMatches.filter(matchsRelease);
        callback(releaseMatches);
    });
}

function searchShow(show, callback) {
    var parseResponse = function(data) {
        var $dom = $(data);
        var $items = $dom.find('#menu_detalle_buscador').toArray();
        return $items.map(function(el) {
            var $title = $(el);
            var $details = $title.next();
            var downloads = $details.find('#buscador_detalle_sub_datos')
                                    .contents().filter(
                                        function() {
                                            return this.nodeType === 3;
                                        })
                                    .get(0).data;
            downloads = parseInt($.trim(downloads.replace('\g,', '')), 10);

            return {
                title: $title.find('a').text(),
                downloads: downloads,
                details: $details.find('#buscador_detalle_sub').text(),
                url: $details.find('#buscador_detalle_sub_datos a').last().attr('href')
            };
        });
    };

    var options = { host: 'subdivx.com', path: '/index.php?buscar='+ encodeURIComponent(show) +'&accion=5&masdesc=&subtitulos=1&realiza_b=1' };
   
    // TODO: retrieve more pages until matches
    http.request(options, function(response) {
        var data = ''
        response.on('data', function (chunk) { data += chunk; });
        response.on('end', function () {
            var shows = parseResponse(data);
            callback(shows);
        });
    }).end();
}

function decompress_rar(inputPath, outputPath, callback) {
    child_process.spawn(
            'unrar',
            ['e', '-y', inputPath],
            { cwd: outputPath })
        .on('close', callback);
}

function decompress_zip(inputPath, outputPath, callback) {
    fs.createReadStream(inputPath)
        .pipe(unzip.Extract({ path: outputPath }))
        .on('close', callback);
}

function decompressFor(type) {
    if(type.indexOf('rar') != -1)
        return decompress_rar;

    if(type.indexOf('/zip') != -1)
        return decompress_zip;

    throw new Error('Type ('+ type +') not supported');
}


exports.searchShow = searchShow;
exports.searchShowRelease = searchShowRelease;
exports.downloadSubtitle = downloadSubtitle;
