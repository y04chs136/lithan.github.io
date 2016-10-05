var LinkedSearch = function(config){
	var instance = null;
	var SINGLE_FILTER_TYPE = "single";
	var MULTIPL_FILTER_TYPE = "multiple";
	var LINKED_CATEGORY = "linked";
	var IVD_CATEGORY = "individual";
	var ACTION_LOAD_CHILDS_SEARCH = "loadChildsAndSearchResults";
	var ACTIVE = 'active';
	this.init = function(config){
		this.pns = config.pns;
		this.levelsData = config.levelsData;
		this.ajaxUrl = config.ajaxUrl;
		this.linkedFiltersEnabled = config.linkedFiltersEnabled;
		this.ivdFiltersEnabled = config.ivdFiltersEnabled;
		this.filtersFrmUrl = config.filtersFrmUrl;
		this.sampleFilterNode = A.one("#sampleFilterContainer");
		this.singleTypeFilterItem = A.one("#sampleItemFilterSingle");
		this.multiTypeFilerItem = A.one("#sampleItemFilterMultiple");
		this.searchResultNode = A.one("#searchResult");
		this.searchResultsNode = A.one("#searchResults");
		this.linkedFiltersNode = A.one("#linkedFilters-list");
		this.ivdFiltersNode = A.one("#ivdFilters-list");
		this.loadMoreNode = A.one("#loadMore");
		this.searchTextNode = A.one("#openSearchText");
		this.topicHeader = A.one("#topicHeader");
		this.start = 0;
		this.pageSize = 10;
		instance = this;
		/**
		 * load initial data -
			 - first level filter if linked filter is enabled 
			 - Individual filters if they are enabled
			 - load search results ( = pagesize ) 
		 * 
		 */  
		instance.loadData();
		
		// initialize text search
		instance.initializeTextSearch();
	}
	this.initializeTextSearch = function(){
		instance.searchTextNode.on("keypress",function(ev){
			// click on enter
			if(ev.keyCode ==  13){
				search();
			}
		})
		A.one("#textSearchButton").on("click",function(){
			search();
		});
		function search(){
			var data = {};
			data.searchCriteriaChanged = true;
			instance.loadData(data);
		}
	}
	// it will be initialized based on number of results
	this.initLoadMore = function(){
		instance.loadMoreNode.on("click",function(){
			// in this case search criteria remains same so searchCriteriaChanged = false
			instance.loadData();
		});
	}
	this.getLinkedFiltersSize = function(){
		return instance.linkedFiltersNode.all("#filter").size();
	}
	this.clearSearchResults = function(){
		instance.searchResultsNode.all("*").remove();
	}
	this.loadData = function(data){
		if(instance.requestUnderProcess){
			return ;
		}
		instance.requestUnderProcess = true;
		data = data ? data : {};
		if(!data.action){
			data.action = ACTION_LOAD_CHILDS_SEARCH;
		}
		if(data.searchCriteriaChanged){
			instance.start = 0;
		}
		data.start = instance.start;
		data.pageSize = instance.pageSize;
		instance.populateRequestData(data);
		var contentId =  'content';
		startPreLoader(contentId);
		A.io.request(instance.ajaxUrl,{
            dataType: 'json',
            method: 'POST',
            data: data,
            on: {
            complete: function(){
            	// this is called before success and failure methods. So right place for any post processing of request.
            	stopPreLoader(contentId);
            	instance.requestUnderProcess = false;
            	if(data.searchCriteriaChanged){
            		// since it's fresh search, clear the existing results
            		instance.clearSearchResults();
            	}
            },
            success: function() {
                var responseData=this.get('responseData');
                if(responseData){
                	if(responseData.error){
                		alert(responseData.error);
                	}else{
                		instance.handleSuccessResponse(responseData);
                	}
                }else{
                	//handle due to some reason data is null
                	alert("Error while fetching data");
                }
              },
		    failure : function(){
		    	alert("Error while fetching data");
		    }
            }
        });
	}
	this.populateRequestData = function(data){
		
		data = data ? data :{};
		data.catgIds = "";
		// search text if any 
		data.searchText = instance.searchTextNode.val();
		
		// logic to determine if it is first request after page load
		if(!instance.notFirstRequest){
			instance.firstRequest = true;
			data.firstRequest = true; // Useful at server side to load individual filters.. Ivd loaded only in first request
			
		}else{
			instance.firstRequest = false;
		}
		// from linked filters
		if(instance.linkedFiltersEnabled){
			var size = instance.getLinkedFiltersSize();
			if(size == 0){ // if no filters exists, then load first filter
				data.loadFirstLevel = true; 
			}
			data.levelNo = size; // used to fetch level info like level name and type
			
			var filtersSize = instance.linkedFiltersNode.all("div#filter").size();
			var foundActive = false;
			var counter = 1;
			while(filtersSize > 0 && foundActive == false){
				var filter = instance.linkedFiltersNode.one("div#filter:nth-last-child(" + counter + ")");
				if(filter){
					var activeNodes = filter.all(".active");
					activeNodes.each(function(node){
						// for these categories child categories will be loaded
						data.catgIds = data.catgIds + " , " +  node.getAttribute("data-catg-id");
						foundActive = true;
					});
				}
				counter = counter + 1;
				filtersSize = filtersSize - 1;
			}
			
			if(counter != 2){ // means active not found in last filter
				data.loadChilds = false;
			}
		}
		
		// from individual filters
		// ( OR condition will be applied between active items in same filter )
		// (AND condition will be applied between two different filters)
		if(instance.ivdFiltersEnabled){
				data.ivdCatIds  = "";
				instance.ivdFiltersNode.all("#filter").each(function(filter){
				data.ivdCatIds = data.ivdCatIds + "##"; // separator between active items in one filter and active items in another filter 
				filter.all(".active").each(function(node){
					data.ivdCatIds = data.ivdCatIds + ", "  + node.getAttribute("data-catg-id");
				});
			}); 
		}
		
		// Consider the filters in url only in first request
		if(instance.firstRequest){ 
			var filtersFrmUrl = instance.filtersFrmUrl;
			if(filtersFrmUrl && !A.Object.isEmpty(filtersFrmUrl)){
				data.ivdCatIds  = "";
				A.Object.each(filtersFrmUrl,function(val,key){
					if(key.indexOf("ifilter",0) != -1){ // individual filter
						data.ivdCatIds = data.ivdCatIds + "##" + val;
					}
					if(key.indexOf("lfilter",0) != -1){ // linked filter
						data.catgIds = val;
						data.fromUrl = true;
					}
					if(key.indexOf("cSearch",0) != -1){
						data.searchText = val;
						data.fromUrl = true;
					}
				});
			}
		}
		
		instance.notFirstRequest = true;
	}
	this.handleSuccessResponse = function(data){
		if(!data){
			return;
		}
		// check if linked filter enabled, if so render 
		if(instance.linkedFiltersEnabled){
			if(data.filterData && data.filterData.categories &&  data.filterData.categories.length > 0){
				instance.createFilter(data.filterData);
				if(data.sublevelFilters){
					A.Array.each(data.sublevelFilters,function(filterData){
						instance.createFilter(filterData);
					});
				}
			}
		}
		// check if individual filter is enabled, if so render it.
		if(instance.ivdFiltersEnabled){
			if(data.ivdFiltersData && data.ivdFiltersData.length > 0){
				A.Array.each(data.ivdFiltersData,function(filterData){
					instance.createFilter(filterData);
				})
			}
		}
		// if search is performed from filters in url, then need to select the filters specified in url
		if(instance.firstRequest){
			instance.show(instance.loadMoreNode.ancestor("#loadmoreContainer"));
			var filtersFrmUrl = instance.filtersFrmUrl;
			if(filtersFrmUrl && !A.Object.isEmpty(filtersFrmUrl) ){
				if(data.linkedCatIds){ // applicable only for linked filters
					filtersFrmUrl.linkedCatIds = data.linkedCatIds; // contains the catId of child and it's parents.
				}
				// selecting the filters on page
				A.Object.each(filtersFrmUrl,function(value,key){ // here value is comma separated catIds
					var catIds = value.split(",");
					A.Array.each(catIds,function(catId){
						var item = A.one("[data-catg-id=" + catId + "]");
						if(item){
							//instance.togleActive(item);
							item.addClass(ACTIVE);
							instance.showHeader(item);
							var chkbox = item.one("input[type=checkbox]");
							if(chkbox){
								chkbox.set("checked",true);
							}
						}
					});
				})
			}
		}
		
		
		// search results always present  irrespective of linked/individual filter
		if(data.searchResults){
			A.Array.each(data.searchResults,function(resultData){
				instance.createSearchResult(resultData);
			});
			// move the cursor
    		instance.start = instance.start + data.searchResults.length;
    		// check if there are more rows to load or not.
    		if(data.searchResults.length == 0 || data.searchResults.length < instance.pageSize){
    			try{
    				//instance.hide(instance.loadMoreNode.one("a"));
    				instance.loadMoreNode.html("No more Results");
    				instance.loadMoreNode.addClass("normalText");
    				instance.loadMoreNode.removeClass("link");
    				// since there are no results to load, unregister the click event of load more
    				instance.loadMoreNode.detach("click");
    				
    			}catch(err){
    				
    			}
    		}else{
    			// initialize it.... as there are more rows to load
    			instance.initLoadMore();
    			instance.loadMoreNode.html("Load More");
    			instance.loadMoreNode.addClass("link");
    			instance.loadMoreNode.removeClass("normalText");
    		}
		}else{
			instance.loadMoreNode.html("Error");
		}
		//instance.show(instance.loadMoreNode.ancestor("#loadmoreContainer"));
	}
	/**
	 * Create Filter - Filter have title and searchable items (categories)
	 *   - Searchable item may be single select or multiselect
	 *   - If the filter is single select, searchable item displayed as hyper link
	 *     if the filter is multi select , searchable item displayed as checkbox 
	 * 
	 *  Searchable item  will have click event. On click, search will be performed.
	 *    Linked Filter : Upon clicking searchable item, all child filters will be refreshed and search will be performed.
	 *                    - Active items in last child filter will be sent to server for search.
	 *                    - If none of the items are active in last child, then active items in last but one filter will be sent to server for search
	 *    Individual Filter - On clcik of searchable item, active items in each filter will be send to server
	 */
	this.createFilter = function(filterData){
		var newFilter = instance.sampleFilterNode.cloneNode(true);
		newFilter.set("id","filter");
		//Get the level info
		newFilter.one("#name").setContent(filterData.name);
		var handler ;
		if(filterData.type == MULTIPL_FILTER_TYPE) {
			handler = instance.createMultTypeFilterItem;
		}else{
			handler = instance.createSingleTypeFilterItem;
		}
		var listNode = newFilter.one("#list");
		A.Array.each(filterData.categories,function(catg){
			// create filter item
			var searchableItem = handler();
			searchableItem.set("id", "filterItem");
			searchableItem.one("#name").setContent(catg.name);
			
			//var searchableItem = item.one("#item");
			searchableItem.setAttribute("data-is-all",catg.isAll); // all or not
			searchableItem.setAttribute("data-catg-id",catg.categoryId);
			searchableItem.setAttribute("data-filter-type",filterData.type);
			searchableItem.setAttribute("data-filter-category",filterData.category); // linked or individual
			searchableItem.setAttribute("data-display-header",filterData.displayHeader); // linked or individual
			searchableItem.setAttribute("data-desc",catg.desc);
			searchableItem.setAttribute("data-name",catg.name);
			searchableItem.setAttribute("data-view-link",catg.viewLink);
			listNode.appendChild(searchableItem);
			
			searchableItem.on('click',function(event){
				var parentFilter = this.ancestor("#filter");
				var filterType = this.getAttribute("data-filter-type");
				if(filterType != MULTIPL_FILTER_TYPE){ 
					parentFilter.all(".active").removeClass("active");
					// Handling header
					instance.showHeader(this);
				}else{
					instance.hide(instance.topicHeader);
					if(event.target.getAttribute("type") != 'checkbox'){
						var checkbox = this.one("#item");
						if(checkbox.get("checked") == true){
							checkbox.set("checked",false); 
						}else{
							checkbox.set("checked",true); 
						}
					}
				}
				instance.togleActive(this);
				
				// Handle All
				var isAll = this.getAttribute("data-is-all");
				if(isAll == "true"){
					if(filterType == SINGLE_FILTER_TYPE){
						
					}else{
						instance.hide(instance.topicHeader);
						var allStatus =  this.one("input[type=checkbox]").get("checked");
						parentFilter.all("input[type=checkbox]").set("checked",allStatus);
						var filterItems = parentFilter.all("#filterItem");
						if(allStatus){
							filterItems.addClass(ACTIVE);
						}else{
							filterItems.removeClass(ACTIVE);
						}
					}
				}

				var data  = {};
				data.searchCriteriaChanged = true;
				data.action = ACTION_LOAD_CHILDS_SEARCH;
				var filterCategory = this.getAttribute("data-filter-category");
				if(filterCategory == LINKED_CATEGORY){
					// clear the child filters.. sibling css selector somehow not working. so written below logic to remove next siblings
					var tempFil = null;
					while((tempFil = parentFilter.next("#filter"))){
						tempFil.remove();
					}
					data.loadChilds = true;
				}
				instance.loadData(data);
			});
		});
		
		if(filterData.category == LINKED_CATEGORY){
			instance.linkedFiltersNode.appendChild(newFilter);
		}else if (filterData.category == IVD_CATEGORY){
			instance.ivdFiltersNode.appendChild(newFilter);
		}
	}
	this.getString = function(str){
		if(str && str != 'undefined'){
			return str;
		}
		return "";
	}
	this.showHeader = function(filterItem){
		/**
		 *  1. Display last selected item details in Header if it has data-display-header true  ( It's configurable value)
		 *  2. if it is false, then consider last to last selected item only if it is in active state
		 * 
		 */
		var show = false;
		var target = filterItem;

		if(filterItem.getAttribute('data-display-header') == "false"){
			if(instance.lastHeaderItem){
				if(instance.lastHeaderItem.hasClass(ACTIVE)){
					target = instance.lastHeaderItem;
				}else{
					instance.hide(instance.topicHeader);
					target = null;
				}
			}else{
				instance.hide(instance.topicHeader);
				target = null;
			}
		}
		if(target){
			var catgId = instance.getString(target.getAttribute('data-catg-id'));
			if(catgId && catgId !='' && catgId != "0"){
				A.one("#headerCatgName").setContent(instance.getString(target.getAttribute('data-name')));
				A.one("#headerCatgDesc").setContent(instance.getString(target.getAttribute('data-desc')));
				var link = target.getAttribute('data-view-link');
				var urlNode = A.one("#headerCatgUrl");
				if(link != null && link != undefined && link != '' && link != 'undefined'){
					instance.show(urlNode);
					urlNode.one("a").setAttribute("href",link);
				}else{
					instance.hide(urlNode);
				}
				instance.show(instance.topicHeader);
				instance.lastHeaderItem = target;
			}else{
				instance.hide(instance.topicHeader);
			}
		}
	}
	this.createSearchResult = function(data){
		var newResult = instance.searchResultNode.cloneNode(true);
		newResult.all("#imgLink,#titleLink").setAttribute("href",data.detailsLink);
		newResult.one("#titleLink").setContent(data.productName);
		newResult.one("#logo").set("src",data.logoUrl);
		newResult.one("#frameworkLogo").set("src",data.frameworkLogoUrl);
		newResult.one("#type").setContent(data.type);
		newResult.one("#desc").setContent(data.desc);
		newResult.one("#duration").setContent(data.duration);
		//newResult.one("#durationUnit").setContent(data.durationUnit);
		newResult.one("#moduleLabel").setContent(data.moduleLabel);
		newResult.one("#moduleCount").setContent(data.moduleCount);
		newResult.one("#specialization").setContent(data.specialization);
		newResult.one("#mobiledesc").setContent(data.desc);
		instance.searchResultsNode.appendChild(newResult);
	}
	this.togleActive = function(node){
		if(node.hasClass(ACTIVE)){
			node.removeClass(ACTIVE);
		}else{
			node.addClass(ACTIVE);
		}
	}
	this.createSingleTypeFilterItem = function(){
		var item =  instance.singleTypeFilterItem.cloneNode(true);
		return item;
	}
	this.createMultTypeFilterItem = function(){
		var item =  instance.multiTypeFilerItem.cloneNode(true);
		return item;
	}
	this.show = function(node){
		if(node){
			node.removeClass("hide");
		}
	}
	this.hide = function(node){
		if(node){
			node.addClass("hide");
		}
	}
	this.init(config);
}