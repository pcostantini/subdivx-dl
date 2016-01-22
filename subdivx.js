"use strict";

var path = require('path');
var child_process = require('child_process');
var http = require('http');
var request = require('request');
var fs = require('fs');
var unzip = require('unzip');
var _ = require('underscore');

// todo: virtual dom

function downloadSubtitle(show, releaseDetails, outputPath) {
    searchShowRelease(show, releaseDetails, function(results) {
        if(!results.length) {
            console.log('no subs found, try with less details');
            return;
        }

        // todo: give options if more than one match? 
        var first = _.first(results);
        
        console.log('Downloading:', first.title);
        console.log(first.details);

        var url = first.url;
        var tmp = path.resolve(path.join(outputPath, 'tmp_sub'));
        var tmpStream = fs.createWriteStream(tmp);

        request(url)
            .on('end', function() {
                var type = this.response.headers['content-type'];
                decompressFor(type)(tmp, outputPath, function() {
                    fs.unlink(tmp); // delete
                });
            })
            .pipe(tmpStream);
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

    var parseResponse = function(html) {
        /* returns {
                title: title,
                details: details,
                downloads: downloads,
                url: url
            } */

        html = html.substring(
            html.indexOf('<div class="pagination">'),
            html.lastIndexOf('<div class="pagination">'));

        var frags = html.split('menu_detalle_buscador');
        var downloadLinkAnchor = '<a rel="nofollow" target="new" href="';
        var downloadLinkAnchorEnd = '"><img src="bajar_sub.gif"';
        var fragCountStart = 'Downloads:</b> ';
        var fragCountEnd = ' <b>Cds:</b>';

    	var subtitles = frags/*.map(function(s) {
                console.log('buscador_detalle_sub_datos', s)
    		  return s.split('buscador_detalle_sub_datos')[1];
    	    })*/
            .filter(function(s) { return s.split('buscador_detalle_sub_datos')[1] !== undefined; })
            .map(function(s) {
                /* ><div id="menu_titulo_buscador"><a class="titulo_menu_izq" href="http://www.subdivx.com/X6XNDU0MTQ0X-legend-2015.html">Subtitulo de Legend (2015)</a></div><img src="img/calif5.gif" class="detalle_calif" name="detalle_calif"></div><div id="buscador_detalle">
<div id="buscador_detalle_sub">los de mmmm06, tomados de metallgott  recortadas l�neas a 40  quitados algunos acentos donde no iban y agregados en otras que le faltaban  son para la versi�n    legend 2015 1080p hdrip x264 ac3-evo
gracias a los traductores!!</div><div id="buscador_detalle_sub_datos"><b>Downloads:</b> 31 <b>Cds:</b> 1 <b>Comentarios:</b> 0 <b>Formato:</b> SubRip <b>Subido por:</b> <a class="link1" href="http://www.subdivx.com/X9X1356919">juancito78</a> <img src="http://www.subdivx.com/pais/1.gif" width="16" height="12"> <b>el</b> 20/01/2016  <a rel="nofollow" target="new" href="http://www.subdivx.com/bajar.php?id=454144&u=8"><img src="bajar_sub.gif" border="0"></a></div></div><div id="*/

                var downloads = tag(s, fragCountStart, fragCountEnd);
                var downloadUrl = tag(s, downloadLinkAnchor, downloadLinkAnchorEnd);
                var title = tag(s, '">Subtitulo de ', '</a></div><img ');
                var details = tag(s, '<div id="buscador_detalle_sub">', '</div><div id="buscador_detalle_sub_datos">');
                var downloads = parseInt(tag(s, '<b>Downloads:</b> ', ' <b>Cds:</b>'), 10) || 0;
                return {
                    title: title,
                    details: details,
                    downloads: downloads,
                    url: downloadUrl
                };
            });

        return subtitles;
    };

    function tag(s, tagStart, tarEnd) {
        return s.substring(
                    s.indexOf(tagStart) + tagStart.length,
                    s.indexOf(tarEnd));
    }

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
