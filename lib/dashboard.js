// Read it using the storage API
var now = Date.now()
var dataStart = Date.now()
var svgHeight = 500;
var chartSvg, timelineSvg;
var details = document.querySelector('#details');
var info = details.querySelector('#info');

var colors = ['#ff8080', '#bf3300', '#ff8c40', '#4c3b26', '#e6e2ac', '#798060', '#a3d9b1', '#204035',
    '#003d4d', '#acd2e6', '#295ba6', '#8091ff', '#220033', '#912699', '#731d3f', '#994d4d', '#4c1400',
    '#995200', '#f2a200', '#dae639', '#698c23', '#1d734b', '#33ccc2', '#3dcef2', '#001b33', '#003de6',
    '#acace6', '#cc00ff', '#f2b6de', '#bf0033', '#f2beb6', '#e59173', '#f2ba79', '#8c7000', '#3d4d00',
    '#55f23d', '#3df2b6', '#1d6d73', '#00aaff', '#697c8c', '#001f73', '#4f4359', '#e680ff', '#d90074', '#331a20'
]


wrangle().then(function(sites, err) {
    showChart(sites)
    showFrequency(sites)
})

function wrangle() {
    return new Promise(function(resolve, reject) {
        chrome.storage.local.get(null, function(items) {

            var sites = []
            for (var k in items) {
                var o = items[k]

                if (o.site !== 'outside' && o.site !== 'newtab') {

                    var index = sites.findIndex(function(el) {
                        return el.name === o.site;
                    })

                    if (index > -1) {
                        sites[index].sessions.push({
                            date: new Date(o.start).toISOString().split("T")[0],
                            duration: Math.floor(o.end - o.start / 1000),
                            start: o.start,
                            end: o.end
                        });
                        sites[index].duration += o.end - o.start;
                    } else {
                        sites.push({
                            name: o.site,
                            sessions: [{
                                date: new Date(o.start).toISOString().split("T")[0],
                                duration: Math.floor(o.end - o.start / 1000),
                                start: o.start,
                                end: o.end
                            }],
                            duration: 0
                        })
                    }
                    dataStart = o.start < dataStart ? o.start : dataStart;
                }
            }
            sites.sort(sortSites)
            resolve(sites)
        });
    })
}

function showChart(sites) {
    var chart = document.querySelector("#chart");
    var width = chart.offsetWidth;
    var height = sites.length * 50
    var textWidth = sites[0].name.length * 15;

    var x = d3.scaleLinear().range([0, width - textWidth]);
    var y = d3.scaleBand().range([0, height]);

    x.domain([0, d3.max(sites, function(d) {
        return d.duration;
    })]);
    y.domain(sites.map(function(d) {
        return d.name;
    })).padding(0.1);

    var chartSvg = d3.select(chart).append('svg')
        .attr("width", width)
        .attr("height", svgHeight)

    var zoomer = d3.zoom().scaleExtent([1, 10]).translateExtent([
        [0, 0],
        [width, height]
    ]).on("zoom", zoom)


    chartSvg.call(zoomer)
        .on("wheel.zoom", null) // disables default zoom wheel behavior
        .on("wheel", pan);

    function zoom() {
        chartSvg.selectAll('g').attr("transform", "translate(0,"+d3.event.transform.y+")");
        timelineSvg.selectAll('g').attr("transform", "translate(0,"+d3.event.transform.y+")");
    }

    function pan() {
        zoomer.translateBy(chartSvg.transition().duration(10), d3.event.wheelDeltaX, d3.event.wheelDeltaY);
    }

    chartSvg.selectAll('g')
        .data(sites)
        .enter()
        .append('g')
        .on('mouseover', function(d) {
            info.innerHTML = "You have visited "+d.name+" "+d.sessions.length+ " times in the last week.<br >"
            info.innerHTML += "You have spendt " + Math.round(d.duration/1000/60) + " minutes of your time browsing " + d.name
        })
        .on('mouseout', function(d) {})

    chartSvg.selectAll('g')
        .append('rect')
        .attr("x", 0)
        .attr("height", y.bandwidth())
        .attr("y", function(d) {
            return y(d.name);
        })
        .attr("width", function(d) {
            return x(d.duration);
        })
        .attr("fill", function(d, i) {
            return colors[i];
        })

    chartSvg.selectAll('g')
        .append('text')
        .attr("x", function(d) {
            return x(d.duration) + 10;
        })
        .attr("height", y.bandwidth())
        .attr("y", function(d) {
            return y(d.name) + y.bandwidth() / 2;
        })
        //.attr("width", textWidth )
        .attr("fill", function(d, i) {
            return colors[i];
        })
        .attr("dominant-baseline", "central")
        .text(function(d) {
            return d.name;
        })

}

function showFrequency(sites) {
    var timeline = document.querySelector("#timeline")

    var width = timeline.offsetWidth;
    var height = sites.length * 50;
    var thumbHeight = 50

    var twoHoursAgo = new Date()
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2)
    parser = d3.isoParse

    var x = d3.scaleTime().domain([parser(twoHoursAgo), parser(Date.now())]).range([0, width])
    var thumbX = d3.scaleTime().domain([parser(dataStart), parser(Date.now())]).range([0, width])
    var y = d3.scaleBand().range([0, height]);
    var thumbY = d3.scaleBand().range([0, thumbHeight]);

    y.domain(sites.map(function(d, i) {
        if (d.name != 'outside' || d.name != 'newtab') return d.name;
    }));

    thumbY.domain(sites.map(function(d, i) {
        return d.name;
    }))

    timelineSvg = d3.select(timeline).append("svg")
        .attr("width", width)
        .attr("height", svgHeight)

    // Add the x Axis
    var xAxis = d3.axisBottom(x)
    var xAxisGroup = d3.select(timeline).append('svg')
        .attr("width", width)
        .attr("height", 30)
        .call(xAxis);


    var thumbSvg = d3.select(timeline).append("svg")
        .attr("width", width)
        .attr("height", thumbHeight)

    var thumbXAxis = d3.axisBottom(thumbX)
    var thumbAxisGroup = d3.select(timeline).append('svg')
        .attr("width", width)
        .attr("height", 50)
        .call(thumbXAxis);

    for (var i = 0; i < sites.length; i++) {
        var site = sites[i]
        if (site.name !== 'outside') {
            timelineSvg.append('g')
                .attr('class', 'timelinebar')
                .selectAll('rect')
                .data(site.sessions)
                .enter()
                .append('rect')
                .attr('x', function(d) {
                    return x(parser(d.start))
                })
                .attr('width', function(d) {
                    return x(parser(d.end)) - x(parser(d.start))
                })
                .attr('y', function() {
                    return y(site.name);
                })
                .attr('height', y.bandwidth())
                .attr('fill', function() {
                    return colors[i]
                })

            thumbSvg.append('g')
                .selectAll('rect')
                .data(site.sessions)
                .enter()
                .append('rect')
                .attr('x', function(d) {
                    return thumbX(parser(d.start))
                })
                .attr('width', function(d) {
                    return thumbX(parser(d.end)) - thumbX(parser(d.start))
                })
                .attr('y', function() {
                    return 10;
                })
                .attr('height', thumbHeight - 20)
                .attr('fill', function() {
                    return colors[i]
                })
        }

    }

    var zoom = d3.zoom()
        .scaleExtent([1, 20])
        .translateExtent([
            [x(parser(dataStart)), 0],
            [width, height]
        ])
        .extent([
            [0, 0],
            [width, height]
        ])
        .on("zoom", zoomed)

    var brush = d3.brushX()
        .extent([
            [0, 0],
            [width, thumbHeight]
        ])
        .on("brush end", brushed);

    thumbSvg.append("g")
        .attr("class", "brush")
        .call(brush)
        .call(brush.move, [width - 50, width]);


    function brushed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
        var s = d3.event.selection || thumbX.range();
        x.domain(s.map(thumbX.invert, thumbX));
        xAxisGroup.call(xAxis)
        timelineSvg.selectAll("rect")
            .attr("x", function(d) {
                return x(parser(d.start));
            })
            .attr("width", function(d) {
                return x(parser(d.end)) - x(parser(d.start));
            });

        thumbSvg.call(zoom.transform, d3.zoomIdentity
            .scale(width / (s[1] - s[0]))
            .translate(-s[0], 0));
    }

    function zoomed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
        var t = d3.event.transform
        x.domain(t.rescaleX(thumbX).domain());
        xAxisGroup.call(xAxis)
        timelineSvg.selectAll("rect")
            .attr("x", function(d) {
                return x(parser(d.start));
            })
            .attr("width", function(d) {
                return x(parser(d.end)) - x(parser(d.start));
            });

        thumbSvg.select(".brush").call(brush.move, x.range().map(t.invertX, t));
    }

    thumbSvg.call(zoom);
}

function sortSites(a, b) {
    if (a.duration < b.duration)
        return 1;
    if (a.duration > b.duration)
        return -1;
    return 0;
}
