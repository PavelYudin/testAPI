module.exports =  function checkValidNumber(arrNumber) {
    return arrNumber.every(value => {
        if(value.trim() !== "" && +value && Number.isInteger(+value)) {
            return true;
        }

        return false;
    });
}