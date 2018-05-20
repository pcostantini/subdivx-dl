subdivx-dl
==========
cli tool - subtitle downloader for subdivx.com
----------------------------------------------

Downloads subtitles from http://www.subvix.com/ (spanish site)

Searches movie title and looks up version using specified distribution details.

Downloads rar or zip file and extracts content into current dir.

And that's all =)

*Requirements*

 * nodejs
 * unrar (best non-free - https://raspberrypi.stackexchange.com/questions/3617/how-to-install-unrar-nonfree)
 * an internet connection

*Usage*

	subdivx-dl "your movie title" [distribution details]

*Usage example*

	subdivx-dl ironman 720p YIFY

	subdivx-dl "ironman 2" 720p YIFY

*Symbolic link*

create a symbolic link into user's local bins

	sudo ln -s $PWD/index.js /usr/local/bin/subdivx-dl
	sudo chmod +x /usr/local/bin/subdivx-dl

*TODO*

 * retrieve more pages (currently only works on first page)
 * detect rar or unzip missing

*Nice to have*

 * automatic rename downloaded .srt to movie's name

*Author*

pablo costantini (github.com/pcostantini/subdivx-dl)

*License*

MIT
