<?php
//Classes representing LibriVox objects:
class LibrivoxRender{
    const API_AUTHORS = 'https://librivox.org/api/feed/authors?format=json';
    const API_BOOKS = 'https://librivox.org/api/feed/audiobooks?format=json';
    const API_RSS = 'https://librivox.org/rss/';
    
    var $_authorData = null;
    var $_bookData = null;
    var $_trackData = null;
    
    function __construct(){  }

    //return a complex object including the download URL list
    public function getBookDetails($bookId){
        $_data = null;
        $_data = file_get_contents(self::API_BOOKS . '&id=' . $bookId);//syntax!
        return $_data;
    }

    /*
     * Build HTML output from shortcode.
     * Call internally to construct the bits
     */
    public function getHTMLBookDetailWrapper($bookid){
        $_data = json_decode($this->getBookDetails($bookid));
        
        $_out = "<div class='book-wrapper' id='book-wrapper'>";
        $_out .= $this->getHTMLBookTitle($_data->books[0]->title, 'h3');
        $_out .= $this->getHTMLBookDescription($_data->books[0]->description);
        $_out .= $this->getHTMLDownloadLink($_data->books[0]->url_zip_file, $_data->books[0]->title);
        $_out .= $this->getHTMLPlayLinks($_data->books[0]->url_rss);
        $_out .= $this->getAudioPlayer();
        $_out .= "</div>";
        return $_out;
    }

    
    public function getHTMLBookTitle($title,$_htag){
        $_out = "<" . $_htag . ">";
        $_out .= $title;
        $_out .= "</" . $_htag . ">";
        return $_out;
    }
    public function getHTMLBookDescription($_description){
        $_out = "<div class='book-description'>";
        $_out .= $_description;
        $_out .= "</div>";
        return $_out;
    }
    
    public function getHTMLDownloadLink($_url,$_linktext){
        $_out = "<div class='book-download'>";
        $_out .= "<a href='" . $_url . "' title='" . $_linktext . "'>";
        $_out .= $_linktext;
        $_out .= "</a>";
        $_out .= "</div>";
        return $_out;
    }
    
    public function getHTMLPlayLinks($_xml_url){
        $_out = "<ul class='book-tracks'>";
        $XMLElement = simplexml_load_string(file_get_contents($_xml_url));
        $_counter = 1;
        foreach($XMLElement->channel->item as $item){
            $_out .= "<li data-track='" . $item->link . "' data-title='" . $item->title . "'>" . $item->title ."</li>";
            $_counter++;
        }
        $_out .= "</ul>";
        return $_out;
    }

    public function getAudioPlayer(){
        $_out = "<audio id='static-audio-player' controls='controls'>";
        $_out .= "<source>";
        $_out .= "</audio>";
        return $_out;
    }
}