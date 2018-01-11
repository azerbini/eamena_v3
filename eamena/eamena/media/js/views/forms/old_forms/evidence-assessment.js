define(['jquery', 
    'underscore', 
    'knockout-mapping', 
    'views/forms/base', 
    'views/forms/sections/branch-list',
    'bootstrap-datetimepicker',], 
    function ($, _, koMapping, BaseForm, BranchList) {
        return BaseForm.extend({
            initialize: function() {
                BaseForm.prototype.initialize.apply(this);                
                
                var self = this;
                var date_picker = $('.datetimepicker').datetimepicker({pickTime: false});
                date_picker.on('dp.change', function(evt){
                    $(this).find('input').trigger('change'); 
                });

                this.addBranchList(new BranchList({
                    el: this.$el.find('#subjects-section')[0],
                    data: this.data,
                    dataKey: 'SITE_FUNCTION_TYPE.E55',
                    rules: true,
                    validateBranch: function (nodes) {
                        return this.validateHasValues(nodes);
                    }
                }));

      
                this.addBranchList(new BranchList({
                    el: this.$el.find('#overall-certainty-section')[0],
                    data: this.data,
                    dataKey: 'ARCHAEOLOGY_CERTAINTY_VALUE.I6',
                    rules: true,
                    validateBranch: function (nodes) {
                         return this.validateHasValues(nodes);
                    }
                }));
                                
                               
                this.addBranchList(new BranchList({
                     el: this.$el.find('#culturalperiod-section')[0],
                     data: this.data,
                     dataKey: 'CULTURAL_PERIOD.E55',
                     rules: true,
                     validateBranch: function (nodes) {
                           return this.validateHasValues(nodes);
                     }
                }));
         
                this.addBranchList(new BranchList({
                     el: this.$el.find('#phase-section')[0],
                     data: this.data,
                     dataKey: 'TIME-SPAN_PHASE.E52',
                     validateBranch: function (nodes) {
                          return true;
                          return this.validateHasValues(nodes);
                     }
                }));

                this.addBranchList(new BranchList({
                    el: this.$el.find('#sitemorph-section')[0],
                    data: this.data,
                    dataKey: 'SITE_MORPHOLOGY_TYPE.E55',
                    rules: true,
                    validateBranch: function (nodes) {
                         return this.validateHasValues(nodes);
                    }
                }));
                               
                this.addBranchList(new BranchList({
                    el: this.$el.find('#siteshape-section')[0],
                    data: this.data,
                    dataKey: 'SITE_OVERALL_SHAPE_TYPE.E55',
                    rules: true,
                    validateBranch: function (nodes) {
                         return this.validateHasValues(nodes);
                    }                                         
                }));
                               

                               
            }
        });
    }
);