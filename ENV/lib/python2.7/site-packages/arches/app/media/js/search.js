require(['jquery', 
    'underscore',
    'backbone',
    'bootstrap',
    'arches', 
    'select2',
    'views/search/term-filter', 
    'views/search/map-filter',
    'views/search/time-filter',
    'views/search/search-results',
    'knockout',
    'plugins/bootstrap-slider/bootstrap-slider.min',
    'views/forms/sections/branch-list',
    'resource-types',
    'openlayers',
    'bootstrap-datetimepicker',
    'plugins/knockout-select2'], 
    function($, _, Backbone, bootstrap, arches, select2, TermFilter, MapFilter, TimeFilter, SearchResults, ko, Slider, BranchList, resourceTypes, ol) {
    $(document).ready(function() {
        var wkt = new ol.format.WKT();

        var SearchView = Backbone.View.extend({
            el: $('body'),
            updateRequest: '',

            events: {
                'click #view-saved-searches': 'showSavedSearches',
                'click #clear-search': 'clear',
                'click #map-filter-button': 'clickMapFilter',
                'click #map-filter-button .close-btn': 'closeMapFilter',
                'click #time-filter-button': 'toggleTimeFilter',
                'click a.dataexport': 'exportSearch',
                'click a.search-and-or': 'onChangeAndOr',
                'click a.search-grouped': 'onChangeGroup',
                'click .add-search-box': 'onAddSearchBox',
                'click .remove-search-box': 'onRemoveSearchBox',
                'click .advanced-search': 'onToggleAdvancedSearch',
            },

            initialize: function(options) {
                var self = this;
                var query = this.getQueryFromUrl();
                if('termFilter' in query){
                    query.termFilter = JSON.parse(query.termFilter);
                    query.termFilter = _.filter(query.termFilter , function(filter){ return filter.length > 0 });
                    this.searchBoxes = query.termFilter.length;
                    // number of term search boxes should be at least one (except the date-location box)
                    if (this.searchBoxes < 1) {
                        this.searchBoxes = 1;
                    }
                } else {
                    this.searchBoxes = 1;
                }
                this.initializeSearchBoxes();

                this.mapFilter = new MapFilter({
                    el: $('#map-filter-container')[0]
                });
                this.mapFilter.on('enabled', function(enabled, inverted){
                    if(enabled){
                        // this.termFilter[0].addTag(this.mapFilterText, inverted);
                        $("#map-filter-button").addClass("enabled");
                    }else{
                        // this.termFilter[0].removeTag(this.mapFilterText);
                        $("#map-filter-button").removeClass("enabled");
                        // this.mapFilter.clear();
                    }
                    this.mapFilter.inverted = inverted;
                    if(inverted){
                        $("#map-filter-button").addClass("inverted");
                    }else{
                        $("#map-filter-button").removeClass("inverted");
                    }
                }, this);


                this.timeFilter = new TimeFilter({
                    el: $('#time-filter-container')[0]
                });
                this.timeFilter.on('enabled', function(enabled, inverted){
                    if(enabled){
                        this.termFilter[0].addTag(this.timeFilterText, inverted);
                        this.termFilterSimple.addTag(this.timeFilterText, inverted);
                    }else{
                        this.termFilter[0].removeTag(this.timeFilterText);
                        this.termFilterSimple.removeTag(this.timeFilterText);
                    }
                }, this);
                this.booleanSearch = "and";
                this.advancedSearch = false;

                this.searchResults = new SearchResults({
                    el: $('#search-results-container')[0]
                });
                this.searchResults.on('mouseover', function(resourceid){
                    this.mapFilter.selectFeatureById(resourceid);
                }, this);
                this.searchResults.on('mouseout', function(){
                    this.mapFilter.unselectAllFeatures();
                }, this);
                this.searchResults.on('find_on_map', function(resourceid, data){
                    var extent,
                        expand = !this.mapFilter.expanded();
                    if (expand) {
                        this.mapFilter.expanded(true);
                    }
                    
                    _.each(data.geometries, function (geometryData) {
                        var geomExtent = wkt.readGeometry(geometryData.label).getExtent();
                        geomExtent = ol.extent.applyTransform(geomExtent, ol.proj.getTransform('EPSG:4326', 'EPSG:3857'));
                        extent = extent ? ol.extent.extend(extent, geomExtent) : geomExtent;
                    });
                    if (extent) {
                        _.delay(function() {
                            self.mapFilter.zoomToExtent(extent);
                        }, expand ? 700 : 0);
                    }
                }, this);


                this.mapFilterText = this.mapFilter.$el.data().filtertext;
                this.timeFilterText = this.timeFilter.$el.data().filtertext;

                self.isNewQuery = true;
                this.searchQuery = {
                    queryString: function(){
                        if (self.advancedSearch) {
                            var termFilters = [];
                            var termFiltersLen = 0;
                            var termFilterGrouping = self.termFilterGrouping;
                            _.each(self.termFilter,function (term, i) {
                                termFiltersLen += term.query.filter.terms().length;
                                termFilters.push(term.query.filter.terms());
                            })
                        } else {
                            var termFilters = [self.termFilterSimple.query.filter.terms()];
                            var termFiltersLen = self.termFilterSimple.query.filter.terms().length;
                            var termFilterGrouping = [self.termFilterGroupingSimple];
                        }
                        var params = {
                            page: self.searchResults.page(),
                            termFilter: ko.toJSON(termFilters),
                            temporalFilter: ko.toJSON({
                                year_min_max: self.timeFilter.query.filter.year_min_max(),
                                filters: self.timeFilter.query.filter.filters(),
                                inverted: self.timeFilter.query.filter.inverted()
                            }),
                            spatialFilter: ko.toJSON(self.mapFilter.query.filter),
                            mapExpanded: self.mapFilter.expanded(),
                            timeExpanded: self.timeFilter.expanded(),
                            booleanSearch: self.booleanSearch,
                            termFilterGrouping: ko.toJSON(termFilterGrouping),
                            advancedSearch: self.advancedSearch ? "true" : "false",
                        };
                        
                        if (termFiltersLen === 0 &&
                            self.timeFilter.query.filter.year_min_max().length === 0 &&
                            self.timeFilter.query.filter.filters().length === 0 &&
                            self.mapFilter.query.filter.geometry.coordinates().length === 0) {
                            params.no_filters = true;
                        }

                        params.include_ids = self.isNewQuery;
                        return $.param(params).split('+').join('%20');
                    },
                    changed: ko.pureComputed(function(){
                        var ret = ko.toJSON(this.timeFilter.query.changed()) +
                            ko.toJSON(this.mapFilter.query.changed());
                        return ret;
                    }, this).extend({ rateLimit: 200 })
                };
                this.getSearchQuery();
                this.searchResults.page.subscribe(function(){
                    self.doQuery();
                });

                this.searchQuery.changed.subscribe(function(){
                    self.isNewQuery = true;
                    self.searchResults.page(1);
                    self.doQuery();
                });
            },
            

            doQuery: function () {
                var self = this;
                var queryString = this.searchQuery.queryString();
                if (this.updateRequest) {
                    this.updateRequest.abort();
                }

                $('.loading-mask').show();
                window.history.pushState({}, '', '?'+queryString);

                this.updateRequest = $.ajax({
                    type: "GET",
                    url: arches.urls.search_results,
                    data: queryString,
                    success: function(results){
                        var data = self.searchResults.updateResults(results);
                        self.mapFilter.highlightFeatures(data, $('.search-result-all-ids').data('results'));
                        self.mapFilter.applyBuffer();
                        self.isNewQuery = false;
                        $('.loading-mask').hide();
                    },
                    error: function(){}
                });
            },

            showSavedSearches: function(){
                this.clear();
                $('#saved-searches').slideDown('slow');
                $('#search-results').slideUp('slow');
                this.mapFilter.expanded(false);
                this.timeFilter.expanded(false);
            },

            hideSavedSearches: function(){
                $('#saved-searches').slideUp('slow');
                $('#search-results').slideDown('slow');
            },

            // clickMapFilter opens map filter if closed, toggles the invert map filter if open
            clickMapFilter: function () {
                if($('#saved-searches').is(":visible")){
                    this.doQuery();
                    this.hideSavedSearches();
                }
                if(this.mapFilter.expanded()){
                    if (this.mapFilter.inverted) {
                        this.mapFilter.inverted = false;
                        $("#map-filter-button").removeClass("inverted");
                    } else {
                        if (this.mapFilter.query.filter.geometry.coordinates().length > 0) {
                            this.mapFilter.inverted = true;
                            $("#map-filter-button").addClass("inverted");
                        } else {
                            this.closeMapFilter();
                        }
                    }
                    this.mapFilter.query.filter.inverted(this.mapFilter.inverted);
                } else {
                    this.mapFilter.expanded(true);
                    $("#map-filter-button").addClass("enabled");
                }
                window.history.pushState({}, '', '?'+this.searchQuery.queryString());
            },

            closeMapFilter: function (ev) {
                if($('#saved-searches').is(":visible")){
                    this.doQuery();
                    this.hideSavedSearches();
                }
                this.mapFilter.expanded(false);
                this.mapFilter.clear();
                
                $("#map-filter-button").removeClass("enabled");
                window.history.pushState({}, '', '?'+this.searchQuery.queryString());
                return false;
            },

            toggleTimeFilter: function(){
                if($('#saved-searches').is(":visible")){
                    this.doQuery();
                    this.hideSavedSearches();
                }
                this.timeFilter.expanded(!this.timeFilter.expanded());
                window.history.pushState({}, '', '?'+this.searchQuery.queryString());
            },

            getQueryFromUrl: function () {
                return _.chain(decodeURIComponent(location.search).slice(1).split('&') )
                    // Split each array item into [key, value]
                    // ignore empty string if search is empty
                    .map(function(item) { if (item) return item.split('='); })
                    // Remove undefined in the case the search is empty
                    .compact()
                    // Turn [key, value] arrays into object parameters
                    .object()
                    // Return the value of the chain operation
                    .value();
            },

            getSearchQuery: function(){
                var doQuery = false;
                var query = this.getQueryFromUrl();

                if('page' in query){
                    query.page = JSON.parse(query.page);
                    doQuery = true;
                }
                this.searchResults.restoreState(query.page);

                if('advancedSearch' in query){
                    var queryAdvancedSearch = query.advancedSearch == "true" ? true : false;
                    if (queryAdvancedSearch != this.advancedSearch) {
                        this.onToggleAdvancedSearch();
                    }
                    doQuery = true;
                }
                if (this.advancedSearch) {
                    this.showAdvancedSearch();
                } else {
                    this.hideAdvancedSearch();
                }
                
                if('termFilter' in query){
                    if (this.advancedSearch) {
                        query.termFilter = JSON.parse(query.termFilter);
                        // remove termfilters if they are empty
                        // except the 1st (date-location) and 2nd (at least one searchbox is needed)
                        query.termFilter = _.filter(query.termFilter , function(filter, i){
                            if (i<2) return true;
                            return filter.length > 0
                         });
                        doQuery = true;
                        for (var i = 0; i < this.searchBoxes+1; i++) {
                            this.termFilter[i].restoreState(query.termFilter[i]);
                        }
                    } else {
                        query.termFilter = JSON.parse(query.termFilter);
                        doQuery = true;
                        this.termFilterSimple.restoreState(query.termFilter[0]);
                    }
                }
                
                if('termFilterGrouping' in query){
                    _.each(JSON.parse(query.termFilterGrouping), function (groupingValue ,i) {
                        
                        $(".select2-container.resource_search_widget"+i)
                            .closest(".search-box-container").find(".group-value").
                            html(groupingValue.charAt(0).toUpperCase() + groupingValue.slice(1));
                        this.termFilterGrouping[i] = groupingValue;
                    }.bind(this));
                    doQuery = true;
                }
                
                if('booleanSearch' in query){
                    this.onChangeAndOr(query.booleanSearch);
                    doQuery = true;
                }

                if('temporalFilter' in query){
                    query.temporalFilter = JSON.parse(query.temporalFilter);
                    doQuery = true;
                }
                if('timeExpanded' in query){
                    query.timeExpanded = JSON.parse(query.timeExpanded);
                    doQuery = true;
                }
                this.timeFilter.restoreState(query.temporalFilter, query.timeExpanded);


                if('spatialFilter' in query){
                    query.spatialFilter = JSON.parse(query.spatialFilter);
                    doQuery = true;
                }
                if('mapExpanded' in query){
                    query.mapExpanded = JSON.parse(query.mapExpanded);
                    doQuery = true;
                }
                this.mapFilter.restoreState(query.spatialFilter, query.mapExpanded);
                

                if(doQuery){
                    this.doQuery();
                    this.hideSavedSearches();
                }
                
            },

            clear: function(){
                this.mapFilter.clear();
                this.timeFilter.clear();
                for (var i = 0; i < this.searchBoxes; i++) {
                    this.termFilter[i].clear();
                }
            },

            exportSearch: function(e) {
                var export_format = e.currentTarget.id,
                    _href = $("a.dataexport").attr("href"),
                    format = 'export=' + export_format,
                    params_with_page = this.searchQuery.queryString(),
                    page_number_regex = /page=[0-9]+/;
                    params = params_with_page.replace(page_number_regex, format);
                $("a.dataexport").attr("href", arches.urls.search_results_export + '?' + params);
            },
            
            onChangeAndOr: function (e) {
                var targetClass;
                if (e.target) {
                    if ($(e.target).hasClass("search-and")) {
                        targetClass = "and";
                    }
                    if ($(e.target).hasClass("search-or")) {
                        targetClass = "or";
                    }
                } else {
                    targetClass = e;
                }
                if (targetClass == 'and') {
                    if (this.booleanSearch != "and") {
                        $(".and-or-value").html("And");
                        this.booleanSearch = "and";
                        $(".select2-choices").removeClass("or-search");
                        this.doQuery();
                    }
                } else if (targetClass == 'or') {
                    if (this.booleanSearch != "or") {
                        $(".and-or-value").html("Or");
                        this.booleanSearch = "or";
                        $(".select2-choices").addClass("or-search");
                        this.doQuery();
                    }
                }
            },
            
            onToggleAdvancedSearch: function () {
                if (this.advancedSearch) {
                    this.advancedSearch = false;
                    this.hideAdvancedSearch();
                } else {
                    this.advancedSearch = true;
                    this.showAdvancedSearch();
                }
                this.doQuery();
            },
            
            showAdvancedSearch: function () {
                $(".btn.advanced-search").addClass("btn-primary");
                $(".select2-container.select-location-time").show();
                $(".search-box-container.term-search-advanced").show();
                $(".search-box-container.term-search-simple").hide();
                $(".global-and-or").show();
                $(".add-remove-search-box").show();
            },
            hideAdvancedSearch: function () {
                $(".btn.advanced-search").removeClass("btn-primary");
                $(".select2-container.select-location-time").hide();
                $(".search-box-container.term-search-advanced").hide();
                $(".search-box-container.term-search-simple").show();
                $(".global-and-or").hide();
                $(".add-remove-search-box").hide();
            },
            
            onChangeGroup: function (e) {
                var i = $(e.target.closest("div")).data("index");
                if (i == "_simple") {
                    var termFilterGrouping = this.termFilterGroupingSimple
                } else {
                    var termFilterGrouping = this.termFilterGrouping[i]
                }
                if ($(e.target).hasClass("search-and")) {
                    if (termFilterGrouping != "and") {
                        $(e.target).closest(".dropdown").find(".group-value").html("And");
                        if (i == "_simple") {
                            this.termFilterGroupingSimple = "and";
                        } else {
                            this.termFilterGrouping[i] = "and";
                        }
                        this.doQuery();
                    }
                } else if ($(e.target).hasClass("search-or")) {
                    if (termFilterGrouping != "or") {
                        $(e.target).closest(".dropdown").find(".group-value").html("Or");
                        if (i == "_simple") {
                            this.termFilterGroupingSimple = "or";
                        } else {
                            this.termFilterGrouping[i] = "or";
                        }
                        this.doQuery();
                    }
                } else if ($(e.target).hasClass("search-group")) {
                    if (termFilterGrouping != "group") {
                        $(e.target).closest(".dropdown").find(".group-value").html("Group");
                        if (i == "_simple") {
                            this.termFilterGroupingSimple = "group";
                        } else {
                            this.termFilterGrouping[i] = "group";
                        }
                        this.doQuery();
                    }
                }
            },

            initializeSearchBoxes: function () {
                this.termFilter = [];
                this.termFilterGrouping = [];
                this.cloneSearchBox("_simple");
                this.termFilterGroupingSimple = "and";
                this.termFilterSimple = this.addSearchBox("_simple");
                this.addSearchBoxEvents(this.termFilterSimple, "_simple");
                $(".search-box-container[data-index='_simple'] .select-groupping").hide();
                $(".search-box-container[data-index='_simple']").addClass("term-search-simple");
                for (var i = 0; i <= this.searchBoxes; i++) {
                    if (i > 0) {
                        this.cloneSearchBox(i);
                    }
                    this.termFilterGrouping[i] = "and";
                    this.termFilter[i] = this.addSearchBox(i);
                    this.addSearchBoxEvents(this.termFilter[i], i);
                    $(".search-box-container[data-index='"+i+"'] .select-groupping").hide();
                    $(".search-box-container[data-index='"+i+"']").addClass("term-search-advanced");
                }
                $('.resource_search_widget0 input').attr({'disabled': true});
            },
            
            addSearchBox: function (i) {
                var newTermFilter = new TermFilter({
                    el: $.find('input.resource_search_widget' + i)[0],
                    index: i
                });
                return newTermFilter;
            },
            
            addSearchBoxEvents: function (termFilter, i) {
                termFilter.on('change', function(){
                    this.isNewQuery = true;
                    this.searchResults.page(1);
                    _.defer(function () {
                        this.doQuery();
                        if (termFilter.query.filter.terms().length < 2) {
                            $(".search-box-container[data-index='"+i+"'] .select-groupping").hide();
                        } else {
                            $(".search-box-container[data-index='"+i+"'] .select-groupping").show();
                        }
                    }.bind(this)) 
                    if($('#saved-searches').is(":visible")){
                        this.hideSavedSearches();
                    }
                }, this);
                termFilter.on('filter-removed', function(item){
                    if(item.text === this.mapFilterText){
                        this.mapFilter.clear();
                    }
                    if(item.text === this.timeFilterText){
                        this.timeFilter.clear();
                    }
                }, this);
                termFilter.on('filter-inverted', function(item){
                    if(item.text === this.mapFilterText){
                        this.mapFilter.query.filter.inverted(item.inverted);
                    }
                    if(item.text === this.timeFilterText){
                        this.timeFilter.query.filter.inverted(item.inverted);
                    }
                }, this);
            },
            
            cloneSearchBox: function (i) {
                var cloneInput = $("#term-select-template").clone()
                    .removeAttr('id','term-select-template')
                    .removeClass('hidden')
                    .attr('data-index', i);
                cloneInput.find(".arches-select2").addClass('resource_search_widget' + i);
                $(".term-search-boxes").append(cloneInput);
            },


            removeSearchBox: function (i) {
                $('.resource_search_widget' + i).remove();
                this.termFilter[i].stopListening();
                this.termFilter[i].remove();
                this.termFilter.splice(i, 1);
                this.doQuery();
            },
            
            onAddSearchBox: function (e) {
                this.searchBoxes++;
                this.cloneSearchBox(this.searchBoxes);
                this.termFilterGrouping[this.searchBoxes] = "and";
                this.termFilter[this.searchBoxes] = this.addSearchBox(this.searchBoxes);
                this.addSearchBoxEvents (this.termFilter[this.searchBoxes], this.searchBoxes);
                $(".search-box-container[data-index='"+this.searchBoxes+"']").addClass("term-search-advanced");
                $(".search-box-container[data-index='"+this.searchBoxes+"'] .select-groupping").hide();
            },

            onRemoveSearchBox: function (e) {
                this.removeSearchBox(this.searchBoxes);
                $(".search-box-container[data-index="+ this.searchBoxes +"]").remove();
                this.searchBoxes--;
            },

        });
        new SearchView();
    });
});