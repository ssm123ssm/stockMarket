$.ajaxSetup({
    cache: false
});
var app = angular.module('myApp', []);
var fresh = true;
var colors = ['#45959b', '#59459b', '#459b73', '#ccd13e ', '#d413b7 '];

app.controller('ctrl', ['$scope', function ($scope) {


    }]);
app.directive('nop', function () {
    return {
        link: function (scope, elm) {
            elm.css('background-color', scope.item.color);
        }
    }
});


$(function () {
    var socket = io.connect();
    var lineChart;

    function nodata() {
        //alert('nothing');
        console.log('nodata');
    }

    var scope = angular.element($('body')).scope();
    socket.on('allData', function (dataz) {

        if (!fresh) {
            lineChart.destroy();
            //alert('destroyed');
        } else {
            fresh = false;
        }
        //$.domCache('#myChart').remove();
        var ctx = document.getElementById("myChart").getContext('2d');

        //alert('New Alldata emission');
        //alert('data');
        //document.write(dataz.info[0].data[0]['date']);
        var stocks = [];
        var labels = [];
        var datasets = [];



        if (dataz.info[0]) {
            $('.info').css('display', 'block');
            dataz.info[0].data.forEach(function (item) {
                labels.push(item.date);
                //data.push(item.val);
            });

            var c = 0;
            dataz.info.forEach(function (item) {
                //c++;
                var ins = {
                    borderColor: colors[c],
                };

                var ins2 = {};
                console.log('Border- ' + c);
                ins2['color'] = colors[c];
                c++;
                if (c == colors.length) {
                    c = 0;
                }
                ins['label'] = item.name;
                ins['borderWidth'] = .5;
                //ins['markerSize'] = 1;

                ins2['name'] = item.name.toUpperCase();

                stocks.push(ins2);
                var data = [];

                item.data.forEach(function (item) {
                    data.push(item.val);
                });
                ins['data'] = data;
                datasets.push(ins);
            });
            // var data = [];
            //console.log(data);
            var data2 = {
                labels: labels,
                datasets: datasets
            };
            var options = {
                elements: {
                    point: {
                        radius: 1
                    }
                },
                showTooltips: false

            };

            lineChart = new Chart(ctx, {
                type: 'line',
                data: data2,
                options: options
            });

            scope.$apply(function () {
                //scope.color = colors[c];
                scope.stocks = stocks;
                scope.remove = function (item) {
                    lineChart.destroy();
                    socket.emit('remove', {
                        sym: item.name
                    });
                };
                scope.fixColor = function (color) {
                    //alert(color);

                }
            });
        } else {
            //alert('empty');
            $('.info').css('display', 'none');
        }






    });
    socket.on('nodata', function (data) {

        //alert('No data!');
        nodata();
        /* $(".notFound").css("display", "block");
 $(".notFound").addClass("animated fadeIn");*/
        //debugger;

        // window.location.replace('/');

    });


    $('#add').click(function () {
        var sym = $('#sym').val().toUpperCase();
        //alert(sym);
        window.location.replace('/test?sym=' + sym);

    });
});
