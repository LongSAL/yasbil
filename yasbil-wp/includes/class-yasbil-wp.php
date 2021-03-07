<?php

/**
 * The file that defines the core plugin class
 *
 * A class definition that includes attributes and functions used across both the
 * public-facing side of the site and the admin area.
 *
 * @link       http://example.com
 * @since      1.0.0
 *
 * @package    YASBIL_WP
 * @subpackage YASBIL_WP/includes
 */

/**
 * The core plugin class.
 *
 * This is used to define internationalization, admin-specific hooks, and
 * public-facing site hooks.
 *
 * Also maintains the unique identifier of this plugin as well as the current
 * version of the plugin.
 *
 * @since      1.0.0
 * @package    YASBIL_WP
 * @subpackage YASBIL_WP/includes
 * @author     Nilavra Bhattacharya <nilavra@ieee.org>
 */
class YASBIL_WP {

	/**
	 * The loader that's responsible for maintaining and registering all hooks that power
	 * the plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      YASBIL_WP_Loader    $loader    Maintains and registers all hooks for the plugin.
	 */
	protected $loader;

	/**
	 * The unique identifier of this plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      string    $yasbil_wp    The string used to uniquely identify this plugin.
	 */
	protected $yasbil_wp;

	/**
	 * The current version of the plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      string    $version    The current version of the plugin.
	 */
	protected $version;

	/**
	 * Define the core functionality of the plugin.
	 *
	 * Set the plugin name and the plugin version that can be used throughout the plugin.
	 * Load the dependencies, define the locale, and set the hooks for the admin area and
	 * the public-facing side of the site.
	 *
	 * @since    1.0.0
	 */
	public function __construct()
    {
		if ( defined( 'YASBIL_WP_VERSION' ) ) {
			$this->version = YASBIL_WP_VERSION;
		} else {
			$this->version = '1.0.0';
		}
		$this->yasbil_wp = 'yasbil-wp';

		$this->load_dependencies();
		$this->set_locale();
		$this->define_admin_hooks();
		$this->define_public_hooks();

	}

	/**
	 * Load the required dependencies for this plugin.
	 *
	 * Include the following files that make up the plugin:
	 *
	 * - YASBIL_WP_Loader. Orchestrates the hooks of the plugin.
	 * - YASBIL_WP_i18n. Defines internationalization functionality.
	 * - YASBIL_WP_Admin. Defines all hooks for the admin area.
	 * - YASBIL_WP_Public. Defines all hooks for the public side of the site.
	 *
	 * Create an instance of the loader which will be used to register the hooks
	 * with WordPress.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function load_dependencies()
    {

		/**
		 * The class responsible for orchestrating the actions and filters of the
		 * core plugin.
		 */
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'includes/class-yasbil-wp-loader.php';

		/**
		 * The class responsible for defining internationalization functionality
		 * of the plugin.
		 */
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'includes/class-yasbil-wp-i18n.php';

		/**
		 * The class responsible for defining all actions that occur in the admin area.
		 */
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'admin/class-yasbil-wp-admin.php';

		/**
		 * The class responsible for defining all actions that occur in the public-facing
		 * side of the site.
		 */
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'public/class-yasbil-wp-public.php';

		$this->loader = new YASBIL_WP_Loader();

	}

	/**
	 * Define the locale for this plugin for internationalization.
	 *
	 * Uses the YASBIL_WP_i18n class in order to set the domain and to register the hook
	 * with WordPress.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function set_locale() {

		$plugin_i18n = new YASBIL_WP_i18n();

		$this->loader->add_action( 'plugins_loaded', $plugin_i18n, 'load_plugin_textdomain' );

	}

	/**
	 * Register all of the hooks related to the admin area functionality
	 * of the plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function define_admin_hooks()
    {
		$plugin_admin = new YASBIL_WP_Admin( $this->get_yasbil_wp(), $this->get_version() );

		// register rest_api routes
        $this->loader->add_action('rest_api_init', $plugin_admin, 'yasbil_register_api_endpoints');

        // ------- admin pages ---------
        // add admin page for YASBIL project edit page and Viz Page
        $this->loader->add_action('admin_menu', $plugin_admin, 'yasbil_add_admin_pages');

        //highlight active menu item
        $this->loader->add_filter('parent_file', $plugin_admin, 'yasbil_fix_menu_items');


        // ------- YASBIL Projects taxonomy ------
        // register custom user taxonomy: YASBIL Projects
        $this->loader->add_action('init', $plugin_admin, 'yasbil_register_taxonomy_yasbil_projects');

        //Add the YASBIL Project Form in New /Edit user profile page
        $this->loader->add_action('show_user_profile', $plugin_admin, 'yasbil_admin_edit_user_screen');
        $this->loader->add_action('edit_user_profile', $plugin_admin, 'yasbil_admin_edit_user_screen');
        $this->loader->add_action('user_new_form', $plugin_admin, 'yasbil_admin_edit_user_screen');

        // save the custom form
        $this->loader->add_action('personal_options_update', $plugin_admin, 'yasbil_save_user_yasbil_project');
        $this->loader->add_action('edit_user_profile_update', $plugin_admin, 'yasbil_save_user_yasbil_project');
        $this->loader->add_action('user_register', $plugin_admin, 'yasbil_save_user_yasbil_project');

        // don't allow Username Same as Taxonomy
        $this->loader->add_filter('sanitize_user', $plugin_admin, 'yasbil_sanitize_username');









        // if prev one doesn't work, try this
        //$this->loader->add_filter( 'submenu_file', $plugin_admin, 'yasbil_set_yasbil_projects_submenu_active2' );

        // Unset Default Column & Add Users Column
        //$this->loader->add_filter('manage_edit-yasbil_projects_columns', $plugin_admin, 'yasbil_admin_taxonomy_add_users_column' );

        // Update Users Column Count
        //$this->loader->add_filter('manage_yasbil_projects_custom_column',$plugin_admin,'yasbil_manage_user_column');



		// demo
		$this->loader->add_action('admin_enqueue_scripts', $plugin_admin,'enqueue_styles');
		$this->loader->add_action('admin_enqueue_scripts', $plugin_admin,'enqueue_scripts');

	}

	/**
	 * Register all of the hooks related to the public-facing functionality
	 * of the plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function define_public_hooks() {

		$plugin_public = new YASBIL_WP_Public( $this->get_yasbil_wp(), $this->get_version() );

		$this->loader->add_action( 'wp_enqueue_scripts', $plugin_public, 'enqueue_styles' );
		$this->loader->add_action( 'wp_enqueue_scripts', $plugin_public, 'enqueue_scripts' );

	}

	/**
	 * Run the loader to execute all of the hooks with WordPress.
	 *
	 * @since    1.0.0
	 */
	public function run() {
		$this->loader->run();
	}

	/**
	 * The name of the plugin used to uniquely identify it within the context of
	 * WordPress and to define internationalization functionality.
	 *
	 * @since     1.0.0
	 * @return    string    The name of the plugin.
	 */
	public function get_yasbil_wp() {
		return $this->yasbil_wp;
	}

	/**
	 * The reference to the class that orchestrates the hooks with the plugin.
	 *
	 * @since     1.0.0
	 * @return    YASBIL_WP_Loader    Orchestrates the hooks of the plugin.
	 */
	public function get_loader() {
		return $this->loader;
	}

	/**
	 * Retrieve the version number of the plugin.
	 *
	 * @since     1.0.0
	 * @return    string    The version number of the plugin.
	 */
	public function get_version() {
		return $this->version;
	}

}
