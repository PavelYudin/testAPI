module.exports = function checkValidDate(date) {
    const regexp = /\d{4}\-\d{2}\-\d{2}/;

    if(typeof date === "string") {
        const arrYYmmdd = date.split("-");

        if(regexp.test(date)) {
            if(+arrYYmmdd[0] >= 2000 && +arrYYmmdd[0] <= 2050) {
                if(+arrYYmmdd[1] > 0 && +arrYYmmdd[1] < 13) {
                    const totalDaysInMonth = new Date(arrYYmmdd[0], arrYYmmdd[1], 0).getDate();

                    if(+arrYYmmdd[2] > 0 && +arrYYmmdd[2] <= totalDaysInMonth) {
                        return true;
                    }
                }
            }
        }
    }

    return false;
}