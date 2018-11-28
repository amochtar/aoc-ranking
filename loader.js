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
        url = document.location.href.split('#')[0] + ".json"
        parts = document.location.pathname.split('/')
        key = parts[1] + '_' + parts.pop()

        browser.storage.local.get(key).then(k => {
            if (k === null || !k.hasOwnProperty(key) || !k[key].hasOwnProperty('data') || !k[[key]].hasOwnProperty('date')) {
                fetchData(url, key).then(data => resolve(data))
            } else {
                ttl = new Date(k[key].date + 60000)
                if (ttl < new Date()) {
                    fetchData(url, key).then(data => resolve(data))
                } else {
                    resolve(k[key].data)
                }
            }
        })
    })
}

loadData()
    .then(data => calculateRanking(data))
    .then(ranking => visualize(ranking))
