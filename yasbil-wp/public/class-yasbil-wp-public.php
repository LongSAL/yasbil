<?php

/**
 * The public-facing functionality of the plugin.
 *
 * @link       http://example.com
 * @since      1.0.0
 *
 * @package    YASBIL_WP
 * @subpackage YASBIL_WP/public
 */

/**
 * The public-facing functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the public-facing stylesheet and JavaScript.
 *
 * @package    YASBIL_WP
 * @subpackage YASBIL_WP/public
 * @author     Your Name <email@example.com>
 */
class YASBIL_WP_Public {

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
	 * @param      string    $yasbil_wp       The name of the plugin.
	 * @param      string    $version    The version of this plugin.
	 */
	public function __construct( $yasbil_wp, $version ) {

		$this->yasbil_wp = $yasbil_wp;
		$this->version = $version;

	}

	/**
	 * Register the stylesheets for the public-facing side of the site.
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

		wp_enqueue_style( $this->yasbil_wp, plugin_dir_url( __FILE__ ) . 'css/yasbil-wp-public.css', array(), $this->version, 'all' );

	}

	/**
	 * Register the JavaScript for the public-facing side of the site.
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

		wp_enqueue_script( $this->yasbil_wp, plugin_dir_url( __FILE__ ) . 'js/yasbil-wp-public.js', array( 'jquery' ), $this->version, false );

	}

}
