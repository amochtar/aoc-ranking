const DIMENSIONS = getWindowDimensions();
const WIDTH = DIMENSIONS.width;
// const HEIGHT = DIMENSIONS.height - 100;

const INSETS = {'left': 275, 'right': 300, 'top': 30, 'bottom': 30};
const PADDING = {'left': 20, 'right': 20, 'top': 15, 'bottom': 15};

const TICK_MARK_LENGTH = 8;

const MEDAL_RADIUS = 7;
const INCOMPLETE_RADIUS = 5;

const SCALES = {};

var DIMMED_OPACITY = 0.2;
var HIGHLIGHT_OPACITY = 1.0;

const DAY_COUNT = 25
const MAX_ROWS = 100
const ROW_HEIGHT = 35

function visualize(data) {
    chart = document.getElementById("chart")
    if (chart === null) {
        chart = document.createElement("div")
        chart.setAttribute("id", "chart")
        chart.setAttribute("style", "width: 100vw; height: 100vh;")
        document.body.appendChild(chart)
    } else {
        while (chart.firstChild) {
            chart.removeChild(chart.firstChild);
        }
    }

    var vis = d3.select(chart)
        .attr('style', 'width: 100vw')
        .append('svg:svg')
        .attr('width', '100%')
        .attr('height', data.ranking.length*ROW_HEIGHT)

    configureScales(data);

    addDayTickLines(vis, DAY_COUNT);

    addLabels(vis, DAY_COUNT, SCALES.y.range()[0] - PADDING.bottom, '0.0em', 'top');

    addRankingLines(vis, data);

    addNameLabels(vis, data, 'pole', SCALES.x(0) - PADDING.right, 'end')
        .attr('y', function (d) {
            return SCALES.y(d.total_ranks[0]-1);
        });
    addNameLabels(vis, data, 'flag', SCALES.x(DAY_COUNT-1) + PADDING.left, 'start')
            .attr('y', function (d, i) {
            return SCALES.y(i);
        });

    addMedals(vis, data);

    return data
}

function configureScales(data) {
    SCALES.x = d3.scale.linear()
        .domain([0, DAY_COUNT-1])
        .range([INSETS.left, WIDTH - INSETS.right]);

    SCALES.y = d3.scale.linear()
        .domain([0, data.ranking.length-1])
        .range([INSETS.top, data.ranking.length*ROW_HEIGHT - INSETS.bottom]);

    SCALES.clr = d3.scale.category20();
}

function highlight(vis, id) {
    vis.selectAll('polyline')
        .style('opacity', function(d) {
            return d.id == id ? HIGHLIGHT_OPACITY : DIMMED_OPACITY;
        });

    vis.selectAll('circle')
        .style('opacity', function(d) {
            return DIMMED_OPACITY;
        });
    vis.selectAll('circle.m'+id)
        .style('opacity', function(d) {
            return HIGHLIGHT_OPACITY;
        });

    vis.selectAll('text.label')
        .style('opacity', function(d) {
            return d.id == id ? HIGHLIGHT_OPACITY : DIMMED_OPACITY;
        });
}

function unhighlight(vis) {
    vis.selectAll('polyline')
        .style('opacity', HIGHLIGHT_OPACITY);
    vis.selectAll('circle')
        .style('opacity', HIGHLIGHT_OPACITY);
    vis.selectAll('text.label')
        .style('opacity', HIGHLIGHT_OPACITY);
}

function addDayTickLines(vis, dayCount) {
    vis.selectAll('line.tickLine')
        .data(SCALES.x.ticks(dayCount))
        .enter().append('svg:line')
        .attr('class', 'tickLine')
        .attr('x1', function(d) {
            return SCALES.x(d + 0.5);
        })
        .attr('x2', function(d) {
            return SCALES.x(d + 0.5);
        })
        .attr('y1', SCALES.y.range()[0] - TICK_MARK_LENGTH)
        .attr('y2', SCALES.y.range()[1] + TICK_MARK_LENGTH)
        .attr('visibility', function(d) {
            return d <= dayCount-2 ? 'visible' : 'hidden'
        });
}

function addLabels(vis, data, y, dy, cssClass) {
    vis.selectAll('text.day.' + cssClass)
        .data(SCALES.x.ticks(data))
        .enter().append('svg:text')
        .attr('class', 'day ' + cssClass)
        .attr('x', function(d) {
            return SCALES.x(d);
        })
        .attr('y', y)
        .attr('dy', dy)
        .attr('text-anchor', 'middle')
        .text(function(d, i) {
            return i+1;
        });
}

function addRankingLines(vis, data) {
    vis.selectAll('polyline.ranking')
        .data(data.ranking)
        .enter()
        .append('svg:polyline')
        .attr('class', 'ranking')
        .attr('points', function(d, idx) {
            var points = [];
            d.total_ranks.forEach((rank, i) => {
                points[i] = SCALES.x(i) + ',' + SCALES.y(rank-1)
            })
            return points.join(' ');
        })
        .style('stroke', function(d) {
            return SCALES.clr(d.total_ranks[0]);
        })
        .on('mouseover', function(d) {
            highlight(vis, d.id);
        })
        .on('mouseout', function() {
            unhighlight(vis);
        });
}

function addNameLabels(vis, data, cssClass, x, textAnchor) {
    return vis.selectAll('text.label.' + cssClass)
        .data(data.ranking)
        .enter()
        .append('svg:text')
        .attr('class', 'label ' + cssClass)
        .attr('x', x)
        .attr('dy', '0.35em')
        .attr('text-anchor', textAnchor)
        .text(function(d) {
            return d.name;
        })
        .style('fill', function(d) {
            return SCALES.clr(d.total_ranks[0]);
        })
        .on('mouseover', function(d) {
            highlight(vis, d.id);
        })
        .on('mouseout', function() {
            unhighlight(vis);
        });
}

function addMedals(vis, data) {
    data.ranking.forEach(function (member, idx) {
        vis.append("defs");
        vis.selectAll("circle.medal.m" + member.id)
            .data(member.ranks)
            .enter()
            .append("svg:circle")
            .attr("class", "medal m" + member.id)
            .attr("cx", function(d, i) {
                return SCALES.x(i);
            })
            .attr("cy", function(d, i) {
                return SCALES.y(member.total_ranks[i] - 1);
            })
            .attr("r", function(d) {
                if (0 < d && d <= 3) {
                    return MEDAL_RADIUS
                }
                return INCOMPLETE_RADIUS
            })
            .attr("visibility", function(d, i) {
                if ((0 < d && d <= 3) || member.stars[i] < 2) {
                    return "visible"
                }
                return "hidden"
            })
            .style("stroke", function(d, i) {
                if (0 < d && d <= 3) {
                    return "#0f0f23"
                }
                if (d == 1) {
                    return "gold"
                }
                else if (d == 2) {
                    return "silver"
                }
                else if (d == 3) {
                    return "#963"
                }
                return SCALES.clr(member.total_ranks[0]);
            })
            .style("fill", function(d, i) {
                if (member.stars[i] == 0) {
                    return "#0f0f23"
                }
                else if (member.stars[i] == 1) {
                    gradId = "m" + member.id + "d" + i
                    var grad = vis.select("defs").append("linearGradient").attr("id", gradId)
                        .attr("x1", "0%").attr("x2", "100%").attr("y1", "100%").attr("y2", "100%");
                    grad.append("stop").attr("offset", "47%").style("stop-color", SCALES.clr(member.total_ranks[0]));
                    grad.append("stop").attr("offset", "47%").style("stop-color", "#0f0f23");

                    return "url(#" + gradId + ")"
                }
                if (d == 1) {
                    return "gold"
                }
                else if (d == 2) {
                    return "silver"
                }
                else if (d == 3) {
                    return "#963"
                }
                return SCALES.clr(member.total_ranks[0]);
            })
            .on('mouseover', function(d) {
                highlight(vis, member.id);
            })
            .on('mouseout', function() {
                unhighlight(vis);
            });
    });
}

function getWindowDimensions() {

    var width = 630;
    var height = 460;
    if (document.body && document.body.offsetWidth) {

        width = document.body.offsetWidth;
        height = document.body.offsetHeight;
    }

    if (document.compatMode == 'CSS1Compat' && document.documentElement && document.documentElement.offsetWidth) {

        width = document.documentElement.offsetWidth;
        height = document.documentElement.offsetHeight;
    }

    if (window.innerWidth && window.innerHeight) {

        width = window.innerWidth;
        height = window.innerHeight;
    }

    return {'width': width, 'height': height};
}
