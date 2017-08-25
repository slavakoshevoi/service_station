const formatDate = require('../../helpers/formatDate');

module.exports = function (dates, requests) {
    var fromDateChart = new Date(dates.fromDateChart);
    var toDateChart = new Date(dates.toDateChart);

    var requestsObj = {};
    while (fromDateChart <= toDateChart) {
        requestsObj[formatDate(fromDateChart, true)] = 0;
        fromDateChart.setDate(fromDateChart.getDate() + 1);
    }

    requests.map(item => {
        requestsObj[formatDate(item.createdAt, true)] += item.cost;
    });

    var datesArr = [];
    var moneyArr = [];

    for (var key in requestsObj) {
        datesArr.push(key.slice(-2));
        moneyArr.push(requestsObj[key]);
    }

    return {
        dates: datesArr,
        money: moneyArr
    };
};