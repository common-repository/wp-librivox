/*
 * Actions:
 * !@#$%^&*()_+[]{};:'"\|
 * 
 */

var engine = {
		
    //strings:
    text_welcome : "Start by entering an author name in the form.",

    proxyUrl : "/index.php/wp-json/wp-librivox/v1",
    searchPanelIdentifier :         "#lvx-search",
    outputPanelIdentifier :         "#lvx-output",
    displayPanelTitleIdentifier :   "#lvx-title > h4",
    
    outputPanelTitle : "",
    previousContent : "",
    firstLoadMessage : "Loading LibriVox data...",
	    
	currentBookDetails : {},
    
    outputPanelStack : {
        VIEW_INITIAL : {    //after initiial ajax load
            findState:null,
            displayState:null
        },
        VIEW_BY_AUTHOR : {  //view of books by selected author
            findState:null,
            displayState:null
        },
        VIEW_BY_BOOK : {    //view tracks after selecting a book
            findState:null,
            displayState:null
        },
        VIEW_BY_TRACK : {    //view after selecting a track (the html 5 player)
            findState:null,
            displayState:null
        }
    },
    
    init : function(){
        this.BuildLibrivoxForm();
        this.playStaticTrack();
    },
    
    /*
     * elements built here will have handlers attached as well to trigger the librivox calls
     */
    BuildLibrivoxForm : function(){
        //Append autocomplete
        var wrapper = document.createElement("div");
        var elem = document.createElement("input");
        elem.setAttribute("id","autocomplete-data");
        var elem2 = document.createElement("input");    //set hidden
        elem2.setAttribute("id","autocomplete-data-id");
        elem2.setAttribute("type","hidden");
        var elem3 = document.createElement("input");    //set hidden
        elem3.setAttribute("id","autocomplete-data-surname");
        elem3.setAttribute("type","hidden");
        var elem4 = document.createElement("input");    //set hidden
        elem4.setAttribute("id","autocomplete-data-forename");
        elem4.setAttribute("type","hidden");
        
        var clear = getCloseButton('Reset search',"author-search-clear");
        jQuery(clear).css({"cursor":"pointer"}).click(function(){
            jQuery("#autocomplete-data")[0].value = "";
            jQuery(engine.outputPanelIdentifier).empty();
            engine.updateDisplayPanelTitle("");//start with empty heading
        });
        
        jQuery(wrapper).append(jQuery(elem));
        jQuery(wrapper).append(jQuery(clear));
        jQuery(wrapper).append(jQuery(elem2));
        jQuery(wrapper).append(jQuery(elem3));
        jQuery(wrapper).append(jQuery(elem4));
        
        jQuery(this.searchPanelIdentifier).append(jQuery(wrapper));
        
        jQuery.ajax(this.proxyUrl + "/authors",{
            dataType:"json"
        }).complete(function(data){  

            var autocompleteData = [];
            var data = JSON.parse(data.responseJSON);

            for(var a=0;a<data.authors.length;a++){
                autocompleteData.push({label : data.authors[a].last_name + ", " + data.authors[a].first_name, value : data.authors[a].id, surname : data.authors[a].last_name, forename:data.authors[a].first_name});
            }
            engine.updateDisplayPanelTitle("");

            jQuery("#autocomplete-data").autocomplete({
                source: autocompleteData,
                select: function( event, ui ) {
                    jQuery( "#autocomplete-data" ).val( ui.item.label );
                    jQuery( "#autocomplete-data-id" ).val( ui.item.value );  //hide this. we need surname for book search
                    jQuery( "#autocomplete-data-surname" ).val( ui.item.surname ); 
                    jQuery( "#autocomplete-data-forename" ).val( ui.item.forename ); 
 
                    //and trigger the next AJAX call to get the books by selected author:
                    engine.buildLibrivoxBooklistByAuthor({
                        surname: jQuery( "#autocomplete-data-surname" ).val(),
                        authorId : jQuery( "#autocomplete-data-id" ).val()
                    });
 
                    return false;
                 }
            });
        });
    },
   
    BuildLibrivoxResponse : function(params){
        jQuery.ajax(this.proxyUrl + "?" + params,{
            dataType:"json"
        }).complete(function(data){  
                jQuery("#body-content > div.pure-u-1.pure-u-sm-3-4.contentpanel.row > div.panel-text").html(data.responseText);
        });
    },
    
    buildLibrivoxBooklistByAuthor : function(params){

        var out = [];
        jQuery.ajax(this.proxyUrl + "/books/" + params.surname,{
            dataType:"json"
        }).complete(function(data){
        	var books = JSON.parse(data.responseJSON);
        	books = books.books;
        	
            for(var a=0;a<books.length;a++){
                if(checkAuthor(params.authorId,books[a])){
                    //include this book
                    out.push(books[a]);
                }
            }
            out.sort();   //TODO: Sort function here
            //process output
            jQuery(engine.outputPanelIdentifier).html(getBooklistOutput(out));
            jQuery(engine.updateDisplayPanelTitle("books by " + jQuery("#autocomplete-data-forename").val() + " " + jQuery("#autocomplete-data-surname").val()));

        }).error(function(err){
            console.log(err);
        });
    },
    
    loadBookDetails : function(bookId){

        jQuery.ajax(this.proxyUrl + "/books/id/" + bookId,{
            dataType:"json"
        }).complete(function(data){
            //there should only be one book for supplied ID:
        	var books = JSON.parse(data.responseJSON);
        	books = books.books;
        	console.log(getBookDetailsOutput(books[0]).close);
            jQuery(engine.outputPanelIdentifier).html(getBookDetailsOutput(books[0]).content);
            jQuery(engine.outputPanelIdentifier).append(getBookDetailsOutput(books[0]).close);
            //process link to downloads here
        }).error(function(err){
            console.log(err);
        });
    },
    
    /*
     * build track player - this will just be a HTML5 audio tag with (TODO) a back/next to 
     * navigate the tracks for current book.
     */
    loadTrackPlayer : function(sections,currentSection){
console.log(currentSection);
        //https://developer.mozilla.org/en/docs/Web/HTML/Element/audio
        var audio = document.createElement("audio");
        var playerWrapper = document.createElement("div");
        var playerTitle = document.createElement("h5");
        
        audio.setAttribute("controls","controls");
        jQuery(playerTitle).text('playing track \'' + jQuery(currentSection).attr("data-title") + '\'');
        
        //start disabled:
        audio.setAttribute("autoplay","autoplay");
        
        var source = document.createElement("source");
        source.setAttribute("src",jQuery(currentSection).attr("data-file"));
        audio.appendChild(source);
        
        playerWrapper.appendChild(playerTitle);
        playerWrapper.appendChild(audio);
        
        jQuery(engine.outputPanelIdentifier).html(playerWrapper);
        
    },
    
    //may need to change this:
    getAudioLinkOutput : function(bookObj){
        var out = document.createElement("div");

        /*
         * For the RSS mp3 links, create a HTML5 overlay player.
         * Ensure the correct MIME type?
         */
        var dataType = "xml";
        var ajaxUrl = this.proxyUrl + "/rss/" + bookObj.id;

        jQuery.ajax(ajaxUrl,{
            "dataType" : "json",
            "mimeType" : "text/json"
        }).complete(function(data){

            var items = data.responseJSON;  //an array
            engine.currentBookDetails = items;

            for(var a=0;a<items.length;a++){
                var row = document.createElement("div");
                var link = items[a]['link'];
                var title = items[a]['title'];
                var duration = "";

                row.setAttribute("data-file",link);
                row.setAttribute("data-title",title);
                row.setAttribute("data-index",a);
                
                jQuery(row).css("cursor","pointer");
                row.appendChild(document.createTextNode(title));
                
                jQuery(row).hover(
                    function(){jQuery(this).css("text-decoration","underline");},
                    function(){jQuery(this).css("text-decoration","none");}
                );

                jQuery(row).click(function(data){
                    engine.loadTrackPlayer(engine.currentBookDetails, jQuery(this));
                    //trigger overlay with audio tag + next/back track buttons?
                    //TODO!
                });
                out.appendChild(row);
            }
           
        }).error(function(err){
            console.log(err);
        });
        return out;
    },
 
    updateDisplayPanelTitle : function(val){
        jQuery(this.displayPanelTitleIdentifier).html(val);
    },
    
    updateDisplayPanelText : function(val){
        jQuery(this.outputPanelIdentifier).html(val);
    },


    /*
     * Handlers for static shortcode variant:
     */
    playStaticTrack : function(){
    	if(jQuery("#book-wrapper").length){
    		//get tracks:
    		jQuery("#book-wrapper ul.book-tracks > li").each(function(){
    			jQuery(this).click(function(){
    				//reset style
    				jQuery(this).parent().find('li').each(function(){
    					jQuery(this).css({'font-weight':'normal'});
    				});
    				//and set current to bold:
    				jQuery(this).css({'font-weight':'bold'});
    				//get the player source tag:
    				jQuery('#static-audio-player > source').attr({'src':jQuery(this).attr('data-track')});
    				
    				//and play it:
    				var player = document.getElementById('static-audio-player');
    				player.load();
    				player.play();
    			}).css({'cursor':'pointer'});
    		}); 			
    	}
    }
};

//utility functions:
function checkAuthor(authorId, bookObj){
    var val = false;
    
    for(var a = 0;a < bookObj.authors.length; a++){
        if(bookObj.authors[a].id === authorId){
            val = true;
        }
    }

    return val;
}

//output format functions:
function getBooklistOutput(booklistObj){
    var out2 = document.createElement("div");
    //jQuery(out2).css({"height":"250px","overflow":"auto"});
    jQuery("#output-panel").css({"height":"initial"});
    jQuery("#list-panel").css({"height":"initial"});
    for(var a=0;a<booklistObj.length;a++){
        var out = document.createElement("div");
        out.setAttribute("bookid",booklistObj[a].id);
        var txt = document.createTextNode(booklistObj[a ].title);
        out.appendChild(txt);
        
        jQuery(out).hover(
                    function(){jQuery(this).css("text-decoration","underline");},
                    function(){jQuery(this).css("text-decoration","none");}
                );
        
        //attach handler to each book title row:
        jQuery(out).click(function(){
            //store current contents of output panel in cache:
            engine.previousContent = jQuery(engine.outputPanelIdentifier+">div").clone(true);
            
            //load book details:
            engine.loadBookDetails(jQuery(this).attr("bookid"));
        }).css({"cursor":"pointer"});
        out2.appendChild(out);
    }
    return(out2);
}

function getBookDetailsOutput(bookObj){
    var out = "";
    if(bookObj !== undefined){  //in case there are none. perhaps check for length higher up?
    	//console.log(bookObj);
        out = document.createElement("div");
        //jQuery(out).css({"height":"240px","overflow":"auto"});
        var close = getCloseButton('Back to booklist',"book-details-close");

        //apply action to this instance
        jQuery(close).click(function(){
            jQuery(engine.outputPanelIdentifier).empty();
            jQuery(engine.outputPanelIdentifier).append(jQuery(engine.previousContent));
            engine.updateDisplayPanelTitle("books by " + jQuery("#autocomplete-data-forename").val() + " " + jQuery("#autocomplete-data-surname").val());
        }).css({"cursor":"pointer"});
        
        var description = document.createElement("div");
        description.innerHTML = bookObj.description;
        //description.innerHTML += "project ID: " + bookObj.id;
        
        //append listen/download display:
        //TODO!
        //out.innerHTML = engine.getAudioLinkOutput(bookObj);
        
        out.appendChild(description);
        
        out.appendChild(engine.getAudioLinkOutput(bookObj));
        
        engine.updateDisplayPanelTitle(bookObj.title);
    }
    return {"content":out,"close":close};
}

//unescape stuff:
//http://stackoverflow.com/questions/1147359/how-to-decode-html-entities-using-jquery
function decodeEntities(encodedString) {
    var textArea = document.createElement('textarea');
    textArea.innerHTML = encodedString;
    return textArea.value;
}

function getCloseButton(value,DOMId){
	var close = document.createElement("input");
	jQuery(close).attr({'type':'button'});
	jQuery(close).attr({'class':'button'});
	jQuery(close).attr({'name':value});
	jQuery(close).attr({'value':value});
    jQuery(close).attr({"id":DOMId});
    return(close);
}
//from http://jsfiddle.net/RwE9s/15/
function StringtoXML(text){
    if (window.ActiveXObject){
        var doc = new ActiveXObject('Microsoft.XMLDOM');
        doc.async = 'false';
        doc.loadXML(text);
    } 
    else {
        var parser=new DOMParser();
        var doc=parser.parseFromString(text,'text/xml');
    }
    return doc;
}

jQuery(function(){
	engine.init();
});