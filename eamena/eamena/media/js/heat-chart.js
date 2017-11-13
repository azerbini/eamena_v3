require([
    'jquery',
    'underscore',
    'Highcharts',
], function($, _, Highcharts) {
    var drawCharts = function (action) {
        var chartOptions = {
            chart: {
                zoomType: 'x'
            },
            title: { text: ''},
            subtitle: {
                text: document.ontouchstart === undefined ?
                        'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
            },
            xAxis: {
                type: 'datetime'
            },
            yAxis: {
                title: {
                    text: 'Actions'
                },
                min: 0,
            },
            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'middle'
            },
            plotOptions: {
                area: {
                    marker: {
                        radius: 2
                    },
                    lineWidth: 1,
                    states: {
                        hover: {
                            lineWidth: 1
                        }
                    },
                    threshold: null
                },
                series:{
                    allowPointSelect: true,
                    point: {
                        events:{
                            select: function(e) {
                                if ($("#date-" + new Date(e.target.x).toISOString().slice(0, 10)).length) {
                                    window.location.hash="date-" + new Date(e.target.x).toISOString().slice(0, 10);
                                }
                            }
                        }
                    }
                }
            },
            series: [{
                type: 'area',
                name: 'Total resources changed',
                fillOpacity: 0
            }, {
                type: 'area',
                name: 'action-resources',
                fillOpacity: 0
            }]
        };

        var seconds = new Date().getTime() / 1000;
        var dataSum = {};
        var dataAction = {};

        var startDate = "";
        // search in every date then in every resource then in every action type
        // and add the actions for this date
        Object.keys(activitySummary).forEach(function (dateData) {
            var sumEntries = 0;
            var actionEntries = 0
            Object.keys(activitySummary[dateData]).forEach(function (resourceData) {
                // sumEntries += activitySummary[dateData][resourceData][actionData];
                sumEntries ++
                Object.keys(activitySummary[dateData][resourceData]).forEach(function (actionData) {
                    if (actionData == action) {
                        actionEntries += activitySummary[dateData][resourceData][actionData];
                    }
                });
            });
            var d = new Date(dateData);
            dataSum[d.getTime()] = sumEntries;
            dataAction[d.getTime()] = actionEntries;
            // find the starting date for the chart
            if (!startDate || startDate > d.getTime()) {
                startDate = d.getTime();
            }
        });
        var today = new Date();
        today = today.getTime();
        var chartDataSum = [];
        var chartDataAction = [];
        var i = 0;
        // create the data array in the format needed by Highcharts
        for (var iDate = startDate; iDate <= today; iDate += 3600000 * 24) {
             var chartValue = dataSum[iDate] ? [iDate, dataSum[iDate]] : [iDate, 0];
             chartDataSum.push(chartValue);
             chartValue = dataAction[iDate] ? [iDate, dataAction[iDate]] : [iDate, 0];
             chartDataAction.push(chartValue);
        }
        chartOptions.series[0].data = chartDataSum;
        chartOptions.series[1].data = chartDataAction;
        chartOptions.series[1].name = $('.dropdown-actions-button').text();
        Highcharts.chart('user-chart', chartOptions);
    }
    $('.dropdown-actions-button').html('Created resources <i class="fa fa-chevron-down"></i>')
    drawCharts('create');
    
    // event listeners for the action type selection button - menu
    $('.dropdown-actions-button').on('click', function(evt) {
        $('.dropdown-actions-menu').toggleClass('open');
        if ($('.dropdown-actions-menu').hasClass('open')) {
            $('.dropdown-actions-menu').show();
        } else {
            $('.dropdown-actions-menu').hide();
        }
    });
    
    $('.select-action').on('click', function(evt) {
        $('.dropdown-actions-menu').removeClass('open');
        $('.dropdown-actions-menu').hide();
        $('.dropdown-actions-button').html($(evt.target).text() +' <i class="fa fa-chevron-down"></i>')
        drawCharts(evt.target.dataset.action);
    });

});
