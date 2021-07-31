"use strict";

var path = require('path');
var child_process = require('child_process');
var http = require('https');
var request = require('request');
var fs = require('fs');
var unzip = require('unzip');
var _ = require('underscore');

// var agent = new http.Agent;
// agent.maxSockets = 1;
http.globalAgent.keepAlive = true

var logEnabled = true;
var log = logEnabled
    ? (o1, o2) => console.log(o1, o2)
    : () => { /* */ };

function downloadSubtitle(show, releaseDetails, outputPath) {
    searchShowRelease(show, releaseDetails, function (results) {
        if (!results.length) {
            log('no subs found, try with less details');
            return;
        }

        // TODO: give options if more than one match? 
        var first = _.first(results);

        // Download Page to obtain download link
        retriveDownloadLink(first.subtitleUrl, function (url) {

            if (!url) {
                // no url?
                log('Download link not found for ' + first.subtitleUrl);
                return;
            }

            log('First subtitle:', first);


            // HACK: download file with puppet
            // reload page so cookies are re-sent
            const puppeteer = require('puppeteer');

            (async () => {

                var browser = await puppeteer.launch({
                    headless: true,
                    executablePath: '/opt/google/chrome/chrome' //await chromium.executablePath
                });


                try {
                    var page = await browser.newPage();

                    var detectedContentType;
                    var detectedDownloadPath;
                    var tempDownloadPath = '/tmp/subdivx-tmp/'

                    page.on('response', async (response) => {
                        // save last detected content download, content type and assume detected download path
                        detectedContentType = response.headers()['content-type'];
                        var url = response.request().url();
                        var filename = path.basename(url);
                        detectedDownloadPath = path.resolve(path.join(tempDownloadPath, filename));
                    });

                    page.on('pageerror', () => { });

                    await page._client.send('Page.setDownloadBehavior', {
                        behavior: 'allow',
                        downloadPath: tempDownloadPath
                    });


                    await page._client.on('Page.downloadProgress', async (e) => {
                        // detect a successfull download and then continue...
                        if (e.state !== 'completed') return;

                        await browser.close();

                        console.log('Decompressing ', detectedDownloadPath);
                        var decompressFunction = decompressFor(detectedContentType);
                        decompressFunction(detectedDownloadPath, outputPath, function () {
                            fs.unlink(detectedDownloadPath, function () { }); // delete
                        });
                    });

                    await page.goto(url);
                    await page.goto(url);

                } catch (e) {
                    console.error(e);
                }

            })()
                .then(() => console.log('Done?'))
                .catch(console.error);
        });
    });
}

function searchShowRelease(show, releaseDetails, callback) {

    var and = function (predicates) {
        return function (e) {
            return _.every(predicates, function (p) { return p(e) })
        }
    };

    var conditions = releaseDetails.map(function (release) {
        return function (match) {
            return match.details.indexOf(release) != -1;
        };
    });

    var matchsRelease = and(conditions);

    searchShow(show, function (showMatches) {
        var releaseMatches = showMatches.filter(matchsRelease);
        callback(releaseMatches);
    });
}

function searchShow(show, callback) {

    if (!show) throw new Error('show not specifed!')

    var parseResponse = function (html) {
        /* returns {
                title: string,
                details: string,
                downloads: number,
                subtitleUrl: string
            } */

        html = html.substring(
            html.indexOf('<div class="pagination">'),
            html.lastIndexOf('<div class="pagination">'));

        var frags = html.split('menu_detalle_buscador');

        var subtitles = frags
            .filter(function (s) { return s.split('buscador_detalle_sub_datos')[1] !== undefined; })
            .map(function (s) {
                /* "><div id="menu_titulo_buscador"><a class="titulo_menu_izq" href="https://www.subdivx.com/X6XNDcwNjA8X-babylon-5-s01e01.html">Subtitulos de Babylon 5 S01E01</a></div><img src="img/calif5.gif" class="detalle_calif" name="detalle_calif"></div><div id="buscador_detalle">\n<div id="buscador_detalle_sub">aquiu van los sub de babylon 5 solo sirven para 350 megas loe realizo el grupo proyecto babylon, entes que nada mis disculpa por haber subido un pack, pero lo estoy corrigiendo ahora va de uno en uno </div><div id="buscador_detalle_sub_datos"><b>Downloads:</b> 1,242 <b>Cds:</b> 1 <b>Comentarios:</b> <a rel="nofollow" href="popcoment.php?idsub=NDcwNjA8" onclick="return hs.htmlExpand(this, { objectType: \'iframe\' } )">3</a> <b>Formato:</b> SubRip <b>Subido por:</b> <a class="link1" href="https://www.subdivx.com/X9X147628">cpsh</a> <img src="/pais/2.gif" width="16" height="12"> <b>el</b> 19/07/2006 </div></div><div id="*/

                var downloads = parseInt(extractSubstring(s, 'Downloads:</b> ', ' <b>Cds:</b>').replace(/,/g, ''), 10) || 0;
                var subtitleUrl = extractSubstring(s, '<a class="titulo_menu_izq" href="', '">');
                var title = extractSubstring(s, '">Subtitulos de ', '</a></div>');
                var details = extractSubstring(s, '<div id="buscador_detalle_sub">', '</div>');

                return {
                    title: title,
                    details: details,
                    downloads: downloads,
                    subtitleUrl: subtitleUrl
                };
            });

        return subtitles;
    };

    var path = '/index.php?buscar=' + encodeURIComponent(show) + '&accion=5&masdesc=&subtitulos=1&realiza_b=1';
    var httpOptions = {
        host: 'www.subdivx.com',
        path: path
    };

    // TODO: retrieve more pages until matches
    http.request(httpOptions, function (response) {
        var data = ''
        response.on('data', function (chunk) { data += chunk; });
        response.on('end', function () {
            var shows = parseResponse(data);
            callback(shows);
        });
    }).end();
}

function retriveDownloadLink(subtitleUrl, callback) {
    http.request(subtitleUrl, function (response) {
        var data = ''
        response.on('data', function (chunk) { data += chunk; });
        response.on('end', function () {
            // todo: html sample
            var downloadUrl = extractSubstring(data, '<h1><a class="link1" href="', '">');
            var fullUrl = 'https://www.subdivx.com/' + downloadUrl;
            callback(fullUrl);
        });
    }).end();
}

function extractSubstring(s, tagStart, tarEnd) {
    var startIx = s.indexOf(tagStart) + tagStart.length;
    return s.substring(
        startIx,
        s.indexOf(tarEnd, startIx));
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
    if (type.indexOf('rar') != -1)
        return decompress_rar;

    if (type.indexOf('/zip') != -1)
        return decompress_zip;

    throw new Error('Type (' + type + ') unexpected');
}

exports.searchShow = searchShow;
exports.searchShowRelease = searchShowRelease;
exports.downloadSubtitle = downloadSubtitle;
