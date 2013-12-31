subdivx-dl
==========
cli tool - subtitle downloader for subdivx.com

Downlaads subtitles from http://www.subvix.com/  (spanish)

Searchs movie title, looks up version using distribution detail.

Downloads rar or zip file and extracts content to current dir.

And that's all =)

requirements:
- nodejs
- internet connection

usage:
	subdivx-dl "your movie title" [distribution details]

usage eg:
	subdivx-dl ironman 720p YIFY
	subdivx-dl "ironman 2" 720p YIFY

symbolic link:
create a symbolic link into user's local bins

	sudo ln -s index.js /usr/local/bin/subdivx-dx

todo:
- support paging - paged responses
- detect rar on unzip missing

nice to have:
- automatic rename downloaded .srt to movie's name

author:
pablo costantini (github.com/pcostantini/subdivx-dl)

license:
MIT
