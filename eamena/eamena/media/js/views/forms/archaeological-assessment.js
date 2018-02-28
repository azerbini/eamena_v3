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
                console.log("self.data", self.data);
                var date_picker = $('.datetimepicker').datetimepicker({pickTime: false});
                date_picker.on('dp.change', function(evt){
                    $(this).find('input').trigger('change'); 
                });
                
                this.addBranchList(new BranchList({
                    el: this.$el.find('#overall-archaeological-certainty')[0],
                    data: this.data,
                    dataKey: 'ARCHAEOLOGICAL_CERTAINTY_OBSERVATION.S4',
                    rules: true,
                    validateBranch: function (nodes) {
                        return this.validateHasValues(nodes);
                    }
                }));
                this.addBranchList(new BranchList({
                    el: this.$el.find('#cultural-period')[0],
                    data: this.data,
                    dataKey: 'CULTURAL_PERIOD_BELIEF.I2',
                    rules: true,
                    validateBranch: function (nodes) {
                        return this.validateHasValues(nodes);
                    }
                }));
                this.addBranchList(new BranchList({
                    el: this.$el.find('#period-of-occupation')[0],
                    data: this.data,
                    dataKey: 'ARCHAEOLOGICAL_TIMESPAN.E52',
                    rules: true,
                    validateBranch: function (nodes) {
                        return this.validateHasValues(nodes);
                    }
                }));
                this.addBranchList(new BranchList({
                    el: this.$el.find('#morphology')[0],
                    data: this.data,
                    dataKey: 'FEATURE_ASSIGNMENT.E13',
                    rules: true,
                    validateBranch: function (nodes) {
                         return this.validateHasValues(nodes);
                    }
                }));
                this.addBranchList(new BranchList({
                    el: this.$el.find('#feature-morphology')[0],
                    data: this.data,
                    dataKey: 'FEATURE_ASSIGNMENT.E13',
                    rules: true,
                    validateBranch: function (nodes) {
                         return this.validateHasValues(nodes);
                    }
                }));
                this.addBranchList(new BranchList({
                    el: this.$el.find('#feature-interpretation')[0],
                    data: this.data,
                    dataKey: 'FUNCTION_INTERPRETATION_INFERENCE_MAKING.I5',
                    rules: true,
                    validateBranch: function (nodes) {
                         return this.validateHasValues(nodes);
                    }
                }));
                // this.addBranchList(new BranchList({
                //     el: this.$el.find('#function-actor')[0],
                //     data: this.data,
                //     dataKey: 'FUNCTION_AND_INTERPRETATION_ACTOR.E39',
                //     rules: false,
                //     validateBranch: function (nodes) {
                //          return this.validateHasValues(nodes);
                //     }
                // }));
                // var actorList = this.data['FUNCTION_AND_INTERPRETATION_ACTOR.E39'].branch_lists;
                // 
                // if (actorList.length) {
                //     $(".show-box").addClass('hidden');
                //     $(".hide-box").addClass('hidden');
                //     $(".edit-actors-row").removeClass('hidden');
                // }
                

            },
            
            // toggleEditActor: function (e) {
            //     if ($(e.target).hasClass("show-box")) {
            //         $(".show-box").addClass('hidden');
            //         $(".hide-box").removeClass('hidden');
            //         $(".edit-actors-row").removeClass('hidden');
            //     } else {
            //         $(".show-box").removeClass('hidden');
            //         $(".hide-box").addClass('hidden');
            //         $(".edit-actors-row").addClass('hidden');
            //     }
            // },
            
            events: function(){
                var events = BaseForm.prototype.events.apply(this);
                events['click .edit-actor'] = 'toggleEditActor';
                return events;
            },

        });
    }
);