import {loadData} from './loader'
import {calculateRanking} from './calculate'
import {visualize} from './visualize'


loadData()
    .then(data => calculateRanking(data))
    .then(ranking => visualize(ranking))
