# YASBIL: Yet Another Search Behaviour (and) Interaction Logger

## Download Links:
* [`yasbil-extn-1.0.0.xpi`](https://github.com/yasbil/yasbil/raw/main/yasbil-extn-1.0.0.xpi): YASBIL Browser Extension (tested with Firefox)
* [`yasbil-wp.zip`](https://github.com/yasbil/yasbil/raw/main/yasbil-wp.zip): YASBIL WordPress plugin; to be installed in central data repository




## Demo Video:
Screen recording of a typical research participant’s search session and
interaction with YASBIL (both browser extension and WordPress plugin).

[![YouTube Video: YASBIL Demo Screen Recording](./resources/yasbil-youtube-thumbnail.png)](http://www.youtube.com/watch?v=-sxQ2Xh_EPo "YASBIL Demo Screen Recording")


## Data Dictionary


### `yasbil_sessions`

- Master Table.  Records all session: start and stop of browser extn
- one userid is associated with one project only
- MySQL TIMESTAMP stores seconds
- Javascripts Date().getTime() returns milliseconds

| **Column** | **Description** |
| ----------- | ----------- |
| `session_id` | server only; PK in server |
| `session_guid` | PK in client |
|`project_id`  | server only; from usermeta? |
|`user_id`  | server only |
|`platform_os`| `platform_info.os`|
|`platform_arch`| `platform_info.arch`|
|`platform_nacl_arch`| `platform_info.nacl_arch` native client architecture)|
|`browser_name`| `browser_info.name`|
|`browser_vendor`| `browser_info.vendor`|
|`browser_version`| `browser_info.version`|
|`browser_build_id`| `browser_info.buildID`|
|`session_tz_str` | |
|`session_tz_offset` | |
|`session_start_ts` | |
|`session_end_ts` | |
|`sync_ts` | initial = 0; later populated with timestamps from MySQL response |

 

 ----------------
 
### `yasbil_session_pagevisits`

- Page Visits in a Session, similar to `moz_places`
- captured from three events:
    - [webNavigation.onCompleted](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webNavigation/onCompleted)
        - captures main page visit events, only AFTER the page has completely loaded
    - [tabs.onActivated](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/onActivated)
        - captures tab switches: user switches back to a webpage-tab previously opened
    - [webNavigation.onHistoryStateUpdated](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webNavigation/onHistoryStateUpdated)
        - to capture webpages like YouTube which do not fire `webNavigation.onCompleted events`
        - Note: this event is fired _(i)_ often twice by Google SERPs, _(ii)_ once by YouTube, _(iii)_ probably never by most webpages 

 
| **Column** | **Description** |
| ----------- | ----------- |
|`pv_id`|server only; PK in server|
|`pv_event`| event that fired the pagevisit |
|`pv_guid`| PK in client|
|`session_guid`||
|`win_id`||
|`win_guid`||
|`tab_id`||
|`tab_guid`|unique ID for the browser tab in which pagevisit occurs|
|`tab_width`||
|`tab_height`||
|--------------|--------------|
|`pv_ts`|timestamp of webpage visit|
|`pv_url`||
|`pv_title`||
|`pv_hostname`||
|`pv_rev_hostname`| for easy lookup of TLD types visited|
|`pv_transition_type`| [Transition type](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/history/TransitionType)|
|`hist_ts`||
|`hist_visit_ct`||
|`pv_srch_engine`||
|`pv_srch_qry`||
|`sync_ts`| initial = 0; later popl with ts from MySQL response|


#### More Resources:
- [How to Get the Screen, Window, and Web Page Sizes in JavaScript](https://dmitripavlutin.com/screen-window-page-sizes/)
- [Guide on Viewports](https://www.quirksmode.org/mobile/viewports.html)



----------------
 
### `yasbil_session_framevisits` 
- iframe navigations (frame_id > 0)
- similar to `yasbil_session_pagevisits`
 


 ----------------
 
### `yasbil_session_history`
 - to get better values for transition type and transition qualifier
 - to capture those webpages which do not fire pagevisits (e.g. YouTube?)


 






----------------
 
### `yasbil_session_mouse`
- captures mouse activity 
 
| **Column** | **Description** |
| ----------- | ----------- |
|`m_id`|server only; PK in server|
|`m_guid`|PK in client|
|`session_guid`||
|`url`||
|`m_ts`|timestamp of mouse activity|
|`m_event`|Javascript mouse event type: `click`, `dblclick`,  `contextmenu`, `scroll` (others?)|
|`loc_x`||
|`loc_y`||
|--------------|--------------|
|`zoom_level`| `window.devicePixelRatio` zoom level in fraction; use `(Math.round(value)*100)` for percentage|
|`browser_width`| `window.outerWidth` width of entire browser window; changes with zoom level|
|`browser_height`| `window.outerHeight` height of entire browser window;  changes with zoom level|
|`viewport_width`| `document.documentElement.clientWidth` width of viewport, excluding scrollbars|
|`viewport_height`| `document.documentElement.clientHeight` height of viewport, excluding scrollbars|
|`page_width`| `document.documentElement.scrollWidth` webpages's scrollable width (should be equal to viewport width, if there is no horizontal scrolling)|
|`page_height`| `document.documentElement.scrollHeight` webpage's scrollable height|
|--------------|--------------|
|.|capture text / context around click / hover etc|
| `sync_ts`| only in client; 0 = not synced|


----------------
 
### `yasbil_session_pagetext`
- captures [`innerText`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/innerText)s of the webpage, once per unique URL per session
- to help compare to terms seen in future queries

| **Column** | **Description** |
| ----------- | ----------- |
|`session_guid`||
|`url`||
|`page_text`|captured using `document.body.innerText` after page has loaded |
|`crt_ts`|timestamp of capture / creation|
| `sync_ts`| only in client; 0 = not synced|
