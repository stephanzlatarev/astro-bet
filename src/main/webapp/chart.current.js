function CycleChart(placeholder) {

  var chart = this;

  chart.placeholder = placeholder;

  chart.getTime = function(day, hour) {
    var offset = - new Date().getTimezoneOffset()
    var d = new Date()
    d.setDate(d.getDate() - d.getDay() + day)
    d.setHours(hour)
    d.setMinutes(offset)
    return d.getTime()
  }

  chart.getWeekStart = function() {
    return chart.getTime(0, 22)
  }

  chart.getWeekEnd = function() {
    return chart.getTime(5, 22)
  }

  chart.grid = {
    xStart: chart.getWeekStart(),
    xEnd: chart.getWeekEnd()
  }

  chart.options = {
    series: {
      lines: { show: true },
      points: { show: false }
    },
    xaxis : {
      mode: 'time',
      timeformat: "%H:%M %d.%m",
      timezone: 'browser'
    },
    grid: {
      markings: []
    },
    hooks: {
      draw: function(plot, ctx) {
        // draw trading hours (GMT):
        // Sydney:   10:00 pm - 07:00 am
        // Tokyo:    00:00 am - 09:00 am
        // London:   08:00 am - 05:00 pm
        // New York: 01:00 pm - 10:00 pm
        for (var d = 1; d <= 5; d++) {
          var londonOpen  = plot.pointOffset({ x: chart.getTime(d,  8), y: chart.grid.yMax })
          var londonClose = plot.pointOffset({ x: chart.getTime(d, 17), y: chart.grid.yMin })
          var newyorkOpen = plot.pointOffset({ x: chart.getTime(d, 13), y: chart.grid.yMax })
          var newyorkClose = plot.pointOffset({ x: chart.getTime(d, 22), y: chart.grid.yMin })

          ctx.beginPath();
          ctx.rect(londonOpen.left, londonOpen.top, londonClose.left - londonOpen.left, londonClose.top - londonOpen.top);
          ctx.stroke();
          ctx.beginPath();
          ctx.rect(newyorkOpen.left, newyorkOpen.top, newyorkClose.left - newyorkOpen.left, newyorkClose.top - newyorkOpen.top);
          ctx.stroke();
        }

      }
    }
  }

  chart.displayData = function() {
    if (chart.data) {
      chart.calibrateChart()
      chart.calibrateGrid()
      chart.displayChart()
    }
  }

  chart.calibrateChart = function() {
    var tickSize = Math.ceil(5000 / chart.placeholder.innerWidth())
    tickSize = Math.ceil(24 / Math.floor(24 / tickSize))

    chart.options.xaxis.tickSize = [ tickSize, 'hour']
    chart.options.xaxis.min = Math.floor(chart.grid.xStart / 3600000) * 3600000;
    chart.options.xaxis.max = Math.floor(chart.grid.xEnd / 3600000) * 3600000;
  }

  chart.calibrateGrid = function() {
    var floor = 0
    var ceiling = 0
    for (i in chart.data) {
      if ((chart.grid.xStart <= chart.data[i].time) && (chart.data[i].time <= chart.grid.xEnd)) {
        floor = floor ? Math.min(floor, chart.data[i].lowBid) : chart.data[i].lowBid;
        ceiling = ceiling ? Math.max(ceiling, chart.data[i].highBid) : chart.data[i].highBid;
      }
    }

    chart.grid.yMin = Math.floor(floor / 100) * 100 + 10
    chart.grid.yMax = Math.ceil(ceiling / 100) * 100 - 10
    chart.grid.yMid = (chart.grid.yMin + chart.grid.yMax) / 2

    if (!chart.options.yaxis) chart.options.yaxis = {}
    chart.options.yaxis.min = chart.grid.yMin;
    chart.options.yaxis.max = chart.grid.yMax;
  }

  chart.displayChart = function() {
    var plot = []
    var series = []

    for (var i in chart.data) {
      if ((chart.grid.xStart <= chart.data[i].time) && (chart.data[i].time <= chart.grid.xEnd)) {
        series.push([ chart.data[i].time, chart.data[i].openBid ])
        series.push([ chart.data[i].time, chart.data[i].highBid ])
        series.push([ chart.data[i].time, chart.data[i].lowBid ])
        series.push([ chart.data[i].time, chart.data[i].closeBid ])
      }
    }

    plot.push({ data: series, color: 'green' });

    // add current pips line
    var pips = chart.data[chart.data.length - 1].closeBid
    plot.push({ data: [ [ chart.grid.xStart, pips ], [ chart.grid.xEnd, pips ] ], color: 'blue' })

    // draw
    chart.placeholder.empty().plot(plot, chart.options).data("plot");
  }

  //---------------------

  $.ajax({
    url: "/retrieve?window=current",
    dataType: "json"
  }).done(function(d) {
    var data = []
    for (var i in d) {
      if (d[i].time) data.push({
        time: d[i].time / 1000,
        openBid: d[i].openBid * 10000,
        highBid: d[i].highBid * 10000,
        lowBid: d[i].lowBid * 10000,
        closeBid: d[i].closeBid * 10000
      })
    }

    chart.data = data
    chart.displayData()
  })

  $(window).resize(function() {
    chart.displayData();
  })

}
