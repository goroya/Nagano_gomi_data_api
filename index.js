const path = require('path');
const axios = require('axios');
const moment = require('moment');
const fse = require('fs-extra');

const outputDir = path.join(__dirname, 'docs');
(async () => {
    try {
        const resChiku = await axios.get('http://linkdata.org/api/1/rdf1s7002i/gomi_calendar_chiku_201803.csv');
        const chikuList = resChiku.data
            .split('\r\n').slice(1, -1)
            .map((val) => val.split(',').slice(1).filter((v) => v))
            .map((v) => ({No: v[0], val: v.slice(1)}));
        await fse.outputJson(
            path.join(outputDir, 'chiku_list.json'), chikuList, {spaces: '  '}
        );

        for (const val of chikuList) {
            const resCalendar = await axios.get(
                `http://linkdata.org/api/1/rdf1s7002i/gomi_calendar_2018_${('00' + val.No).slice(-2)}.csv`
            );
            const calendar = resCalendar.data.split('\r\n').slice(0, -1);
            const daysLine = calendar[0].split(',');
            const dayArray = daysLine.slice(3)
                .map((day) => {
                    return moment('1899-12-30', 'YYYY-MM-DD')
                        .add(day, 'days').format('YYYY/MM/DD ddd');
                });
            const garbageDaysLines = calendar.slice(1);
            const garbageDays = [];
            for (let garbageDaysLine of garbageDaysLines) {
                const [, kindJa, kindEn, ...tmpDays]
                    = garbageDaysLine.split(',');
                const days = tmpDays.map((v) => !!v);
                garbageDays.push({
                    kindJa,
                    kindEn,
                    days,
                });
            }
            const result = {
                name: daysLine[0],
                days: dayArray,
                garbageDays,
            };
            await fse.outputJson(
                path.join(outputDir, `${result.name}.json`),
                result, {spaces: '  '}
            );
        }
    } catch (e) {
        console.error('error', e);
    }
})();
