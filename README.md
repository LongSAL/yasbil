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

- [`innerText`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/innerText) and [`innerHTML`](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML) to capture page content, and see if text on page come up in future search query terms
    - YouTube fires `onHistoryStateUpdated` **before** the page has completely loaded; so these properties may contain stale values from previous page  
 
| **Column** | **Description** |
| ----------- | ----------- |
|`pv_id`|server only; PK in server|
|`pv_event`| event that fired the pagevisit |
|`pv_guid`| PK in client|
|`session_guid`||
|`win_id`||
|`win_guid`|unique ID for the browser window in which pagevisit occurs|
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
|`pv_page_text`|captured using `document.body.innerText` after page has loaded |
|`pv_page_html`|captured using `document.body.innerText` after page has loaded |
|`hist_ts`||
|`hist_visit_ct`||
|`pv_srch_engine`||
|`pv_srch_qry`||
|`sync_ts`| initial = 0; later popl with ts from MySQL response|




----------

### `yasbil_session_webnav`
- captures [`webnavigation`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webNavigation) events as timing signals 
 
| **Column** | **Description** |
| ----------- | ----------- |
|`webnav_id`|server only; PK in server|
|`webnav_guid`|PK in client|
|`session_guid`||
|`tab_id`||
|`tab_guid`|unique ID for the browser tab in which event occurs|
|`frame_id`|Frame in which the event occurs. 0 indicates that the event happens in the tab's top-level browsing context, not in a nested `<iframe>`. A positive value indicates that navigation happens in a nested iframe. Frame IDs are unique for a given tab and process |
|--------------|--------------|
|`webnav_event`|Event type: `onBeforeNavigate`, `onCommitted`,  `onDOMContentLoaded`, `onCompleted`|
|`webnav_ts`|timestamp of event (ms since epoch)|
|`webnav_url`|url of page / frame |
|`webnav_transition_type`|only for `onCommitted` event: [`transitionType`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webNavigation/TransitionType): The reason for the navigation|
|`webnav_transition_qual`|only for `onCommitted` event: [`transitionQualifier`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webNavigation/TransitionQualifier). Extra information about the navigation|
|--------------|--------------|
| `sync_ts`| only in client; 0 = not synced|






----------------
 
### `yasbil_session_mouse`
- captures mouse activity 
 
| **Column** | **Description** |
| ----------- | ----------- |
|`m_id`|server only; PK in server|
|`m_guid`|PK in client|
|`session_guid`||
|`win_id`||
|`win_guid`|unique ID for the browser window in which mouse activity occurs|
|`tab_id`||
|`tab_guid`|unique ID for the browser tab in which mouse activity occurs|
|--------------|--------------|
|`m_event`|Mouse event type: `MOUSE_HOVER`, `MOUSE_CLICK`,  `MOUSE_RCLICK`, `MOUSE_DBLCLICK`|
|`m_url`|url of the page|
|`m_ts`|timestamp of mouse activity|
|--------------|--------------|
|`zoom`| `window.devicePixelRatio` zoom level in fraction; use `(Math.round(value)*100)` for percentage|
|`page_w`| `document.documentElement.scrollWidth` webpages's scrollable width (should be equal to viewport width, if there is no horizontal scrolling)|
|`page_h`| `document.documentElement.scrollHeight` webpage's scrollable height|
|`page_x`| `window.pageXOffset` page horizontally scrolled|
|`page_y`| `window.pageYOffset` page vertically scrolled|
|`viewport_w`| `document.documentElement.clientWidth` width of viewport, excluding scrollbars|
|`viewport_h`| `document.documentElement.clientHeight` height of viewport, excluding scrollbars|
|`browser_w`| `window.outerWidth` width of entire browser window; changes with zoom level|
|`browser_h`| `window.outerHeight` height of entire browser window; changes with zoom level|
|--------------|--------------|
|`mouse_x`| `MouseEvent.pageX` X (horizontal) coordinate (in pixels) at which the mouse was clicked, relative to the left edge of the entire document. This includes any portion of the document not currently visible|
|`mouse_y`| `MouseEvent.pageY` Y (vertical) coordinate in pixels of the event relative to the whole document. This property takes into account any vertical scrolling of the page|
|`hover_dur`|duration of hover (if `MOUSE_HOVER` event) in milliseconds|
|--------------|--------------|
|`dom_path`|sequence of element tags up the DOM hierarchy from the target element to HTML|
|`target_text`|rendered text of the target element of the event|
|`target_html`|`innerHTML` of the target element of the event|
|`closest_a_text`|rendered text of the closest anchor tag / link (`<a>`) from the event's target element, if exists|
|`closest_a_html`|`innerHTML` of the closest anchor tag / link (`<a>`) from the event's target element, if exists|
|--------------|--------------|
| `sync_ts`| only in client; 0 = not synced|



#### More Resources:
- [How to Get the Screen, Window, and Web Page Sizes in JavaScript](https://dmitripavlutin.com/screen-window-page-sizes/)
- [Guide on Viewports](https://www.quirksmode.org/mobile/viewports.html)





 

