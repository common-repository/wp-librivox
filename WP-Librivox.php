<?php
/*
Plugin Name: WP-Librivox
Plugin URI: http://www.jcms-consulting.co.uk/jcms-wordpress-plugins.html
Description: Allows rendering of Librivox audio book downloads/play in templates.
Version: 1.0.0
Author: JCMS Consulting
Author URI: http://www.jcms-consulting.co.uk
*/
include "includes/LibrivoxRender.php";
include "includes/LibrivoxAPI.php";

/*
 * Actions:
 * !@#$%^&*()_+[]{};:'"\|
 * 
 */


/*
 * build output for a book:
 * */
function wplv_get_book_by_id($atts){    //shortcode params
    $librivox = new LibrivoxRender();
    $_out = $librivox->getHTMLBookDetailWrapper($atts['bookid']);
    $librivox = null;
    return $_out;
};

/*
 * Build output for book search/playback, interact with client-side JS and AJAX endpoints:
 */
function wplv_build_interactive_output(){
    $librivox = new LibrivoxAPI();
    $_out = $librivox->buildInteractiveWrapper();
    $librivox = null;
    return $_out;
};

/*
 * REST endpoint handler methods
 */
function wplv_authors_wrapper(){
    $librivox = new LibrivoxAPI();
    $_out = $librivox->getAuthorList();
    $librivox = null;
    return $_out;
};
function wplv_books_by_author_wrapper($author){
    $librivox = new LibrivoxAPI();
    $_out = $librivox->getBooksByAuthorName($author);
    $librivox = null;
    return $_out;
};

function wplv_book_by_id_wrapper($id){
    $librivox = new LibrivoxAPI();
    $_out = $librivox->getBookById($id);
    $librivox = null;
    return $_out;
};

function wplv_tracks_by_bookid_wrapper($id){
    $librivox = new LibrivoxAPI();
    $_out = $librivox->getTracksByBookId($id);
    $librivox = null;
    return $_out;
};


/*
 * Add shortcode handlers:
 */
add_shortcode('librivox_book', 'wplv_get_book_by_id');
add_shortcode('librivox_app', 'wplv_build_interactive_output');

//Add REST API from LibrivoxAPI!!
add_action('rest_api_init', function(){
    
    register_rest_route('wp-librivox/v1', '/authors/',array(
        'methods'=>'GET',
        'callback'=>'wplv_authors_wrapper'
    ));
    
    register_rest_route('wp-librivox/v1', '/books/(?P<name>\w+)',array(
        'methods'=>'GET',
        'callback'=>'wplv_books_by_author_wrapper',
        'args'=>['name'],
    ));
    
    register_rest_route('wp-librivox/v1', '/books/id/(?P<id>\w+)',array(
        'methods'=>'GET',
        'callback'=>'wplv_book_by_id_wrapper',
        'args'=>['id'],
    ));
    
    register_rest_route('wp-librivox/v1', '/rss/(?P<id>\w+)',array(
        'methods'=>'GET',
        'callback'=>'wplv_tracks_by_bookid_wrapper',
        'args'=>['id'],
    ));
} );

//register and include scripts:
//see https://code.tutsplus.com/tutorials/loading-css-into-wordpress-the-right-way--cms-20402
function wplvEnqueueScripts(){
    wp_register_script(
        'engine',
        plugins_url( '/js/engine.js',__FILE__),  //see developer.wordpress.org/reference/functions/plugin_url/
        array('jquery'),
        1.1,
        true);
    wp_enqueue_script('engine');
    wp_enqueue_script('jquery');
    wp_enqueue_script('jquery-effects-core');
    wp_enqueue_script('jquery-ui-core');
    wp_enqueue_script('jquery-ui-autocomplete');
}
//TODO: This needs sorting out as it does not apply properly
function wplvEnqueueStyles(){
    //plugin custom CSS
    wp_register_style(
        'wp-librivox',
        plugins_url( '/css/wp-librivox.css',__FILE__));
    
    //local jquery UI as CDN usage is discouraged... 
    wp_register_style(
        'jquery-ui',
        plugins_url( '/css/jquery-ui.css',__FILE__));
    wp_enqueue_style('wp-librivox');
    wp_enqueue_style('jquery-ui');
}
/*
 * Note difference between 'actions' and methods!
 * I need to use the wp_enqueue_style METHOD but the 'wp_enqueue_scripts' ACTION
 * */
add_action( 'wp_enqueue_scripts', 'wplvEnqueueScripts' );
add_action( 'wp_enqueue_scripts', 'wplvEnqueueStyles' );
?>
