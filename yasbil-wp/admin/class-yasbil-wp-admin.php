<?php

/**
 * The admin-specific functionality of the plugin.
 *
 * @link       http://example.com
 * @since      1.0.0
 *
 * @package    YASBIL_WP
 * @subpackage YASBIL_WP/admin
 */

/**
 * The admin-specific functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the admin-specific stylesheet and JavaScript.
 *
 * @package    YASBIL_WP
 * @subpackage YASBIL_WP/admin
 * @author     Your Name <email@example.com>
 */
class YASBIL_WP_Admin {

	/**
	 * The ID of this plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 * @var      string    $yasbil_wp    The ID of this plugin.
	 */
	private $yasbil_wp;

	/**
	 * The version of this plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 * @var      string    $version    The current version of this plugin.
	 */
	private $version;

	/**
	 * Initialize the class and set its properties.
	 *
	 * @since    1.0.0
	 * @param      string    $yasbil_wp       The name of this plugin.
	 * @param      string    $version    The version of this plugin.
	 */
	public function __construct( $yasbil_wp, $version ) {

		$this->yasbil_wp = $yasbil_wp;
		$this->version = $version;

	}


    /**
     * Register the REST API endpoints for uploading YASBIL data
     *
     * @since    1.0.0
     */
    public function yasbil_register_api_endpoints()
    {
        //POST:  https://volt.ischool.utexas.edu/wp/wp-json/yasbil/v1/sync_sessions

        register_rest_route('yasbil/v1', 'sync_sessions', [
            // By using this constant we ensure that when the WP_REST_Server
            // changes our readable endpoints will work as intended.
            'methods'             => WP_REST_Server::CREATABLE, //POST
            // Here we register our callback. The callback is fired when this
            // endpoint is matched by the WP_REST_Server class.
            'callback'            => array($this, 'yasbil_sync_sessions_table'),
            // Here we register our permissions callback. The callback is fired
            // before the main callback to check if the current user can access the endpoint.
            'permission_callback' => array($this, 'yasbil_sync_permissions_check'),
        ]);

        //POST:  https://volt.ischool.utexas.edu/wp/wp-json/yasbil/v1/sync_pagevisits

        register_rest_route('yasbil/v1', 'sync_pagevisits', [
            'methods'             => WP_REST_Server::CREATABLE, //POST
            'callback'            => array($this, 'yasbil_sync_pagevisits_table'),
            'permission_callback' => array($this, 'yasbil_sync_permissions_check'),
        ]);

        // multiple endpoints can be registered in one function..
//        register_rest_route('yasbil/v1', 'posts', [
//            'methods' => 'GET',
//            'callback' => 'wl_posts',
//        ]);

        // register_rest_route() handles more arguments but we are going to stick to the basics for now.
//        register_rest_route( 'my-plugin/v1', '/private-data', array(
//            // By using this constant we ensure that when the WP_REST_Server changes our readable endpoints will work as intended.
//            'methods'  => WP_REST_Server::READABLE, //GET
//            // Here we register our callback. The callback is fired when this endpoint is matched by the WP_REST_Server class.
//            'callback' => 'prefix_get_private_data',
//            // Here we register our permissions callback. The callback is fired before the main callback to check if the current user can access the endpoint.
//            'permission_callback' => 'prefix_get_private_data_permissions_check',
//        ) );

    }



    /**
     * Register custom taxonomy -- YASBIL Projects -- to categoize users
     *
     * @since    1.0.0
     */
    public function yasbil_register_taxonomy_yasbil_projects()
    {
        $labels = array(
            'name'                       => _x( 'YASBIL Projects', 'YASBIL Projects Name', 'text_domain' ),
            'singular_name'              => _x( 'YASBIL Project', 'YASBIL Project Name', 'text_domain' ),
            'menu_name'                  => __( 'YASBIL Projects', 'text_domain' ),
            'all_items'                  => __( 'All YASBIL Projects', 'text_domain' ),
            'parent_item'                => __( 'Parent YASBIL Project', 'text_domain' ),
            'parent_item_colon'          => __( 'Parent YASBIL Project:', 'text_domain' ),
            'new_item_name'              => __( 'New YASBIL Project Name', 'text_domain' ),
            'add_new_item'               => __( 'Add New YASBIL Project', 'text_domain' ),
            'edit_item'                  => __( 'Edit YASBIL Project', 'text_domain' ),
            'update_item'                => __( 'Update YASBIL Project', 'text_domain' ),
            'view_item'                  => __( 'View YASBIL Project', 'text_domain' ),
            'separate_items_with_commas' => __( 'Separate YASBIL Projects with commas', 'text_domain' ),
            'add_or_remove_items'        => __( 'Add or remove YASBIL Projects', 'text_domain' ),
            'choose_from_most_used'      => __( 'Choose from the most used', 'text_domain' ),
            'popular_items'              => __( 'Popular YASBIL Projects', 'text_domain' ),
            'search_items'               => __( 'Search YASBIL Projects', 'text_domain' ),
            'not_found'                  => __( 'Not Found', 'text_domain' ),
            'no_terms'                   => __( 'No YASBIL Projects', 'text_domain' ),
            'items_list'                 => __( 'YASBIL Projects list', 'text_domain' ),
            'items_list_navigation'      => __( 'YASBIL Projects list navigation', 'text_domain' ),
        );
        $args = array(
            'labels'                     => $labels,
            'hierarchical'               => false, // NOPE! do not make it hierarchical (like categories)
            //'public'                     => true,
            'show_ui'                    => true,
            'show_admin_column'          => true,
            'show_in_nav_menus'          => true,
            //'show_tagcloud'              => true,
            'query_var'                 => true,
            'rewrite'                   => [ 'slug' => 'yasbil_project' ],
        );
        register_taxonomy( 'yasbil_projects', 'user', $args );
    }





    /**
     * Adds admin page for
     * 'YASBIL Projects' taxonomy
     * Viz Pages
     *
     * @since    1.0.0
     */
    public function yasbil_add_admin_pages()
    {
        // redirects to per user activity
        add_menu_page(
            'YASBIL WP: View Synced Data', //Page Title
            'YASBIL WP', //Menu Title
            'read', //Capability: all reg users
            'yasbil_wp', //Page slug
            array($this, 'yasbil_html_per_user_data'), //Callback to print html
            'dashicons-palmtree' //icon url
            //plugins_url( 'myplugin/images/icon.png' ),
            // 6, // https://developer.wordpress.org/reference/functions/add_menu_page/#menu-structure
        );

        //overall summary
        add_submenu_page(
            'yasbil_wp', //parent slug
            'Overall Summary', //Page Title
            'Overall Summary', //Menu Title
            'administrator', //Capability: Only admins
            'yasbil_wp-summary', //menu slug
            array($this, 'yasbil_html_admin_summary_data') //Callback to print html
        );

        // per user activity
        add_submenu_page(
            'yasbil_wp', //parent slug
            'View Synced Data', //Page Title
            'View Synced Data', //Menu Title
            'read', //Capability: all reg users
            'yasbil_wp', //menu slug
            array($this, 'yasbil_html_per_user_data') //Callback to print html
        );

        $tax = get_taxonomy( 'yasbil_projects' );

        add_submenu_page(
            'yasbil_wp', //parent slug
            esc_attr( $tax->labels->menu_name ), //page title
            esc_attr( $tax->labels->menu_name ), //menu title
            'administrator', //Capability: only admins
            'edit-tags.php?taxonomy=' . $tax->name //menu slug
        );
    }


    /**
     * Update parent file name to fix the selected menu issue
     */
    function yasbil_fix_menu_items($parent_file)
    {
        global $submenu_file;
        if (
            isset($_GET['taxonomy']) &&
            $_GET['taxonomy'] == 'yasbil_projects' &&
            $submenu_file == 'edit-tags.php?taxonomy=yasbil_projects'
        ) {
            //TODO: fix this
            //$parent_file = 'users.php';
            $parent_file = 'admin.php?page=yasbil_wp';
            //$parent_file = 'admin.php';
        }
        return $parent_file;
    }


    /**
     * Add an additional settings section on the new/edit user profile page in the admin.
     * This section allows users to select a YASBIL Project from a set of radio button of terms
     * from the "YASBIL Projects" taxonomy.
     *
     * This is just one example of many ways this can be handled.
     * Another is multi-select
     *
     * @param object $user The user object currently being edited.
     *
     * @since    1.0.0
     */
    public function yasbil_admin_edit_user_screen($user)
    {
        // show only to administrators (i.e. not to individual participants)
        if(!current_user_can( 'administrator' ))
            return;

        // Make sure the user can assign terms of the YASBIL Projects taxonomy before proceeding.
        // if ( !current_user_can( $tax->cap->assign_terms ) )
        //    return;

        global $pagenow;
        $tax = get_taxonomy( 'yasbil_projects' );

        // Get the terms of the 'yasbil_projects' taxonomy.
        $terms = get_terms( 'yasbil_projects', array( 'hide_empty' => false ) );
?>

        <hr style="border: 1px solid #aaa; margin: 20px 0px 10px;">

        <h1 style="text-align: center">
            <?php _e( 'YASBIL Project' ); ?>
        </h1>
        <p style="font-size: 16px;">
            <b>WARNING:</b>
            Changing the YASBIL project will be reflected in subsequent data uploads only.
            Data uploaded in the past will NOT get modified.
            <br/><br/>
            <b><i>Do not alter the assigned YASBIL project if a participant has already uploaded some data.</i></b>
            <br/>
            In that case, it is better to create a new user and assign them to the new YABIL project.
        </p>
        <table class="form-table">
            <tr>
                <th>
                    <label for="yasbil_projects">
                        <?php _e( 'Assigned to YASBIL Project' ); ?>
                    </label>
                </th>
                <td>
<?php
                    // If there are any YASBIL Project terms, loop through them and display radio buttons.
                    // only one YASBIL project per user
                    if ( !empty( $terms ) )
                    {
                        foreach ( $terms as $term )
                        {
?>
                            <label for="yasbil_projects-<?php echo esc_attr( $term->slug ); ?>">
                                <input type="radio"
                                    name="yasbil_projects"
                                    id="yasbil_projects-<?php echo esc_attr( $term->slug ); ?>"
                                    value="<?php echo $term->slug; ?>"
                                    <?php if ( $pagenow !== 'user-new.php' ) checked( true, is_object_in_term( $user->ID, 'yasbil_projects', $term->slug ) ); ?>
                                >
                                <?php echo $term->name; ?>
                            </label>
                            <br/>
<?php
                        }
                    }
                    // If there are no YASBIL Projects, display a message.
                    else {
                        _e( 'No YASBIL Projects are available. Create some from the YASBIL-WP Menu.' );
                    }
?>
                </td>
            </tr>
        </table>

        <hr style="border: 1px solid #aaa; margin: 10px 0px 20px;">

<?php
    }




    /**
     * Saves the term selected on the new or edit user profile page in the admin.
     * This function is triggered when the page is updated. We just grab the posted data
     * and use wp_set_object_terms() to save it.
     *
     * @param int $user_id The ID of the user to save the terms for.
     *
     * @since    1.0.0
     */
    public function yasbil_save_user_yasbil_project( $user_id )
    {
        // allow only for administrators
        // i.e. do not allow participants to change their projects
        if(!current_user_can( 'administrator' ))
            return;

        // Make sure the current user can edit the user and assign terms before proceeding.
        // if ( !current_user_can( 'edit_user', $user_id ) && current_user_can( $tax->cap->assign_terms ) )
        //    return false;

        $tax = get_taxonomy( 'yasbil_projects' );

        $term = $_POST['yasbil_projects'];
        // Sets the terms (we're just using a single term) for the user.
        wp_set_object_terms( $user_id, $term, 'yasbil_projects', false);

        clean_object_term_cache( $user_id, 'yasbil_projects' );
    }



    /**
     * @param string $username The username of the user before registration is complete.
     */
    public function yasbil_sanitize_username( $username )
    {
        if ( 'yasbil_projects' === $username )
            $username = '';

        return $username;
    }







//-------------------------- Admin Page Render --------------------------------


    /**
     * Renders HTML to view synced data
     * Participants: can only view their own data
     * Admins: checks key for user_id;
     * TODO: if not, should redirects to summary page
     */
    public function yasbil_html_per_user_data()
    {
        $user_id = 0;

        $user_data = null;
        if ( current_user_can('administrator'))
        {
            if(isset($_GET['user_id']))
            {
                $user_id = $this->yasbil_nvl($_GET['user_id'], 0);
                $user_data = get_userdata($user_id);
            }
            else
            {
                // if no user-id is set, render the summary page
                //$this->yasbil_html_admin_summary_data(); (NO!)
                //redirect to summary page

                $redirect_url = admin_url('admin.php?page=yasbil_wp-summary', 'https');
                nocache_headers();
                if ( wp_redirect( $redirect_url, 302 ) ) //temporary redirect
                    exit;
            }
        }
        elseif (current_user_can('read'))
        {
            if(isset($_GET['user_id']))
            {
                // if non-admins try to pass user_id param,
                // redirect to main plugin page
                $redirect_url = admin_url('admin.php?page=yasbil_wp', 'https');
                nocache_headers();
                if ( wp_redirect( $redirect_url, 302 ) ) //temporary redirect
                    exit;
            }

            $user_data = wp_get_current_user();
            $user_id = $user_data->ID;
        }
        else
        {
            return;
        }

        // search query params
        //st date, end date

        global $wpdb;

        $project_detail = $this->yasbil_get_project_for_user($user_id);
        $project_name = $project_detail[1];
        $user_codename = $user_data->user_login;

?>
        <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.23/css/jquery.dataTables.min.css">
        <script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/1.10.23/js/jquery.dataTables.min.js"></script>
        <!-- datatables  buttons-->
        <script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/buttons/1.6.5/js/dataTables.buttons.min.js"></script>
        <!-- export -->
        <script type="text/javascript" charset="utf8" src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.3/jszip.min.js"></script>
        <script type="text/javascript" charset="utf8" src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.53/pdfmake.min.js"></script>
        <script type="text/javascript" charset="utf8" src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.53/vfs_fonts.js"></script>
        <script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/buttons/1.6.5/js/buttons.html5.min.js"></script>
        <script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/buttons/1.6.5/js/buttons.print.min.js"></script>

        <div class="wrap">

<?php

        if ( current_user_can('administrator'))
        {
            //show participant details only to administrator
?>
            <h1>Participant Details</h1>

            <p style="font-size:16px">
                <b>Project Name:</b>
                <?=$project_name?>

                &nbsp; &bull; &nbsp;

                <b>Participant ID:</b>
                <?=$user_id?>
                &nbsp; &bull; &nbsp;

                <b>Participant Codename:</b>
                <?=$user_codename?>
            </p>
<?php   }
        else
        {
?>
            <h1>Your Uploaded Data</h1>
            <p style="font-size:16px">
                This is the data you have uploaded
                using the YASBIL Browser Extension.
                <br/>
                You can download copies of your data in various formats by clicking the appropriate buttons.
                <br/>
                If you have any concerns regarding this uploaded
                data, please get in touch with us.
                We are always ready to help mitigate your concerns.
            </p>
<?php   }
?>

            <p>All timestamps are in UTC.</p>

            <!-- explanation of transition type and qualifiers --->
            <!--table>
                <thead>
                    <tr>
                        <th>
                            <a target="_blank" href="https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webNavigation/TransitionType">
                                Transition Type (MDN)
                            </a>
                        </th>
                        <th>
                            <a target="_blank" href="https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webNavigation/TransitionQualifier">
                                Transition Qualifier (MDN)
                            </a>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <dl>
                                <dt><a id="value-link"></a>"link"</dt>
                                <dd>The user clicked a link in another page.</dd>
                                <dt><a id="value-typed"></a>"typed"</dt>
                                <dd>The user typed the URL into the address bar. This is also used if the user started typing into the address bar, then selected a URL from the suggestions it offered. See also "generated".</dd>
                                <dt><a id="value-auto_bookmark"></a>"auto_bookmark"</dt>
                                <dd>The user clicked a bookmark or an item in the browser history.</dd>
                                <dt><a id="value-auto_subframe"></a>"auto_subframe"</dt>
                                <dd>Any nested iframes that are automatically loaded by their parent.</dd>
                                <dt><a id="value-manual_subframe"></a>"manual_subframe"</dt>
                                <dd>Any nested iframes that are loaded as an explicit user action. Loading such an iframe will generate an entry in the back/forward navigation list.</dd>
                                <dt><a id="value-generated"></a>"generated"</dt>
                                <dd>The user started typing in the address bar, then clicked on a suggested entry that didn't contain a URL.</dd>
                                <dt><a id="value-start_page"></a>"start_page"</dt>
                                <dd>The page was passed to the command line or is the start page.</dd>
                                <dt><a id="value-form_submit"></a>"form_submit"</dt>
                                <dd>The user submitted a form. Note that in some situations, such as when a form uses a script to submit its contents, submitting a form does not result in this transition type.</dd>
                                <dt><a id="value-reload"></a>"reload"</dt>
                                <dd>The user reloaded the page, using the Reload button or by pressing Enter in the address bar. This is also used for session restore and reopening closed tabs.</dd>
                                <dt><a id="value-keyword"></a>"keyword"</dt>
                                <dd>The URL was generated using a <a target="_blank" href="https://support.mozilla.org/en-US/kb/how-search-from-address-bar" class="external" rel=" noopener">keyword search</a> configured by the user.</dd>
                                <dt><a id="value-keyword_generated"></a>"keyword_generated"</dt>
                                <dd>Corresponds to a visit generated for a keyword.</dd>
                            </dl>
                        </td>

                        <td>
                            <dl>
                                <dt>"client_redirect"</dt>
                                <dd>Redirect(s) caused by JavaScript running in the page or a "refresh" pragma in the page's <a href="/en-US/docs/Web/HTML/Element/meta">meta</a> tag.</dd>
                                <dt>"server_redirect"</dt>
                                <dd>Redirect(s) caused by a <a href="https://en.wikipedia.org/wiki/List_of_HTTP_status_codes#3xx_Redirection" class="external" rel=" noopener">3XX HTTP status code</a> sent from the server.</dd>
                                <dt>"forward_back"</dt>
                                <dd>The user used the forward or back button to trigger the navigation.</dd>
                                <dt>"from_address_bar"</dt>
                                <dd>The user triggered the navigation from the address bar.</dd>
                            </dl>
                        </td>
                    </tr>
                </tbody>
            </table>
            -->
<?php
        $tbl_sessions = $wpdb->prefix . "yasbil_sessions";

        $sql_select_sessions = "
            SELECT *
            FROM $tbl_sessions s
            WHERE s.wp_userid = %s
            ORDER BY s.session_start_ts desc
        ";

        $db_res_sessions = $wpdb->get_results(
            $wpdb->prepare($sql_select_sessions, $user_id),
            ARRAY_A
        );

        // -------- start sessions loop ------------
        foreach ($db_res_sessions as $row_s)
        {
            $session_guid = $row_s['session_guid'];
?>
            <hr style="border: 1px solid #aaa; margin: 20px 0px 10px;">

            <h1>
                Session ID:
                <?=$row_s['session_id']?>
            </h1>

            <p style="font-size:16px">
                <b>Session Start:</b>
                <?=$this->yasbil_milli_to_str($row_s['session_start_ts'], true)?>
                &nbsp; &bull; &nbsp;
                <b>Session End:</b>
                <?=$this->yasbil_milli_to_str($row_s['session_end_ts'], true)?>
                &nbsp; &bull; &nbsp;
                <b>Duration:</b>
                <?=$this->yasbil_display_dur_diff($row_s['session_start_ts'], $row_s['session_end_ts'])?>
                &nbsp; &bull; &nbsp;
                <b>Sync Time:</b>
                <?=$this->yasbil_milli_to_str($row_s['sync_ts'], true)?>

                <br/><br/>

                Page Visits:
            </p>

<?php
            $tbl_pagevisits = $wpdb->prefix . "yasbil_session_pagevisits";

            $sql_select_pv = "
                    SELECT *
                    FROM $tbl_pagevisits pv
                    WHERE pv.session_guid = %s
                    ORDER BY pv.pv_ts asc
                ";

            $db_res_pv =  $wpdb->get_results(
                $wpdb->prepare($sql_select_pv, $session_guid),
                ARRAY_A
            );

?>

            <div class="table-wrapper" 
                 style="padding: 10px; background: white"
            >

                <table id="table_pagevisits_<?=$row_s['session_id']?>" class="display">
                    <thead>
                        <tr>
                            <!-- hidden. for export -->
                            <th>Sync Time</th>
                            <th>Full Title</th>
                            <th>Full URL</th>

                            <!-- visible-->
                            <th>Timestamp</th>
                            <th>Window</th>
                            <th>Tab</th>
                            <th>
                                Transition <a target="_blank"
                                   href="https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webNavigation/TransitionType"
                                >Type</a>
                            </th>
                            <th>
                                Transition <a target="_blank"
                                   href="https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webNavigation/TransitionQualifier"
                                >Qualifier</a>
                            </th>
                            <th>Search Engine</th>
                            <th>Search Query</th>
                            <th>URL Host</th>
                            <th>Page Title</th>
                        </tr>
                    </thead>
                    <tbody>
<?php
            // --------- start pagevisit loop - for rows of table -------------

            // for displaying window and tab numbers as 1,2...
            $win_num = 1;
            $tab_num = 1;
            $arr_win = array();
            $arr_tab = array();

            foreach ($db_res_pv as $row_pv)
            {
                if(!array_key_exists($row_pv['win_id'], $arr_win)) {
                    $arr_win[$row_pv['win_id']] = $win_num++;
                }

                if(!array_key_exists($row_pv['tab_id'], $arr_tab)) {
                    $arr_tab[$row_pv['tab_id']] = $tab_num++;
                }

                $time = $this->yasbil_milli_to_str($row_pv['pv_ts']);

                $window = $arr_win[$row_pv['win_id']];
                $tab = $arr_tab[$row_pv['tab_id']];

                //$transition_type = $row_pv['pv_transition_type'];

                $url_host = $this->yasbil_truncate_str($row_pv['pv_hostname']);

                $title = '<a target="_blank" title="'.$row_pv['pv_title'].'" href="'. esc_url($row_pv['pv_url']) . '">'
                    . $this->yasbil_truncate_str($row_pv['pv_title'])
                    . '</a>';

                //$sync_time = $this->yasbil_milli_to_str($row_pv['sync_ts']);
?>
                    <tr>
                        <!-- hidden; for export-->
                        <td><?=$this->yasbil_milli_to_str($row_pv['sync_ts'])?></td>
                        <td><?=$row_pv['pv_title']?></td>
                        <td><?=$row_pv['pv_url']?></td>

                        <!--visible-->
                        <td><?=$time?></td>
                        <td><?=$window?></td>
                        <td><?=$tab?></td>
                        <td><?=str_ireplace('YASBIL_TAB_SWITCH', 'TAB_SWITCH', $row_pv['pv_transition_type'])?></td>
                        <td><?=$row_pv['pv_transition_qualifier']?></td>
                        <td><?=$row_pv['pv_srch_engine']?></td>
                        <td><?=$row_pv['pv_srch_qry']?></td>
                        <td><?=$url_host?></td>
                        <td><?=$title?></td>
                    </tr>
<?php
            } // --------- end pagevisit loop -------------
?>
                    </tbody>
                </table>
            </div> <!-- table wrapper -->

            <script>
                jQuery('#table_pagevisits_<?=$row_s['session_id']?>').DataTable({
                    columnDefs: [{
                        targets: [0, 1, 2],
                        visible: false,
                        searchable: false
                    }],
                    pageLength: 100,
                    dom: 'Blfritip', //https://datatables.net/reference/option/dom
                    buttons: ['copy', 'csv', 'excel'], //'pdf', 'print'],
                    // hide the last few columns, but include in data export

                });
            </script>
<?php

        } // --------- end session loop -------------

?>
        </div> <!--  end .wrap: html render -->
<?php

    } // end render function





    /**
     * Renders HTML to view Summary Data
     * Only Visible To admins.
     * Provides URLs to view per-user data
     */
    public function yasbil_html_admin_summary_data()
    {
        //page is only for admins
        // redundant - probably
        if(!current_user_can('administrator')) {
            return;
        }

        global $wpdb;
?>

        <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.23/css/jquery.dataTables.min.css">
        <script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/1.10.23/js/jquery.dataTables.min.js"></script>

        <div class="wrap">
            <h1>YASBIL Data Collection Summary</h1>

            <p>All timestamps are in UTC.</p>

<?php

        // Get the terms (project names) of the 'yasbil_projects' taxonomy.
        $arr_yasbil_projects = get_terms( 'yasbil_projects', array( 'hide_empty' => false ) );
        if ( !empty( $arr_yasbil_projects ) )
        {
            foreach ($arr_yasbil_projects as $proj)
            {
                $project_id = $proj->term_id; // constant; use Select distinct on this
                $project_name = strtoupper($proj->slug) ; // should be constant; can be varied;
                $project_nice_name = $proj->name;
                $project_desc = $proj->description;

?>
                <hr style="border: 1px solid #aaa; margin: 20px 0px 10px;">

                <h1>
                    Project <?=$project_id?>: <?=$project_name?>
                </h1>

                <p style="font-size:16px">
                    <b>Full Name:</b>
                    <?=$project_nice_name?>
                    &nbsp; &bull; &nbsp;
                    <b>Description:</b>
                    <?=$project_desc?>

                    <br/><br/>

                    List of Participants:
                </p>

<?php
                $arr_participants = get_objects_in_term($project_id, 'yasbil_projects');

                // not WP_Error and not empty array
                if(!is_wp_error( $arr_participants ) && !empty($arr_participants))
                {
?>
                    <div class="table-wrapper"
                         style="padding: 10px; background: white"
                    >

                        <table id="table_project_<?=$project_name?>" class="display">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Code Name</th>
                                    <th>Total Sessions</th>
                                    <th>Total Page Visits</th>
                                    <th>Avg Session Duration</th>
                                    <th>Page Visit per Session</th>
                                    <th>Last Browsing Activity</th>
                                </tr>
                            </thead>
                            <tbody>
<?php
                    foreach ($arr_participants as $user_id)
                    {
                        $user_info = get_userdata($user_id);
                        $user_data_url = admin_url('admin.php?page=yasbil_wp&user_id='.$user_id, 'https');
                        $code_name = '<a title="View Uploaded Data" target="_blank" href="'.$user_data_url.'">'
                            .$user_info->user_login
                            .'</a>';

                        $tbl_sessions = $wpdb->prefix . "yasbil_sessions";
                        $tbl_pagevisits = $wpdb->prefix . "yasbil_session_pagevisits";

                        $sql_select_summary_stats = "
                            SELECT COUNT(DISTINCT s.session_guid) session_ct
                                , COUNT(DISTINCT pv.pv_guid) pv_ct
                                , AVG(distinct(s.session_end_ts - s.session_start_ts)) avg_session_dur_ms
                                , (COUNT(DISTINCT pv.pv_guid) / COUNT(DISTINCT s.session_guid) ) pv_per_session
                                , MAX(pv.pv_ts) last_activity
                            FROM $tbl_sessions s,
                                $tbl_pagevisits pv
                            WHERE 1=1 
                            AND s.session_guid = pv.session_guid
                            AND s.wp_userid = %s
                        ";

                        $row_stats = $wpdb->get_row(
                            $wpdb->prepare($sql_select_summary_stats, $user_id),
                            ARRAY_A
                        );

?>
                                <tr>
                                    <td><?=$user_id?></td>
                                    <td><?=$code_name?></td>
                                    <td><?=$row_stats['session_ct']?></td>
                                    <td><?=$row_stats['pv_ct']?></td>
                                    <td><?=$this->yasbil_display_dur($row_stats['avg_session_dur_ms'])?></td>
                                    <td><?=$row_stats['pv_per_session']?></td>
                                    <td><?=$this->yasbil_milli_to_str($row_stats['last_activity'])?></td>
                                </tr>

<?php
                    } // --------- end participants loop -------------
?>
                            </tbody>

                        </table>
                    </div> <!-- table wrapper -->

                <script>
                    jQuery('#table_project_<?=$project_name?>').DataTable({
                        pageLength: 100
                    });
                </script>

<?php
                } else {
                    _e( 'No participants in this YASBIL Project. 
                    Assign Participants to projects by editing their User Profiles.' );
                } // end if of WP Users

            } // end: project loop
        }
        // If there are no YASBIL Projects, display a message.
        else{
            _e( 'No YASBIL Projects are available. Create some from the YASBIL-WP Menu.' );
        }

?>


        </div> <!-- end div.wrap-->








        <?php

    } // summary render html function




//-------------------------- End: Page Render --------------------------------

    /**
     * Unsets the 'posts' page and adds the 'users' page as the parent
     * on the manage YASBIL Projects admin page.
     *
     * from: https://www.nopio.com/blog/add-user-taxonomy-wordpress/
     * if previous fn doesn't work, try this
     * @since    1.0.0
     */
    /*public function yasbil_set_yasbil_projects_submenu_active2( $submenu_file )
    {
        global $parent_file;
        if( 'edit-tags.php?taxonomy=yasbil_projects' == $submenu_file ) {
            $parent_file = 'users.php';
        }
        return $submenu_file;
    }*/






//-------------------------- SESSIONS Sync --------------------------------
    public function yasbil_sync_sessions_table( $request )
    {
        /***
        JSON body format:
        {
        'num_rows': 23, (not required)
        'data_rows': [ {row 1 obj}, {row 2 obj}, ... {row n obj}, ]
        }
         */

        try
        {
            $json_body = $request->get_json_params();

            $current_user = wp_get_current_user();
            $wp_userid = $current_user->ID;
            $wp_username = $current_user->user_login;

            $project_detail = $this->yasbil_get_project_for_user($wp_userid);
            $project_id = $project_detail[0];
            $project_name = $project_detail[1];

            $sync_ts = $this->yasbil_get_millitime();

            // $num_rows = $json_body['num_rows'];
            $data_rows = $json_body['data_rows']; //array

            global $wpdb;

            // to insert multiple rows
            // https://stackoverflow.com/a/12374838
            // https://wordpress.stackexchange.com/a/328037

            $tbl_sessions = $wpdb->prefix . "yasbil_sessions";
            $sql_insert_session = "
                INSERT INTO $tbl_sessions (
                    session_guid, 
                    project_id,
                    project_name,
                    wp_userid,
                    participant_name,
                    platform_os,
                    platform_arch,
                    platform_nacl_arch,
                    browser_name,
                    browser_vendor,
                    browser_version,
                    browser_build_id,
                    session_tz_str,
                    session_tz_offset,
                    session_start_ts,
                    session_end_ts,
                    sync_ts
                ) VALUES ";

            $values = array();
            $place_holders = array();

            foreach ( $data_rows as $row )
            {
                array_push(
                    $values,
                    sanitize_text_field($row['session_guid']),
                    $project_id,
                    $project_name,
                    $wp_userid,
                    $wp_username,
                    sanitize_text_field($row['platform_os']),
                    sanitize_text_field($row['platform_arch']),
                    sanitize_text_field($row['platform_nacl_arch']),
                    sanitize_text_field($row['browser_name']),
                    sanitize_text_field($row['browser_vendor']),
                    sanitize_text_field($row['browser_version']),
                    sanitize_text_field($row['browser_build_id']),
                    sanitize_text_field($row['session_tz_str']),
                    sanitize_text_field($row['session_tz_offset']),
                    sanitize_text_field($row['session_start_ts']),
                    sanitize_text_field($row['session_end_ts']),
                    $sync_ts
                );
                $place_holders[] = "(
                    %s, %s, %s, %s, %s, 
                    %s, %s, %s, %s, %s, 
                    %s, %s, %s, %s, %s, 
                    %s, %s
                )";
            }

            $sql_insert_session .= implode( ', ', $place_holders );
            if( false === $wpdb->query( $wpdb->prepare( "$sql_insert_session ", $values ) ))
            {
                return new WP_Error('db_query_error', $wpdb->last_error, array('status' => 400));
            }

            $synced_sessions = $wpdb->get_results( $wpdb->prepare("
                SELECT session_guid 
                FROM $tbl_sessions 
                WHERE sync_ts = %s",
                $sync_ts
            ));

            $arr_synced_session_guids = array();

            foreach ($synced_sessions as $row_sess) {
                $arr_synced_session_guids[] = $row_sess->session_guid;
            }

            $return_obj = array();
            $return_obj['sync_ts'] = $sync_ts;
            $return_obj['guids'] = $arr_synced_session_guids;

            $response = new WP_REST_Response( $return_obj );
            $response->set_status( 201 );

            return $response;
        }
        catch (Exception $e)
        {
            return new WP_Error('wp_exception', $e->getMessage(), array('status' => 400));
        }
    }








//-------------------------- PAGEVISITS Sync --------------------------------
    public function yasbil_sync_pagevisits_table( $request )
    {
        /***
         JSON body format:
         {
            'num_rows': 23, (not required)
            'data_rows': [ {row 1 obj}, {row 2 obj}, ... {row n obj}, ]
         }
        */

        try
        {
            $json_body = $request->get_json_params();

            $current_user = wp_get_current_user();
            $wp_userid = $current_user->ID;
            $wp_username = $current_user->user_login;

            $project_detail = $this->yasbil_get_project_for_user($wp_userid);
            $project_id = $project_detail[0];
            $project_name = $project_detail[1];

            $sync_ts = $this->yasbil_get_millitime();

            // $num_rows = $json_body['num_rows'];
            $data_rows = $json_body['data_rows']; //array

            global $wpdb;

            // to insert multiple rows
            // https://stackoverflow.com/a/12374838
            // https://wordpress.stackexchange.com/a/328037


            $tbl_pagevisits = $wpdb->prefix . "yasbil_session_pagevisits";
            $sql_insert_pv = "
                INSERT INTO $tbl_pagevisits (
                    pv_guid,
                    session_guid,
                    project_id,
                    project_name,
                    wp_userid,
                    participant_name,         
                    win_id,
                    win_guid,
                    tab_id,
                    tab_guid,
                    pv_ts,
                    pv_url,
                    pv_title,
                    title_upd,
                    pv_hostname,
                    pv_rev_hostname,
                    pv_transition_type,
                    pv_transition_qualifier,
                    pv_srch_engine,
                    pv_srch_qry,
                    sync_ts
                ) VALUES ";

            $values = array();
            $place_holders = array();

            foreach ( $data_rows as $row )
            {
                array_push(
                    $values,
                    sanitize_text_field($row['pv_guid']),
                    sanitize_text_field($row['session_guid']),
                    $project_id,
                    $project_name,
                    $wp_userid,
                    $wp_username,
                    sanitize_text_field($row['win_id']),
                    sanitize_text_field($row['win_guid']),
                    sanitize_text_field($row['tab_id']),
                    sanitize_text_field($row['tab_guid']),
                    sanitize_text_field($row['pv_ts']),
                    esc_url_raw($row['pv_url']),
                    sanitize_text_field($row['pv_title']),
                    sanitize_text_field($row['title_upd']),
                    sanitize_text_field($row['pv_hostname']),
                    sanitize_text_field($row['pv_rev_hostname']),
                    sanitize_text_field($row['pv_transition_type']),
                    sanitize_text_field($row['pv_transition_qualifier']),
                    sanitize_text_field($row['pv_srch_engine']),
                    sanitize_text_field($row['pv_srch_qry']),
                    sanitize_text_field($sync_ts)
                );
                $place_holders[] = "(
                    %s, %s, %s, %s, %s, 
                    %s, %s, %s, %s, %s, 
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s
                )";
            }

            $sql_insert_pv .= implode( ', ', $place_holders );
            if( false === $wpdb->query( $wpdb->prepare( "$sql_insert_pv ", $values ) ))
            {
                return new WP_Error('db_query_error', $wpdb->last_error, array('status' => 400));
            }

            $synced_sessions = $wpdb->get_results( $wpdb->prepare("
                SELECT pv_guid 
                FROM $tbl_pagevisits 
                WHERE sync_ts = %s",
                $sync_ts
            ));

            $arr_synced_pv_guids = array();

            foreach ($synced_sessions as $row_sess) {
                $arr_synced_pv_guids[] = $row_sess->pv_guid;
            }

            $return_obj = array();
            $return_obj['sync_ts'] = $sync_ts;
            $return_obj['guids'] = $arr_synced_pv_guids;

            $response = new WP_REST_Response( $return_obj );
            $response->set_status( 201 );

            return $response;
        }
        catch (Exception $e)
        {
            return new WP_Error('wp_exception', $e->getMessage(), array('status' => 400));
        }
    }



















    // to get current time in milliseconds
    // https://stackoverflow.com/a/3656934
    public function yasbil_get_millitime()
    {
        $microtime = microtime();
        $comps = explode(' ', $microtime);

        // Note: Using a string here to prevent loss of precision
        // in case of "overflow" (PHP converts it to a double)
        return sprintf('%d%03d', $comps[1], $comps[0] * 1000);
    }


    public function yasbil_milli_to_str($milli_time, $incl_day=false)
    {
        $sec_time = $milli_time / 1000;

        if($incl_day)
            return strtoupper(date('Y-m-d, D, H:i:s', $sec_time));

        return date('Y-m-d H:i:s', $sec_time);
    }



    public function yasbil_truncate_str($long_str, $thresh = 30)
    {
        if (strlen($long_str) >= $thresh) {
            return substr($long_str, 0, $thresh-3). "..."; // . substr($long_str, -5);
        }
        else {
            return $long_str;
        }
    }


    /**
     * Check if a given request has access to sync yasbil data (assuming it checks austhentication)
     *
     * @param WP_REST_Request $request Full data about the request.
     * @return WP_Error|bool
     */
    function yasbil_sync_permissions_check( $request )
    {
        /**
         * Restrict YASBIL endpoints to only users who have the read capability (subscriber and above).
         */
        // https://developer.wordpress.org/rest-api/extending-the-rest-api/routes-and-endpoints/#permissions-callback

        return current_user_can( 'read' );
        //or check current user is in term: + taxonomy new permission: 'participant?'

        /***
        if ( ! current_user_can( 'read' ) )
        {
            return new WP_Error( 'rest_forbidden', esc_html__( 'OMG you can not view private data.', 'my-text-domain' ), array( 'status' => 401 ) );
        }

        // This is a black-listing approach. You could alternatively do this via white-listing,
        // by returning false here and changing the permissions check.
        return true;
        *****/
    }


    /**
     * Takes a variable and returns sanitized output / default value
     */
    public function yasbil_nvl($test_val, $default_val)
    {
        if(!isset($test_val) || trim($test_val)==='')
            return $default_val;

        return sanitize_text_field( $test_val );
    }


    /**
     * Takes a userid and returns the [term-id, term-slug] for the single YASBIL project (custom taxonomy)
     * @param $userid
     */
    function yasbil_get_project_for_user( $userid )
    {
        $arr_yasbil_projects = wp_get_object_terms( $userid,  'yasbil_projects' );

        if ( ! empty( $arr_yasbil_projects ) )
        {
            if ( ! is_wp_error( $arr_yasbil_projects ) )
            {
                $term = $arr_yasbil_projects[0];
                //available properties: // https://developer.wordpress.org/reference/classes/wp_term/
                return array($term->term_id, strtoupper($term->slug));
            }
        }

        return array(0, "DEFAULT_PROJECT");
    }

    /**
     * Displays difference between two milliseconds in appropriate units
     */
    function yasbil_display_dur_diff($milli_st, $milli_end)
    {
        return $this->yasbil_display_dur($milli_end - $milli_st);

    }

    function yasbil_display_dur($diff_ms)
    {
        $diff_s = $diff_ms / 1000.0;
        $diff_min = $diff_ms / (60 * 1000.0);

        $return_val = "";

        if($diff_s < 60)
            $return_val = sprintf('%.2f sec', $diff_s);
        elseif($diff_s >=60 && $diff_min < 60)
            $return_val = sprintf('%d min %d sec',
                (int)($diff_s) / 60,
                (int)($diff_s) % 60
            );
        else
            $return_val = sprintf('%d hr %d min',
                (int)($diff_min) / 60,
                (int)($diff_min) % 60
            );

        return $return_val;
    }








	/**
	 * Register the stylesheets for the admin area.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_styles() {

		/**
		 * This function is provided for demonstration purposes only.
		 *
		 * An instance of this class should be passed to the run() function
		 * defined in YASBIL_WP_Loader as all of the hooks are defined
		 * in that particular class.
		 *
		 * The YASBIL_WP_Loader will then create the relationship
		 * between the defined hooks and the functions defined in this
		 * class.
		 */

		wp_enqueue_style( $this->yasbil_wp, plugin_dir_url( __FILE__ ) . 'css/yasbil-wp-admin.css', array(), $this->version, 'all' );

	}

	/**
	 * Register the JavaScript for the admin area.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_scripts() {

		/**
		 * This function is provided for demonstration purposes only.
		 *
		 * An instance of this class should be passed to the run() function
		 * defined in YASBIL_WP_Loader as all of the hooks are defined
		 * in that particular class.
		 *
		 * The YASBIL_WP_Loader will then create the relationship
		 * between the defined hooks and the functions defined in this
		 * class.
		 */

		wp_enqueue_script( $this->yasbil_wp, plugin_dir_url( __FILE__ ) . 'js/yasbil-wp-admin.js', array( 'jquery' ), $this->version, false );

	}

}
