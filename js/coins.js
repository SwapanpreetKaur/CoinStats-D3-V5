var outerHeight = 400;
var outerWidth = 750;
var margin = {left: 80, right: 80, top: 10, bottom:50 };
var innerHeight = outerHeight - margin.top - margin.bottom;
var innerWidth = outerWidth - margin.left - margin.right;
var parseTime = d3.timeParse("%d/%m/%Y");
var formatTime = d3.timeFormat("%d/%m/%Y");
var bisectDate = d3.bisector(function(d) { return d.date; }).left;

// Add SVG elements
var svg = d3.select('#chart-area').append('svg')
            .attr('height',outerHeight)
            .attr('width',outerWidth);

var g = svg.append('g')
           .attr('transform','translate(' + margin.left +  ', ' + margin.top + ')');

// Add Scales
var xScale = d3.scaleTime().range([0,innerWidth]);
var yScale = d3.scaleLinear().range([innerHeight,0]);

//Add Labels
var xAxisG = g.append('g')
              .attr('class','x axis')
              .attr("transform", "translate(0," + innerHeight + ")")

var xLabel = g.append('text')
              .attr('class','x axisLabel')
              .attr('x',innerWidth / 2)
              .attr('y',innerHeight + 40)
              .attr('font-size','20px')
              .attr('text-anchor','middle')
              .attr('fill','black')
              .text('Time'); 

var yAxisG = g.append('g')
              .attr('class','y axis')

var yLabel = g.append('text')
              .attr('class','y axisLabel')
              .attr('transform', 'rotate(-90)')
              .attr('x',-170)
              .attr('y',-50)
              .attr('font-size','20px')
              .attr('text-anchor','middle')
              .attr('fill','black')
              .text('PRICE_USD');

var xAxis = d3.axisBottom()
              .ticks(4);

var yAxis = d3.axisLeft();

// Add the line for the first time
g.append('path')
 .attr('class','line')
 
var t = function(){ return d3.transition().duration(1000); }

// Add Date range slider
// Can choose interval between two different dates
$('#date-slider').slider({
  range: true,
  min: parseTime("12/5/2013").getTime(),
  max: parseTime("31/10/2017").getTime(),
  step: 86400000,
  values: [parseTime("12/5/2013").getTime() , parseTime("31/10/2017").getTime()],
  slide: function(event,ui){
    $('#dateLabel1').text(formatTime(new Date(ui.values[0] )));
    $('#dateLabel2').text(formatTime(new Date(ui.values[1] )));
    update();
  }
})

// Clean the data,remove null values
// Passing data as an array data[coins]
// Converting some strings to work as numbers
d3.json('coins.json').then(function(data){
  filterData = [];
  for(var coins in data) {
    filterData[coins] = data[coins].filter(function(data){ 
      return (data['price_usd']!== null) })

    filterData[coins].forEach(function(d){
      d['price_usd'] = +d['price_usd'];
      d['market_cap'] = +d['market_cap'];
      d['24h_vol'] = +d['24h_vol'];
      d['date'] = parseTime(d['date']);
    });
  }  console.log(filterData)
  update();
})

// Code need to adjust to a changing dataset
// Apply filter on data array to include only the dates within range set by slider
// Adjust again line d attribute every time the graph updates, using a different line()  function.
// Add transitions to line and axes, so that visualization updates
// Formatting numbers at y-axis with different abbreviations
function update(){

var varEle = document.getElementById ('var-select');
var coinEle = document.getElementById ('coin-select');
var yValue = varEle.options [varEle.selectedIndex] .value;
var coin = coinEle.options [coinEle.selectedIndex] .value;

var sliderValues = $('#date-slider').slider('values');
var dateTimeFilter = filterData[coin].filter(function(d){
return ((d.date >= sliderValues[0]) && (d.date <= sliderValues[1])) });

xScale.domain(d3.extent(dateTimeFilter,function(d){ return d.date; }));
yScale.domain([d3.min(dateTimeFilter,function(d){ return d[yValue]; }) / 1.005,
              d3.max(dateTimeFilter,function(d){ return d[yValue]; }) * 1.005]);

var formatSig = d3.format(".2s");
function formatAbbr(x){
  var s = formatSig(x);
    switch (s[s.length - 1]){
      case 'G': return s.slice(0,-1) + 'B';
      case 'K': return s.slice(0,-1) + 'K';
    }
    return s;
}

xAxis.scale(xScale);
xAxisG.transition(t()).call(xAxis);
yAxis.scale(yScale);
yAxisG.transition(t()).call(yAxis.tickFormat(formatAbbr));

line = d3.line()
         .x(function(d){ return xScale(d.date); })
         .y(function(d){ return yScale(d[yValue]); })

g.select('.line')
 .transition(t)
 .attr('stroke','#2c7fb8')
 .attr('d',line(dateTimeFilter));

// Change label of y-axis depending upon the variable we are looking
var newLabel = (yValue == 'price_usd') ? 'PRICE_USD' : ((yValue == 'market_cap') ? 'Market Capitalization (USD)' : '24 Hour Trading Volume (USD)')
yLabel.text(newLabel);

// Clear old tooltips
d3.select(".focus").remove();
d3.select(".overlay").remove();

// Add ToolTip
// Add group to show or hide tooltip
// Add vertical and horizontal line,circle,text SVG
// Add an invisible rectangle as an overlay
var focus = g.append("g")
       .attr("class", "focus")
       .style("display", "none");
focus.append("line")
   .attr("class", "x-hover-line hover-line")
   .attr("y1", 0)
   .attr("y2", innerHeight);
focus.append("line")
   .attr("class", "y-hover-line hover-line")
   .attr("x1", 0)
   .attr("x2", innerWidth);
focus.append("circle")
     .attr("r", 5);
focus.append("text")
   .attr("x", 15)
   .attr("dy", ".31em");
svg.append("rect")
   .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
   .attr("class", "overlay")
   .attr("width", innerWidth)
   .attr("height", innerHeight)
   .on("mouseover", function() { focus.style("display", null); })
   .on("mouseout", function() { focus.style("display", "none"); })
   .on("mousemove", mousemove);

// invert method on xScale to find time value matches co-ordinate positions
// bisectdate function return index of data array where time value belong
// comparing the data we are looking at closest to time values in an array,returning data point closest to
function mousemove() {
var x0 = xScale.invert(d3.mouse(this)[0]);
var i = bisectDate(dateTimeFilter, x0, 1);
var d0 = dateTimeFilter[i - 1];
var d1 = dateTimeFilter[i];
var d = (d1 && d0) ? (x0 - d0.date > d1.date - x0 ? d1 : d0) : 0;
focus.attr("transform", "translate(" + xScale(d.date) + "," + yScale(d[yValue]) + ")");
focus.select("text").text(function() { return d3.format("$,")(d[yValue].toFixed(2)); });
focus.select(".x-hover-line").attr("y2", innerHeight - yScale(d[yValue]));
focus.select(".y-hover-line").attr("x2", -xScale(d.date));
}
}
