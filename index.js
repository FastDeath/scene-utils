var sceneCharset = /^[A-Za-z0-9\-\._()]+$/;
var nonSceneCharset = /[^A-Za-z0-9\-\._()]+/g;
var releaseGroupPat = /-(\w+)$/;
var tagSet = {
	quality: ["HD", "SD", "HDTV", /\.\d{3,}p/g],
	source: ["BluRay", "BDRip", "WEB-DL", "WEBRip", "iTunesHD", "AmazonHD"],
	languages: [/german/i, /english/i],
	tags: [
		/\.[xh]\.?264/i, "AVC",
		/\.DD5\.?1/, "DTS", "AC3",
		"Subbed", "Dubbed", "DL"
	]
};
var languages = [/german/i, /english/i];

exports.dissectTags = function (tagStr) {
	tagStr = "." + tagStr + ".";
	var allTags = tagStr.split(".");
	var output = {};

	Object.keys(tagSet).forEach((key) => {
		var patterns = tagSet[key];
		output[key] = patterns.map((pattern) => (pattern instanceof RegExp) ? tagStr.match(pattern) : (allTags.includes(pattern) && pattern))
			.filter(m => !!m)
			.map(m => (m instanceof Array) ? m : [m])
			.reduce((res, matches) => res.concat(matches), [])
			.map(m => m.replace(/(^\.+|\.+$)/g, ""));
		patterns.forEach((pattern) => tagStr = tagStr.replace(pattern, ""));
	});

	output.title = tagStr.replace(/\.+/g, " ").trim();

	return output;
}

exports.dissectTitle = function (title, titleKey) {
	var output = {};

	/*output.languages = languages.map((language) => title.match(language))
			.filter(m => !!m)
			.map(m => (m instanceof Array) ? m : [m])
			.reduce((res, matches) => res.concat(matches), [])
			.map(m => m.replace(/(^\.+|\.+$)/g, "").toLowerCase());
	languages.forEach((language) => title = title.replace(language, ""));*/

	output[titleKey] = title.replace(/\.+/g, " ").trim();

	return output;
}

exports.dissectDirname = function (dirname, graceful) {
	if (graceful)
		dirname = dirname.replace(/\s+/g, ".").replace(nonSceneCharset, "");

	dirname = sceneCharset.exec(dirname.trim());
	dirname = dirname && dirname[0];
	if (!dirname) return null; // charset does not match naming standard

	var output = { dirname: dirname };

	var releaseGroup = releaseGroupPat.exec(dirname);
	if (releaseGroup) {
		output.group = releaseGroup[1].trim();
		dirname = dirname.replace(releaseGroupPat, "");
	}

	var series = /^(.*)\.S(\d+)(?:E(\d+))?\.(.*)$/i.exec(dirname);
	if (series) {
		output.type = (series[3]) ? "episode" : "season";
		output.season = parseInt(series[2]);
		if (series[3])
			output.episode = parseInt(series[3]);
		Object.assign(output, exports.dissectTitle(series[1], "series"));
		Object.assign(output, exports.dissectTags(series[4].trim(".")));
	}

	return output;
}
