function fetchData(url, key) {
    return fetch(url)
        .then(response => response.json())
        .then(data => {
            val = {
                data: data,
                date: new Date().getTime()
            }
            browser.storage.local.set({[key]: val})
            return data
        })
        .catch(err => {console.log(err)})
}

function loadData() {
    return new Promise((resolve, reject) => {
        url = document.location.protocol + '//' + document.location.host + document.location.pathname + ".json"

        browser.storage.local.get(url).then(k => {
            if (k === null || !k.hasOwnProperty(url) || !k[url].hasOwnProperty('data') || !k[[url]].hasOwnProperty('date')) {
                fetchData(url, url).then(data => resolve(data))
            } else {
                ttl = new Date(k[url].date + (5 * 60 * 1000))
                if (ttl < new Date()) {
                    fetchData(url, url).then(data => resolve(data))
                } else {
                    resolve(k[url].data)
                }
            }
        })
    })
}

loadData()
    .then(data => calculateRanking(data))
    .then(ranking => visualize(ranking))
