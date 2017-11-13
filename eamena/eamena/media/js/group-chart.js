require([
    'jquery',
    'underscore',
    'Highcharts'
], function($, _, Highcharts) {
    // var seconds = new Date().getTime() / 1000;
    var drawCharts = function (action) {
        var allUsersData = {};
        var startDate;
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
                enabled: false
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
                }
            },
            series: [{
                type: 'area',
                name: 'UserActions',
                fillOpacity: 0
            }]
        };

        // find the starting date for the charts
        Object.keys(activitySummary).forEach(function (userData) {
            Object.keys(activitySummary[userData].data).forEach(function (dateData) {
                var userStartDate = new Date(activitySummary[userData].startDate);
                userStartDate = userStartDate.getTime();
                if (!startDate || startDate > userStartDate) {
                    startDate = userStartDate;
                }
            });
        });
        
        // for every user, then every date, then every, resource
        // add the actions of type action
        Object.keys(activitySummary).forEach(function (userData) {
            var data = {};
            Object.keys(activitySummary[userData].data).forEach(function (dateData) {
                var sumEntries = 0;
                Object.keys(activitySummary[userData].data[dateData]).forEach(function (resourceData) {
                    sumEntries += activitySummary[userData].data[dateData][resourceData][action];
                });
                var d = new Date(dateData);
                data[d.getTime()] = sumEntries;
                if (!allUsersData[d.getTime()]) {
                    allUsersData[d.getTime()] = 0;
                }
                allUsersData[d.getTime()] += sumEntries;
            });
            var today = new Date();
            today = today.getTime();
            var chartData = [];
            var i = 0;
            // create the data array in the format needed by Highcharts adding zeros
            // where there is no data
            for (var iDate = startDate; iDate <= today; iDate += 3600000 * 24) {
                 var chartValue = data[iDate] ? [iDate, data[iDate]] : [iDate, 0];
                 chartData.push(chartValue);
            }
            chartOptions.series[0].data = chartData;
            Highcharts.chart('user-chart-' + userData, chartOptions);
        });

        var today = new Date();
        today = today.getTime();
        var chartData = [];
        var i = 0;
        for (var iDate = startDate; iDate <= today; iDate += 3600000 * 24) {
             var chartValue = allUsersData[iDate] ? [iDate, allUsersData[iDate]] : [iDate, 0];
             chartData.push(chartValue);
        }
        chartOptions.series[0].data = chartData;
        Highcharts.chart('group-chart', chartOptions);
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
