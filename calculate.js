// note: days and levels are 1-based here
function getMemberCompletionDayLevel(member, day, level) {
  let completed = null

  if (member.completion_day_level !== undefined &&
      member.completion_day_level[day] != undefined &&
      member.completion_day_level[day][level] !== undefined &&
      member.completion_day_level[day][level].get_star_ts !== undefined) {
    completed = member.completion_day_level[day][level].get_star_ts
  }

  return completed
}

// note: days and levels are 1-based here
function compareMembersByDayLevel(day, level) {
  return function (a, b) {
    aCompleted = getMemberCompletionDayLevel(a, day, level)
    bCompleted = getMemberCompletionDayLevel(b, day, level)

    if (aCompleted === bCompleted) {
      return +b.id - +a.id
    }
    if (aCompleted === null) {
      return 1
    }
    if (bCompleted === null) {
      return -1
    }
    return +aCompleted - +bCompleted
  }
}

// note: day is 0-based here
function compareRankingByDay(day) {
  return function (a, b) {
    if (a.total_scores[day] === b.total_scores[day]) {
      return +a.id - +b.id
    }
    return b.total_scores[day] - a.total_scores[day]
  }
}

function calculateRanking(data) {
  // initialize ranking structure
  members = Object.values(data.members)
  ranking = {}
  members.forEach(member => ranking[member.id] = {
    id: member.id,
    name: member.name,
    total_score: 0,
    scores: [],
    ranks: [],
    stars: [],
    total_scores: [],
    total_ranks: []
  })

  // max score per star is number of members
  max_score = members.length

  // do actual calculation of scores, ranks and stars
  for (let d = 0; d < 25; d++) {
    for (let l = 1; l <= 2; l++) {
      members.sort(compareMembersByDayLevel(d+1, l))
      members.forEach(function (member, index) {
        if (ranking[member.id].scores[d] === undefined) {
          ranking[member.id].scores[d] = 0
        }

        if (ranking[member.id].stars[d] === undefined) {
          ranking[member.id].stars[d] = 0
        }

        completed = getMemberCompletionDayLevel(member, d+1, l)
        if (completed !== null) {
          ranking[member.id].stars[d] = l
          score = max_score - index
          ranking[member.id].scores[d] += score
          ranking[member.id].total_score += score
          ranking[member.id].ranks[d] = index + 1
        } else {
          ranking[member.id].ranks[d] = 0
        }

        ranking[member.id].total_scores[d] = ranking[member.id].total_score
      })
    }
  }
  ranking = Object.values(ranking)

  // finally get total_ranks for all days
  for (let d = 0; d < 25; d++) {
    ranking.sort(compareRankingByDay(d))
    ranking.forEach(function(rank, index) {
      ranking[index].total_ranks[d] = index + 1
    })
  }

  return {ranking: ranking}
}
