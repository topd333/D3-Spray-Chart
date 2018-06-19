function BasicSpray(container) {

    this.colors = ["#b2182b", "#d6604d", "#f4a582", "#92c5de", "#4393c3", "#2166ac"];
    this.d0 = 400;
    this.d1 = 350;
    this.d2 = 160;

    var rect = container.node().getBoundingClientRect(),
        margin = 5,
        size = Math.min(rect.width, rect.height) - 2 * margin,
        r0 = size / Math.sqrt(2),
        r1 = r0 * this.d1 / this.d0,
        r2 = r0 * this.d2 / this.d0,
        center = { x: Math.floor(rect.width / 2), y: Math.floor(rect.height / 2 + size / 2) };

    this.dBase = r0 / this.d0;

    var svg = container.append("svg").attr("width", rect.width).attr("height", rect.height);
    this.g0 = svg.append("g").attr("transform", "translate(" + center.x + "," + center.y + ")").style("opacity", 0);

    var tooltip = container.append("div").attr("class", "tooltip").style("opacity", 0);

    this.arcs = [
        { innerRadius: 0, outerRadius: r2, innerD: 0, outerD: this.d2, startAngle: -Math.PI / 4, endAngle: -Math.PI / 12, rotate: -30 },
        { innerRadius: 0, outerRadius: r2, innerD: 0, outerD: this.d2, startAngle: -Math.PI / 12, endAngle: Math.PI / 12, rotate: 0 },
        { innerRadius: 0, outerRadius: r2, innerD: 0, outerD: this.d2, startAngle: Math.PI / 12, endAngle: Math.PI / 4, rotate: 30 },
        { innerRadius: r2, outerRadius: r1, innerD: this.d2, outerD: this.d1, startAngle: -Math.PI / 4, endAngle: -Math.PI / 12, rotate: -30 },
        { innerRadius: r2, outerRadius: r1, innerD: this.d2, outerD: this.d1, startAngle: -Math.PI / 12, endAngle: Math.PI / 12, rotate: 0 },
        { innerRadius: r2, outerRadius: r1, innerD: this.d2, outerD: this.d1, startAngle: Math.PI / 12, endAngle: Math.PI / 4, rotate: 30 }
    ];

    var arc = d3.arc();
    this.g0.selectAll(".arc").data(this.arcs).enter().append("path").attr("class", "arc").attr("d", arc)
        .on("mouseover", function (d) {
            tooltip.html(Math.round(d.count * 100 / data.length) + "% (" + d.count + " of " + d.total + ")").style("opacity", 1);
        })
        .on("mousemove", function (d) {
            var pos = d3.mouse(this);
            if (pos[0] <= center.x * 0.3) {
                tooltip.style("right", null).style("left", (pos[0] + center.x + 8) + "px").style("top", (pos[1] + center.y - 15) + "px");
            } else {
                tooltip.style("left", null).style("right", (center.x - pos[0] + 4) + "px").style("top", (pos[1] + center.y - 15) + "px");
            }
        })
        .on("mouseout", function () {
            tooltip.style("opacity", 0);
        });

    this.g0.selectAll(".arc-text").data(this.arcs).enter().append("text").attr("class", "arc-text")
        .attr("x", 0).attr("y", function (d) { return -d.outerRadius * 0.75; })
        .attr("transform", function (d) { return "rotate(" + d.rotate + ")"; });

    this.g2 = svg.append("g").attr("transform", "translate(" + center.x + "," + center.y + ")").style("opacity", 0).style("pointer-events", "none");
    this.g2.append("rect").attr("class", "dots-panel").attr("x", -center.x).attr("y", -center.y).attr("width", rect.width).attr("height", rect.height);

    this.g1 = svg.append("g").attr("transform", "translate(" + Math.floor(rect.width / 2) + "," + Math.floor(rect.height / 2 + 20) + ")").style("opacity", 0);
    this.g1.append("text").style("text-anchor", "middle");

    this.update = function (data) {
        var self = this;

        self.g0.style("opacity", 0);
        self.g1.style("opacity", 0);
        self.g2.selectAll(".dot").remove();

        if (data.length === 0) {
            self.g1.select("text").text("There is no available data.");
            self.g1.transition().style("opacity", 1);
            return;
        }

        self.arcs.forEach(function (a) {
            a.count = 0;
            a.total = data.length;
        });

        data.forEach(function (d) {
            if (d.distance <= self.d2) {
                if (d.direction >= -45 && d.direction < -15) {
                    self.arcs[0].count++;
                } else if (d.direction >= -15 && d.direction <= 15) {
                    self.arcs[1].count++;
                } else if (d.direction > 15 && d.direction <= 45) {
                    self.arcs[2].count++;
                }
            } else if (d.distance <= self.d1) {
                if (d.direction >= -45 && d.direction < -15) {
                    self.arcs[3].count++;
                } else if (d.direction >= -15 && d.direction <= 15) {
                    self.arcs[4].count++;
                } else if (d.direction > 15 && d.direction <= 45) {
                    self.arcs[5].count++;
                }
            }

            var rad = d.direction * Math.PI / 180;
            self.g2.append("circle").attr("class", "dot").attr("r", 3).attr("cx", Math.sin(rad) * d.distance * self.dBase).attr("cy", -Math.cos(rad) * d.distance * self.dBase).style("opacity", 0);
        });

        var tempSort = [], i;
        for (i = 0; i < self.arcs.length; i++) {
            tempSort.push({ index: i, count: self.arcs[i].count });
        }

        tempSort.sort(function (a, b) { return a.count < b.count ? 1 : a.count > b.count ? -1 : 0; });
        for (i = 0; i < tempSort.length; i++) {
            self.arcs[tempSort[i].index].color = self.colors[i];
        }

        self.g0.selectAll(".arc").data(self.arcs).style("fill", function (d) { return d.color; });
        self.g0.selectAll(".arc-text").data(self.arcs).text(function (d) { return Math.round(d.count * 100 / d.total) + "%"; });

        self.g0.transition().duration(500).style("opacity", 1);
        self.g2.selectAll(".dot").transition().duration(500).style("opacity", 1);
    };

    this.toggleDots = function () {
        var self = this;

        if (self.g2.style("opacity") == 0) {
            self.g2.transition().style("opacity", 1).style("pointer-events", "auto");
        } else {
            self.g2.transition().style("opacity", 0).style("pointer-events", "none");
        }
    };
}

function RpmVelo(container) {

    var rect = container.node().getBoundingClientRect(),
        margin = { left: 60, top: 20, right: 90, bottom: 50 },
        size = { width: rect.width - margin.left - margin.right, height: rect.height - margin.top - margin.bottom };

    var svg = container.append("svg").attr("width", rect.width).attr("height", rect.height);

    this.yScale = d3.scaleLinear().range([size.height, 0]);
    this.yAxis = d3.axisLeft(this.yScale).tickSizeInner(-size.width).tickSizeOuter(0).tickPadding(8).ticks(5);

    this.xScale = d3.scaleLinear().range([0, size.width]);
    this.xAxis = d3.axisBottom(this.xScale);

    this.y = svg.append("g").attr("class", "y axis").attr("transform", "translate(" + margin.left + "," + margin.top + ")").style("opacity", 0);
    this.y.append("text").attr("class", "label").attr("transform", "rotate(-90)").attr("x", -size.height / 2).attr("y", -42).style("text-anchor", "middle").text("RPM");

    this.x = svg.append("g").attr("class", "x axis").attr("transform", "translate(" + margin.left + "," + (margin.top + size.height) + ")").style("opacity", 0);
    this.x.append("text").attr("class", "label").attr("x", size.width / 2).attr("y", 32).text("MPH");

    this.g0 = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").style("opacity", 0);

    var tooltip = container.append("div").attr("class", "tooltip").style("opacity", 0);

    this.firstLoad = true;
    this.color = d3.scaleOrdinal(d3.schemeCategory10);

    this.g1 = svg.append("g").attr("transform", "translate(" + (margin.left + size.width / 2) + "," + (margin.top + size.height / 2) + ")").style("opacity", 0);
    this.g1.append("text").style("text-anchor", "middle");

    this.g2 = svg.append("g").attr("transform", "translate(" + (margin.left + size.width + 20) + "," + (margin.top + 20) + ")").style("opacity", 0);

    this.update = function (data) {
        var self = this;

        if (!self.firstLoad) {
            self.g0.style("opacity", 0);
            self.g1.style("opacity", 0);
            self.g2.style("opacity", 0);
            self.g0.html("");
            self.g2.html("");
        }

        if (data.length === 0) {
            self.g1.select("text").text("There is no available data.");
            self.g1.transition().style("opacity", 1);
            return;
        }

        var xDomain = d3.extent(data, function (d) { return d.velocity; });
        var yDomain = d3.extent(data, function (d) { return d.spin_rate; });

        self.xScale.domain(xDomain).nice();
        self.yScale.domain(yDomain).nice();

        if (self.firstLoad) {
            self.x.call(self.xAxis).transition().style("opacity", 1);
            self.y.call(self.yAxis).transition().style("opacity", 1);
        } else {
            self.x.transition().call(self.xAxis);
            self.y.transition().call(self.yAxis);
        }

        d3.map(data, function (d) { return d.pitch_type; }).keys().forEach(function (type, i) {
            var subData = data.filter(function (d) { return d.pitch_type === type; });

            self.g0.append("g").attr("data-type", type)
                .selectAll(".dot").data(subData).enter().append("circle").attr("class", "dot").attr("r", 3)
                .style("fill", function (d) { return self.color(d.pitch_type); })
			    .attr("cx", function (d) { return self.xScale(d.velocity); })
			    .attr("cy", function (d) { return self.yScale(d.spin_rate); })
                .on("mouseover", function (d) {
                    tooltip.html(d.pitch_type + "<br/>v: " + Math.round(d.velocity * 100) / 100 + " mph<br/>s: " + Math.round(d.spin_rate * 100) / 100 + " rpm").style("opacity", 1);
                })
                .on("mousemove", function () {
                    var pos = d3.mouse(this);
                    tooltip.style("left", (pos[0] + 30) + "px").style("top", (pos[1] - 32) + "px");
                })
                .on("mouseout", function () {
                    tooltip.style("opacity", 0);
                });

            self.g2.append("circle").attr("class", "legend-dot").attr("r", 4).attr("cx", 0).attr("cy", i * 18).style("fill", self.color(type));
            self.g2.append("text").attr("class", "legend-text").attr("x", 8).attr("y", i * 18 + 4).text(type).attr("state", "1")
                .on("click", function () {
                    var state = d3.select(this).attr("state");
                    self.g0.select("g[data-type=" + d3.select(this).text() + "]").transition().style("opacity", state === "1" ? 0 : 1);
                    d3.select(this).attr("state", state === "1" ? "0" : "1").style("opacity", state === "1" ? 0.5 : 1);
                });
        });

        self.g0.transition().duration(500).style("opacity", 1);
        self.g2.transition().duration(500).style("opacity", 1);

        self.firstLoad = false;
    };
}

//spin rate vs velo
// Highcharts.chart('container', {
//     chart: {
//         type: 'scatter',
//         zoomType: 'xy'
//     },
//     title: {
//         text: 'Spin Rate vs Velocity'
//     },
//     subtitle: {
//         text: 'Pitcher: Phil Neikro'
//     },
//     xAxis: {
//         title: {
//             enabled: true,
//             text: 'Velocity (MPH)'
//         },
//         startOnTick: true,
//         endOnTick: true,
//         showLastLabel: true
//     },
//     yAxis: {
//         title: {
//             text: 'Spin rate (RPM)'
//         }
//     },
//     legend: {
//         layout: 'vertical',
//         align: 'left',
//         verticalAlign: 'top',
//         x: 100,
//         y: 70,
//         floating: true,
//         backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
//         borderWidth: 1
//     },
//     plotOptions: {
//         scatter: {
//             marker: {
//                 radius: 5,
//                 states: {
//                     hover: {
//                         enabled: true,
//                         lineColor: 'rgb(100,100,100)'
//                     }
//                 }
//             },
//             states: {
//                 hover: {
//                     marker: {
//                         enabled: false
//                     }
//                 }
//             },
//             tooltip: {
//                 headerFormat: '<b>{series.name}</b><br>',
//                 pointFormat: '{point.x} mph, {point.y} rpm'
//             }
//         }
//     },
//     series: [{
//         name: 'Fastball',
//         color: 'rgba(223, 83, 83, .5)',
//         data: [[85.5592214109487,1876.50508704771],
// [89.9445500901461,1836.93874298594],
// [82.8653322803656,1843.01780929452],
// [88.4256962570508,1853.43139887124],
// [85.2568517939003,1893.83457957847],
// [80.203648124803,1845.63648673786],
// [82.6935773404478,1844.8576667312],
// [81.8608099387411,1847.12463570875],
// [87.5405016603166,1861.15105664504],
// [81.0717988528418,1821.81598341382],
// [83.7933499690489,1811.93069058247],
// [85.8565357621329,1886.19359649678],
// [89.4741267423948,1809.18741497954],
// [83.7020059496587,1894.40571193692],
// [80.3365270961883,1846.35239923683],
// [86.2988434379618,1831.19392100315],
// [89.0502147206166,1872.03000256713],
// [81.0002229880266,1816.66647557961],
// [82.6755523697521,1813.21765294239],
// [84.5343707287879,1851.64287932039],
// [83.9454512652028,1857.45184296975],
// [87.988330811816,1822.62804222042],
// [88.6385724635731,1813.96385061677],
// [84.6294588682535,1841.43121380727],
// [82.1582056001644,1800.19831670516],
// [83.7424332819233,1816.02699657931],
// [83.3237203252409,1841.94239921214],
// [84.333411739036,1836.46278531419],
// [82.3365634435947,1832.83267251511],
// [82.2892823257086,1812.44894219663],
// [82.9003566767883,1872.15155028],
// [83.3787897594269,1817.72512141043],
// [85.5547278946918,1888.59447825474],
// [82.3436453446616,1880.37816447094],
// [80.4250808206278,1862.08373302568],
// [85.2515543831019,1807.9939825854],
// [82.7955960602616,1875.72413044874],
// [88.269428370293,1851.85791412741],
// [84.180325416648,1865.64053288653],
// [81.0638718523337,1895.37510598159],
// [84.8973240190684,1887.70655832319],
// [87.147365415264,1898.46437996386],
// [81.5433456122904,1887.068399475],
// [86.6623923327293,1841.8862299654],
// [84.2216943987884,1838.88723912352],
// [89.3320883783277,1893.29752440217],
// [83.8934187561377,1826.86824558682],
// [86.6048138893064,1860.2825151352],
// [89.8020981953585,1839.91365829233],
// [82.3813890676825,1804.69189465048],
// [80.5650608300038,1896.63204719233],
// [81.1375449733011,1867.32850605081],
// [80.2289426507818,1852.45531716139],
// [80.7404867327352,1892.35051669387],
// [82.3550794808418,1804.7595636429],
// [84.8072800204215,1846.71975151921],
// [81.0303000229358,1887.6554582394],
// [86.0641121473337,1801.60501695639],
// [87.5912697129531,1840.00831706792],
// [87.8392956459557,1879.85721058404],
// [85.8056055616678,1837.76758169259] ]
//
//     }, {
//         name: 'Slider',
//         color: 'rgba(119, 152, 191, .5)',
//         data: [[75.1140810567258,2286.54703169038],
// [76.2222490119356,2269.55106307948],
// [75.1604179348,2289.26778265363],
// [72.8672644760165,2276.32821674229],
// [80.7045001379086,2209.75501533638],
// [75.1233987294466,2252.72767235248],
// [80.47239071378,2252.29032170452],
// [80.3671762814942,2279.48211366999],
// [80.8739626373338,2295.02437598379],
// [77.264456401932,2219.08892934524],
// [76.1186830698429,2222.77151810849],
// [78.8226725677961,2223.4881689225],
// [75.1829569545412,2287.94818242972],
// [75.0153015002513,2232.54566848426],
// [75.6240239788592,2271.42444743934],
// [77.4398044113781,2233.1441532186],
// [73.5034075309467,2235.40602811943],
// [79.6519236132918,2237.84538427946],
// [76.2708067222767,2251.18664614193],
// [73.313358756678,2259.37148019045],
// [73.3597138607047,2253.45842831785],
// [72.096484937283,2202.5637439918],
// [77.4589303864106,2219.84060224581],
// [72.4089234462156,2269.01250988562],
// [77.949541991511,2299.38441414596],
// [72.4324033036069,2271.21158745872],
// [76.834808416574,2217.03488142644],
// [78.71450767513,2282.87615846074],
// [76.6408128858215,2262.37759389719],
// [72.6085258615783,2209.97303249398],
// [79.2286026916744,2230.4715072961],
// [77.2257821192963,2253.04739765187],
// [74.2339502245601,2220.16625972434],
// [79.2464500098617,2245.59030018084],
// [75.9387486257012,2211.02522710048],
// [78.9289973609709,2295.47631142604],
// [77.7784478884555,2233.82321352737],
// [75.9650569991319,2226.91090157216],
// [74.4028323694372,2221.56028244836],
// [78.4456477668346,2218.86232245627],
// [72.2328224557947,2278.03091024923]]
//     }]
// });

//exit velocity by zone
// $(function() {
//   var rect2 = '2';
//   var rect3 = '3';
//   var rect4 = '4';
//
//   function addRectangle(chart) {
//     if (this.rectangle) {
//       $(this.rectangle.element).remove();
//     }
//
// 		var binWidth = chart.xAxis[0].toPixels(chart.xAxis[0].categories.indexOf(rect3)) - chart.xAxis[0].toPixels(chart.xAxis[0].categories.indexOf(rect2));
//     		var binHeight = chart.yAxis[0].toPixels(chart.yAxis[0].categories.indexOf(rect2)) - chart.yAxis[0].toPixels(chart.yAxis[0].categories.indexOf(rect3));
//     var pixelX1 = chart.xAxis[0].toPixels(chart.xAxis[0].categories.indexOf(rect2));
//     var pixelX2 = chart.xAxis[0].toPixels(chart.xAxis[0].categories.indexOf(rect2));
//     var pixelY1 = chart.yAxis[0].toPixels(chart.yAxis[0].categories.indexOf(rect4));
//     var pixelY2 = chart.yAxis[0].toPixels(chart.yAxis[0].categories.indexOf(rect4));
//
//     console.log(binWidth);
//         console.log(binHeight);
//
//
//     this.rectangle = chart.renderer.rect(pixelX1-(binWidth/2),pixelY1-(binWidth/2)-1,binWidth*3,binHeight*3 -2).attr({
//       fill: 'transparent',
//       stroke: 'black',
//       zIndex: 42,
//       style: 'pointer-events: none',
//       'stroke-width': 3
//     }).add();
//   }
//   $('#container').highcharts({
//
//     chart: {
//       type: 'heatmap',
//       marginTop: 40,
//       marginBottom: 40,
//       events: {
//         load: function() {
//           addRectangle(this);
//         },
//         redraw: function() {
//           addRectangle(this);
//         }
//       }
// 		},
//     title: {
//       text: 'Exit velocity by zone'
//     },
//
//     xAxis: {
//       categories: ['1', '2', '3', '4', '5']
//     },
//
//     yAxis: {
//       categories: ['1', '2', '3', '4', '5'],
//       title: null
//     },
//
//     colorAxis: {
//       min: 0,
//       stops: [
//         [0, '#3060cf'],
//         [0.5, '#ffffff'],
//         [0.9, '#c4463a']
//       ],
//     },
//
//     legend: {
//       align: 'right',
//       layout: 'vertical',
//       margin: 0,
//       verticalAlign: 'top',
//       y: 25,
//       symbolHeight: 280
//     },
//
//     tooltip: {
//       formatter: function() {
//         return '<b>' + this.series.xAxis.categories[this.point.x] + '</b> sold <br><b>' +
//           this.point.value + '</b> items on <br><b>' + this.series.yAxis.categories[this.point.y] + '</b>';
//       }
//     },
//
//     series: [{
//       name: 'Exit velo by zone',
//       borderWidth: 1,
//       data: [
//         [0, 0, 25],
//         [0, 1, 64],
//         [0, 2, 77],
//         [0, 3, 77],
//         [0, 4, 42],
//         [1, 0, 30],
//         [1, 1, 19],
//         [1, 2, 8],
//         [1, 3, 24],
//         [1, 4, 67],
//         [2, 0, 40],
//         [2, 1, 19],
//         [2, 2, 8],
//         [2, 3, 24],
//         [2, 4, 67],
//         [3, 0, 55],
//         [3, 1, 100],
//         [3, 2, 8],
//         [3, 3, 24],
//         [3, 4, 67],
//         [4, 0, 34],
//         [4, 1, 19],
//         [4, 2, 8],
//         [4, 3, 24],
//         [4, 4, 67]
//       ],
//       dataLabels: {
//         enabled: true,
//         color: '#000000'
//       }
//     }]
//   });
// });
