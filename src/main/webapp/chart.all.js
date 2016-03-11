function AllChart(placeholder) {
  var chart = this

  chart.placeholder = placeholder

  chart.options = {
    series: {
      lines: { show: true },
      points: { show: false }
    },
    xaxis : {
      mode: 'time',
      ticks: [],
      timezone: 'browser'
    }
  }

  for (i = 2000; i < 2025; i++) chart.options.xaxis.ticks.push(new Date(i, 1, 1).getTime())

  chart.display = function() {
    if (!chart.data) return

    var plot = []
    var series = []

    for (var i in chart.data) {
      series.push([ chart.data[i].time, chart.data[i].open ])
      series.push([ chart.data[i].time, chart.data[i].high ])
      series.push([ chart.data[i].time, chart.data[i].low ])
      series.push([ chart.data[i].time, chart.data[i].close ])
    }

    plot.push({ data: series, color: 'green' })

    // draw
    chart.placeholder.empty().plot(plot, chart.options).data("plot")
  }

  $.ajax({
    url: "/retrieve?window=all",
    dataType: "json"
  }).done(function(d) {
    chart.data = []
    for (var i in d) {
      chart.data.push({
        time: d[i].time / 1000,
        open: d[i].openBid * 10000,
        high: d[i].highBid * 10000,
        low: d[i].lowBid * 10000,
        close: d[i].closeBid * 10000
      })
    }

    chart.display()
  })

  $(window).resize(function() {
    chart.display()
  })

}
