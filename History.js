﻿function newAAMastersAAMariamTradingHistory() {

    let thisObject = {

        // Main functions and properties.

        initialize: initialize,
        container: undefined,
        getContainer: getContainer,
        setTimePeriod: setTimePeriod,
        setDatetime: setDatetime,
        draw: draw,

        // Secondary functions and properties.

        currentCandle: undefined,
        positionAtDatetime: positionAtDatetime,
        onLayerStatusChanged: onLayerStatusChanged
    };

    /* this is part of the module template */

    let container = newContainer();     // Do not touch this 3 lines, they are just needed.
    container.initialize();
    thisObject.container = container;

    let layerStatus = 'off';            // Since the moduleis a layer, it must handle the different possible layer status.

    let plotArea = newPlotArea();       // Needed to be able to plot on the timeline, otherwise not.

    let timePeriod;                     // This will hold the current Time Period the user is at.
    let datetime;                       // This will hold the current Datetime the user is at.

    /* these are module specific variables: */

    let file;                           // Here we keep the history records to be ploted every time the Draw() function is called by the AAWebPlatform.
    let history = [];                   // This is where the history records are stored before plotting.

    return thisObject;

    function initialize(pExchange, pMarket, pDatetime, pTimePeriod, pLayerStatus, callBackFunction) {

        datetime = pDatetime;
        timePeriod = pTimePeriod;

        let File = newFile();
        File.initialize("AAMasters", "AAMariam", "Trading History", "Trading History", pExchange, pMarket, onFileReady)

        function onFileReady() {

            file = File.getFile();

        }
    }

    function getContainer(point) {

        if (layerStatus !== 'on') { return; }

        let container;

        /* First we check if this point is inside this space. */

        if (this.container.frame.isThisPointHere(point) === true) {

            return this.container;

        } else {

            /* This point does not belong to this space. */

            return undefined;
        }

    }

    function setTimePeriod(pTimePeriod) {

        timePeriod = pTimePeriod;

    }

    function setDatetime(newDatetime) {

        datetime = newDatetime;

    }

    function draw() {

        if (layerStatus !== 'on') { return; }

        plotChart();

    }

    function recalculate() {

        if (layerStatus === 'off') { return; }

        for (let i = 0; i < file.length; i++) {

            let newHistoryRecord = {

                date: Math.trunc(file[i][0] / 60000) * 60000 + 30000,
                rate: file[i][1],                    
                newPositions: file[i][2],
                newTrades: file[i][3],
                movedPositions: file[i][4]
            };

            history.push(newHistoryRecord);
        }

        thisObject.container.eventHandler.raiseEvent("History Changed", history);
    }

    function recalculateScale() {

        if (file === undefined) { return; } // We need the market file to be loaded to make the calculation.

        if (plotArea.maxValue > 0) { return; } // Already calculated.

        let minValue = {
            x: EARLIEST_DATE.valueOf(),
            y: 0
        };

        let maxValue = {
            x: MAX_PLOTABLE_DATE.valueOf(),
            y: nextPorwerOf10(getMaxRate())
        };


        plotArea.initialize(
            minValue,
            maxValue,
            thisObject.container.frame.width,
            thisObject.container.frame.height
        );

        function getMaxRate() {

            let maxValue = 0;

            for (let i = 0; i < file.length; i++) {

                let currentMax = marketFile[i][1];   // 1 = rates.

                if (maxValue < currentMax) {
                    maxValue = currentMax;
                }
            }

            return maxValue;

        }

    }

    function plotChart() {

         for (let i = 0; i < history.length; i++) {

                record = history[i];

                let point = {
                    x: record.begin + timePeriod / 7 * 1.5,
                    y: record.open
                };

                point = plotArea.inverseTransform(point, thisObject.container.frame.height);

                point = transformThisPoint(point, thisObject.container);

                if (point.x < viewPort.visibleArea.bottomLeft.x || point.x > viewPort.visibleArea.bottomRight.x) {
                    continue;
                }

                point = viewPort.fitIntoVisibleArea(point);

                browserCanvasContext.beginPath();

                browserCanvasContext.moveTo(point.x, point.y);

                browserCanvasContext.closePath();

                if (record.direction === 'up') { browserCanvasContext.strokeStyle = 'rgba(27, 105, 7, 1)'; }
                if (record.direction === 'down') { browserCanvasContext.strokeStyle = 'rgba(130, 9, 9, 1)'; }
                if (record.direction === 'side') { browserCanvasContext.strokeStyle = 'rgba(27, 7, 105, 1)'; }

                if (datetime !== undefined) {

                    let dateValue = datetime.valueOf();

                    if (dateValue >= record.begin && dateValue <= record.end) {

                        /* highlight the current record */

                        browserCanvasContext.fillStyle = 'rgba(255, 233, 31, 1)'; // Current record accroding to time

                    } else {

                        if (record.direction === 'up') { browserCanvasContext.fillStyle = 'rgba(64, 217, 26, 1)'; }
                        if (record.direction === 'down') { browserCanvasContext.fillStyle = 'rgba(219, 18, 18, 1)'; }
                        if (record.direction === 'side') { browserCanvasContext.fillStyle = 'rgba(64, 26, 217, 1)'; }
                    }

                } else {

                    if (record.direction === 'up') { browserCanvasContext.fillStyle = 'rgba(64, 217, 26, 1)'; }
                    if (record.direction === 'down') { browserCanvasContext.fillStyle = 'rgba(219, 18, 18, 1)'; }
                    if (record.direction === 'side') { browserCanvasContext.fillStyle = 'rgba(64, 26, 217, 1)'; }

                }

                if (
                    point.x < viewPort.visibleArea.topLeft.x + 50
                    ||
                    point.x > viewPort.visibleArea.bottomRight.x - 50
                ) {
                    // we leave this history without fill.
                } else {
                    browserCanvasContext.fill();
                }

                browserCanvasContext.lineWidth = 1;
                browserCanvasContext.stroke();


            }

    }

    function onLayerStatusChanged(eventData) {

        if (eventData.layer === 'Mariam Trades History') {
            layerStatus = eventData.status;
        }

    }

    function onZoomChanged(event) {

    }

    function onDragFinished() {

    }
}

