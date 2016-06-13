function CycleChart(placeholder, cycle) {

  var chart = this;

  chart.placeholder = placeholder;

  var xStart = new Date(cycle.newMoon)
  xStart.setMinutes(- new Date().getTimezoneOffset())
  xStart.setHours(0)
  xStart.setDate(xStart.getDate() - xStart.getDay() + 1)
  var xEnd = new Date(xStart.getTime())
  xEnd.setDate(xEnd.getDate() + 28 + 5)

  chart.grid = {
    xStart: xStart.getTime(),
    xEnd: xEnd.getTime()
  }

  chart.options = {
    series: {
      lines: { show: true },
      points: { show: false }
    },
    xaxis : {
      mode: 'time',
      timeformat: "%d.%m",
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

        var time = new Date(xStart.getTime())

        while (time.getTime() < xEnd.getTime()) {
          if ((time.getDay() >= 1) && (time.getDay() <= 5)) {
            time.setHours(8)
            var londonOpen  = plot.pointOffset({ x: time.getTime(), y: chart.grid.yMax })
            time.setHours(17)
            var londonClose = plot.pointOffset({ x: time.getTime(), y: chart.grid.yMin })
            time.setHours(13)
            var newyorkOpen = plot.pointOffset({ x: time.getTime(), y: chart.grid.yMax })
            time.setHours(22)
            var newyorkClose = plot.pointOffset({ x: time.getTime(), y: chart.grid.yMin })
  
            ctx.beginPath();
            ctx.rect(londonOpen.left, londonOpen.top, londonClose.left - londonOpen.left, londonClose.top - londonOpen.top);
            ctx.stroke();
            ctx.beginPath();
            ctx.rect(newyorkOpen.left, newyorkOpen.top, newyorkClose.left - newyorkOpen.left, newyorkClose.top - newyorkOpen.top);
            ctx.stroke();
          }

          time.setDate(time.getDate() + 1)
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
    chart.options.xaxis.tickSize = [ 7, 'day']
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
    url: "/retrieve?window=" + cycle.name,
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
