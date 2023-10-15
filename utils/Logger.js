/**
 *  Author: Seweryn Michota
 *  Date: October 2023
 */

const LogModel = require('../models/Log');

class Logger {

    /**
     * Method will display display lon in console and save it to MongoDB (logs collection)
     * 
     * @param {String} message Message to be displayed/save to db
     * @param {Request} req Reguest. If not null, request contain User data used for log
     */
    log(message, req) {
        const logTime = this.getTime(new Date())
        let logMessage = "{"+ logTime +"} " + message
        // Save log to MongoDB
        const logToSave = new LogModel({
            date: logTime,
            message: message
        })
        logToSave.save()
        console.log(logMessage)
    }

    /**
     * This takes date as input and returns 'nicelly' formatted date readible in console
     * 
     * @param {Date} date_ob Date objet (Usually Date.now())
     * @returns Formatted date string
     */
    getTime(date_ob) {
        let date = ("0" + date_ob.getDate()).slice(-2);
        let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
        let year = date_ob.getFullYear();
        let hours = date_ob.getHours();
        let minutes = date_ob.getMinutes();
        let seconds = date_ob.getSeconds();
        return year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;
    }

}

module.exports = Logger