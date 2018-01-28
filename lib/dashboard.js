

var sites;
var scopeVerbatim = "day";
var scopeRange = calculateRange(scopeVerbatim, new Date())
scopeRange[1] = Date.now()

var details = document.querySelector('#details');
var info = details.querySelector('#info');

var colors = ['#ff8080', '#bf3300', '#ff8c40', '#4c3b26', '#e6e2ac', '#798060', '#a3d9b1', '#204035',
    '#003d4d', '#acd2e6', '#295ba6', '#8091ff', '#220033', '#912699', '#731d3f', '#994d4d', '#4c1400',
    '#995200', '#f2a200', '#dae639', '#698c23', '#1d734b', '#33ccc2', '#3dcef2', '#001b33', '#003de6',
    '#acace6', '#cc00ff', '#f2b6de', '#bf0033', '#f2beb6', '#e59173', '#f2ba79', '#8c7000', '#3d4d00',
    '#55f23d', '#3df2b6', '#1d6d73', '#00aaff', '#697c8c', '#001f73', '#4f4359', '#e680ff', '#d90074', '#331a20'
]

bootstrap()

function bootstrap(){
    document.querySelector("#header").onclick = function(e) {
        var el = e.target;
        if (el.classList.contains("button") && !el.classList.contains("selected")) {
            this.querySelector(".selected").classList.remove("selected")
            el.classList.add("selected")
            scopeVerbatim = el.innerHTML.toLowerCase()
            render()
        }
    }
    /*
    document.querySelector(".nav#left").onclick = function(e){
        scopeRange = calculateRange(scopeVerbatim, scopeRange[0])

        render()
    }


    document.querySelector(".nav#right").onclick = function(e){

    }*/

    setupGraphs()
    render()
}

function render(){
    sortData().then(function(){
        renderGraphs()
    })
}

function wrangle(){

    chrome.storage.local.get(null, function(items) {
        sites = {}

        //for each site we need!
            //stats
            //

    })
    //how often do we need to re-wrangle the all time stats? //on reloads? //refocus?
    //we need two datasets -- all time stats    
    //window.onfocus() -> rewrangle and re-sort data!
}

function sortData(scope) {
    return new Promise(function(done) {

        //we need two datasets -- all time stats
        //within the current window.

        chrome.storage.local.get(null, function(items) {
            sites = [] // we empty the global object

            for (var k in items) {
                if (k > scopeRange[0].valueOf() ) { //Only add the sites that has been visited within the timeframe
                    var o = items[k]
                    if (o.site !== 'outside' && o.site !== 'newtab') {

                        var index = sites.findIndex(function(el) {
                            return el.name === o.site;
                        })

                        if(index === -1){
                            sites.push({
                                name: o.site,
                                sessions: [],
                                duration: 0
                            })
                            index = sites.length-1;
                        }

                        var dur = Math.floor( ( o.end - o.start ) / 1000)
                        sites[index].sessions.push({
                            duration: dur,
                            start: o.start,
                            end: o.end
                        });
                        sites[index].duration += dur;

                    }
                }
            }
            var placeholder = []
            for(var i = 0; i < sites.length;i++){
                if(sites[i].duration >= 60){
                        placeholder.push(sites[i])
                }
            }
            sites = placeholder.sort(sortSites)
            done()
        })
    })
}

function setupGraphs(){
    var chart = document.querySelector("#chart");
    var width = chart.offsetWidth;
    d3.select(chart).append('svg')
        .attr("id", "barSvg")
        .attr("width", width)


    var timeline = document.querySelector("#timeline")
    width = timeline.offsetWidth;

    d3.select(timeline).append("svg")
        .attr("id", "timelineSvg")
        .attr("width", width)

    d3.select(timeline).append('svg')
        .attr("id", "axisGroup")
        .attr("width", width)

        d3.select(timeline).append("svg")
            .attr("id", "thumbSvg")
            .attr("width", width)

    d3.select(timeline).append('svg')
        .attr("id", "thumbAxisGroup")
        .attr("width", width)


}

function renderGraphs(){
    renderBarChart()
    renderActivityGraph()
}

function renderBarChart() {
    var chart = document.querySelector("#chart");
    var width = chart.offsetWidth;
    var height = sites.length * 50
    var svgHeight = height < 500 ? height : 500;
    var textWidth = sites[0].name.length * 15;

    var x = d3.scaleLinear().range([0, width - textWidth]);
    var y = d3.scaleBand().range([0, height]);

    x.domain([0, d3.max(sites, function(d) {
        return d.duration;
    })]);
    y.domain(sites.map(function(d) {
        return d.name;
    })).padding(0.1);


    var barSvg = d3.select("#barSvg")
        .attr("width", width)
        .attr("height", svgHeight)

    barSvg.selectAll('*').remove()

    var zoomer = d3.zoom().scaleExtent([1, 10]).translateExtent([
        [0, 0],
        [width, height]
    ]).on("zoom", zoom)

    barSvg.call(zoomer)
        .on("wheel.zoom", null) // disables default zoom wheel behavior
        .on("wheel", pan);

    function zoom() {
        barSvg.selectAll('g').attr("transform", "translate(0," + d3.event.transform.y + ")");
        d3.select("#timelineSvg").selectAll('g').attr("transform", "translate(0," + d3.event.transform.y + ")");
    }

    function pan() {
        zoomer.translateBy(barSvg.transition().duration(10), d3.event.wheelDeltaX, d3.event.wheelDeltaY);
    }

    barSvg.selectAll('g')
        .data(sites)
        .enter()
        .append('g')
        .on('mouseover', function(d) {
            showDetails(d)
        })
        .on('mouseout', function(d) {})

    barSvg.selectAll('g')
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

    barSvg.selectAll('g')
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

function renderActivityGraph(scope) {
    var timeline = document.querySelector("#timeline")

    var width = timeline.offsetWidth;
    var height = sites.length * 50;
    var svgHeight = height < 500 ? height : 500;
    var thumbHeight = 50

    parser = d3.isoParse

    var x = d3.scaleTime().domain([parser(scopeRange[0]), parser(scopeRange[1])]).range([0, width])
    var thumbX = d3.scaleTime().domain([parser(scopeRange[0]), parser(scopeRange[1])]).range([0, width])
    var y = d3.scaleBand().range([0, height]);
    var thumbY = d3.scaleBand().range([0, thumbHeight]);

    y.domain(sites.map(function(d, i) {
        if (d.name != 'outside' || d.name != 'newtab') return d.name;
    }));

    thumbY.domain(sites.map(function(d, i) {
        return d.name;
    }))

    timelineSvg = d3.select("#timelineSvg")
        .attr("height", svgHeight)

    timelineSvg.selectAll('*').remove()

    // Add the x Axis
    var xAxis = d3.axisBottom(x).tickFormat(getTickFormat(scopeVerbatim))

    var xAxisGroup = d3.select("#axisGroup")
        .attr("height", 30)
        .call(xAxis)

    var thumbSvg = d3.select("#thumbSvg")
        .attr("height", thumbHeight)

    thumbSvg.selectAll('*').remove()

    var thumbXAxis = d3.axisBottom(thumbX).tickFormat(getTickFormatShort(scopeVerbatim))
    var thumbAxisGroup = d3.select("#thumbAxisGroup")
         .attr("height", 50)
         .call(thumbXAxis)

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
            [x(parser(scope)), 0],
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

        var existingExtent = thumbX.range();
        if (!d3.event.selection && d3.event.sourceEvent) {
            var dx = 50, // Use a fixed width when recentering.
                cx = d3.mouse(this)[0],
                x0 = cx - dx / 2,
                x1 = cx + dx / 2;

            existingExtent = x1 > width ? [width - dx, width] : x0 < 0 ? [0, dx] : [x0, x1];
        }


        var s = d3.event.selection || existingExtent
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
        //console.log("zooomed")
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

function showDetails(siteObj){
    var details = document.querySelector("#details")
    var site = details.querySelector("#site");
    site.innerHTML = "on " +  siteObj.name
    var visits = details.querySelector("#visits");
    visits.innerHTML = siteObj.sessions.length;

    var overall = details.querySelector("#visits_overall");
    overall.innerHTML = siteObj.sessions.length;

    var time = details.querySelector("#time");
    var dur = siteObj.duration;
    var s = dur % 60;
    var m =  (dur / 60) % 60;
    var h = dur % 3600;
    time.innerHTML = dur + " seconds "
    var avg_time = details.querySelector("#avg_time");
    var avg_seconds = dur/siteObj.sessions.length;
    avg_time.innerHTML = Math.floor(avg_seconds) + " seconds";

    site.innerHTML = " on " + siteObj.name
    console.log(siteObj)

}

function sortSites(a, b) {
    if (a.duration < b.duration)
        return 1;
    if (a.duration > b.duration)
        return -1;
    return 0;
}

function getTickFormat(scopeVerbatim){
    if(scopeVerbatim === "day") return d3.timeFormat("%H:%M")
    if(scopeVerbatim === "week") return d3.timeFormat("%a %d %H:%M")
    if(scopeVerbatim === "month") return d3.timeFormat("%a %d")
    //if(scopeVerbatim === "year") return d3.timeFormat("%b %d")
    return d3.timeFormat("%H:%M")
}

function getTickFormatShort(scopeVerbatim){
    if(scopeVerbatim === "day") return d3.timeFormat("%H:%M")
    if(scopeVerbatim === "week") return d3.timeFormat("%a %d")
    if(scopeVerbatim === "month") return d3.timeFormat("%b %d")
    //if(scopeVerbatim === "year") return d3.timeFormat("%b %d")
    return d3.timeFormat("%H:%M")
}

function calculateRange(scopeVerbatim, newEndDate){
    var start = new Date()
    if(scopeVerbatim === "day"){
        start.setHours(newEndDate.getHours()-24);
    } else if (scopeVerbatim === "week") {
        start.setDate(newEndDate.getDate()-7);
    } else if (scopeVerbatim === "month") {
        start.setMonth(newEndDate.getMonth()-1);
    }

    return [start, newEndDate]
}
