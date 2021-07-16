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

        //GET:  https://volt.ischool.utexas.edu/wp/wp-json/yasbil/v2_0_0/check_connection
        register_rest_route('yasbil/v2_0_0', 'check_connection', [
            'methods'             => WP_REST_Server::READABLE, //GET
            'callback'            => array($this, 'yasbil_sync_check_connection'),
            'permission_callback' => array($this, 'yasbil_sync_check_permission'),
        ]);

        //POST:  https://volt.ischool.utexas.edu/wp/wp-json/yasbil/v2_0_0/sync_table
        register_rest_route('yasbil/v2_0_0', 'sync_table', [
            'methods'             => WP_REST_Server::CREATABLE, //POST
            'callback'            => array($this, 'yasbil_sync_table'),
            'permission_callback' => array($this, 'yasbil_sync_check_permission'),
        ]);

        //GET:  https://volt.ischool.utexas.edu/wp/wp-json/yasbil/admin/hash2string?p_hash=xxx
        register_rest_route('yasbil/admin', 'hash2string', [
            'methods'             => WP_REST_Server::READABLE, //GET
            'callback'            => array($this, 'yasbil_rest_util_hash2string'),
            //'permission_callback' => array($this, 'yasbil_rest_util_check_permission'),
        ]);

        /*register_rest_route('yasbil/v1', 'sync_sessions', [
            // By using this constant we ensure that when the WP_REST_Server
            // changes our readable endpoints will work as intended.
            'methods'             => WP_REST_Server::CREATABLE, //POST
            // Here we register our callback. The callback is fired when this
            // endpoint is matched by the WP_REST_Server class.
            'callback'            => array($this, 'yasbil_sync_sessions_table'),
            // Here we register our permissions callback. The callback is fired
            // before the main callback to check if the current user can access the endpoint.
            'permission_callback' => array($this, 'yasbil_sync_check_permission'),
        ]);*/

        //POST:  https://volt.ischool.utexas.edu/wp/wp-json/yasbil/v1/sync_pagevisits

        /*register_rest_route('yasbil/v1', 'sync_pagevisits', [
            'methods'             => WP_REST_Server::CREATABLE, //POST
            'callback'            => array($this, 'yasbil_sync_pagevisits_table'),
            'permission_callback' => array($this, 'yasbil_sync_check_permission'),
        ]);*/

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
            //'dashicons-palmtree' //icon url
            plugins_url( 'yasbil-wp/icon/yasbil-icon-20.png' )
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
            In that case, it is better to create a new user and assign them to the new YASBIL project.
        </p>
        <table class="form-table">
            <tr>
                <th>
                    <label for='yasbil_projects'>
                        <?php _e( 'Assigned to YASBIL Project' ); ?>
                    </label>
                </th>
                <td>
<?php
                    // If there are any YASBIL Project terms, loop through them and display radio buttons.
                    // only one YASBIL project per user
                    if ( !empty( $terms ) )
                    {
                        $userAssigned = 0;

                        foreach ( $terms as $term )
                        {
                            if(is_object_in_term( $user->ID, 'yasbil_projects', $term->slug )){
                                $userAssigned += 1; //not using true / false as this will loop again
                            }
?>
                            <label for="yasbil_projects-<?php echo esc_attr( $term->slug ); ?>">
                                <input type="radio"
                                    name='yasbil_projects'
                                    id="yasbil_projects-<?php echo esc_attr( $term->slug ); ?>"
                                    value="<?php echo $term->slug; ?>"
                                    <?php if ( $pagenow !== 'user-new.php' ) checked( true, is_object_in_term( $user->ID, 'yasbil_projects', $term->slug ) ); ?>
                                >
                                <?php echo $term->name; ?>
                            </label>
                            <br/>
<?php

                            if($pagenow !== 'user-new.php' && $userAssigned > 0)
                            {
?>                              <script>jQuery('input[name=yasbil_projects]').attr('disabled',true);</script>
<?php
                            }

                        }
                    }
                    // If there are no YASBIL Projects, display a message.
                    else {
                        _e( 'No YASBIL Projects are available. Create some projects from the YASBIL WP Menu.' );
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
     * Sets yasbil_user_status meta key = ACTIVE (i.e user can immediately start syncing data)
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

        $term = $_POST['yasbil_projects'];
        // Sets the terms (we're just using a single term) for the user.
        wp_set_object_terms( $user_id, $term, 'yasbil_projects', false);

        //enables this user to sync data
        $this->yasbil_set_user_enabled($user_id);

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







//-------------------------- START: HTML Render Functions --------------------------------


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

        // activate / deactivate participants
        if(isset($_POST['yasbil_select_users']) && is_array($_POST['yasbil_select_users']))
        {
            $arr_user_ids = $_POST['yasbil_select_users'];

            foreach($arr_user_ids as $user_id)
            {
                if(isset($_POST['yasbil_set_user_enabled']))
                    $this->yasbil_set_user_enabled($user_id);
                elseif (isset($_POST['yasbil_set_user_disabled']))
                    $this->yasbil_set_user_disabled($user_id);
            }
        }

        ?>

        <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.23/css/jquery.dataTables.min.css">
        <script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/1.10.23/js/jquery.dataTables.min.js"></script>

        <style>
            .dataTables_length select {
                width: 60px !important;
                padding: 0px 5px !important;
            }
        </style>

        <div class="wrap">
            <h1>YASBIL Data Collection Summary</h1>

            <p>All timestamps are in participant's local time.</p>

            <style>
                .badge-enabled {
                    color: #fff;
                    background-color: #007bff;
                }

                .badge-disabled {
                    color: #fff;
                    background-color: #aaa;
                }

                .badge {
                    display: inline-block;
                    padding: .25em .4em;
                    font-size: 100%;
                    font-weight: 700;
                    line-height: 1;
                    text-align: center;
                    white-space: nowrap;
                    vertical-align: baseline;
                    border-radius: .25rem;
                }
            </style>


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
                    <form method="post">
                    <p class="submit">
                        <input type="submit" name="yasbil_set_user_enabled" id="submit-enable"
                               class="button button-primary" value="Enable Users">
                        &nbsp;&nbsp;
                        <input type="submit" name="yasbil_set_user_disabled" id="submit-deactivate"
                               class="button button-secondary" value="Disable Users">
                    </p>




                    <div class="table-wrapper"
                         style="padding: 10px; background: white"
                    >

                        <table id="table_project_<?=$project_name?>" class="display">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Total Sessions</th>
                                <th>Total Page Visits</th>
                                <th>Avg Session Duration</th>
                                <th>Page Visits per Session</th>
                                <th>Last Browsing Activity</th>
                            </tr>
                            </thead>
                            <tbody>
                            <?php
                            foreach ($arr_participants as $user_id)
                            {
                                $user_info = get_userdata($user_id);
                                $user_status = $this->yasbil_get_user_status($user_id);
                                $user_status_badge = "<span class='badge badge-enabled'>ENABLED</span>";

                                if($user_status === "DISABLED")
                                    $user_status_badge = "<span class='badge badge-disabled'>DISABLED</span>";

                                $user_data_url = admin_url('admin.php?page=yasbil_wp&user_id='.$user_id, 'https');
                                $user_name = $user_info->user_login;
                                $user_name_link = '<a title="View Uploaded Data" target="_blank" href="'.$user_data_url.'">'
                                    .$user_name
                                    .'</a>';

                                $tbl_sessions = $wpdb->prefix . "yasbil_sessions";
                                $tbl_pagevisits = $wpdb->prefix . "yasbil_session_pagevisits";

                                //fix: added IF() for when session_end_ts = 0 (not recorded)

                                $sql_select_summary_stats = "
                            SELECT COUNT(DISTINCT s.session_guid) session_ct
                                , COUNT(DISTINCT pv.hist_ts) pv_ct
                                , AVG(distinct(IF(s.session_end_ts<>0, s.session_end_ts, s.session_start_ts) - s.session_start_ts)) avg_session_dur_ms
                                , round(COUNT(DISTINCT pv.hist_ts) / COUNT(DISTINCT s.session_guid), 1) pv_per_session
                                , MAX(pv.pv_ts) last_activity
                                , s.session_tz_offset
                            FROM $tbl_sessions s,
                                $tbl_pagevisits pv
                            WHERE 1=1 
                            AND s.session_guid = pv.session_guid
                            AND s.user_id = %s
                        ";

                                $row_stats = $wpdb->get_row(
                                    $wpdb->prepare($sql_select_summary_stats, $user_id),
                                    ARRAY_A
                                );

                                $tz_off = $row_stats['session_tz_offset'];

                                ?>
                                <tr>
                                    <td>
                                        <label for="yasbil_select_user_<?=$user_id?>">
                                            <input type="checkbox"
                                                   name='yasbil_select_users[]'
                                                   id="yasbil_select_user_<?=$user_id?>"
                                                   title="Select User <?=$user_id?> (<?=$user_name?>) to activate / deactivate"
                                                   value="<?=$user_id?>">
                                            <?=$user_id?>
                                            &nbsp;
                                            <?=$user_status_badge?>
                                        </label>

                                    </td>
                                    <td><?=$user_name_link?></td>
                                    <td><?=$row_stats['session_ct']?></td>
                                    <td><?=$row_stats['pv_ct']?></td>
                                    <td><?=$this->yasbil_display_dur($row_stats['avg_session_dur_ms'])?></td>
                                    <td><?=$row_stats['pv_per_session']?></td>
                                    <td><?=$this->yasbil_milli_to_str($row_stats['last_activity'], $tz_off)?></td>
                                </tr>

                                <?php
                            } // --------- end participants loop -------------
                            ?>
                            </tbody>

                        </table>


                    </div> <!-- table wrapper -->

                    <p class="submit">
                        <input type="submit" name="yasbil_set_user_enabled" id="submit-enable"
                               class="button button-primary" value="Enable Users">
                        &nbsp;&nbsp;
                        <input type="submit" name="yasbil_set_user_disabled" id="submit-deactivate"
                               class="button button-secondary" value="Disable Users">
                    </p>
                    </form>

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

        $project_detail = $this->yasbil_get_user_project($user_id);
        $project_name = $project_detail[1];
        $user_name = $user_data->user_login;

?>

        <!-- Bootstrap CSS -->
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
        <!-- Option 1: Bootstrap Bundle with Popper -->
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous"></script>
        <!-- datatables searchbuilder-->
        <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.23/css/jquery.dataTables.min.css">
        <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/searchbuilder/1.1.0/css/searchBuilder.dataTables.min.css">
        <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/datetime/1.1.0/css/dataTables.dateTime.min.css">
        <!-- datatables searchpane-->
        <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/searchpanes/1.3.0/css/searchPanes.dataTables.min.css">
        <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/select/1.3.3/css/select.dataTables.min.css">
        <!-- datatables rowgroup-->
        <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/rowgroup/1.1.3/css/rowGroup.dataTables.min.css">

        <script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/1.10.23/js/jquery.dataTables.min.js"></script>
        <!-- datatables searchbuilder-->
        <script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/searchbuilder/1.1.0/js/dataTables.searchBuilder.min.js"></script>
        <script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/datetime/1.1.0/js/dataTables.dateTime.min.js"></script>
        <!-- datatables searchpane-->
        <script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/searchpanes/1.3.0/js/dataTables.searchPanes.min.js"></script>
        <script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/select/1.3.3/js/dataTables.select.min.js"></script>
        <!-- datatables rowgroup-->
        <script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/rowgroup/1.1.3/js/dataTables.rowGroup.min.js"></script>

        <!-- datatables buttons-->
        <script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/buttons/1.6.5/js/dataTables.buttons.min.js"></script>
        <!-- export -->
        <script type="text/javascript" charset="utf8" src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.3/jszip.min.js"></script>
        <script type="text/javascript" charset="utf8" src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.53/pdfmake.min.js"></script>
        <script type="text/javascript" charset="utf8" src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.53/vfs_fonts.js"></script>
        <script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/buttons/1.6.5/js/buttons.html5.min.js"></script>
        <script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/buttons/1.6.5/js/buttons.print.min.js"></script>

        <style>
            /*table caption {*/
            /*    font-size: 18px;*/
            /*}*/

            body {
                background: #f0f0f1 !important;
                color: #3c434a !important;
                font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif;
                font-size: 13px !important;
                line-height: 1.4em !important;
                min-width: 600px !important;
            }

            hr{opacity: 1!important;}

            .dataTables_length select {
                width: 60px !important;
                padding: 0px 5px !important;
            }

            div.dtsb-searchBuilder div.dtsb-group div.dtsb-criteria select.dtsb-dropDown,
            div.dtsb-searchBuilder div.dtsb-group div.dtsb-criteria input.dtsb-input {
                min-width: 200px;
            }

            div.dtsp-panesContainer div.dtsp-searchPanes div.dtsp-searchPane div.dtsp-topRow div.dtsp-searchCont input.dtsp-search {
                border: 1px solid #aaa !important;
                border-radius: 4px !important;
                padding-left: 5px !important;
                margin-bottom: 3px;
                margin-left: 0px;
            }

            div.dtsp-panesContainer div.dtsp-searchPanes div.dtsp-searchPane {
                flex-grow: 1;
                flex-shrink: 0;
                font-size: .9em;
                /* margin-top: 5px; */
                /* border: 1px dashed#ccc; */
                /* border-top: 1px solid #777; */
                padding-bottom: 10px;
            }

            div.table-wrapper {
                /*padding: 10px;*/
                /*background: white;*/
            }

            div.nav-content-wrapper {
                background: white;
                padding: 10px;
            }

            div.tab-content {
                border-top: 2px dashed #ddd;
                padding-top: 10px;
            }
        </style>

        <script>
            // https://stackoverflow.com/a/31637900
            function html_encode(e)
            {
                const res = JSON.stringify(e, null, 2);
                return res;
            }
        </script>

        <div class="wrap">

<?php

        if ( current_user_can('administrator'))
        {
            //show participant details only to administrator
?>
            <h1>Participant Details</h1>

            <p style="font-size:16px">
                <b>Project:</b>
                <?=$project_name?>

                &nbsp; &bull; &nbsp;

                <b>User ID:</b>
                <?=$user_id?>
                &nbsp; &bull; &nbsp;

                <b>User Name:</b>
                <?=$user_name?>
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

            <p>All timestamps are in participant's local time.</p>
<?php
        $tbl_sessions = $wpdb->prefix . "yasbil_sessions";

        $sql_select_sessions = "
            SELECT *
            FROM $tbl_sessions s
            WHERE 1=1
            and s.user_id = %s
            ORDER BY s.session_start_ts desc
        ";

        $db_res_sessions = $wpdb->get_results(
            $wpdb->prepare($sql_select_sessions, $user_id),
            ARRAY_A
        );

        // -------- start sessions loop ------------
        $session_disp_num = 0;
        foreach ($db_res_sessions as $row_s)
        {
            $session_guid = $row_s['session_guid'];
            $tz_off = $row_s['session_tz_offset'];
            $session_disp_num++;
?>
            <hr style="border: 1px solid #777; margin: 20px 0px 10px;">

            <h1>
                Session ID:
                <?=$row_s['session_id']?>
                (<?=$this->yasbil_truncate_str($row_s['session_guid'],9)?>)
            </h1>

            <p style="font-size:16px">
                <b>Start Time:</b>
                <?=$this->yasbil_milli_to_str($row_s['session_start_ts'], $tz_off, true)?>
                &nbsp; &bull; &nbsp;
                <b>End Time:</b>
                <?=$this->yasbil_milli_to_str($row_s['session_end_ts'], $tz_off, true)?>
                &nbsp; &bull; &nbsp;
                <b>Duration:</b>
                <?=$this->yasbil_display_dur_diff($row_s['session_start_ts'], $row_s['session_end_ts'])?>

                <br/>

                <b>Platform:</b>
                <?="{$row_s['platform_os']} {$row_s['platform_arch']} {$row_s['platform_nacl_arch']}"?>
                &nbsp; &bull; &nbsp;
                <b>Browser:</b>
                <?="{$row_s['browser_vendor']} {$row_s['browser_name']} {$row_s['browser_version']}"?>
                &nbsp; &bull; &nbsp;
                <b>Synced:</b>
                <?=$this->yasbil_milli_to_str($row_s['sync_ts'], $tz_off, true)?>
            </p>

            <div class="nav-content-wrapper">

                <!-- Nav tabs for various tables-->
                <ul class="nav nav-pills" id="nav_tabs_<?=$row_s['session_id']?>" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active"
                                id="btn-pagevisits_<?=$row_s['session_id']?>" data-bs-toggle="tab"
                                data-bs-target="#tab_pagevisits_<?=$row_s['session_id']?>"
                                type="button" role="tab" aria-controls="tab_pagevisits_<?=$row_s['session_id']?>" aria-selected="true"
                        >Page Visits</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link"
                                id="btn-mouse_<?=$row_s['session_id']?>" data-bs-toggle="tab"
                                data-bs-target="#tab_mouse_<?=$row_s['session_id']?>"
                                type="button" role="tab" aria-controls="tab_mouse_<?=$row_s['session_id']?>" aria-selected="false"
                        >Mouse Events</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link"
                                id="btn-serp_<?=$row_s['session_id']?>" data-bs-toggle="tab"
                                data-bs-target="#tab_serp_<?=$row_s['session_id']?>"
                                type="button" role="tab" aria-controls="tab_serp_<?=$row_s['session_id']?>" aria-selected="false"
                        >SERPs</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link"
                                id="btn-webnav_<?=$row_s['session_id']?>" data-bs-toggle="tab"
                                data-bs-target="#tab_webnav_<?=$row_s['session_id']?>"
                                type="button" role="tab" aria-controls="tab_webnav_<?=$row_s['session_id']?>" aria-selected="false"
                        >Web Events</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link"
                                id="btn-largestring_<?=$row_s['session_id']?>" data-bs-toggle="tab"
                                data-bs-target="#tab_largestring_<?=$row_s['session_id']?>"
                                type="button" role="tab" aria-controls="tab_largestring_<?=$row_s['session_id']?>" aria-selected="false"
                        >Text Content</button>
                    </li>
                </ul>

                <!-- ALL Tab panes -->
                <div class="tab-content">

                    <!--------------------- PageVisits ----------------------->
                    <div id="tab_pagevisits_<?=$row_s['session_id']?>" class="tab-pane active" role="tabpanel" aria-labelledby="pagevisits-tab">
<?php
                    $tbl_pagevisits = $wpdb->prefix . "yasbil_session_pagevisits";

                    $sql_select_pv = "
                        SELECT *
                        FROM $tbl_pagevisits pv
                        WHERE 1=1
                        and pv.session_guid = %s
                        -- group by pv.hist_ts
                        ORDER BY pv.pv_ts asc
                    ";

                    $db_res_pv =  $wpdb->get_results(
                        $wpdb->prepare($sql_select_pv, $session_guid),
                        ARRAY_A
                    );

                    // --------- start pagevisit loop - for rows of table -------------
                    $arr_datatable = array();

                    // for displaying window and tab numbers as 1,2...
                    $win_num = 1; $tab_num = 1;
                    $arr_win = array(); $arr_tab = array();

                    foreach ($db_res_pv as $row_pv)
                    {
                        if(!array_key_exists($row_pv['win_id'], $arr_win)) {
                            $arr_win[$row_pv['win_id']] = $win_num++;
                        }

                        if(!array_key_exists($row_pv['tab_id'], $arr_tab)) {
                            $arr_tab[$row_pv['tab_id']] = $tab_num++;
                        }

                        // add data to display array
                        $arr_datatable[] = [
                            //time
                            $this->yasbil_milli_to_str($row_pv['pv_ts'], $tz_off),
                            //window | tab
                            sprintf(
                                "%s | %s",
                                $arr_win[$row_pv['win_id']],
                                $arr_tab[$row_pv['tab_id']]
                            ),
                            //url
                            sprintf(
                                "<a href='%s' target='_blank'>%s</a>",
                                esc_url($row_pv['pv_url']),
                                $row_pv['pv_hostname']
                            ),
                            // nav event
                            str_replace('.', ' ', $row_pv['pv_event']),
                            // page title
                            str_replace(
                                ['.',  '+',  '?',  '/',  '='],
                                ['. ', '+ ', '? ', '/ ', '= '],
                                $row_pv['pv_title']
                            ),
                            //text_size
                            $this->yasbil_strsize($this->yasbil_hash2string($row_pv['pv_page_text'])),
                            //html size
                            $this->yasbil_strsize($this->yasbil_hash2string($row_pv['pv_page_html'])),
                            //transition
                            str_ireplace('YASBIL_', '', $row_pv['pv_transition_type']),
                            // search engine, search query
                            "{$row_pv['pv_search_engine']} {$row_pv['pv_search_query']}"
                        ];

                    } // --------- end pagevisit loop -------------

                    $js_data = json_encode($arr_datatable, JSON_INVALID_UTF8_SUBSTITUTE);

                    if (!$js_data)
                    {
                        echo "<div class='alert alert-danger'>"
                            . json_last_error_msg()
                            ."</div>";

                        $js_data = "[]";
                    }

?>
                        <div class="table-wrapper">
                            <table id="table_pv_<?=$row_s['session_id']?>" class="display">
                                <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>Window | Tab</th>
                                    <th>URL</th>
                                    <th>Navigation Event</th>
                                    <th>Page Title</th>
                                    <th>Text Size (k)</th>
                                    <th>HTML Size (k)</th>
                                    <th>
                                        <a target="_blank"
                                           href="https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/history/TransitionType"
                                        >Transition</a>
                                    </th>
                                    <th>[Search Engine] Search Query</th>
                                </tr>
                                </thead>
                            </table>
                        </div> <!-- table wrapper -->

                        <script>
                            const data_pv_<?=$row_s['session_id']?> = <?=$js_data?>;

                            jQuery('#table_pv_<?=$row_s['session_id']?>').DataTable({
                                data: data_pv_<?=$row_s['session_id']?>,
                                pageLength: 10, autoWidth: false, searchBuilder: true,
                                searchPanes: {cascadePanes: true, viewTotal: true},
                                language: {searchPanes: {countFiltered: '{shown} / {total}'}},
                                dom: 'QPlfritBip', buttons: ['copy', 'csv', 'excel'], //'pdf', 'print'],
                                columnDefs: [
                                    {targets: [7], searchPanes: {header: 'Transition'},},
                                    {targets: [0], searchPanes: {show: false},}
                                ],
                            });

                            // rebuild search pane sometime after user clicks tab button
                            // to fix broken layout of search panes
                            jQuery('#btn-pagevisits_<?=$row_s['session_id']?>').click(function () {
                                setTimeout(function(){
                                    jQuery('#table_pv_<?=$row_s['session_id']?>').DataTable().searchPanes.rebuildPane();
                                }, 10);
                            });
                        </script>
                    </div> <!-------- end: PageVisits ------->


                    <!--------------------- Mouse ----------------------->
                    <div id="tab_mouse_<?=$row_s['session_id']?>"  class="tab-pane"  role="tabpanel" aria-labelledby="mouse-tab">
<?php
                    $tbl_mouse = $wpdb->prefix . "yasbil_session_mouse";

                    $sql_select_mouse = "
                        SELECT *
                        FROM $tbl_mouse m
                        WHERE 1=1
                        and m.session_guid = %s
                        ORDER BY m.m_ts asc
                    ";

                    $db_res_mouse =  $wpdb->get_results(
                        $wpdb->prepare($sql_select_mouse, $session_guid),
                        ARRAY_A
                    );

                    // --------- start mouse loop - for rows of table -------------
                    $arr_datatable = [];
                    foreach ($db_res_mouse as $row_m)
                    {
                        // ------ start: run-length-encoding (RLE) for dom-path --------
                        // https://www.geeksforgeeks.org/run-length-encoding/
                        $dom_path_str = $this->yasbil_hash2string($row_m['dom_path']);
                        $dom_path_arr = explode('|', $dom_path_str);
                        $dom_path_rle = "";

                        $n = count($dom_path_arr);
                        for ($i = 0; $i < $n ; $i++)
                        {
                            // Count occurrences of current character
                            $count = 1;
                            while (
                                $i < $n - 1
                                &&
                                $dom_path_arr[$i] == $dom_path_arr[$i + 1]
                            )
                            {
                                $count++;
                                $i++;
                            }

                            //add element
                            $dom_path_rle .= $dom_path_arr[$i];
                            // add count if > 1
                            $dom_path_rle .= $count > 1 ? "<sup>$count</sup>" : "";
                            // add separator if not last element
                            $dom_path_rle .= $i < $n - 1 ? " > " : "";
                        }
                        // ------- end: run length encoding --------

                        // add data to display array
                        $arr_datatable[] = [
                            //time
                            $this->yasbil_milli_to_str($row_m['m_ts'], $tz_off),
                            //url
                            sprintf(
                                "<a href='%s' target='_blank'>%s</a>",
                                esc_url($row_m['m_url']),
                                parse_url($row_m['m_url'], PHP_URL_HOST)
                            ),
                            // event
                            sprintf(
                                "%s",
                                str_ireplace('MOUSE_', '', $row_m['m_event'])
                            ),
                            // hover dur
                            $row_m['m_event'] == "MOUSE_HOVER" ? round($row_m['hover_dur']/1000, 1) : "",
                            // Page Dim
                            sprintf(
                                "%s x %s",
                                $row_m['page_w'], $row_m['page_h']
                            ),
                            // Mouse Loc x, y (%, %)
                            sprintf(
                              "%s, %s (%s, %s)",
                                $row_m['mouse_x'], $row_m['mouse_y'],
                                round($row_m['mouse_x']/$row_m['page_w']*100, 0),
                                round($row_m['mouse_y']/$row_m['page_h']*100, 0)
                            ),
                            // Viewport as Page Height %
                            sprintf(
                                "%s &dash; %s",
                                round($row_m['page_scrolled_y']/$row_m['page_h']*100, 0),
                                round(($row_m['page_scrolled_y'] + $row_m['viewport_h'])/$row_m['page_h']*100, 0)
                            ),
                            // Target
                            mb_substr(
                                $this->yasbil_hash2string($row_m['target_text']),
                                0, 50, "UTF-8"
                            ),
                            // Closest Anchor Tag
                            mb_substr(
                                $this->yasbil_hash2string($row_m['closest_a_text']),
                                0, 50, "UTF-8"
                            ),
                            // DOM Path
                            $dom_path_rle,
                        ];

                    } // --------- end mouse loop -------------

                    $js_data = json_encode($arr_datatable, JSON_INVALID_UTF8_SUBSTITUTE);

                    if (!$js_data)
                    {
                        echo "<div class='alert alert-danger'>"
                        . json_last_error_msg()
                        ."</div>";

                        $js_data = "[]";
                    }

?>
                        <div class="table-wrapper">
                            <table id="table_mouse_<?=$row_s['session_id']?>" class="display">
                                <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>URL</th>
                                    <th>Event</th>
                                    <th>Hover Dur</th>
                                    <th>Page Dim<br/>w x h</th>
                                    <th>Mouse Loc<br/>x, y (%, %)</th>
                                    <th>Viewport as Page Height %</th>
                                    <th>Target</th>
                                    <th>Closest Anchor Tag</th>
                                    <th>DOM Path</th>
                                </tr>
                            </table>
                        </div> <!-- table wrapper -->

                        <script>
                            const data_mouse_<?=$row_s['session_id']?> = <?=$js_data?>;

                            jQuery('#table_mouse_<?=$row_s['session_id']?>').DataTable({
                                data: data_mouse_<?=$row_s['session_id']?>,
                                pageLength: 10, autoWidth: false, searchBuilder: true,
                                searchPanes: {cascadePanes: true, viewTotal: true},
                                language: {searchPanes: {countFiltered: '{shown} / {total}'}},
                                dom: 'QPlfritBip', buttons: ['copy', 'csv', 'excel'], //'pdf', 'print'],
                                columnDefs: [
                                    {targets: [0], searchPanes: {show: false},},
                                    {targets: [4], searchPanes: {header: 'Page Dim'},},
                                    {targets: [5], searchPanes: {header: 'Mouse Loc'},},
                                    {targets: [6], searchPanes: {header: 'Viewport'},},
                                ],
                            });

                            // rebuild search pane sometime after user clicks tab button
                            // to fix broken layout of search panes
                            jQuery('#btn-mouse_<?=$row_s['session_id']?>').click(function () {
                                setTimeout(function(){
                                    jQuery('#table_mouse_<?=$row_s['session_id']?>').DataTable().searchPanes.rebuildPane();
                                }, 10);
                            });
                        </script>
                    </div> <!-------- end: Mouse ------->


                    <!--------------------- SERP ----------------------->
                    <div id="tab_serp_<?=$row_s['session_id']?>" class="tab-pane"  role="tabpanel" aria-labelledby="serps-tab">
<?php
                        $tbl_serp = $wpdb->prefix . "yasbil_session_serp";

                        $sql_select_serp = "
                            SELECT *
                            FROM $tbl_serp serp
                            WHERE 1=1
                            and serp.session_guid = %s
                            ORDER BY serp.serp_ts asc
                        ";

                        $db_res_serp =  $wpdb->get_results(
                            $wpdb->prepare($sql_select_serp, $session_guid),
                            ARRAY_A
                        );

                        // --------- start serp loop - for rows of table -------------
                        $arr_datatable = [];
                        foreach ($db_res_serp as $row_serp)
                        {

                            $json_arr = json_decode($row_serp['scraped_json_arr'], true);

                            //TODO: hydrate (hash2string) inner
                            for($row_i = 0; $row_i < count($json_arr); $row_i++)
                            {
                                $inner_t = $this->yasbil_hash2string($json_arr[$row_i]['inner_text']);
                                $inner_h = $this->yasbil_hash2string($json_arr[$row_i]['inner_html']);

                                $json_arr[$row_i]['inner_text'] = $inner_t;
                                $json_arr[$row_i]['inner_html'] = $inner_h;
                            }

                            //$json_arr_str = json_encode($json_arr, JSON_PRETTY_PRINT|JSON_HEX_QUOT|JSON_HEX_APOS );

                            $json_arr_str = htmlspecialchars(json_encode($json_arr, JSON_PRETTY_PRINT|JSON_INVALID_UTF8_SUBSTITUTE), ENT_QUOTES, 'UTF-8');

                            // full data html
                            $full_data_html = "N/A";

                            if(count($json_arr) > 0)
                            {
                                $full_data_html = "
                                    <button class=\"btn btn-outline-secondary btn-sm\"
                                            data-bs-toggle=\"modal\"
                                            data-bs-target=\"#modal_serp_{$row_s['session_id']}\"
                                            data-longtext=\"$json_arr_str\"
                                            type=\"button\">
                                        View Full JSON
                                    </button>
                                ";
                            }

                            // add data to display array
                            $arr_datatable[] = [
                                //time
                                $this->yasbil_milli_to_str($row_serp['serp_ts'], $tz_off),
                                //url
                                sprintf(
                                    "<a href='%s' target='_blank'>%s</a>",
                                    esc_url($row_serp['serp_url']),
                                    parse_url($row_serp['serp_url'], PHP_URL_HOST)
                                ),
                                // search engine
                                $row_serp['search_engine'],
                                // search query
                                $row_serp['search_query'],
                                // serp offset
                                $row_serp['serp_offset'],
                                // data length
                                count($json_arr),
                                // full data
                                $full_data_html,
                            ];
                        } // --------- end serp loop -------------

                        $js_data = json_encode($arr_datatable, JSON_INVALID_UTF8_SUBSTITUTE);

                        if (!$js_data)
                        {
                            echo "<div class='alert alert-danger'>"
                                . json_last_error_msg()
                                ."</div>";

                            $js_data = "[]";
                        }

?>
                        <div class="table-wrapper">
                            <table id="table_serp_<?=$row_s['session_id']?>" class="display">
                                <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>URL</th>
                                    <th>Search Engine</th>
                                    <th>Search Query</th>
                                    <th>SERP Offset</th>
                                    <th>Data Length</th>
                                    <th>Full Data</th>
                                </tr>
                                </thead>
                            </table>
                        </div> <!-- table wrapper -->

                        <!-- modal to display SERP scraped array -->
                        <div id="modal_serp_<?=$row_s['session_id']?>" class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                            <div class="modal-dialog modal-dialog-scrollable modal-xl">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                    </div>
                                    <div class="modal-body text-dark bg-light">
                                        <pre class="longtext_body" style="font-size: 100%; overflow: initial"></pre>
                                    </div>
                                    <div class="modal-footer">
                                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <script>
                            const data_serp_<?=$row_s['session_id']?> = <?=$js_data?>;

                            jQuery('#table_serp_<?=$row_s['session_id']?>').DataTable({
                                data: data_serp_<?=$row_s['session_id']?>,
                                pageLength: 10, autoWidth: false, searchBuilder: true,
                                searchPanes: {cascadePanes: true, viewTotal: true},
                                language: {searchPanes: {countFiltered: '{shown} / {total}'}},
                                dom: 'QPlfritBip', buttons: ['copy', 'csv', 'excel'], //'pdf', 'print'],
                                columnDefs: [{searchPanes: {show: false}, targets: [0]},],
                            });

                            // rebuild search pane sometime after user clicks tab button
                            // to fix broken layout of search panes
                            jQuery('#btn-serp_<?=$row_s['session_id']?>').click(function () {
                                setTimeout(function(){
                                    jQuery('#table_serp_<?=$row_s['session_id']?>').DataTable().searchPanes.rebuildPane();
                                }, 10);
                            });

                            //show SERP array on button click
                            jQuery("#modal_serp_<?=$row_s['session_id']?>").on('show.bs.modal', function (e)
                            {
                                const triggerLink = jQuery(e.relatedTarget);
                                const longtext = html_encode(triggerLink.data('longtext'));
                                jQuery(this).find(".modal-body .longtext_body").text(longtext);
                            });

                        </script>

                    </div> <!-------- end: SERP ------->


                    <!--------------------- WebNav ----------------------->
                    <div id="tab_webnav_<?=$row_s['session_id']?>" class="tab-pane"  role="tabpanel" aria-labelledby="webnav-tab">
<?php
                        $tbl_webnav = $wpdb->prefix . "yasbil_session_webnav";

                        $sql_select_webnav = "
                            SELECT *
                            FROM $tbl_webnav w
                            WHERE 1=1
                            and w.session_guid = %s
                            ORDER BY w.webnav_ts asc
                        ";

                        $db_res_webnav =  $wpdb->get_results(
                            $wpdb->prepare($sql_select_webnav, $session_guid),
                            ARRAY_A
                        );

                        // for displaying window and tab numbers as 1,2...
                        $tab_num = 1; $arr_tab = array();

                        // --------- start webnav loop - for rows of table -------------
                        $arr_datatable = [];
                        foreach ($db_res_webnav as $row_w)
                        {
                            if(!array_key_exists($row_w['tab_id'], $arr_tab)) {
                                $arr_tab[$row_w['tab_id']] = $tab_num++;
                            }

                            // add data to display array
                            $arr_datatable[] = [
                                //time
                                $this->yasbil_milli_to_str($row_w['webnav_ts'], $tz_off),
                                //tab
                                $arr_tab[$row_w['tab_id']],
                                //url
                                sprintf(
                                    "<a href='%s' target='_blank'>%s</a>",
                                    esc_url($row_w['webnav_url']),
                                    parse_url($row_w['webnav_url'], PHP_URL_HOST)
                                ),
                                // event
                                str_replace('.', ' ', $row_w['webnav_event']),
                                // transition
                                sprintf(
                                    "%s %s",
                                    $row_w['webnav_transition_type'],
                                    $row_w['webnav_transition_qual']
                                ),
                            ];
                        } // --------- end webnav loop -------------

                        $js_data = json_encode($arr_datatable, JSON_INVALID_UTF8_SUBSTITUTE);

                        if (!$js_data)
                        {
                            echo "<div class='alert alert-danger'>"
                                . json_last_error_msg()
                                ."</div>";

                            $js_data = "[]";
                        }
?>
                        <div class="table-wrapper">
                            <table id="table_webnav_<?=$row_s['session_id']?>" class="display">
                                <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>Tab</th>
                                    <th>URL</th>
                                    <th>Event</th>
                                    <th>Transition</th>
                                </tr>
                                </thead>
                            </table>
                        </div> <!-- table wrapper -->

                        <script>
                            const data_webnav_<?=$row_s['session_id']?> = <?=$js_data?>;

                            jQuery('#table_webnav_<?=$row_s['session_id']?>').DataTable({
                                data: data_webnav_<?=$row_s['session_id']?>,
                                pageLength: 10, autoWidth: false, searchBuilder: true,
                                searchPanes: {cascadePanes: true, viewTotal: true},
                                language: {searchPanes: {countFiltered: '{shown} / {total}'}},
                                dom: 'QPlfritBip', buttons: ['copy', 'csv', 'excel'], //'pdf', 'print'],
                                rowGroup: {dataSrc: 2},
                                columnDefs: [{searchPanes: {show: false}, targets: [0]},],
                            });

                            // rebuild search pane sometime after user clicks tab button
                            // to fix broken layout of search panes
                            jQuery('#btn-webnav_<?=$row_s['session_id']?>').click(function () {
                                setTimeout(function(){
                                    jQuery('#table_webnav_<?=$row_s['session_id']?>').DataTable().searchPanes.rebuildPane();
                                }, 10);
                            });

                        </script>
                    </div>  <!-------- end: WebNav ------->


                    <!--------------------- Largestring ----------------------->
                    <div id="tab_largestring_<?=$row_s['session_id']?>" class="tab-pane"  role="tabpanel" aria-labelledby="largestring-tab">
                        <div class="alert alert-info">
                            Across all sessions. So only shown in the top/last session
                        </div>
<?php
                    $tbl_largestring = $wpdb->prefix . "yasbil_largestring";

                    // double %%s for wpdab()
                    // https://wordpress.stackexchange.com/a/140688
                    $sql_select_largestring = "
                        SELECT FROM_UNIXTIME(l.sync_ts/1000, '%%Y-%%m-%%d %%H:%%i') sync_time_mins
                             , count(distinct l.string_guid) n_rows
                             , sum(LENGTH(l.string_body)) tot_str_len
                        FROM $tbl_largestring l
                        WHERE 1 = $session_disp_num 
                        and l.user_id = %s
                        group by 1
                        order by 1 desc
                    ";

                    //1=XX to show this table only in the top session
                    // tab (to reduce page size)


                    $db_res_largestring =  $wpdb->get_results(
                        $wpdb->prepare($sql_select_largestring, $user_id),
                        ARRAY_A
                    );

                    // --------- start largestring loop - for rows of table -------------
                    $arr_datatable = [];
                    foreach ($db_res_largestring as $row_ls)
                    {
                        // add data to display array
                        $arr_datatable[] = [
                            //sync time
                            $row_ls['sync_time_mins'],
                            // # rows
                            $row_ls['n_rows'],
                            // size
                            $this->yasbil_hr_size($row_ls['tot_str_len']),
                            //url
                            /*sprintf(
                                "<a href='%s' target='_blank'>%s</a>",
                                esc_url($row_ls['src_url']),
                                parse_url($row_ls['src_url'], PHP_URL_HOST)
                            ),*/
                        ];
                    } // --------- end largestring loop -------------

                    $js_data = json_encode($arr_datatable, JSON_INVALID_UTF8_SUBSTITUTE);

                    if (!$js_data)
                    {
                        echo "<div class='alert alert-danger'>"
                            . json_last_error_msg()
                            ."</div>";

                        $js_data = "[]";
                    }

                    if($session_disp_num == 1)
                    {
?>
                        <div class="table-wrapper">
                            <table id="table_ls_<?=$row_s['session_id']?>" class="display">
                                <thead>
                                <tr>
                                    <th>Sync Time</th>
                                    <th># Rows</th>
                                    <th>Upload Size</th>
                                </tr>
                                </thead>
                            </table>
                        </div> <!-- table wrapper -->

                        <script>
                            const data_largestring_<?=$row_s['session_id']?> = <?=$js_data?>;

                            jQuery('#table_ls_<?=$row_s['session_id']?>').DataTable({
                                data: data_largestring_<?=$row_s['session_id']?>,
                                order: [[ 0, "desc" ]],
                                pageLength: 10, autoWidth: false, searchBuilder: true,
                                searchPanes: {cascadePanes: true, viewTotal: true},
                                language: {searchPanes: {countFiltered: '{shown} / {total}'}},
                                dom: 'QPlfritBip', buttons: ['copy', 'csv', 'excel'], //'pdf', 'print'],
                                columnDefs: [{ className: "text-end", targets: [ 1,2 ] }],
                            });

                            // rebuild search pane sometime after user clicks tab button
                            // to fix broken layout of search panes
                            jQuery('#btn-largestring_<?=$row_s['session_id']?>').click(function () {
                                setTimeout(function(){
                                    jQuery('#table_ls_<?=$row_s['session_id']?>').DataTable().searchPanes.rebuildPane();
                                }, 10);
                            });

                        </script>
<?php              } // if session_disp_num > 1
?>

                    </div>  <!-------- end: LargeString ------->

                </div> <!-- end: tab-content -->

            </div> <!-- end: nav-content-wrapper -->


<?php

        } // --------- end session loop -------------

?>
        </div> <!--  end .wrap: html render -->
<?php

    } // end render function










//-------------------------- END: HTML Renders --------------------------------







//-------------------------- START: Data Sync Functions --------------------------------


    /**
     * Check if a given request has access to sync yasbil data:
     * check authentication; check if user is active, and assigned to project
     *
     * @param WP_REST_Request $request Full data about the request.
     * @return WP_Error|bool
     */
    function yasbil_sync_check_permission( $request )
    {
        /**
         * Restrict YASBIL endpoints to only users who have the read capability (subscriber and above).
         */
        // https://developer.wordpress.org/rest-api/extending-the-rest-api/routes-and-endpoints/#permissions-callback

        $result = false;

        if(current_user_can( 'read' ))
        {
            $current_user = wp_get_current_user();
            $user_id = $current_user->ID;

            $user_status = $this->yasbil_get_user_status($user_id);

            //if user is enabled to sync data
            if($user_status === "ENABLED")
            {
                //if user is assigned to a project
                $project_detail = $this->yasbil_get_user_project($user_id);

                // project_id is not the default project (0)
                // ie user is actually assigned to a project
                if($project_detail[0] !== 0)
                    $result = true;
            }
        }


        return $result;
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



    function yasbil_sync_check_connection( $request )
    {
        $response_body = [];
        $response_body['code'] = 'yasbil_connection_success';

        $response = new WP_REST_Response( $response_body );
        $response->set_status( 201 );

        return $response;
    }




    // single function to sync all tables
    public function yasbil_sync_table( $request )
    {
        /***
        JSON body format:
        {
        'table_name': 'yasbil_session_webnav',
        'client_pk_col': 'webnav_guid',
        'num_rows': 23, (not required)
        'data_rows': [ {row 1 obj}, {row 2 obj}, ... {row n obj}, ]
        }
         */

        try
        {
            //TODO: check authentication (whether participant is active)

            global $wpdb;

            $json_body = $request->get_json_params();

            $current_user = wp_get_current_user();
            $user_id = $current_user->ID;
            $user_name = $current_user->user_login;

            // sanitize_key(): Keys are used as internal identifiers. Lowercase
            // alphanumeric characters, dashes, and underscores are allowed.
            $tbl_name = $wpdb->prefix . sanitize_text_field($json_body['table_name']);
            $client_pk_col = sanitize_text_field($json_body['client_pk_col']);

            $project_detail = $this->yasbil_get_user_project($user_id);
            $project_id = $project_detail[0];
            $project_name = $project_detail[1];

            $sync_ts = $this->yasbil_get_millitime();
            $data_rows = $json_body['data_rows'];

            // auto increment columns; need not be inserted
            $arr_auto_cols = [
                "session_id",
                "pv_id",
                "m_id",
                "webnav_id",
            ];

            // comma separated list of all columns
            $arr_col_names = $wpdb->get_col("DESC {$tbl_name}", 0);
            $sql_col_csv = ""; //implode( ', ', $arr_col_names );
            $sql_placeholder_csv = "";

            // loop over columns
            foreach ( $arr_col_names as $col_name )
            {
                if(!in_array($col_name, $arr_auto_cols))
                {
                    $sql_col_csv .= "$col_name,";
                    $sql_placeholder_csv .= "%s,";
                }
            }

            //remove last comma(s)
            $sql_col_csv = rtrim($sql_col_csv, ', ');
            $sql_placeholder_csv = rtrim($sql_placeholder_csv, ', ');

            // sql insert statement
            $sql_insert = "INSERT INTO $tbl_name ($sql_col_csv) VALUES";

            $values = array();
            $place_holders = array();

            foreach ( $data_rows as $row )
            {
                // loop over columns
                foreach ( $arr_col_names as $col_name )
                {
                    if(!in_array($col_name, $arr_auto_cols))
                    {
                        switch ($col_name)
                        {
                            case "project_id":
                                $values[] = $project_id;
                                break;
                            case "project_name":
                                $values[] = $project_name;
                                break;
                            case "user_id":
                                $values[] = $user_id;
                                break;
                            case "user_name":
                                $values[] = $user_name;
                                break;
                            case "sync_ts":
                                $values[] = $sync_ts;
                                break;
                            default:
                                //options for sanitizing
                                // sanitize_text_field
                                // sanitize_textarea_field
                                // mysqli_real_escape_string
                                // htmlentities
                                /*function test_input($data) {
                                    $data = trim($data);
                                    $data = stripslashes($data);
                                    $data = htmlspecialchars($data);
                                    return $data;
                                }*/
                                // using "prepare" so perhaps not required
                                $values[] = $row[$col_name];
                                break;
                        }
                    }
                } // end: loop over cols
                $place_holders[] = "($sql_placeholder_csv)";
            } //end: loop over data rows

            $sql_insert .= implode( ', ', $place_holders );
            if( false === $wpdb->query( $wpdb->prepare( "$sql_insert ", $values ) ))
            {
                return new WP_Error('db_query_error', $wpdb->last_error, array('status' => 400));
            }

            $arr_synced_rows = $wpdb->get_results( $wpdb->prepare("
                    SELECT $client_pk_col 
                    FROM $tbl_name 
                    WHERE sync_ts = %s",
                $sync_ts
            ), ARRAY_A);

            $arr_synced_pks = array();

            foreach ($arr_synced_rows as $row) {
                $arr_synced_pks[] = $row[$client_pk_col];
            }

            $return_obj = array();
            $return_obj['sync_ts'] = $sync_ts;
            $return_obj['guids'] = $arr_synced_pks;

            $response = new WP_REST_Response( $return_obj );
            $response->set_status( 201 );

            return $response;

        }
        catch (Exception $e)
        {
            return new rest_ensure_response(WP_Error('wp_exception', $e->getMessage(), array('status' => 400)));
        }
    }




//-------------------------- END: Data Sync Functions --------------------------------


    function yasbil_rest_util_check_permission( $request )
    {
        // https://developer.wordpress.org/rest-api/extending-the-rest-api/routes-and-endpoints/#permissions-callback

        // Restrict YASBIL util endpoints to only users who have admin capability (for now).
        if ( ! current_user_can( 'administrator' ) ) {
            return new WP_Error(
                    'rest_forbidden',
                    esc_html__( 'OMG you can not view private data.'),
                    array( 'status' => 401 )
            );
        }

        // This is a black-listing approach. You could alternatively do this via white-listing, by returning false here and changing the permissions check.
        return true;
    }


    //  need cookie authentication to use endpoint
    // https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/
    function yasbil_rest_util_hash2string( $request )
    {
        //GET:  https://volt.ischool.utexas.edu/wp/wp-json/yasbil/admin/hash2string?p_hash=xxx
        if ( isset( $request['p_hash'] ) )
        {
            $p_hash = $request['p_hash'];
            $large_str = $this->yasbil_hash2string($p_hash);

            return rest_ensure_response( $large_str );

        }
        return rest_ensure_response( $request['p_hash'] );

    }



//-------------------------- START: Utility REST API Functions --------------------------------




//-------------------------- END: Utility REST API Functions --------------------------------







// ----------- start: getter and setter functions -----------

    // gets user status: ACTIVE / INACTIVE
    function yasbil_get_user_status( $user_id )
    {
        $yasbil_user_status = get_user_meta($user_id, 'yasbil_user_status', true);

        // if meta key is empty, user is active
        if( empty($yasbil_user_status)) {
            return "ENABLED";
        }

        return $yasbil_user_status;
    }

    // sets the user-status as active
    function yasbil_set_user_enabled( $user_id )
    {
        update_user_meta( $user_id, 'yasbil_user_status', 'ENABLED');
    }

    // sets the user-status as active
    function yasbil_set_user_disabled( $user_id )
    {
        update_user_meta( $user_id, 'yasbil_user_status', 'DISABLED');
    }


    // Takes a user_id and returns the [term-id, term-slug]
    // for the single YASBIL project (custom taxonomy)
    function yasbil_get_user_project( $user_id )
    {
        $arr_yasbil_projects = wp_get_object_terms( $user_id,  'yasbil_projects' );

        if ( ! empty( $arr_yasbil_projects ) )
        {
            if ( ! is_wp_error( $arr_yasbil_projects ) )
            {
                $term = $arr_yasbil_projects[0];
                //available properties:
                // // https://developer.wordpress.org/reference/classes/wp_term/
                return array($term->term_id, strtoupper($term->slug));
            }
        }

        return array(0, "DEFAULT_PROJECT");
    }






// ----------- end: getter and setter functions -----------



// ----------- start: utility functions  -----------

    // get current time in milliseconds
    // https://stackoverflow.com/a/3656934
    public function yasbil_get_millitime()
    {
        $microtime = microtime();
        $comps = explode(' ', $microtime);

        // Note: Using a string here to prevent loss of precision
        // in case of "overflow" (PHP converts it to a double)
        return sprintf('%d%03d', $comps[1], $comps[0] * 1000);
    }


    public function yasbil_milli_to_str($milli_time, $tz_offset_mins=0, $incl_day=false)
    {
        //$sec_time = $milli_time / 1000;
        $sec_time = $milli_time / 1000 + $tz_offset_mins*60;

        if($sec_time <= 0)
            return "-";

        if($incl_day)
            return strtoupper(date('Y-m-d, D, H:i:s', $sec_time));

        return date('Y-m-d H:i:s', $sec_time);
    }



    public function yasbil_truncate_str($long_str, $thresh = 30)
    {
        if (strlen($long_str) >= $thresh) {
            return mb_substr($long_str, 0, $thresh-3, "UTF-8"). "..."; // . substr($long_str, -5);
        }
        else {
            return $long_str;
        }
    }



    //Takes a variable and returns sanitized output / default value
    public function yasbil_nvl($test_val, $default_val)
    {
        if(!isset($test_val) || trim($test_val)==='')
            return $default_val;

        return sanitize_text_field( $test_val );
    }




    // displays difference between two milliseconds in appropriate units
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


    // gets the largestring stored in database
    function yasbil_hash2string($p_hash)
    {
        $split_arr = explode("|", $p_hash);

        //string locator does not have 3 pipe-delimited parts
        // so must be original string
        if(count($split_arr) !== 3)
        {
            return $p_hash;
        }


        // these are strings, but MySQL will parse them to int
        $string_guid = $split_arr[0];
        $start_idx = $split_arr[1];
        $end_idx = $split_arr[2];

        global $wpdb;

        $tbl_largestring = $wpdb->prefix . "yasbil_largestring";

        //mysql substring index starts from 1
        $db_res_string = $wpdb->get_var($wpdb->prepare("
            select substring(a.string_body, %s+1, %s-%s+1) string_body
            from $tbl_largestring a
            where a.string_guid = %s
            limit 1
            ",
            $start_idx,
            $end_idx, $start_idx,
            $string_guid
        ));

        return $db_res_string ? $db_res_string : $p_hash;
    }


    // returns in K
    function yasbil_strsize($p_str)
    {
        $num_chars = strlen($p_str);

        return round($num_chars/1000, 1);

//        $_KB = 1024;
//        $_MB = _KB * 1024;
//        $_GB = _MB * 1024;
//
//        $res = num_chars;
//
//        if(num_chars >= _GB)
//            res = (num_chars / _GB).toFixed(1) + 'GB';
//        else if(num_chars >= _MB)
//            res = (num_chars / _MB).toFixed(1) + 'MB';
//        else
//            res = (num_chars / _KB).toFixed(1) + 'KB'

    }

    // human readable size
    function yasbil_hr_size($p_bytes)
    {
        $_KB = 1024;
        $_MB = $_KB * 1024;
        $_GB = $_MB * 1024;

        $res = $p_bytes;

        if($p_bytes >= $_GB)
            $res = round($p_bytes / $_GB, 1) . ' GB';
        else if($p_bytes >= $_MB)
            $res = round($p_bytes / $_MB, 1) . ' MB';
        else
            $res = round($p_bytes / $_KB, 1) . ' KB';

        return $res;
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
//    public function yasbil_sync_sessions_table( $request )
//    {
//        /***
//        JSON body format:
//        {
//        'num_rows': 23, (not required)
//        'data_rows': [ {row 1 obj}, {row 2 obj}, ... {row n obj}, ]
//        }
//         */
//
//        try
//        {
//            $json_body = $request->get_json_params();
//
//            $current_user = wp_get_current_user();
//            $user_id = $current_user->ID;
//            $user_name = $current_user->user_login;
//
//            $project_detail = $this->yasbil_get_user_project($user_id);
//            $project_id = $project_detail[0];
//            $project_name = $project_detail[1];
//
//            $sync_ts = $this->yasbil_get_millitime();
//
//            // $num_rows = $json_body['num_rows'];
//            $data_rows = $json_body['data_rows']; //array
//
//            global $wpdb;
//
//            // to insert multiple rows
//            // https://stackoverflow.com/a/12374838
//            // https://wordpress.stackexchange.com/a/328037
//
//            $tbl_sessions = $wpdb->prefix . "yasbil_sessions";
//            $sql_insert_session = "
//                INSERT INTO $tbl_sessions (
//                    session_guid,
//                    project_id,
//                    project_name,
//                    wp_user_id,
//                    participant_name,
//                    platform_os,
//                    platform_arch,
//                    platform_nacl_arch,
//                    browser_name,
//                    browser_vendor,
//                    browser_version,
//                    browser_build_id,
//                    session_tz_str,
//                    session_tz_offset,
//                    session_start_ts,
//                    session_end_ts,
//                    sync_ts
//                ) VALUES ";
//
//            $values = array();
//            $place_holders = array();
//
//            foreach ( $data_rows as $row )
//            {
//                array_push(
//                    $values,
//                    sanitize_text_field($row['session_guid']),
//                    $project_id,
//                    $project_name,
//                    $user_id,
//                    $user_name,
//                    sanitize_text_field($row['platform_os']),
//                    sanitize_text_field($row['platform_arch']),
//                    sanitize_text_field($row['platform_nacl_arch']),
//                    sanitize_text_field($row['browser_name']),
//                    sanitize_text_field($row['browser_vendor']),
//                    sanitize_text_field($row['browser_version']),
//                    sanitize_text_field($row['browser_build_id']),
//                    sanitize_text_field($row['session_tz_str']),
//                    sanitize_text_field($row['session_tz_offset']),
//                    sanitize_text_field($row['session_start_ts']),
//                    sanitize_text_field($row['session_end_ts']),
//                    $sync_ts
//                );
//                $place_holders[] = "(
//                    %s, %s, %s, %s, %s,
//                    %s, %s, %s, %s, %s,
//                    %s, %s, %s, %s, %s,
//                    %s, %s
//                )";
//            }
//
//            $sql_insert_session .= implode( ', ', $place_holders );
//            if( false === $wpdb->query( $wpdb->prepare( "$sql_insert_session ", $values ) ))
//            {
//                return new WP_Error('db_query_error', $wpdb->last_error, array('status' => 400));
//            }
//
//            $synced_sessions = $wpdb->get_results( $wpdb->prepare("
//                SELECT session_guid
//                FROM $tbl_sessions
//                WHERE sync_ts = %s",
//                $sync_ts
//            ));
//
//            $arr_synced_session_guids = array();
//
//            foreach ($synced_sessions as $row_sess) {
//                $arr_synced_session_guids[] = $row_sess->session_guid;
//            }
//
//            $return_obj = array();
//            $return_obj['sync_ts'] = $sync_ts;
//            $return_obj['guids'] = $arr_synced_session_guids;
//
//            $response = new WP_REST_Response( $return_obj );
//            $response->set_status( 201 );
//
//            return $response;
//        }
//        catch (Exception $e)
//        {
//            return new WP_Error('wp_exception', $e->getMessage(), array('status' => 400));
//        }
//    }








//-------------------------- PAGEVISITS Sync --------------------------------
//    public function yasbil_sync_pagevisits_table( $request )
//    {
//        /***
//         JSON body format:
//         {
//            'num_rows': 23, (not required)
//            'data_rows': [ {row 1 obj}, {row 2 obj}, ... {row n obj}, ]
//         }
//        */
//
//        try
//        {
//            $json_body = $request->get_json_params();
//
//            $current_user = wp_get_current_user();
//            $user_id = $current_user->ID;
//            $user_name = $current_user->user_login;
//
//            $project_detail = $this->yasbil_get_user_project($user_id);
//            $project_id = $project_detail[0];
//            $project_name = $project_detail[1];
//
//            $sync_ts = $this->yasbil_get_millitime();
//
//            // $num_rows = $json_body['num_rows'];
//            $data_rows = $json_body['data_rows']; //array
//
//            global $wpdb;
//
//            // to insert multiple rows
//            // https://stackoverflow.com/a/12374838
//            // https://wordpress.stackexchange.com/a/328037
//
//
//            $tbl_pagevisits = $wpdb->prefix . "yasbil_session_pagevisits";
//            $sql_insert_pv = "
//                INSERT INTO $tbl_pagevisits (
//                    pv_guid,
//                    session_guid,
//                    project_id,
//                    project_name,
//                    wp_user_id,
//                    participant_name,
//                    win_id,
//                    win_guid,
//                    tab_id,
//                    tab_guid,
//                    pv_ts,
//                    pv_url,
//                    pv_title,
//                    title_upd,
//                    pv_hostname,
//                    pv_rev_hostname,
//                    pv_transition_type,
//                    pv_transition_qualifier,
//                    pv_srch_engine,
//                    pv_srch_qry,
//                    sync_ts
//                ) VALUES ";
//
//            $values = array();
//            $place_holders = array();
//
//            foreach ( $data_rows as $row )
//            {
//                array_push(
//                    $values,
//                    sanitize_text_field($row['pv_guid']),
//                    sanitize_text_field($row['session_guid']),
//                    $project_id,
//                    $project_name,
//                    $user_id,
//                    $user_name,
//                    sanitize_text_field($row['win_id']),
//                    sanitize_text_field($row['win_guid']),
//                    sanitize_text_field($row['tab_id']),
//                    sanitize_text_field($row['tab_guid']),
//                    sanitize_text_field($row['pv_ts']),
//                    esc_url_raw($row['pv_url']),
//                    sanitize_text_field($row['pv_title']),
//                    sanitize_text_field($row['title_upd']),
//                    sanitize_text_field($row['pv_hostname']),
//                    sanitize_text_field($row['pv_rev_hostname']),
//                    sanitize_text_field($row['pv_transition_type']),
//                    sanitize_text_field($row['pv_transition_qualifier']),
//                    sanitize_text_field($row['pv_srch_engine']),
//                    sanitize_text_field($row['pv_srch_qry']),
//                    $sync_ts
//                );
//                $place_holders[] = "(
//                    %s, %s, %s, %s, %s,
//                    %s, %s, %s, %s, %s,
//                    %s, %s, %s, %s, %s,
//                    %s, %s, %s, %s, %s,
//                    %s
//                )";
//            }
//
//            $sql_insert_pv .= implode( ', ', $place_holders );
//            if( false === $wpdb->query( $wpdb->prepare( "$sql_insert_pv ", $values ) ))
//            {
//                return new WP_Error('db_query_error', $wpdb->last_error, array('status' => 400));
//            }
//
//            $synced_sessions = $wpdb->get_results( $wpdb->prepare("
//                SELECT pv_guid
//                FROM $tbl_pagevisits
//                WHERE sync_ts = %s",
//                $sync_ts
//            ));
//
//            $arr_synced_pv_guids = array();
//
//            foreach ($synced_sessions as $row_sess) {
//                $arr_synced_pv_guids[] = $row_sess->pv_guid;
//            }
//
//            $return_obj = array();
//            $return_obj['sync_ts'] = $sync_ts;
//            $return_obj['guids'] = $arr_synced_pv_guids;
//
//            $response = new WP_REST_Response( $return_obj );
//            $response->set_status( 201 );
//
//            return $response;
//        }
//        catch (Exception $e)
//        {
//            return new WP_Error('wp_exception', $e->getMessage(), array('status' => 400));
//        }
//    }





}
