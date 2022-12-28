// note: days and levels are 1-based here
function getMemberCompletionDayLevel(member, day, level) {
    var completed = null;

    if (
        member.completion_day_level !== undefined &&
        member.completion_day_level[day] != undefined &&
        member.completion_day_level[day][level] !== undefined &&
        member.completion_day_level[day][level].get_star_ts !== undefined
    ) {
        completed = member.completion_day_level[day][level].get_star_ts;
    }

    return completed;
}

// note: days and levels are 1-based here
function compareMembersByDayLevel(day, level) {
    return function (a, b) {
        const aCompleted = getMemberCompletionDayLevel(a, day, level);
        const bCompleted = getMemberCompletionDayLevel(b, day, level);

        if (aCompleted === bCompleted) {
            return +b.id - +a.id;
        }
        if (aCompleted === null) {
            return 1;
        }
        if (bCompleted === null) {
            return -1;
        }
        return +aCompleted - +bCompleted;
    };
}

// note: day is 0-based here
function compareRankingByDay(day, fallback) {
    return function (a, b) {
        if (a.scores[day] === b.scores[day]) {
            if (fallback) {
                return +a.id - +b.id;
            }
            if (day <= 0) {
                return compareRankingByDay(day + 1, true)(a, b);
            }
            return compareRankingByDay(day - 1)(a, b);
        }
        return b.scores[day] - a.scores[day];
    };
}

// note: day is 0-based here
function compareTotalRankingByDay(day) {
    return function (a, b) {
        if (a.total_scores[day] === b.total_scores[day]) {
            if (a.completed[day] === b.completed[day]) {
                return +a.id - +b.id;
            }
            if (!a.completed[day]) return 1;
            if (!b.completed[day]) return -1;
            return a.completed[day] - b.completed[day];
        }
        return b.total_scores[day] - a.total_scores[day];
    };
}

export function calculateRanking(data) {
    // initialize ranking structure
    var members = Object.values(data.members);
    var ranking = {};
    members.forEach((member) => {
        name = member.name;
        if (member.name === undefined || member.name === null) {
            name = "(anonymous user #" + member.id + ")";
        }
        ranking[member.id] = {
            id: member.id,
            name: name,
            total_score: 0,
            scores: [],
            ranks: [],
            stars: [],
            total_scores: [],
            total_ranks: [],
            completed: [],
            medals: [],
            stats: [],
        };
    });

    // max score per star is number of members
    const max_score = members.length;

    var max_days = Object.values(data.members).reduce(function (acc, m) {
        var l = Object.values(m.completion_day_level).length;
        if (l > acc) {
            return l;
        }
        return acc;
    }, 0);

    // do actual calculation of scores and stars
    for (let d = 0; d < 25; d++) {
        var date = Date.UTC(data.event, 11, d + 1, 5);
        if (d < max_days || date < new Date().getTime()) {
            for (let l = 1; l <= 2; l++) {
                members.sort(compareMembersByDayLevel(d + 1, l));
                members.forEach(function (member, index) {
                    if (ranking[member.id].scores[d] === undefined) {
                        ranking[member.id].scores[d] = 0;
                    }

                    if (ranking[member.id].stars[d] === undefined) {
                        ranking[member.id].stars[d] = 0;
                    }

                    if (ranking[member.id].stats[d] === undefined) {
                        ranking[member.id].stats[d] = { 1: null, 2: null };
                    }

                    var completed = getMemberCompletionDayLevel(
                        member,
                        d + 1,
                        l
                    );
                    if (completed !== null) {
                        ranking[member.id].stars[d] = l;
                        var score = max_score - index;
                        if (data.event == "2018" && d + 1 == 6) {
                            // Because of a bug in the day 6 puzzle that made it
                            // unsolvable for some users until about two hours
                            // after unlock, day 6 is worth no points.
                            score = 0;
                        }
                        if (data.event == "2020" && d + 1 == 1) {
                            // Because of an outage during the day 1 puzzle unlock,
                            // day 1 is worth no points.
                            score = 0;
                        }
                        ranking[member.id].scores[d] += score;
                        ranking[member.id].total_score += score;

                        ranking[member.id].stats[d][l] = {
                            time: completed - date / 1000, // completed is in s, date is in ms
                            rank: index,
                            score: score,
                        };
                    }
                    ranking[member.id].completed[d] = completed;
                    ranking[member.id].total_scores[d] =
                        ranking[member.id].total_score;
                    if (completed && index < 3) {
                        ranking[member.id].medals[d] = index + 1;
                    } else {
                        ranking[member.id].medals[d] = 0;
                    }
                });
            }
        }
    }
    ranking = Object.values(ranking);

    // finally get ranks and total_ranks for all days
    for (let d = 0; d < 25; d++) {
        let date = Date.UTC(data.event, 11, d + 1, 5);
        if (d === 0 || d < max_days || date < new Date().getTime()) {
            ranking.sort(compareRankingByDay(d));
            ranking.forEach(function (rank, index) {
                ranking[index].ranks[d] = index + 1;
            });
            ranking.sort(compareTotalRankingByDay(d));
            ranking.forEach(function (rank, index) {
                ranking[index].total_ranks[d] = index + 1;
            });
        }
    }

    return { ranking: ranking };
}
