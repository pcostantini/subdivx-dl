subdivx-dl
==========
cli tool - subtitle downloader for subdivx.com
----------------------------------------------

Downloads subtitles from http://www.subvix.com/ (spanish)

Search by title and looks up match using distribution details.

Downloads rar or zip file and extracts content into current dir.

And that's all =)

*Requirements*

 * nodejs
 * an internet connection

*Usage*

	subdivx-dl "the title" [distribution details]

*Usage example*

	subdivx-dl ironman 720p YIFY

	subdivx-dl "ironman 2" 720p YIFY

*Symbolic link*

create a symbolic link into user's local bins

	sudo ln -s index.js /usr/local/bin/subdivx-dl

*TODO*

 * support paging - paged responses
 * detect rar missing

*Nice to have*

 * automatic rename downloaded .srt to movie's name

*Author*

pablo costantini (github.com/pcostantini/subdivx-dl)

*License*

MIT
