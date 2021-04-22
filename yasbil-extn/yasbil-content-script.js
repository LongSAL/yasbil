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

//const tab_info = await browser.tabs.getCurrent() //doesn't work

let portToBG = browser.runtime.connect({name:"port-ba-popup-to-bg"});


// -------------------- mouse listeners --------------------
document.body.addEventListener('click', listener_mouse_click);
function listener_mouse_click(e){cs_log_mouse('click', e);}


// -------------------- mouse handler --------------------
// single helper function to log all mouse events from content script (cs)
function cs_log_mouse(m_event, e)
{
    portToBG.postMessage({
        yasbil_msg: "DB_LOG_MOUSE",
        yasbil_mouse_data: {
            m_event: m_event,
            page_x: e.pageX,
            page_y: e.pageY,
            target: e.target,

            page_w: document.documentElement.scrollWidth,
            page_h: document.documentElement.scrollHeight,
            zoom: window.devicePixelRatio,
            browser_w: window.outerWidth,
            browser_h: window.outerHeight,
            viewport_w: document.documentElement.clientWidth,
            viewport_h: document.documentElement.clientHeight,
        }
    });
}

// TODO: on document ready, capture document.body.innerText
