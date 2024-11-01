<?php
//Classes representing LibriVox objects:
class LibrivoxAPI{
    const API_AUTHORS = 'https://librivox.org/api/feed/authors?format=json';
    const API_BOOKS = 'https://librivox.org/api/feed/audiobooks?format=json';
    const API_RSS = 'https://librivox.org/rss/';
    
    var $_authorData = null;
    var $_bookData = null;
    var $_trackData = null;
    
    function __construct(){
        
    }
    /*
     * REST API handler functions.
     * Each return the raw XML or JSON provided by the LibriVox API. Mainly so that 
     * REST calls on the local WP server work without running into CORS issues.
     */
    public function getAuthorList(){
        $_data = file_get_contents(self::API_AUTHORS);
        return($_data);
    }
    
    public function getAuthorDetails($authorId){
        $_data = file_get_contents(self::API_AUTHORS);
        return($_data);
    }
    public function getAllBookData(){
        $_data = null;
        $_data = file_get_contents(self::API_BOOKS);
        return $_data;
    }
    
    public function getBookById($args){
        $params = $args->get_url_params();
        $_data = null;
        $_data = file_get_contents(self::API_BOOKS . "&id=" . $params["id"] );
        return $_data;
    }
    
    public function getTracksByBookId($args){
        $params = $args->get_url_params();
        $_data = null;
        $_data = file_get_contents(self::API_RSS . $params["id"] );
        $_xml = simplexml_load_string($_data);
        print($_xml);
        $_out = array();
        foreach($_xml->channel->item as $item){
            $_temp_title = dom_import_simplexml($item->title);
            $_temp_url = dom_import_simplexml($item->link);
            $_entry = new stdClass();
            $_entry->title = $_temp_title->textContent;
            $_entry->link = $_temp_url->textContent;
            $_out[] = $_entry;     //array append syntax
        }
        return($_out);
    }
    
    
    public function getBooksByAuthorName($args){
        $params = $args->get_url_params();
        $_data = null;
        $_data = file_get_contents(self::API_BOOKS . "&author=" . $params["name"] );//  + ;
        return $_data;
    }
    
    //return a complex object including the download URL list
    public function getBookDetails($bookId){
        $_data = null;
        $_data = file_get_contents(self::API_BOOKS . '&id=' . $bookId);//syntax!
        return $_data;
    }
    //retrieves XML, returns an object:
    public function getRSSLinks($rssSource){
        $_data = null;
        $_data = file_get_contents($rssSource);
        $XMLElement = simplexml_load_string($_data);
        $_link = $XMLElement->channel->item[0]->link;//test
        return $_link;
    }

    
    public function buildInteractiveWrapper(){
        $_out = "<div class='book-wrapper' id='lvx-search'>Search by Author</div>";
        $_out .= "<div class='book-wrapper' id='lvx-title'><h4></h4></div>";
        $_out .= "<div class='book-wrapper' id='lvx-output'></div>";
        return $_out;
    }
}