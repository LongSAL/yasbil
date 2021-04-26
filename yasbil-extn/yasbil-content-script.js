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

console.log('content script started', new Date().getTime());

// use tabs.connect
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/connect
// whenever a tab's URL changes, (or status changes from loading to complete?)
// initiate connection from BG script?


// let portToBG2 = browser.runtime.connect({name:"port-ba-popup-to-bg-2"});

//console.log(portToBG);

let p_BG_mouse = browser.runtime.connect({name:"port-ba-popup-to-bg"}); //null


// -------------------- mouse listeners --------------------
document.body.addEventListener('click', listener_mouse_click);
function listener_mouse_click(e){cs_log_mouse('click', e);}


// -------------------- mouse handler --------------------
// single helper function to log all mouse events from content script (cs)

async function cs_log_mouse(m_event, e)
{
    if(m_event === 'click')
    {
        p_BG_mouse.postMessage({
            yasbil_msg: "DB_LOG_MOUSE",
            yasbil_mouse_data: {
                m_event: m_event,
                page_x: e.pageX,
                page_y: e.pageY,

                target_text: e.target.innerText,

                page_w: document.documentElement.scrollWidth,
                page_h: document.documentElement.scrollHeight,
                zoom: window.devicePixelRatio,
                browser_w: window.outerWidth,
                browser_h: window.outerHeight,
                viewport_w: document.documentElement.clientWidth,
                viewport_h: document.documentElement.clientHeight,

                target_html: e.target.innerHTML,
            }
        });
    }
    else if(m_event === 'scroll')
    {

    }


    console.log('CS:', m_event, new Date().getTime());
}



/******** unused code *******/
// -------------------- comm with BG --------------------
//browser.runtime.onConnect.addListener(cs_listener_runtime_onConnect);

/*function cs_listener_runtime_onConnect(p)
{
    console.log('cs_listener_runtime_onConnect', new Date().getTime());
    p_BG_mouse = p;
}*/


