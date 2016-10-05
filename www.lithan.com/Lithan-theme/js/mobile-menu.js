YUI().use('node', function (Y) {
	
	var searchBar = Y.all('.header_search_icon');
	var searchBarField = Y.one('#headerSearchField');
	var signInSearchBar = Y.all('.signIn_search_icon');
	var signInSearchBarField = Y.all('#signIn-headerSearchField');
	var mobilesearchBarField = Y.one('#mobile-headerSearchField');
	var mobilesearchBar = Y.all('.mobileheader_search_icon');
	var menuSub = Y.all('.dl-menu ul.dl-submenu');
	var menuSub2;
	var menuBack;
	
	menuSub.prepend('<li class="dl-back" id="dl-back"><a class="menu_back_btn" href="#"><i class="icon icon-chevron-left"></i> Back </a></li>');
	var menuItems = Y.all('.dl-menu ul li');
	menuBack = Y.all('.dl-back');
	
	mobilesearchBar.on('click', function(e){
		var searchValue = document.getElementById('mobile-headerSearchField').value;
		window.location= "/catalog?cSearch="+searchValue;
	});
	
	if(mobilesearchBarField){
		mobilesearchBarField.on('keypress', function(e){
			var searchValue = document.getElementById('mobile-headerSearchField').value;
			if (e.keyCode == 13) {
				window.location= "/catalog?cSearch="+searchValue;
			}
		});
	}	
	
	searchBar.on('click', function(e){
		var searchValue = document.getElementById('headerSearchField').value;
		window.location= "/catalog?cSearch="+searchValue;
	});
	
	if(searchBarField){
		searchBarField.on('keypress', function(e){
			var searchValue = document.getElementById('headerSearchField').value;
			if (e.keyCode == 13) {
				window.location= "/catalog?cSearch="+searchValue;
			}
		});
	}
	
	signInSearchBar.on('click', function(e){
		var searchValue = document.getElementById('signIn-headerSearchField').value;
		window.location= "/catalog?cSearch="+searchValue;
	});
	
	if(signInSearchBarField){
		signInSearchBarField.on('keypress', function(e){
			var searchValue = document.getElementById('signIn-headerSearchField').value;
			if (e.keyCode == 13) {
				window.location= "/catalog?cSearch="+searchValue;
			}
		});
	}
	
	menuItems.on('click', function(e){
		e.preventDefault();
		e.stopPropagation();
		var targ = e.currentTarget;
		
		menuSub2 = e.currentTarget.one('ul.dl-submenu');
		
		if(menuSub2){
			
			e.currentTarget.ancestor('ul.dl-menu').addClass('dl-subview');
			
			//e.stopPropagation();
			
		
			
			if(e.currentTarget.ancestor('li.dl-subviewopen')){
				//alert("I have LI ancestor of DL-Subviewopen");
				e.currentTarget.ancestor('li.dl-subviewopen').replaceClass('dl-subviewopen','dl-subview');
			}
			else{
				//alert("I dont have LI ancestor of DL-Subviewopen");
				
			}
			
			e.currentTarget.addClass('dl-subviewopen');	
		}
		
		else{
			window.location = targ.one('a').getAttribute('href');
		}
		
		
		
	});

menuBack.on('click', function(e){
		
		e.preventDefault();
		e.stopPropagation();
		
		//alert("Back Btn!");
		var subview = e.currentTarget.ancestor('li.dl-subviewopen');
		var subview2 = e.currentTarget.ancestor('li.dl-subview');
		subview.removeClass('dl-subviewopen');
		
		if(subview2){
				subview2.replaceClass( 'dl-subview','dl-subviewopen' );
		}
		else if(e.currentTarget.ancestor('ul.dl-subview')){
			e.currentTarget.ancestor('ul.dl-subview').removeClass( 'dl-subview' );
		}
		
	});

});


YUI().use('event-hover','node', 'transition', 'event', 'anim', 'datatype-number', function (Y) {
	
	var mobileMenu  = Y.one('.main-navigation-mobile');
	var mobileMenuBtn = Y.one('.mobile-navigation-button');
	var mobile_header = Y.one('.main-header-mobile');
	var didScroll;
	   var lastScrollTop = 0;
	   var delta = 5;
	   var navbarHeight = mobile_header.get('offsetHeight');
	
	
	if(mobileMenuBtn){
		mobileMenuBtn.on('click', mobileMenuBtnClicked);
	}
	
	var menuList1 = Y.all('.dropbtn');
	var menuList2 = Y.all('.dropbtn1');
	if(menuList1){
		menuList1.on('click', mobileMenuBtnClose);
	}
	if(menuList2){
		menuList2.on('click', mobileMenuBtnClose);
	}
	
	Y.on('scroll', function(e) {    
		if(window.scrollY > 10 || window.pageYOffset > 10 ){
			didScroll = true;
		}
	});
	
	setInterval(function() {
	    if (didScroll) {
	        //hasScrolled();
	        didScroll = false;
	    }
	}, 10);
	
	function hasScrolled() {
	    var st = this.scrollTop();
	    
	    if(Math.abs(lastScrollTop - st) <= delta)
	        return;
	    
	    if (st > lastScrollTop && st > navbarHeight){
	        // Scroll Down
	        //header_lp.removeClass('nav-down').addClass('nav-up');
	    	mobile_header.removeClass('nav-down').addClass('nav-up');

	        if(mobileMenuBtn){
	        	mobileMenuBtn.removeClass('nav-down').addClass('nav-up');
	        	mobileMenu.removeClass('active');
	        }
	    } else {
	        // Scroll Up
	        if(st + win.get('offsetHeight') < doc.get('offsetHeight')) {
	            //header_lp.removeClass('nav-up').addClass('nav-down');
	        	mobile_header.removeClass('nav-up').addClass('nav-down');
	            if(mobileMenuBtn){
		        	mobileMenuBtn.removeClass('nav-up').addClass('nav-down');
		        	mobileMenu.removeClass('active');
		        }

	        }
	    }
	    
	    lastScrollTop = st;
	}

	
	
	function mobileMenuBtnClicked(e){
		var targ = e.currentTarget;
		
		var parentTarg = targ.get('parentNode').get('parentNode');
		parentTarg.toggleClass('active');
	}
	
	function mobileMenuBtnClose(e){
		
		var targ = Y.all('.main-header-mobile');
		if(targ){
			targ.removeClass('active');
		}
		var targ1 = Y.all('.main-header-mobile .mobile-menu-icon-hamburger');
		
		if(targ1){
			targ1.removeClass('active');
		}
	}
	
});
