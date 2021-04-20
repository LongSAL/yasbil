/**
 * Original Author: Nilavra Bhattacharya
 * Author URL: https://nilavra.in
 * Date: 2021-04-19
 * Time: 01:52 PM CDT
 *
 * This script runs on all pages visited by the user
 * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/executeScript
 *
 * The result of the script is the last evaluated statement,
 * which is similar to what would be output
 *
 */

let result =
{
    zoom_level: window.devicePixelRatio,
    browser_width: window.outerWidth,
    browser_height: window.outerHeight,
    viewport_width: document.documentElement.clientWidth,
    viewport_height: document.documentElement.clientHeight,
    page_width: document.documentElement.scrollWidth,
    page_height: document.documentElement.scrollHeight
};

result;