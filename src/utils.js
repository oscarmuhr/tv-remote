module.exports = function transformUrl(url) {
    const urlRegExp = new RegExp('(.+?)([A-Z])', 'g');

    var formattedUrl = '';

    let lastIndex = 0;

    while ((regexpArray = urlRegExp.exec(url)) != null) {
        formattedUrl = formattedUrl + regexpArray[1].toLowerCase() + '-' + regexpArray[2].toLowerCase();
        lastIndex = urlRegExp.lastIndex;
    }

    if (lastIndex != url.length) {
        formattedUrl = formattedUrl + url.substring(lastIndex).toLowerCase();
    }

    return formattedUrl;
}
