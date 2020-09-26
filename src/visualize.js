const d3 = require("d3");

const WIDTH = Math.max(
    1120,
    window.getComputedStyle(document.body).width.replace("px", "")
);

const INSETS = { left: 275, right: 300, top: 70, bottom: 30 };
const PADDING = { left: 20, right: 20, top: 15, bottom: 15 };

const TICK_MARK_LENGTH = 8;

const SCALES = {};

var DIMMED_OPACITY = 0.2;
var HIGHLIGHT_OPACITY = 1.0;

const DAY_COUNT = 25;
const ROW_HEIGHT = 35;

const SortModes = {
    TOTAL_RANK: 0,
    DAY_RANK: 1
};

export function visualize(data, mode = SortModes.TOTAL_RANK) {
    var chart = document.getElementById("chart");
    if (chart === null) {
        chart = document.createElement("div");
        chart.setAttribute("id", "chart");
        chart.setAttribute("style", "width: 100%;");
        document.body.appendChild(chart);
    } else {
        while (chart.firstChild) {
            chart.removeChild(chart.firstChild);
        }
    }

    var height = data.ranking.length * ROW_HEIGHT + INSETS.top + INSETS.bottom;
    var vis = d3
        .select(chart)
        .append("svg:svg")
        .attr("width", "100%")
        .attr("height", height);

    configureScales(data, height);

    addSorters(vis, data, mode);

    addDayTickLines(vis, DAY_COUNT);

    addLabels(vis, DAY_COUNT, SCALES.y.range()[0] - PADDING.bottom, "0.0em");

    addRankingLines(vis, data, mode);

    addNameLabels(vis, data, "left", SCALES.x(0) - PADDING.right, "end").attr(
        "y",
        function(d) {
            if (mode === SortModes.DAY_RANK) {
                return SCALES.y(d.ranks[0] - 1);
            }
            return SCALES.y(d.total_ranks[0] - 1);
        }
    );
    addNameLabels(
        vis,
        data,
        "right",
        SCALES.x(DAY_COUNT - 1) + PADDING.left,
        "start"
    ).attr("y", function(d, i) {
        if (mode === SortModes.DAY_RANK) {
            return SCALES.y(d.ranks[d.ranks.length - 1] - 1);
        }
        return SCALES.y(i);
    });

    addProgress(vis, data, mode);
    addMedals(vis, data, mode);
    addDayRanking(vis, data, mode);

    return data;
}

function getTextWidth(text) {
    var context = getTextWidth.context;
    if (context === undefined) {
        var canvas = document.createElement("canvas");
        var context = canvas.getContext("2d");
        var bodyStyle =
            getTextWidth.bodyStyle ||
            (getTextWidth.bodyStyle = window.getComputedStyle(document.body));
        context.font = bodyStyle.fontSize + " " + bodyStyle.fontFamily;
        getTextWidth.context = context;
    }
    var metrics = context.measureText(text);
    return metrics.width;
}

function configureScales(data, height) {
    const labelWidth =
        50 +
        data.ranking.reduce((acc, m) => {
            const w = getTextWidth(m.name);
            if (w > acc) {
                return w;
            }
            return acc;
        }, 0);
    SCALES.x = d3
        .scaleLinear()
        .domain([0, DAY_COUNT - 1])
        .range([labelWidth, WIDTH - labelWidth]);

    SCALES.y = d3
        .scaleLinear()
        .domain([0, data.ranking.length - 1])
        .range([INSETS.top, height - INSETS.bottom]);

    const schemeCategory20 = [
        "#1f77b4",
        "#aec7e8",
        "#ff7f0e",
        "#ffbb78",
        "#2ca02c",
        "#98df8a",
        "#d62728",
        "#ff9896",
        "#9467bd",
        "#c5b0d5",
        "#8c564b",
        "#c49c94",
        "#e377c2",
        "#f7b6d2",
        "#7f7f7f",
        "#c7c7c7",
        "#bcbd22",
        "#dbdb8d",
        "#17becf",
        "#9edae5"
    ];
    SCALES.clr = d3.scaleOrdinal(schemeCategory20);
}

function highlight(vis, id) {
    vis.selectAll("polyline").style("opacity", function(d) {
        return d.id == id ? HIGHLIGHT_OPACITY : DIMMED_OPACITY;
    });

    vis.selectAll("circle").style("opacity", function(d) {
        return DIMMED_OPACITY;
    });
    vis.selectAll("circle.m" + id).style("opacity", function(d) {
        return HIGHLIGHT_OPACITY;
    });

    vis.selectAll(".medal").style("opacity", function(d) {
        return DIMMED_OPACITY;
    });
    vis.selectAll(".medal.m" + id).style("opacity", function(d) {
        return HIGHLIGHT_OPACITY;
    });

    vis.selectAll("text.label").style("opacity", function(d) {
        return d.id == id ? HIGHLIGHT_OPACITY : DIMMED_OPACITY;
    });
    vis.selectAll(".dayrank.completed.m" + id).style("visibility", "visible");
}

function unhighlight(vis) {
    vis.selectAll("polyline").style("opacity", HIGHLIGHT_OPACITY);
    vis.selectAll("circle").style("opacity", HIGHLIGHT_OPACITY);
    vis.selectAll(".medal").style("opacity", HIGHLIGHT_OPACITY);
    vis.selectAll("text.label").style("opacity", HIGHLIGHT_OPACITY);
    vis.selectAll(".dayrank").style("visibility", "hidden");
}

function addSorters(vis, data, mode) {
    var sortNode = vis
        .append("svg:text")
        .attr("class", "sort")
        .attr("x", "50%")
        .attr("y", "1em")
        // .attr('dy', '0')
        .attr("text-anchor", "middle")
        .on("click", function() {
            visualize(data, 1 - mode);
        });

    sortNode.append("tspan").text("Showing ranking based on ");

    sortNode
        .append("tspan")
        .attr("class", "em")
        .text(function() {
            if (mode === SortModes.TOTAL_RANK) {
                return "total score";
            }
            return "score per day";
        });

    sortNode.append("tspan").text(". Switch to ranking on ");

    sortNode.append("tspan").text(function() {
        if (mode === SortModes.TOTAL_RANK) {
            return "score per day.";
        }
        return "total score.";
    });
}

function addDayTickLines(vis, dayCount) {
    vis.selectAll("line.tickLine")
        .data(SCALES.x.ticks(dayCount))
        .enter()
        .append("svg:line")
        .attr("class", "tickLine")
        .attr("x1", function(d) {
            return SCALES.x(d + 0.5);
        })
        .attr("x2", function(d) {
            return SCALES.x(d + 0.5);
        })
        .attr("y1", SCALES.y.range()[0] - TICK_MARK_LENGTH)
        .attr("y2", SCALES.y.range()[1] + TICK_MARK_LENGTH)
        .attr("visibility", function(d) {
            return d <= dayCount - 2 ? "visible" : "hidden";
        });
}

function addLabels(vis, day_count, y, dy) {
    vis.selectAll("text.day")
        .data(SCALES.x.ticks(day_count))
        .enter()
        .append("svg:text")
        .attr("class", "day")
        .attr("x", function(d) {
            return SCALES.x(d);
        })
        .attr("y", y)
        .attr("dy", dy)
        .attr("text-anchor", "middle")
        .text(function(d, i) {
            return i + 1;
        });
}

function addRankingLines(vis, data, mode) {
    vis.selectAll("polyline.ranking")
        .data(data.ranking)
        .enter()
        .append("svg:polyline")
        .attr("class", "ranking")
        .attr("points", function(d, idx) {
            var points = [];
            if (mode === SortModes.DAY_RANK) {
                d.ranks.forEach((rank, i) => {
                    points[i] = SCALES.x(i) + "," + SCALES.y(rank - 1);
                });
            } else {
                d.total_ranks.forEach((rank, i) => {
                    points[i] = SCALES.x(i) + "," + SCALES.y(rank - 1);
                });
            }
            return points.join(" ");
        })
        .style("stroke", function(d) {
            return SCALES.clr(d.total_ranks[0]);
        })
        .on("mouseover", function(d) {
            highlight(vis, d.id);
        })
        .on("mouseout", function() {
            unhighlight(vis);
        });
}

function addNameLabels(vis, data, cssClass, x, textAnchor) {
    return vis
        .selectAll("text.label." + cssClass)
        .data(data.ranking)
        .enter()
        .append("svg:text")
        .attr("class", "label " + cssClass)
        .attr("x", x)
        .attr("dy", "0.35em")
        .attr("text-anchor", textAnchor)
        .text(function(d) {
            return d.name;
        })
        .style("fill", function(d) {
            return SCALES.clr(d.total_ranks[0]);
        })
        .on("mouseover", function(d) {
            highlight(vis, d.id);
        })
        .on("mouseout", function() {
            unhighlight(vis);
        });
}

function addMedals(vis, data, mode) {
    var symbolGenerator = d3
        .symbol()
        .type(d3.symbolStar)
        .size(150);
    var pathData = symbolGenerator();

    data.ranking.forEach(function(member, idx) {
        vis.append("defs");
        vis.selectAll("path.medal.m" + member.id)
            .data(member.medals)
            .enter()
            .append("path")
            .attr("class", "medal m" + member.id)
            .attr("transform", function(d, i) {
                if (mode === SortModes.DAY_RANK) {
                    return (
                        "translate(" +
                        SCALES.x(i) +
                        ", " +
                        SCALES.y(member.ranks[i] - 1) +
                        ")"
                    );
                }
                return (
                    "translate(" +
                    SCALES.x(i) +
                    ", " +
                    SCALES.y(member.total_ranks[i] - 1) +
                    ")"
                );
            })
            .filter(function(d, i) {
                return 0 < d && d <= 3;
            })
            .attr("d", pathData)
            .style("stroke", function(d, i) {
                return "#0f0f23";
            })
            .style("fill", function(d, i) {
                if (d == 1) {
                    return "gold";
                } else if (d == 2) {
                    return "silver";
                } else if (d == 3) {
                    return "#963";
                }
            })
            .on("mouseover", function(d) {
                highlight(vis, member.id);
            })
            .on("mouseout", function() {
                unhighlight(vis);
            });
    });
}

function addProgress(vis, data, mode) {
    data.ranking.forEach(function(member, idx) {
        vis.append("defs");
        vis.selectAll("circle.progress.m" + member.id)
            .data(member.ranks)
            .enter()
            .append("svg:circle")
            .attr("class", "progress m" + member.id)
            .attr("cx", function(d, i) {
                return SCALES.x(i);
            })
            .attr("cy", function(d, i) {
                if (mode === SortModes.DAY_RANK) {
                    return SCALES.y(member.ranks[i] - 1);
                }
                return SCALES.y(member.total_ranks[i] - 1);
            })
            .attr("r", 5)
            .style("stroke", function(d, i) {
                return SCALES.clr(member.total_ranks[0]);
            })
            .style("fill", function(d, i) {
                if (member.stars[i] == 0) {
                    return "#0f0f23";
                } else if (member.stars[i] == 1) {
                    var gradId = "m" + member.id + "d" + i;
                    var grad = vis
                        .select("defs")
                        .append("linearGradient")
                        .attr("id", gradId)
                        .attr("x1", "0%")
                        .attr("x2", "100%")
                        .attr("y1", "100%")
                        .attr("y2", "100%");
                    grad.append("stop")
                        .attr("offset", "49%")
                        .style("stop-color", SCALES.clr(member.total_ranks[0]));
                    grad.append("stop")
                        .attr("offset", "49%")
                        .style("stop-color", "#0f0f23");

                    return "url(#" + gradId + ")";
                }
                return SCALES.clr(member.total_ranks[0]);
            })
            .style("visibility", function(d, i) {
                if (0 < d && d <= 3 && member.medals[i]) {
                    return "hidden";
                }
                if (member.stars[i] < 2) {
                    return "visible";
                }
                if (i == 0 || i == member.stars.length - 1) {
                    return "visible";
                }
                return "hidden";
            })
            .on("mouseover", function(d) {
                highlight(vis, member.id);
            })
            .on("mouseout", function() {
                unhighlight(vis);
            });
    });
}

function addDayRanking(vis, data, mode) {
    data.ranking.forEach(function(member, idx) {
        vis.append("defs");
        vis.selectAll("circle.dayrank.m" + member.id)
            .data(member.ranks)
            .enter()
            .append("svg:circle")
            .attr("class", function(d, i) {
                if (member.completed[i]) {
                    return "dayrank completed m" + member.id;
                }
                return "dayrank m" + member.id;
            })
            .attr("cx", function(d, i) {
                return SCALES.x(i);
            })
            .attr("cy", function(d, i) {
                if (mode === SortModes.DAY_RANK) {
                    return SCALES.y(member.ranks[i] - 1);
                }
                return SCALES.y(member.total_ranks[i] - 1);
            })
            .attr("r", 10)
            .style("stroke", function(d, i) {
                return SCALES.clr(member.total_ranks[0]);
            })
            .style("color", function(d, i) {
                return SCALES.clr(member.total_ranks[0]);
            })
            .style("fill", function(d, i) {
                return SCALES.clr(member.total_ranks[0]);
            })
            .style("visibility", "hidden")
            .on("mouseover", function(d) {
                highlight(vis, member.id);
            })
            .on("mouseout", function() {
                unhighlight(vis);
            });
        vis.selectAll("text.dayrank.m" + member.id)
            .data(d3.zip(member.ranks, member.times))
            .enter()
            .append("svg:text")
            .attr("class", function(d, i) {
                if (member.completed[i]) {
                    return "dayrank completed m" + member.id;
                }
                return "dayrank m" + member.id;
            })
            .attr("x", function(d, i) {
                return SCALES.x(i);
            })
            .attr("y", function(d, i) {
                if (mode === SortModes.DAY_RANK) {
                    return SCALES.y(member.ranks[i] - 1);
                }
                return SCALES.y(member.total_ranks[i] - 1);
            })
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .style("stroke", function(d, i) {
                return "#0f0f23";
            })
            .style("visibility", "hidden")
            .style("font-size", function(d, i) {
                var dRank = d[0];
                if (dRank > 1000) {
                    return "xx-small";
                }
                if (dRank > 100) {
                    return "x-small";
                }
                return "small";
            })
            .text(function(d, i) {
                var dRank = d[0];
                return dRank;
            })
            .on("mouseover", function(d) {
                highlight(vis, member.id);
            })
            .on("mouseout", function() {
                unhighlight(vis);
            })
            .append("svg:title")
            .text(function(d, i) {
                var dTime = d[1];
                if (dTime < 24 * 60 * 60) {
                    // https://stackoverflow.com/a/25279399/854540
                    return new Date(1000 * dTime).toISOString().substr(11, 8);
                }
                else if (dTime === 24 * 60 * 60) {
                    return "24:00:00"; // instead of 00:00:00
                }
                else {
                    return ">24h"; // match personal leaderboard stats page
                }
            });
    });
}
